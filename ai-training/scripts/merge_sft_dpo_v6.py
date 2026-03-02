#!/usr/bin/env python3
"""
Merge SFT LoRA + DPO LoRA into base model in fp16, convert to GGUF Q8_0, deploy to Ollama.

Two-step merge pipeline:
1. Load Qwen2.5-7B-Instruct in fp16 (CPU)
2. Apply SFT LoRA (checkpoint-900) → merge_and_unload()
3. Apply DPO LoRA (chiro-no-dpo) → merge_and_unload()
4. Save merged safetensors in fp16
5. Convert to GGUF Q8_0
6. Create Modelfile and deploy to Ollama

Usage:
    python scripts/merge_sft_dpo_v6.py
    python scripts/merge_sft_dpo_v6.py --version v6
    python scripts/merge_sft_dpo_v6.py --skip-deploy
"""

import argparse
import gc
import json
import os
import subprocess
import sys
import time
from pathlib import Path

# Fix Windows console encoding
if sys.platform == 'win32':
    os.environ.setdefault('PYTHONIOENCODING', 'utf-8')
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

SCRIPT_DIR = Path(__file__).parent.resolve()
AI_TRAINING_DIR = SCRIPT_DIR.parent
MODELS_DIR = AI_TRAINING_DIR / 'models'
GGUF_DIR = MODELS_DIR / 'gguf'

BASE_MODEL = 'Qwen/Qwen2.5-7B-Instruct'
SFT_DIR = MODELS_DIR / 'chiro-no' / 'checkpoint-900'
DPO_DIR = MODELS_DIR / 'chiro-no-dpo'
CONVERT_SCRIPT = AI_TRAINING_DIR / 'llama-cpp-convert' / 'convert_hf_to_gguf.py'
PYTHON_EXE = AI_TRAINING_DIR / 'ml-env' / 'Scripts' / 'python.exe'

SYSTEM_PROMPT = """Du er en spesialisert klinisk assistent for kiropraktorer i Norge. Du har omfattende kunnskap om kiropraktisk praksis, muskel- og skjelettsystemet, nevrologisk undersokelse, og norsk helsevesen.

DINE KJERNEOPPGAVER:
1. SOAP-notater (Subjektiv, Objektiv, Analyse/Vurdering, Plan)
2. Klinisk vurdering med rode flagg-identifisering
3. Diagnosekoding (ICPC-2 og ICD-10)
4. Behandlingsplanlegging
5. Norsk medisinsk fagsprak

VANLIGE ICPC-2 KODER FOR KIROPRAKTIKK:
- L01 Nakkesymptom/plage | L02 Ryggsymptom/plage | L03 Korsryggsymptom/plage
- L04 Brystsymptom muskel-skjelett | L08 Skuldersymptom/plage
- L13 Hoftesymptom/plage | L15 Knesymptom/plage | L18 Muskelsmerter
- L77 Forstuing ankel | L83 Nakkesyndrom | L84 Ryggsyndrom uten utstråling
- L85 Deformitet rygg | L86 Ryggsyndrom med utstråling (isjias)
- L89 Hofteartrose | L92 Skuldersyndrom | L93 Tennisalbue
- L96 Intern kneskade | L98 Fotlidelse | N01 Hodepine
- N02 Spenningshodepine | N17 Svimmelhet/vertigo | N89 Migrene
- N93 Karpaltunnelsyndrom | H82 Vestibular dysfunksjon (BPPV)
- D20 Mage/buk-symptom | L99 Annen muskel-skjelett sykdom

RODE FLAGG — KLASSIFISERING:
AKUTT (ring 113 / legevakt umiddelbart):
- Cauda equina-syndrom: sadel-anestesi, urinretensjon, bilateral beinsvakhet
- Vertebrobasilar insuffisiens: diplopi, dysartri, dysfagi etter nakkemanipulasjon
- Aortaaneurisme: pulserende abdominal masse, konstant ryggsmerte, hypotensjon
- Thunderclap-hodepine: akutt eksplosiv hodepine (mulig SAH)
- Ryggmargskompresjon: bilateral svakhet, inkontinens, kjent kreft

HENVIS (akutt/haste til spesialist):
- Cervikal myelopati: hyperrefleksi, Hoffman+, Babinski+, gangvansker
- Temporalisarteritt: tinninghodepine >50 ar, kjeveklaudikasjon, forhoyet SR
- Progressivt nevrologisk utfall: tiltagende svakhet over dager/uker
- Mistenkt metastase: kjent kreft, vekttap, nattesmerter, ny ryggsmerte

MONITORER (folg opp, vurder henvisning):
- Inflammatorisk ryggsmerte: morgenstivhet >30 min, ung mann, familieanamnese
- Mistanke om infeksjon: feber, nattesvette, immunsuppresjon

TRYGT (mekanisk, kiropraktisk behandling trygt):
- Mekaniske smerter: belastningsrelatert, stillingsbetinget, ingen nattesmerter
- Muskelspasme: etter aktivitet, normal nevrologi
- BPPV: posisjonsutlost svimmelhet, positiv Dix-Hallpike
- Tendinopati: gradvis debut, belastningsrelatert, normal nevrologi

KLINISK EKSEMPEL — Akutt korsrygg:
S: 45 ar mann. Akutt debut korsryggsmerte etter tungt loft. VAS 7/10. Ingen utstråling.
O: Antalgisk holdning. AROM lumbal: Fleksjon redusert. Palpasjon: Okt tonus ES bilat L3-L5. SLR negativ bilat. Nevro ua.
A: Akutt lumbalt fasettleddsrestriksjoner (L03). Ingen rode flagg. Prognose god.
P: SMT L4/L5, mobilisering lumbal, Trp ES bilat. Ovelser: lumbal mobilitet. Ny tid 2-3 dager.

KLINISK EKSEMPEL — Rodt flagg (cauda equina):
S: 50 ar med akutte korsryggsmerter, nummenhet perineum, urinretensjon.
O: Sadel-anestesi bilat. Redusert analsfinktertonus. Bilateral SLR positiv.
A: AKUTT MISTANKE CAUDA EQUINA-SYNDROM. Krever oyeblikkelig henvisning.
P: Ring 113/legevakt UMIDDELBART. Ikke behandle. Folg pasienten til overlevering.

DIAGNOSEKODING-FORMAT:
Nar du gir en diagnose, ALLTID inkluder ICPC-2 koden i formatet:
  "[KODE] - [Norsk beskrivelse]"
Eksempel: "L03 - Korsryggsymptom" eller "L86 - Ryggsyndrom med utstråling"

VIKTIGE REGLER:
- Svar alltid pa norsk med korrekt medisinsk fagsprak.
- Var presis, evidensbasert og klinisk relevant.
- Flagg alltid rode flagg tydelig med anbefalt handling.
- Bruk ICPC-2 koder ved diagnosesetting.
- SMS-meldinger: Maks 160 tegn. Var kort og direkte.
- Brev til fastlege: Bruk "Til fastlege" eller "Til behandlende lege" i overskrift.
- Folg norsk helselovgivning og etiske retningslinjer."""


def step1_merge(merged_dir, version):
    """Load base model in fp16, apply SFT + DPO LoRAs, merge and save."""
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import PeftModel

    print(f"\n{'='*60}")
    print(f"  STEP 1: Two-Stage LoRA Merge ({version})")
    print(f"  Base: {BASE_MODEL}")
    print(f"  SFT:  {SFT_DIR}")
    print(f"  DPO:  {DPO_DIR}")
    print(f"  Out:  {merged_dir}")
    print(f"{'='*60}\n")

    t0 = time.time()

    # Verify adapters exist
    for label, path in [('SFT', SFT_DIR), ('DPO', DPO_DIR)]:
        if not (path / 'adapter_model.safetensors').exists():
            print(f"  ERROR: {label} adapter not found at {path}")
            return False
        print(f"  Found {label} adapter: {path}")

    # Load base model in fp16 on CPU (avoids OOM on 12GB GPU)
    print(f"\n  [1/6] Loading base model in fp16 (CPU)...")
    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        torch_dtype=torch.float16,
        device_map="cpu",
        trust_remote_code=True,
        low_cpu_mem_usage=True,
    )
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    print(f"  Base loaded ({time.time()-t0:.0f}s)")

    # Apply SFT LoRA and merge
    print(f"  [2/6] Applying SFT LoRA ({SFT_DIR.name})...")
    model = PeftModel.from_pretrained(model, str(SFT_DIR), torch_dtype=torch.float16)
    model = model.merge_and_unload()
    print(f"  SFT merged ({time.time()-t0:.0f}s)")

    # Apply DPO LoRA and merge
    print(f"  [3/6] Applying DPO LoRA...")
    model = PeftModel.from_pretrained(model, str(DPO_DIR), torch_dtype=torch.float16)
    model = model.merge_and_unload()
    print(f"  DPO merged ({time.time()-t0:.0f}s)")

    # Save merged model
    print(f"  [4/6] Saving merged model...")
    merged_dir.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(str(merged_dir), safe_serialization=True)
    tokenizer.save_pretrained(str(merged_dir))

    # Clean up quantization_config from config.json
    config_path = merged_dir / 'config.json'
    if config_path.exists():
        with open(config_path, 'r') as f:
            cfg = json.load(f)
        if 'quantization_config' in cfg:
            del cfg['quantization_config']
        cfg['dtype'] = 'float16'
        cfg['use_cache'] = True
        with open(config_path, 'w') as f:
            json.dump(cfg, f, indent=2)
    print(f"  Saved ({time.time()-t0:.0f}s)")

    # Cleanup
    del model
    gc.collect()

    elapsed = time.time() - t0
    print(f"\n  Merge complete in {elapsed/60:.1f} minutes")
    return True


def step2_convert_gguf(merged_dir, gguf_path):
    """Convert merged safetensors to GGUF Q8_0."""
    print(f"\n{'='*60}")
    print(f"  STEP 2: Convert to GGUF Q8_0")
    print(f"{'='*60}\n")

    if not CONVERT_SCRIPT.exists():
        print(f"  ERROR: convert_hf_to_gguf.py not found at {CONVERT_SCRIPT}")
        return False

    python = str(PYTHON_EXE) if PYTHON_EXE.exists() else 'python'
    GGUF_DIR.mkdir(parents=True, exist_ok=True)

    print(f"  Converting {merged_dir.name} -> {gguf_path.name} (Q8_0)...")
    t0 = time.time()
    try:
        result = subprocess.run(
            [python, str(CONVERT_SCRIPT), str(merged_dir),
             '--outfile', str(gguf_path), '--outtype', 'q8_0'],
            capture_output=True, text=True, timeout=1800,
            encoding='utf-8', errors='replace',
        )
        if result.returncode == 0:
            size_gb = gguf_path.stat().st_size / (1024**3)
            print(f"  GGUF created: {gguf_path.name} ({size_gb:.1f} GB) in {time.time()-t0:.0f}s")
            return True
        else:
            stderr = result.stderr.strip()[-1000:] if result.stderr else 'Unknown error'
            print(f"  GGUF conversion failed: {stderr}")
            return False
    except subprocess.TimeoutExpired:
        print(f"  GGUF conversion timed out (>30 min)")
        return False


def step3_deploy_ollama(gguf_path, model_name, version):
    """Create Modelfile and deploy to Ollama."""
    print(f"\n{'='*60}")
    print(f"  STEP 3: Deploy to Ollama as '{model_name}'")
    print(f"{'='*60}\n")

    # Create Modelfile — build as plain string to avoid escaping issues
    tq = '"""'  # triple quote for Ollama Modelfile
    tmpl = '{{- if .System }}<|im_start|>system\n{{ .System }}<|im_end|>\n{{ end }}{{- range .Messages }}<|im_start|>{{ .Role }}\n{{ .Content }}<|im_end|>\n{{ end }}<|im_start|>assistant\n'
    lines = [
        f'FROM ./{gguf_path.name}',
        '',
        f'# ChiroClick SFT+DPO {version} merged model (full GGUF, Q8_0 quantization)',
        f'# Base: {BASE_MODEL}',
        f'# SFT: {version} LoRA (checkpoint-900), 1 epoch, ~9,593 examples + 74 targeted',
        f'# DPO: {version} DPO (2 epochs, 720 pairs, beta=0.1)',
        '# Both adapters merged into base in fp16, then quantized to Q8_0',
        '',
        f'TEMPLATE {tq}{tmpl}{tq}',
        '',
        'PARAMETER temperature 0.3',
        'PARAMETER top_p 0.85',
        'PARAMETER top_k 40',
        'PARAMETER num_ctx 4096',
        'PARAMETER repeat_penalty 1.1',
        'PARAMETER stop <|im_end|>',
        'PARAMETER stop <|im_start|>',
        '',
        f'SYSTEM {tq}{SYSTEM_PROMPT}{tq}',
        '',
    ]
    modelfile_content = '\n'.join(lines)
    modelfile_path = GGUF_DIR / f'Modelfile.{model_name}'
    with open(modelfile_path, 'w', encoding='utf-8') as f:
        f.write(modelfile_content)
    print(f"  Created Modelfile: {modelfile_path.name}")

    # Deploy via ollama create
    print(f"  Deploying {model_name} to Ollama...")
    try:
        result = subprocess.run(
            ['ollama', 'create', model_name, '-f', str(modelfile_path)],
            cwd=str(GGUF_DIR),
            capture_output=True, text=True, timeout=600,
            encoding='utf-8', errors='replace',
        )
        if result.returncode == 0:
            print(f"  Deployed: {model_name}")
            return True
        else:
            stderr = result.stderr.strip() if result.stderr else 'Unknown error'
            print(f"  Deploy failed: {stderr}")
            return False
    except Exception as e:
        print(f"  Deploy error: {e}")
        return False


def step4_smoke_test(model_name):
    """Quick test of the deployed model."""
    print(f"\n{'='*60}")
    print(f"  STEP 4: Smoke Test")
    print(f"{'='*60}\n")

    test_prompt = "Skriv en kort klinisk vurdering for nakkesmerter."
    print(f"  Testing {model_name}...")
    try:
        result = subprocess.run(
            ['ollama', 'run', model_name, test_prompt],
            capture_output=True, text=True, timeout=120,
            encoding='utf-8', errors='replace',
        )
        if result.returncode == 0:
            response = result.stdout.strip()
            has_norwegian = any(c in response for c in 'øæåØÆÅ')
            print(f"  Response: {len(response)} chars, Norwegian: {'YES' if has_norwegian else 'NO'}")
            print(f"  Preview: {response[:300]}{'...' if len(response) > 300 else ''}")
            return True
        else:
            print(f"  Test failed: {result.stderr[:200]}")
            return False
    except subprocess.TimeoutExpired:
        print(f"  Test timed out (>120s)")
        return False


def main():
    parser = argparse.ArgumentParser(description='Merge SFT+DPO LoRAs and deploy to Ollama')
    parser.add_argument('--version', default='v6', help='Version tag (default: v6)')
    parser.add_argument('--skip-deploy', action='store_true', help='Only merge and convert, no Ollama deploy')
    parser.add_argument('--skip-merge', action='store_true', help='Skip merge (use existing merged dir)')
    args = parser.parse_args()

    version = args.version
    model_name = f'chiro-no-sft-dpo-{version}'
    merged_dir = MODELS_DIR / f'chiro-no-sft-dpo-{version}-merged'
    gguf_path = GGUF_DIR / f'{model_name}.gguf'

    print(f"\n{'#'*60}")
    print(f"  SFT+DPO Merge & Deploy Pipeline — {model_name}")
    print(f"{'#'*60}")

    overall_start = time.time()

    # Step 1: Merge
    if not args.skip_merge:
        ok = step1_merge(merged_dir, version)
        if not ok:
            print("\nMerge failed. Aborting.")
            return 1
    else:
        if not merged_dir.exists():
            print(f"Merged dir not found: {merged_dir}")
            return 1
        print(f"Skipping merge, using existing: {merged_dir}")

    # Step 2: Convert to GGUF Q8_0
    ok = step2_convert_gguf(merged_dir, gguf_path)
    if not ok:
        print("\nGGUF conversion failed. Aborting.")
        return 1

    # Step 3: Deploy to Ollama
    if not args.skip_deploy:
        ok = step3_deploy_ollama(gguf_path, model_name, version)
        if not ok:
            print("\nOllama deploy failed.")
            return 1

        # Step 4: Smoke test
        step4_smoke_test(model_name)

    # Summary
    elapsed = time.time() - overall_start
    print(f"\n{'#'*60}")
    print(f"  COMPLETE in {elapsed/60:.1f} minutes")
    print(f"  Model: {model_name}")
    if gguf_path.exists():
        print(f"  GGUF:  {gguf_path} ({gguf_path.stat().st_size / (1024**3):.1f} GB)")
    print(f"{'#'*60}")

    # Show Ollama models
    print("\n  Current Ollama models:")
    subprocess.run(['ollama', 'list'], timeout=30)

    return 0


if __name__ == '__main__':
    sys.exit(main())
