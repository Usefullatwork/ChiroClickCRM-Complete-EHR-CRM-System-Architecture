#!/usr/bin/env python3
"""
ChiroClick Sequential Training Pipeline
Trains all 4 models one after another, deploys each to Ollama after completion.
Designed to run unattended for 8-11 hours.

Usage:
    python train_all_sequential.py
    python train_all_sequential.py --skip fast  # Skip already-trained models
    python train_all_sequential.py --only fast medical  # Train specific models only
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

# Training order: smallest first (faster feedback), largest last
TRAINING_ORDER = [
    {
        'key': 'fast',
        'dataset': 'quick-fields',
        'description': 'chiro-fast (Qwen2.5-1.5B, ~30 min)',
        'test_prompt': 'Skriv subjektiv for en pasient med korsryggsmerter',
    },
    {
        'key': 'medical',
        'dataset': 'medical-safety',
        'description': 'chiro-medical (Qwen2.5-3B, ~1-2 hrs)',
        'test_prompt': 'Identifiser røde flagg for hodepine med synsforstyrrelser og nakkestivhet',
    },
    {
        'key': 'norwegian',
        'dataset': 'norwegian-clinical',
        'description': 'chiro-norwegian (Qwen2.5-7B, ~3-4 hrs)',
        'test_prompt': 'Skriv et SOAP-notat for en pasient med cervikogen hodepine',
    },
    {
        'key': 'default',
        'dataset': 'general-clinical',
        'description': 'chiro-no (Qwen2.5-7B, ~3-4 hrs)',
        'test_prompt': 'Generer en klinisk vurdering for lumbal skiveprolaps L4-L5',
    },
]

SCRIPT_DIR = Path(__file__).parent
AI_TRAINING_DIR = SCRIPT_DIR.parent
PYTHON_EXE = AI_TRAINING_DIR / 'ml-env' / 'Scripts' / 'python.exe'
TRAIN_SCRIPT = SCRIPT_DIR / 'train_unsloth.py'
MODELS_DIR = AI_TRAINING_DIR / 'models'
LOGS_DIR = AI_TRAINING_DIR / 'logs'
DATA_DIR = AI_TRAINING_DIR / 'data' / 'processed'
PROGRESS_FILE = LOGS_DIR / 'training-progress.json'


def load_progress():
    """Load training progress from file."""
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f)
    return {'completed': [], 'failed': [], 'deployed': [], 'started_at': None}


def save_progress(progress):
    """Save training progress to file."""
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, indent=2)


def has_checkpoint(model_key):
    """Check if a model has an existing checkpoint to resume from."""
    from train_unsloth import MODELS
    output_name = MODELS[model_key]['output_name']
    model_dir = MODELS_DIR / output_name
    if not model_dir.exists():
        return False
    checkpoints = list(model_dir.glob('checkpoint-*'))
    return len(checkpoints) > 0


def train_model(model_info, force_resume=False):
    """Train a single model. Returns True on success."""
    key = model_info['key']
    dataset = model_info['dataset']

    # Check for existing checkpoint
    can_resume = has_checkpoint(key)
    will_resume = force_resume or can_resume

    print(f"\n{'='*70}")
    print(f"  TRAINING: {model_info['description']}")
    print(f"  Dataset: {dataset}")
    if will_resume:
        print(f"  Mode: RESUMING from checkpoint")
    print(f"  Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*70}\n")

    cmd = [
        str(PYTHON_EXE),
        str(TRAIN_SCRIPT),
        '--model', key,
        '--low-vram',
        '--data-dir', str(DATA_DIR / dataset),
        '--output', str(MODELS_DIR),
        '--log-dir', str(LOGS_DIR),
        '--quantize', 'q4_k_m',
    ]

    if will_resume:
        cmd.append('--resume')

    start = time.time()
    result = subprocess.run(cmd, timeout=36000)  # 10 hour max per model
    elapsed = time.time() - start

    if result.returncode == 0:
        print(f"\n  COMPLETED: {model_info['description']} in {elapsed/60:.1f} minutes")
        return True
    else:
        print(f"\n  FAILED: {model_info['description']} (exit code {result.returncode}) after {elapsed/60:.1f} minutes")
        return False


def deploy_model(model_key):
    """Deploy a trained model to Ollama. Returns True on success.

    Uses merged model directory with 'FROM .' Modelfile pattern.
    Falls back to GGUF-based deployment if merged dir is not available.
    """
    from train_unsloth import MODELS
    output_name = MODELS[model_key]['output_name']
    lora_name = f"{output_name}-lora"

    # Strategy 1: Use merged model directory (preferred — how fast/medical were deployed)
    merged_dir = MODELS_DIR / f'{output_name}-merged'
    merged_modelfile = merged_dir / 'Modelfile'

    if merged_dir.exists() and (merged_dir / 'model.safetensors').exists():
        if not merged_modelfile.exists():
            # Generate Modelfile if missing
            config = MODELS[model_key]
            modelfile_content = f'''FROM .

PARAMETER temperature 0.3
PARAMETER top_p 0.85
PARAMETER top_k 40
PARAMETER num_ctx {config.get('low_vram_seq_length', 2048)}
PARAMETER repeat_penalty 1.0

SYSTEM "{config['system_prompt']}"
'''
            with open(merged_modelfile, 'w', encoding='utf-8') as f:
                f.write(modelfile_content)
            print(f"  Generated Modelfile: {merged_modelfile}")

        print(f"\n  Deploying {lora_name} from merged dir: {merged_dir}")
        try:
            result = subprocess.run(
                ['ollama', 'create', lora_name, '-f', str(merged_modelfile)],
                cwd=str(merged_dir),
                capture_output=True, text=True, timeout=600,
                encoding='utf-8',
            )
            if result.returncode == 0:
                print(f"  Deployed: {lora_name}")
                return True
            else:
                print(f"  Deploy failed: {result.stderr}")
                return False
        except Exception as e:
            print(f"  Deploy error: {e}")
            return False

    # Strategy 2: Fall back to GGUF-based deployment
    gguf_dir = MODELS_DIR / 'gguf'
    modelfile = gguf_dir / f"Modelfile.{lora_name}"
    gguf_file = gguf_dir / f"{output_name}.gguf"

    if gguf_file.exists() and modelfile.exists():
        print(f"\n  Deploying {lora_name} from GGUF: {gguf_file}")
        try:
            result = subprocess.run(
                ['ollama', 'create', lora_name, '-f', str(modelfile)],
                cwd=str(gguf_dir),
                capture_output=True, text=True, timeout=600,
                encoding='utf-8',
            )
            if result.returncode == 0:
                print(f"  Deployed: {lora_name}")
                return True
            else:
                print(f"  Deploy failed: {result.stderr}")
                return False
        except Exception as e:
            print(f"  Deploy error: {e}")
            return False

    print(f"  WARNING: No deployable model found for {output_name}")
    print(f"  Expected merged dir: {merged_dir}")
    print(f"  Expected GGUF: {gguf_file}")
    return False


def test_model(model_key, test_prompt):
    """Test a deployed model with a clinical prompt."""
    from train_unsloth import MODELS
    output_name = MODELS[model_key]['output_name']
    lora_name = f"{output_name}-lora"

    print(f"\n  Testing {lora_name}...")
    try:
        result = subprocess.run(
            ['ollama', 'run', lora_name, test_prompt],
            capture_output=True, text=True, timeout=120,
        )
        if result.returncode == 0:
            response = result.stdout.strip()
            # Show first 500 chars
            preview = response[:500] + ('...' if len(response) > 500 else '')
            print(f"  Response preview:\n  {preview}\n")
            return True
        else:
            print(f"  Test failed: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print(f"  Test timed out (>120s)")
        return False
    except Exception as e:
        print(f"  Test error: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description='Train all ChiroClick models sequentially')
    parser.add_argument('--skip', nargs='+', default=[], help='Models to skip (e.g., fast medical)')
    parser.add_argument('--only', nargs='+', default=[], help='Train only these models')
    parser.add_argument('--no-deploy', action='store_true', help='Skip Ollama deployment')
    parser.add_argument('--resume', action='store_true', help='Resume from last progress checkpoint')
    args = parser.parse_args()

    progress = load_progress() if args.resume else {
        'completed': [], 'failed': [], 'deployed': [],
        'started_at': datetime.now().isoformat(),
    }

    # Filter models
    models_to_train = TRAINING_ORDER
    if args.only:
        models_to_train = [m for m in models_to_train if m['key'] in args.only]
    if args.skip:
        models_to_train = [m for m in models_to_train if m['key'] not in args.skip]
    if args.resume:
        models_to_train = [m for m in models_to_train if m['key'] not in progress['completed']]

    print(f"\n{'#'*70}")
    print(f"  ChiroClick Sequential Training Pipeline")
    print(f"  Models to train: {[m['key'] for m in models_to_train]}")
    print(f"  Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'#'*70}\n")

    overall_start = time.time()

    for i, model_info in enumerate(models_to_train, 1):
        key = model_info['key']
        print(f"\n[{i}/{len(models_to_train)}] Starting {key}...")

        # Train
        success = train_model(model_info)

        if success:
            progress['completed'].append(key)

            # Deploy to Ollama
            if not args.no_deploy:
                deployed = deploy_model(key)
                if deployed:
                    progress['deployed'].append(key)
                    test_model(key, model_info['test_prompt'])

            # Clear GPU memory between models
            try:
                import torch
                torch.cuda.empty_cache()
                torch.cuda.synchronize()
            except Exception:
                pass
            gc.collect()
        else:
            progress['failed'].append(key)

        save_progress(progress)

    overall_time = time.time() - overall_start

    # Final summary
    print(f"\n{'#'*70}")
    print(f"  TRAINING PIPELINE COMPLETE")
    print(f"  Total time: {overall_time/3600:.1f} hours ({overall_time/60:.0f} minutes)")
    print(f"  Completed: {progress['completed']}")
    print(f"  Failed: {progress['failed']}")
    print(f"  Deployed: {progress['deployed']}")
    print(f"{'#'*70}\n")

    # List all chiro models in Ollama
    print("  Current Ollama models:")
    subprocess.run(['ollama', 'list'], timeout=30)

    return 0 if not progress['failed'] else 1


if __name__ == '__main__':
    sys.exit(main())
