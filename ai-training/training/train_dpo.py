#!/usr/bin/env python3
"""
DPO (Direct Preference Optimization) Training — ChiroClickCRM

Trains models using preference pairs from user feedback.
Requires: ≥500 preference pairs (prompt, chosen, rejected).

This is the "next level" after SFT — uses human feedback to align
model outputs with practitioner preferences.

Usage:
    python training/train_dpo.py --model norwegian --data-dir ../data/dpo/
    python training/train_dpo.py --model default --epochs 2 --beta 0.1

Prerequisites:
    1. Export preference pairs: python scripts/export_dpo_pairs.py
    2. Minimum 500 preference pairs in data/dpo/train.jsonl
"""

import argparse
import gc
import json
import logging
import os
import sys
import time
from datetime import datetime
from pathlib import Path

# ============================================================
# Model Configurations (same as SFT)
# ============================================================

MODELS = {
    'norwegian': {
        'name': 'Qwen/Qwen2.5-7B-Instruct',
        'fallback': 'mistralai/Mistral-7B-Instruct-v0.2',
        'output_name': 'chiro-norwegian',
        'description': 'Norwegian clinical documentation (DPO)',
        'max_seq_length': 2048,  # Reduced for DPO (3 sequences per example)
    },
    'medical': {
        'name': 'Qwen/Qwen2.5-3B-Instruct',
        'fallback': 'Qwen/Qwen2.5-1.5B-Instruct',
        'output_name': 'chiro-medical',
        'description': 'Medical safety (DPO)',
        'max_seq_length': 2048,
    },
    'fast': {
        'name': 'Qwen/Qwen2.5-1.5B-Instruct',
        'fallback': 'Qwen/Qwen2.5-0.5B-Instruct',
        'output_name': 'chiro-fast',
        'description': 'Quick autocomplete (DPO)',
        'max_seq_length': 2048,
    },
    'default': {
        'name': 'Qwen/Qwen2.5-7B-Instruct',
        'fallback': 'Qwen/Qwen2.5-3B-Instruct',
        'output_name': 'chiro-no',
        'description': 'General clinical (DPO)',
        'max_seq_length': 2048,
    },
}

# LoRA config for DPO (same as SFT)
LORA_CONFIG = {
    'r': 16,
    'lora_alpha': 16,
    'lora_dropout': 0.05,
    'target_modules': [
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj"
    ],
    'bias': "none",
}


def setup_logging(model_key):
    """Set up logging for DPO training."""
    log_dir = Path(__file__).parent.parent / 'logs'
    log_dir.mkdir(exist_ok=True)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    log_file = log_dir / f'dpo_{model_key}_{timestamp}.log'

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(message)s',
        handlers=[
            logging.FileHandler(log_file, encoding='utf-8'),
            logging.StreamHandler(sys.stdout),
        ]
    )
    return logging.getLogger(__name__)


def check_gpu(logger):
    """Check GPU availability and VRAM."""
    try:
        import torch
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            gpu_mem = torch.cuda.get_device_properties(0).total_memory / (1024**3)
            logger.info(f'GPU: {gpu_name} ({gpu_mem:.1f} GB)')
            return True, gpu_mem
        else:
            logger.warning('No GPU available, training will be slow')
            return False, 0
    except ImportError:
        logger.error('PyTorch not installed')
        return False, 0


def load_dpo_dataset(data_dir, logger):
    """Load DPO preference pairs from JSONL files.

    Expected format per line:
    {
        "prompt": "User's clinical prompt",
        "chosen": "Preferred (better) response",
        "rejected": "Rejected (worse) response"
    }
    """
    from datasets import Dataset

    train_path = os.path.join(data_dir, 'train.jsonl')
    val_path = os.path.join(data_dir, 'validation.jsonl')

    if not os.path.exists(train_path):
        logger.error(f'Training data not found: {train_path}')
        logger.error('Generate DPO pairs first: python scripts/export_dpo_pairs.py')
        sys.exit(1)

    # Load training data
    train_data = []
    with open(train_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                item = json.loads(line)
                # Validate required fields
                if all(k in item for k in ['prompt', 'chosen', 'rejected']):
                    train_data.append(item)

    logger.info(f'Loaded {len(train_data)} training preference pairs')

    if len(train_data) < 100:
        logger.warning(f'Only {len(train_data)} pairs — recommend ≥500 for good results')

    # Load validation data
    val_data = []
    if os.path.exists(val_path):
        with open(val_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line:
                    item = json.loads(line)
                    if all(k in item for k in ['prompt', 'chosen', 'rejected']):
                        val_data.append(item)
        logger.info(f'Loaded {len(val_data)} validation preference pairs')
    else:
        # Split training data 90/10
        split_idx = int(len(train_data) * 0.9)
        val_data = train_data[split_idx:]
        train_data = train_data[:split_idx]
        logger.info(f'Split: {len(train_data)} train / {len(val_data)} validation')

    train_dataset = Dataset.from_list(train_data)
    val_dataset = Dataset.from_list(val_data)

    return train_dataset, val_dataset


def train_dpo(model_key, data_dir, args, logger):
    """Run DPO training on a model."""
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
    from trl import DPOTrainer, DPOConfig

    config = MODELS[model_key]
    output_dir = Path(__file__).parent.parent / 'models' / f'{config["output_name"]}-dpo'

    logger.info(f'DPO Training: {config["description"]}')
    logger.info(f'Base model: {config["name"]}')
    logger.info(f'Output: {output_dir}')

    # Check if SFT LoRA exists (DPO should be applied on top of SFT)
    # train_unsloth.py saves to models/{output_name}/ with checkpoint-* subdirs
    sft_base_dir = Path(__file__).parent.parent / 'models' / config["output_name"]
    sft_lora_dir = None
    if sft_base_dir.exists():
        # Look for latest checkpoint with adapter_model.safetensors
        checkpoints = sorted(sft_base_dir.glob("checkpoint-*"))
        for ckpt in reversed(checkpoints):
            if (ckpt / "adapter_model.safetensors").exists():
                sft_lora_dir = ckpt
                break
        if sft_lora_dir is None and (sft_base_dir / "adapter_model.safetensors").exists():
            sft_lora_dir = sft_base_dir
    use_sft_base = sft_lora_dir is not None
    if use_sft_base:
        logger.info(f'Found SFT LoRA at {sft_lora_dir} — will apply DPO on top of SFT')
    else:
        logger.info('No SFT LoRA found — applying DPO directly on base model')

    # Load dataset
    train_dataset, val_dataset = load_dpo_dataset(data_dir, logger)

    # Quantization config (4-bit NF4)
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
    )

    # Load base model
    model_name = config['name']
    logger.info(f'Loading base model: {model_name}')

    try:
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            quantization_config=bnb_config,
            device_map="auto",
            trust_remote_code=True,
        )
    except Exception as e:
        logger.warning(f'Failed to load {model_name}: {e}')
        model_name = config.get('fallback', model_name)
        logger.info(f'Trying fallback: {model_name}')
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            quantization_config=bnb_config,
            device_map="auto",
            trust_remote_code=True,
        )

    tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # If SFT LoRA exists, merge it first
    if use_sft_base:
        from peft import PeftModel
        logger.info('Merging SFT LoRA weights...')
        model = PeftModel.from_pretrained(model, str(sft_lora_dir))
        model = model.merge_and_unload()
        logger.info('SFT LoRA merged successfully')

    # Prepare for k-bit training
    model = prepare_model_for_kbit_training(model)

    # Apply new LoRA adapter for DPO
    lora_config = LoraConfig(
        r=LORA_CONFIG['r'],
        lora_alpha=LORA_CONFIG['lora_alpha'],
        lora_dropout=LORA_CONFIG['lora_dropout'],
        target_modules=LORA_CONFIG['target_modules'],
        bias=LORA_CONFIG['bias'],
        task_type="CAUSAL_LM",
    )
    model = get_peft_model(model, lora_config)

    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total_params = sum(p.numel() for p in model.parameters())
    logger.info(f'Trainable parameters: {trainable_params:,} / {total_params:,} '
                f'({trainable_params/total_params*100:.2f}%)')

    # DPO Training config
    dpo_config = DPOConfig(
        output_dir=str(output_dir),
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=args.grad_accum,
        learning_rate=args.lr,
        beta=args.beta,  # DPO-specific: controls deviation from reference policy
        lr_scheduler_type="cosine",
        warmup_steps=20,
        weight_decay=0.01,
        max_grad_norm=0.3,
        logging_steps=5,
        save_strategy="epoch",
        eval_strategy="epoch",
        save_total_limit=2,
        bf16=torch.cuda.is_bf16_supported(),
        fp16=not torch.cuda.is_bf16_supported(),
        max_length=config['max_seq_length'],
        max_prompt_length=config['max_seq_length'] // 2,
        report_to="none",
        remove_unused_columns=False,
        # Critical for RTX 4070 (12GB): precompute ref log probs to avoid
        # loading both policy and reference models simultaneously
        precompute_ref_log_probs=True,
        gradient_checkpointing=True,
        dataloader_num_workers=0,
        seed=42,
    )

    # Create DPO trainer
    trainer = DPOTrainer(
        model=model,
        args=dpo_config,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        processing_class=tokenizer,
    )

    # Train
    logger.info('Starting DPO training...')
    start_time = time.time()

    try:
        train_result = trainer.train()
        elapsed = (time.time() - start_time) / 60
        logger.info(f'Training completed in {elapsed:.1f} minutes')
        logger.info(f'Training loss: {train_result.training_loss:.4f}')
    except torch.cuda.OutOfMemoryError:
        logger.error('OUT OF MEMORY! Try: --batch-size 1 --grad-accum 8')
        gc.collect()
        torch.cuda.empty_cache()
        sys.exit(1)
    except Exception as e:
        logger.error(f'Training failed: {e}')
        raise

    # Save LoRA adapter
    logger.info(f'Saving DPO LoRA adapter to {output_dir}')
    model.save_pretrained(str(output_dir))
    tokenizer.save_pretrained(str(output_dir))

    # Evaluate
    if len(val_dataset) > 0:
        eval_results = trainer.evaluate()
        logger.info(f'Eval results: {eval_results}')

    # Update training log
    log_path = Path(__file__).parent.parent / 'logs' / 'training-progress.json'
    try:
        if log_path.exists():
            with open(log_path, 'r', encoding='utf-8') as f:
                progress = json.load(f)
        else:
            progress = {}

        progress[f'{model_key}_dpo'] = {
            'status': 'completed',
            'base_model': model_name,
            'training_loss': round(train_result.training_loss, 4),
            'elapsed_minutes': round(elapsed, 1),
            'dataset_size': len(train_dataset),
            'epochs': args.epochs,
            'beta': args.beta,
            'timestamp': datetime.now().isoformat(),
        }

        with open(log_path, 'w', encoding='utf-8') as f:
            json.dump(progress, f, indent=2)
    except Exception as e:
        logger.warning(f'Could not update training log: {e}')

    logger.info(f'\nDPO training complete!')
    logger.info(f'Next step: python scripts/merge_and_deploy.py --model {model_key} --dpo')
    logger.info(f'(merge_and_deploy.py will need to be updated to support --dpo flag)')

    # Cleanup
    del model, trainer
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()


def main():
    parser = argparse.ArgumentParser(description='DPO Training for ChiroClickCRM AI Models')
    parser.add_argument('--model', required=True, choices=list(MODELS.keys()),
                       help='Model to train (norwegian, medical, fast, default)')
    parser.add_argument('--data-dir', type=str, default=None,
                       help='Path to DPO preference pairs directory')
    parser.add_argument('--epochs', type=int, default=2,
                       help='Number of training epochs (default: 2)')
    parser.add_argument('--batch-size', type=int, default=1,
                       help='Per-device batch size (default: 1)')
    parser.add_argument('--grad-accum', type=int, default=8,
                       help='Gradient accumulation steps (default: 8)')
    parser.add_argument('--learning-rate', '--lr', type=float, default=5e-5,
                       dest='lr',
                       help='Learning rate (default: 5e-5, lower than SFT)')
    parser.add_argument('--beta', type=float, default=0.1,
                       help='DPO beta parameter (default: 0.1)')
    args = parser.parse_args()

    logger = setup_logging(args.model)

    # Set default data directory
    if args.data_dir is None:
        args.data_dir = str(Path(__file__).parent.parent / 'data' / 'dpo')

    logger.info(f'ChiroClickCRM DPO Training')
    logger.info(f'Model: {args.model}')
    logger.info(f'Data: {args.data_dir}')
    logger.info(f'Beta: {args.beta}')

    # Check prerequisites
    has_gpu, gpu_mem = check_gpu(logger)
    if not has_gpu:
        logger.warning('No GPU detected — DPO training will be very slow')

    # Check data exists
    if not os.path.exists(args.data_dir):
        logger.error(f'DPO data directory not found: {args.data_dir}')
        logger.error('Generate DPO pairs first:')
        logger.error('  1. Collect ≥500 feedback pairs via the application')
        logger.error('  2. Run: python scripts/export_dpo_pairs.py')
        sys.exit(1)

    train_path = os.path.join(args.data_dir, 'train.jsonl')
    if not os.path.exists(train_path):
        logger.error(f'Training file not found: {train_path}')
        logger.error('Export preference pairs: python scripts/export_dpo_pairs.py')
        sys.exit(1)

    # Count pairs
    with open(train_path, 'r', encoding='utf-8') as f:
        pair_count = sum(1 for line in f if line.strip())

    if pair_count < 100:
        logger.warning(f'Only {pair_count} preference pairs — recommend ≥500')
        logger.warning('Continue anyway? Training may not be effective.')
    elif pair_count < 500:
        logger.info(f'{pair_count} preference pairs — acceptable but ≥500 recommended')
    else:
        logger.info(f'{pair_count} preference pairs — good dataset size')

    # Train
    train_dpo(args.model, args.data_dir, args, logger)


if __name__ == '__main__':
    main()
