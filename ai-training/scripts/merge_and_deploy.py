#!/usr/bin/env python3
"""
Merge LoRA adapter with base model in float16 and deploy to Ollama.

The training script saves 4-bit quantized models, but merging quantized models
produces broken safetensors (flat 1D tensors). This script loads the base model
in float16, applies the LoRA adapter, merges, saves, and deploys to Ollama.

Usage:
    python merge_and_deploy.py --model fast
    python merge_and_deploy.py --model medical
    python merge_and_deploy.py --model norwegian
    python merge_and_deploy.py --model default
    python merge_and_deploy.py --all
"""

import argparse
import gc
import json
import os
import subprocess
import sys
import time
from datetime import datetime
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
LOGS_DIR = AI_TRAINING_DIR / 'logs'
PROGRESS_FILE = LOGS_DIR / 'training-progress.json'

# Import model configs from training script
sys.path.insert(0, str(AI_TRAINING_DIR / 'training'))
from train_unsloth import MODELS


def merge_lora_model(model_key, low_memory=False):
    """
    Load base model in float16, apply LoRA adapter, merge, and save.
    Returns merged_dir path on success, None on failure.
    """
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import PeftModel

    config = MODELS[model_key]
    output_name = config['output_name']
    lora_dir = MODELS_DIR / f'{output_name}-lora'
    merged_dir = MODELS_DIR / f'{output_name}-merged'

    if not lora_dir.exists():
        print(f"  ERROR: LoRA adapter not found: {lora_dir}")
        return None

    adapter_config_path = lora_dir / 'adapter_config.json'
    if not adapter_config_path.exists():
        print(f"  ERROR: adapter_config.json not found in {lora_dir}")
        return None

    # Read base model name from adapter config
    with open(adapter_config_path, 'r') as f:
        adapter_config = json.load(f)
    base_model_name = adapter_config.get('base_model_name_or_path', config['name'])

    print(f"\n{'='*60}")
    print(f"  Merging: {output_name}")
    print(f"  Base model: {base_model_name}")
    print(f"  LoRA adapter: {lora_dir}")
    print(f"  Output: {merged_dir}")
    print(f"{'='*60}\n")

    merge_start = time.time()

    # Step 1: Load base model in float16 (NOT 4-bit!)
    print("  [1/5] Loading base model in float16...")
    try:
        if low_memory:
            # For 7B models on limited RAM: use CPU offloading
            model = AutoModelForCausalLM.from_pretrained(
                base_model_name,
                torch_dtype=torch.float16,
                device_map="cpu",
                trust_remote_code=True,
                low_cpu_mem_usage=True,
            )
        else:
            model = AutoModelForCausalLM.from_pretrained(
                base_model_name,
                torch_dtype=torch.float16,
                device_map="auto",
                trust_remote_code=True,
                low_cpu_mem_usage=True,
            )
    except Exception as e:
        print(f"  Failed to load {base_model_name}: {e}")
        print(f"  Trying fallback: {config['fallback']}")
        base_model_name = config['fallback']
        model = AutoModelForCausalLM.from_pretrained(
            base_model_name,
            torch_dtype=torch.float16,
            device_map="auto",
            trust_remote_code=True,
            low_cpu_mem_usage=True,
        )

    tokenizer = AutoTokenizer.from_pretrained(
        base_model_name,
        trust_remote_code=True,
    )

    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
        tokenizer.pad_token_id = tokenizer.eos_token_id

    print(f"  Base model loaded ({time.time() - merge_start:.1f}s)")

    # Step 2: Apply LoRA adapter
    print("  [2/5] Applying LoRA adapter...")
    model = PeftModel.from_pretrained(
        model,
        str(lora_dir),
        torch_dtype=torch.float16,
    )
    print(f"  LoRA adapter applied ({time.time() - merge_start:.1f}s)")

    # Step 3: Merge and unload
    print("  [3/5] Merging LoRA weights into base model...")
    model = model.merge_and_unload()
    print(f"  Merged ({time.time() - merge_start:.1f}s)")

    # Step 4: Save merged model
    print(f"  [4/5] Saving merged model to {merged_dir}...")
    merged_dir.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(str(merged_dir), safe_serialization=True)
    tokenizer.save_pretrained(str(merged_dir))

    # Remove quantization_config from config.json (leftover from 4-bit training)
    config_path = merged_dir / 'config.json'
    if config_path.exists():
        with open(config_path, 'r') as f:
            model_config = json.load(f)
        if 'quantization_config' in model_config:
            del model_config['quantization_config']
            model_config['dtype'] = 'float16'
            model_config['use_cache'] = True
            with open(config_path, 'w') as f:
                json.dump(model_config, f, indent=2)
            print(f"  Removed quantization_config from config.json")
    print(f"  Saved ({time.time() - merge_start:.1f}s)")

    # Step 5: Create Modelfile (with ChatML template for Qwen models)
    print("  [5/5] Creating Modelfile...")
    num_ctx = config.get('low_vram_seq_length', 2048)
    system_prompt = config['system_prompt']
    modelfile_content = f'''FROM .

TEMPLATE """{{{{- if .System }}}}<|im_start|>system
{{{{ .System }}}}<|im_end|>
{{{{ end }}}}{{{{- range .Messages }}}}<|im_start|>{{{{ .Role }}}}
{{{{ .Content }}}}<|im_end|>
{{{{ end }}}}<|im_start|>assistant
"""

PARAMETER temperature 0.3
PARAMETER top_p 0.85
PARAMETER top_k 40
PARAMETER num_ctx {num_ctx}
PARAMETER repeat_penalty 1.1
PARAMETER stop <|im_end|>
PARAMETER stop <|im_start|>

SYSTEM """{system_prompt}"""
'''
    modelfile_path = merged_dir / 'Modelfile'
    with open(modelfile_path, 'w', encoding='utf-8') as f:
        f.write(modelfile_content)

    elapsed = time.time() - merge_start
    print(f"\n  Merge complete in {elapsed / 60:.1f} minutes")

    # Cleanup GPU memory
    del model
    gc.collect()
    try:
        import torch
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    except Exception:
        pass

    return merged_dir


def convert_to_gguf(model_key, merged_dir):
    """Convert merged safetensors to GGUF format. Returns gguf_path on success."""
    config = MODELS[model_key]
    output_name = config['output_name']
    gguf_dir = MODELS_DIR / 'gguf'
    gguf_dir.mkdir(parents=True, exist_ok=True)
    gguf_path = gguf_dir / f'{output_name}.gguf'

    # Find convert script (llama.cpp sparse checkout)
    convert_script = AI_TRAINING_DIR / 'llama-cpp-convert' / 'convert_hf_to_gguf.py'
    if not convert_script.exists():
        print(f"  ERROR: convert_hf_to_gguf.py not found at {convert_script}")
        return None

    print(f"\n  Converting {output_name} to GGUF (f16)...")
    try:
        python_exe = AI_TRAINING_DIR / 'ml-env' / 'Scripts' / 'python.exe'
        if not python_exe.exists():
            python_exe = 'python'
        result = subprocess.run(
            [str(python_exe), str(convert_script), str(merged_dir),
             '--outfile', str(gguf_path), '--outtype', 'f16'],
            capture_output=True, text=True, timeout=1200,
            encoding='utf-8', errors='replace',
        )
        if result.returncode == 0:
            size_gb = gguf_path.stat().st_size / (1024**3)
            print(f"  GGUF created: {gguf_path} ({size_gb:.1f} GB)")
            return gguf_path
        else:
            stderr = result.stderr.strip() if result.stderr else 'Unknown error'
            print(f"  GGUF conversion failed: {stderr[-500:]}")
            return None
    except Exception as e:
        print(f"  GGUF conversion error: {e}")
        return None


def deploy_to_ollama(model_key, merged_dir):
    """Deploy merged model to Ollama via GGUF conversion.

    Strategy:
    1. Convert merged safetensors -> GGUF (f16)
    2. Create Modelfile referencing the .gguf file
    3. ollama create from GGUF Modelfile

    Note: Direct safetensors import (FROM .) fails on Windows 11 Dev builds
    due to 'untrusted mount point' security mitigation.
    """
    config = MODELS[model_key]
    output_name = config['output_name']
    lora_name = f"{output_name}-lora"
    gguf_dir = MODELS_DIR / 'gguf'

    # Step 1: Convert to GGUF
    gguf_path = gguf_dir / f'{output_name}.gguf'
    if not gguf_path.exists():
        gguf_path = convert_to_gguf(model_key, merged_dir)
        if gguf_path is None:
            return False

    # Step 2: Create GGUF Modelfile
    num_ctx = config.get('low_vram_seq_length', 2048)
    system_prompt = config['system_prompt']
    modelfile_content = f'''FROM ./{output_name}.gguf

# ChiroClick LoRA fine-tuned model
# Base: {config['name']}

TEMPLATE """{{{{- if .System }}}}<|im_start|>system
{{{{ .System }}}}<|im_end|>
{{{{ end }}}}{{{{- range .Messages }}}}<|im_start|>{{{{ .Role }}}}
{{{{ .Content }}}}<|im_end|>
{{{{ end }}}}<|im_start|>assistant
"""

PARAMETER temperature 0.3
PARAMETER top_p 0.85
PARAMETER top_k 40
PARAMETER num_ctx {num_ctx}
PARAMETER repeat_penalty 1.1
PARAMETER stop <|im_end|>
PARAMETER stop <|im_start|>

SYSTEM """{system_prompt}"""
'''
    modelfile_path = gguf_dir / f'Modelfile.{lora_name}'
    with open(modelfile_path, 'w', encoding='utf-8') as f:
        f.write(modelfile_content)

    # Step 3: Deploy via ollama create
    print(f"\n  Deploying {lora_name} to Ollama from GGUF...")
    try:
        result = subprocess.run(
            ['ollama', 'create', lora_name, '-f', str(modelfile_path)],
            cwd=str(gguf_dir),
            capture_output=True, text=True, timeout=600,
            encoding='utf-8', errors='replace',
        )
        if result.returncode == 0:
            print(f"  Deployed: {lora_name}")
            return True
        else:
            stderr = result.stderr.strip() if result.stderr else 'Unknown error'
            print(f"  Deploy failed: {stderr}")
            return False
    except Exception as e:
        print(f"  Deploy error: {e}")
        return False


def test_model(model_key, timeout=120):
    """Quick smoke test of a deployed model."""
    config = MODELS[model_key]
    output_name = config['output_name']
    lora_name = f"{output_name}-lora"

    test_prompt = "Skriv en kort klinisk vurdering for nakkesmerter."
    print(f"\n  Testing {lora_name}...")
    try:
        result = subprocess.run(
            ['ollama', 'run', lora_name, test_prompt],
            capture_output=True, text=True, timeout=timeout,
            encoding='utf-8', errors='replace',
        )
        if result.returncode == 0:
            response = result.stdout.strip()
            preview = response[:300] + ('...' if len(response) > 300 else '')
            has_norwegian = any(c in response for c in 'øæåØÆÅ')
            print(f"  Response length: {len(response)} chars")
            print(f"  Norwegian chars: {'YES' if has_norwegian else 'NO'}")
            print(f"  Preview: {preview}")
            return True
        else:
            stderr = ''.join(c for c in (result.stderr or '') if c.isprintable() or c in '\n\r\t')
            print(f"  Test failed: {stderr[:200]}")
            return False
    except subprocess.TimeoutExpired:
        print(f"  Test timed out (>{timeout}s)")
        return False
    except Exception as e:
        print(f"  Test error: {e}")
        return False


def update_progress(model_key, deployed=True):
    """Update training-progress.json."""
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, 'r') as f:
            progress = json.load(f)
    else:
        progress = {'completed': [], 'failed': [], 'deployed': []}

    if deployed and model_key not in progress.get('deployed', []):
        progress.setdefault('deployed', []).append(model_key)

    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, indent=2)


def main():
    parser = argparse.ArgumentParser(description='Merge LoRA adapter and deploy to Ollama')
    parser.add_argument('--model', choices=list(MODELS.keys()),
                        help='Model to merge and deploy')
    parser.add_argument('--all', action='store_true',
                        help='Merge and deploy all models with LoRA adapters')
    parser.add_argument('--low-memory', action='store_true',
                        help='Use CPU-only loading for large models (7B)')
    parser.add_argument('--skip-deploy', action='store_true',
                        help='Only merge, do not deploy to Ollama')
    parser.add_argument('--skip-test', action='store_true',
                        help='Skip smoke test after deployment')
    args = parser.parse_args()

    if not args.model and not args.all:
        parser.error("Specify --model or --all")

    # Determine which models to process
    if args.all:
        models_to_process = list(MODELS.keys())
    else:
        models_to_process = [args.model]

    # Filter to only models that have LoRA adapters
    available = []
    for key in models_to_process:
        lora_dir = MODELS_DIR / f"{MODELS[key]['output_name']}-lora"
        if lora_dir.exists() and (lora_dir / 'adapter_config.json').exists():
            available.append(key)
        else:
            print(f"  Skipping {key}: no LoRA adapter at {lora_dir}")

    if not available:
        print("No models with LoRA adapters found. Train models first.")
        return 1

    print(f"\n{'#'*60}")
    print(f"  LoRA Merge & Deploy Pipeline")
    print(f"  Models: {available}")
    print(f"  Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'#'*60}")

    overall_start = time.time()
    results = {}

    for model_key in available:
        config = MODELS[model_key]
        output_name = config['output_name']

        # Use low_memory for 7B models
        is_large = '7B' in config['name'] or model_key in ('norwegian', 'default')
        use_low_mem = args.low_memory or is_large

        # Merge
        merged_dir = merge_lora_model(model_key, low_memory=use_low_mem)
        if merged_dir is None:
            results[model_key] = 'MERGE_FAILED'
            continue

        # Deploy
        if not args.skip_deploy:
            deployed = deploy_to_ollama(model_key, merged_dir)
            if deployed:
                results[model_key] = 'DEPLOYED'
                update_progress(model_key, deployed=True)

                # Test
                if not args.skip_test:
                    test_model(model_key)
            else:
                results[model_key] = 'DEPLOY_FAILED'
        else:
            results[model_key] = 'MERGED'

    overall_time = time.time() - overall_start

    # Summary
    print(f"\n{'#'*60}")
    print(f"  MERGE & DEPLOY COMPLETE")
    print(f"  Total time: {overall_time / 60:.1f} minutes")
    print(f"  Results:")
    for key, status in results.items():
        print(f"    {MODELS[key]['output_name']}: {status}")
    print(f"{'#'*60}")

    # Show Ollama models
    print("\n  Current Ollama models:")
    subprocess.run(['ollama', 'list'], timeout=30)

    return 0 if all(v in ('DEPLOYED', 'MERGED') for v in results.values()) else 1


if __name__ == '__main__':
    sys.exit(main())
