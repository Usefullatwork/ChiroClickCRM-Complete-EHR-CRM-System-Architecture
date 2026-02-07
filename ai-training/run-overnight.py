#!/usr/bin/env python3
"""
ChiroClickCRM Overnight Training Launcher
Run this with: py -3.11 run-overnight.py
"""

import subprocess
import sys
import os
import time
from pathlib import Path
from datetime import datetime

AI_DIR = Path(__file__).parent.resolve()
VENV_DIR = AI_DIR / "ml-env"
SCRIPTS_DIR = AI_DIR / "scripts"
TRAINING_DIR = AI_DIR / "training"
DATA_DIR = AI_DIR / "data" / "processed"
MODELS_DIR = AI_DIR / "models"
GGUF_DIR = MODELS_DIR / "gguf"
LOGS_DIR = AI_DIR / "logs"

LOGS_DIR.mkdir(exist_ok=True)
MODELS_DIR.mkdir(exist_ok=True)

timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
LOGFILE = LOGS_DIR / f"overnight-{timestamp}.log"


def log(msg):
    line = f"[{datetime.now().strftime('%H:%M:%S')}] {msg}"
    print(line, flush=True)
    with open(LOGFILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def run(cmd, timeout=None):
    """Run a command, logging output in real-time."""
    log(f"Running: {' '.join(str(c) for c in cmd)}")
    proc = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        text=True, encoding="utf-8", errors="replace"
    )
    output_lines = []
    try:
        for line in proc.stdout:
            line = line.rstrip()
            print(line, flush=True)
            output_lines.append(line)
            with open(LOGFILE, "a", encoding="utf-8") as f:
                f.write(line + "\n")
        proc.wait(timeout=timeout)
    except subprocess.TimeoutExpired:
        proc.kill()
        log("TIMEOUT - process killed")
    return proc.returncode, output_lines


def main():
    overall_start = time.time()

    log("=" * 60)
    log("ChiroClickCRM Overnight Training Pipeline")
    log(f"Started: {datetime.now()}")
    log(f"Log: {LOGFILE}")
    log("=" * 60)

    # ── Phase 0: Environment ──
    log("\n[Phase 0] Environment checks")

    # Check GPU
    rc, _ = run(["nvidia-smi", "--query-gpu=name,memory.total",
                  "--format=csv,noheader,nounits"])
    if rc != 0:
        log("WARNING: nvidia-smi failed - GPU may not be available")

    # Check Ollama
    rc, _ = run(["ollama", "--version"])
    ollama_ok = rc == 0
    if not ollama_ok:
        log("WARNING: Ollama not found - model deployment will be skipped")

    # ── Phase 1: Virtual Environment ──
    log("\n[Phase 1] Setting up ML environment")

    python_cmd = str(VENV_DIR / "Scripts" / "python.exe")
    pip_cmd = str(VENV_DIR / "Scripts" / "pip.exe")

    if not os.path.exists(python_cmd):
        log("Creating virtual environment...")
        rc, _ = run(["py", "-3.11", "-m", "venv", str(VENV_DIR)])
        if rc != 0:
            log("ERROR: Failed to create venv")
            return 1

    # Check if torch is installed
    rc, _ = run([python_cmd, "-c",
                 "import torch; print(f'PyTorch {torch.__version__}, CUDA: {torch.cuda.is_available()}')"])
    if rc != 0:
        log("Installing PyTorch with CUDA...")
        run([pip_cmd, "install", "torch", "torchvision", "torchaudio",
             "--index-url", "https://download.pytorch.org/whl/cu121"],
            timeout=600)

    # Check if ML dependencies are installed
    rc, _ = run([python_cmd, "-c",
                 "from transformers import AutoModelForCausalLM; from peft import LoraConfig; "
                 "from trl import SFTTrainer; import bitsandbytes; print('ML deps OK')"])
    if rc != 0:
        log("Installing ML dependencies (this takes a while)...")
        run([pip_cmd, "install",
             "transformers==4.44.2", "datasets==2.21.0", "accelerate==0.34.2"],
            timeout=300)
        run([pip_cmd, "install",
             "peft==0.13.2", "trl==0.9.6", "bitsandbytes==0.43.3"],
            timeout=300)
        run([pip_cmd, "install",
             "rouge-score", "nltk", "tqdm", "pandas", "numpy<2"],
            timeout=120)

    # Verify CUDA
    log("Verifying CUDA...")
    run([python_cmd, "-c",
         "import torch; print(f'CUDA: {torch.cuda.is_available()}'); "
         "print(f'GPU: {torch.cuda.get_device_name(0)}' if torch.cuda.is_available() else 'No GPU')"])

    # ── Phase 2: Clean Data ──
    log("\n[Phase 2] Cleaning training data")
    rc, _ = run([python_cmd, str(SCRIPTS_DIR / "clean_and_prepare.py"),
                 "--output-dir", str(DATA_DIR)])
    if rc != 0:
        log("ERROR: Data cleaning failed")
        return 1

    train_file = DATA_DIR / "all-clean" / "train.jsonl"
    if not train_file.exists():
        log("ERROR: No training data produced")
        return 1

    # ── Phase 3: Train Models ──
    models = [
        ("fast",      "quick-fields",       "chiro-fast"),
        ("medical",   "medical-safety",     "chiro-medical"),
        ("norwegian", "norwegian-clinical", "chiro-norwegian"),
        ("default",   "general-clinical",   "chiro-no"),
    ]

    trained = 0
    failed = []
    succeeded = []

    for model_key, dataset_name, output_name in models:
        log(f"\n{'=' * 60}")
        log(f"[Phase 3] Training {output_name} ({model_key})")
        log(f"{'=' * 60}")

        model_start = time.time()

        # Pick dataset
        ds_dir = DATA_DIR / dataset_name
        if not (ds_dir / "train.jsonl").exists():
            ds_dir = DATA_DIR / "all-clean"
        log(f"Dataset: {ds_dir}")

        # Train
        rc, _ = run([
            python_cmd, str(TRAINING_DIR / "train_unsloth.py"),
            "--model", model_key,
            "--data-dir", str(ds_dir),
            "--output", str(MODELS_DIR),
            "--log-dir", str(LOGS_DIR),
            "--low-vram",
            "--quantize", "q4_k_m",
        ], timeout=6 * 3600)  # 6h max per model

        elapsed = (time.time() - model_start) / 60
        if rc == 0:
            log(f"{output_name}: COMPLETE in {elapsed:.0f} min")
            trained += 1
            succeeded.append(output_name)

            # Deploy to Ollama
            lora_name = f"{output_name}-lora"
            modelfile = GGUF_DIR / f"Modelfile.{lora_name}"
            if ollama_ok and modelfile.exists():
                log(f"Deploying {lora_name} to Ollama...")
                run(["ollama", "create", lora_name, "-f", str(modelfile)])
        else:
            log(f"{output_name}: FAILED after {elapsed:.0f} min - continuing")
            failed.append(output_name)

    # ── Phase 4: Validation ──
    log(f"\n[Phase 4] Validation")
    validate_script = SCRIPTS_DIR / "validate_models.py"
    if validate_script.exists():
        run([python_cmd, str(validate_script), "--log-dir", str(LOGS_DIR)])

    # ── Summary ──
    total_time = (time.time() - overall_start) / 60
    log(f"\n{'=' * 60}")
    log("OVERNIGHT TRAINING COMPLETE")
    log(f"{'=' * 60}")
    log(f"Total time: {total_time:.0f} minutes")
    log(f"Models trained: {trained} / 4")
    log(f"Succeeded: {', '.join(succeeded) if succeeded else 'none'}")
    log(f"Failed: {', '.join(failed) if failed else 'none'}")
    log(f"Log: {LOGFILE}")
    log(f"\nNext steps:")
    log(f"  ollama list | findstr chiro")
    log(f"  ollama run chiro-fast-lora \"Generer hovedklage for nakkesmerter\"")
    log(f"{'=' * 60}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
