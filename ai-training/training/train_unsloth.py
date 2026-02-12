#!/usr/bin/env python3
"""
ChiroClick LoRA Fine-Tuning (Standard transformers + peft)

Usage:
    python train_unsloth.py --model norwegian --data-dir ../data/processed/norwegian-clinical
    python train_unsloth.py --model medical --epochs 3 --quantize q4_k_m
    python train_unsloth.py --model fast --low-vram
    python train_unsloth.py --model default --low-vram --data-dir ../data/processed/general-clinical

Models:
    norwegian - Mistral 7B (Norwegian clinical)
    medical   - Gemma 2 2B (clinical safety, fallback from MedGemma)
    fast      - Llama 3.2 3B (autocomplete)
    default   - Mistral 7B (general clinical)
"""

import argparse
import gc
import logging
import os
import sys
import time
from datetime import datetime
from pathlib import Path

# ============================================================
# Model Configurations
# ============================================================

MODELS = {
    'norwegian': {
        'name': 'Qwen/Qwen2.5-7B-Instruct',
        'fallback': 'mistralai/Mistral-7B-Instruct-v0.2',
        'output_name': 'chiro-norwegian',
        'description': 'Norwegian clinical documentation',
        'max_seq_length': 4096,
        'low_vram_seq_length': 2048,
        'system_prompt': (
            'Du er en klinisk dokumentasjonsspesialist for kiropraktikk i Norge. '
            'Generer nøyaktige, profesjonelle SOAP-notater og klinisk dokumentasjon. '
            'Bruk korrekt norsk medisinsk terminologi og følg norske retningslinjer. '
            'Prioriter alltid pasientsikkerhet og korrekt medisinsk informasjon.'
        ),
    },
    'medical': {
        'name': 'Qwen/Qwen2.5-3B-Instruct',
        'fallback': 'Qwen/Qwen2.5-1.5B-Instruct',
        'output_name': 'chiro-medical',
        'description': 'Medical safety and red flag detection',
        'max_seq_length': 2048,
        'low_vram_seq_length': 2048,
        'system_prompt': (
            'Du er en medisinsk sikkerhetsrådgiver for kiropraktikk. '
            'Identifiser røde flagg, gi differensialdiagnostikk og klinisk resonnering. '
            'Prioriter alltid pasientsikkerhet.'
        ),
    },
    'fast': {
        'name': 'Qwen/Qwen2.5-1.5B-Instruct',
        'fallback': 'Qwen/Qwen2.5-0.5B-Instruct',
        'output_name': 'chiro-fast',
        'description': 'Quick autocomplete and suggestions',
        'max_seq_length': 2048,
        'low_vram_seq_length': 2048,
        'system_prompt': (
            'Du er en rask klinisk tekstassistent. '
            'Generer korte, presise kliniske tekstfelt for kiropraktisk dokumentasjon.'
        ),
    },
    'default': {
        'name': 'Qwen/Qwen2.5-7B-Instruct',
        'fallback': 'Qwen/Qwen2.5-3B-Instruct',
        'output_name': 'chiro-no',
        'description': 'General clinical documentation',
        'max_seq_length': 4096,
        'low_vram_seq_length': 2048,
        'system_prompt': (
            'Du er en klinisk dokumentasjonsspesialist for kiropraktikk i Norge. '
            'Generer nøyaktige, profesjonelle kliniske dokumenter.'
        ),
    },
}

# LoRA configuration
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

# Default training config
TRAINING_CONFIG = {
    'learning_rate': 2e-4,
    'lr_scheduler_type': "linear",
    'warmup_steps': 50,
    'per_device_train_batch_size': 4,
    'gradient_accumulation_steps': 4,
    'num_train_epochs': 3,
    'weight_decay': 0.01,
    'max_grad_norm': 0.3,
    'optim': "adamw_torch",
    'logging_steps': 10,
    'save_strategy': "epoch",
    'eval_strategy': "epoch",
    'save_total_limit': 2,
}

# Low-VRAM overrides (for 6GB GPUs like RTX 2060)
LOW_VRAM_CONFIG = {
    'per_device_train_batch_size': 1,
    'gradient_accumulation_steps': 4,
    'num_train_epochs': 3,
}

# Ultra-low VRAM fallback (if first attempt OOMs)
ULTRA_LOW_VRAM_CONFIG = {
    'per_device_train_batch_size': 1,
    'gradient_accumulation_steps': 8,
    'max_seq_length_override': 1024,
}


# ============================================================
# Logging Setup
# ============================================================

def setup_logging(model_key, log_dir):
    """Set up file + console logging."""
    log_dir = Path(log_dir)
    log_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    log_file = log_dir / f"train-{model_key}-{timestamp}.log"

    logger = logging.getLogger("chiroclickcrm")
    logger.setLevel(logging.DEBUG)
    logger.handlers.clear()

    fh = logging.FileHandler(log_file, encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(logging.Formatter(
        "%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S"
    ))
    logger.addHandler(fh)

    ch = logging.StreamHandler(sys.stdout)
    ch.setLevel(logging.INFO)
    ch.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(ch)

    logger.info(f"Logging to: {log_file}")
    return logger, log_file


# ============================================================
# GPU Utilities
# ============================================================

def check_gpu(logger):
    """Check GPU availability and log info."""
    try:
        import torch
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            gpu_mem = torch.cuda.get_device_properties(0).total_memory / 1e9
            logger.info(f"GPU: {gpu_name}")
            logger.info(f"VRAM: {gpu_mem:.1f} GB total")
            return True, gpu_mem
        else:
            logger.warning("No GPU detected. Training will be very slow.")
            return False, 0
    except Exception as e:
        logger.warning(f"Could not check GPU: {e}")
        return False, 0


def log_gpu_memory(logger, prefix=""):
    """Log current GPU memory usage."""
    try:
        import torch
        if torch.cuda.is_available():
            alloc = torch.cuda.memory_allocated(0) / 1e9
            reserved = torch.cuda.memory_reserved(0) / 1e9
            logger.debug(f"{prefix}GPU memory: {alloc:.2f}GB allocated, {reserved:.2f}GB reserved")
    except Exception:
        pass


def clear_gpu_memory(logger):
    """Clear GPU cache between models."""
    try:
        import torch
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            torch.cuda.synchronize()
            gc.collect()
            logger.info("GPU memory cleared")
            log_gpu_memory(logger, "After cleanup: ")
    except Exception as e:
        logger.warning(f"Could not clear GPU memory: {e}")


# ============================================================
# Model Loading (standard transformers + peft)
# ============================================================

def load_model_with_lora(model_key, max_seq_length, logger):
    """Load model with LoRA adapters using standard transformers + peft."""
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

    config = MODELS[model_key]
    model_name = config['name']

    logger.info(f"Loading model: {model_name}")
    logger.info(f"Max sequence length: {max_seq_length}")

    # 4-bit quantization config
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
    )

    load_start = time.time()
    try:
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            quantization_config=bnb_config,
            device_map="auto",
            dtype=torch.float16,
            trust_remote_code=True,
        )
        tokenizer = AutoTokenizer.from_pretrained(
            model_name,
            trust_remote_code=True,
        )
        logger.info(f"Loaded primary model in {time.time() - load_start:.1f}s")
    except Exception as e:
        logger.warning(f"Failed to load {model_name}: {e}")
        logger.info(f"Trying fallback: {config['fallback']}")
        model = AutoModelForCausalLM.from_pretrained(
            config['fallback'],
            quantization_config=bnb_config,
            device_map="auto",
            dtype=torch.float16,
            trust_remote_code=True,
        )
        tokenizer = AutoTokenizer.from_pretrained(
            config['fallback'],
            trust_remote_code=True,
        )
        logger.info(f"Loaded fallback model in {time.time() - load_start:.1f}s")

    # Set padding token if not set
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
        tokenizer.pad_token_id = tokenizer.eos_token_id

    log_gpu_memory(logger, "After model load: ")

    # Prepare model for k-bit training
    logger.info("Preparing model for 4-bit training...")
    model = prepare_model_for_kbit_training(model)

    # Add LoRA adapters
    logger.info("Adding LoRA adapters...")
    lora_config = LoraConfig(
        r=LORA_CONFIG['r'],
        lora_alpha=LORA_CONFIG['lora_alpha'],
        lora_dropout=LORA_CONFIG['lora_dropout'],
        target_modules=LORA_CONFIG['target_modules'],
        bias=LORA_CONFIG['bias'],
        task_type="CAUSAL_LM",
    )

    model = get_peft_model(model, lora_config)
    model.config.use_cache = False  # Required for gradient checkpointing

    log_gpu_memory(logger, "After LoRA: ")
    return model, tokenizer


# ============================================================
# Dataset Loading
# ============================================================

def load_dataset_from_dir(data_dir, logger):
    """Load training and validation datasets from a directory."""
    from datasets import load_dataset

    data_dir = Path(data_dir)
    train_file = data_dir / 'train.jsonl'
    val_file = data_dir / 'validation.jsonl'

    if not train_file.exists():
        raise FileNotFoundError(f"Training file not found: {train_file}")

    logger.info(f"Loading datasets from: {data_dir}")

    data_files = {'train': str(train_file)}
    if val_file.exists():
        data_files['validation'] = str(val_file)
    else:
        data_files['validation'] = str(train_file)
        logger.warning("No validation file found, using train for validation")

    dataset = load_dataset('json', data_files=data_files)

    logger.info(f"Train examples: {len(dataset['train'])}")
    logger.info(f"Validation examples: {len(dataset['validation'])}")

    return dataset


def format_chat_template(example, tokenizer):
    """Format example using chat template."""
    messages = example.get('messages', [])
    if not messages:
        return {"text": ""}

    try:
        text = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=False
        )
        return {"text": text}
    except Exception:
        # Fallback: manual ChatML format
        text = ""
        for msg in messages:
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            if role == 'system':
                text += f"<|im_start|>system\n{content}<|im_end|>\n"
            elif role == 'user':
                text += f"<|im_start|>user\n{content}<|im_end|>\n"
            elif role == 'assistant':
                text += f"<|im_start|>assistant\n{content}<|im_end|>\n"
        return {"text": text}


# ============================================================
# Training
# ============================================================

def train(
    model_key,
    data_dir,
    output_dir,
    logger,
    epochs=None,
    learning_rate=None,
    batch_size=None,
    low_vram=False,
    max_seq_length=None,
    resume_from_checkpoint=False,
    packing=True,
):
    """Run the training pipeline. Returns (model, tokenizer, lora_path) or (None, None, None) on failure."""
    import torch
    from trl import SFTTrainer, SFTConfig

    config = MODELS[model_key]
    output_name = config['output_name']

    logger.info("=" * 60)
    logger.info("ChiroClick LoRA Fine-Tuning")
    logger.info("=" * 60)
    logger.info(f"Model: {model_key} ({config['description']})")
    logger.info(f"Output: {output_name}")
    logger.info(f"Low VRAM mode: {low_vram}")
    logger.info(f"Packing: {packing}")
    logger.info(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("=" * 60)

    # Determine sequence length
    if max_seq_length:
        seq_len = max_seq_length
    elif low_vram:
        seq_len = config['low_vram_seq_length']
    else:
        seq_len = config['max_seq_length']

    # Check GPU
    has_gpu, gpu_mem = check_gpu(logger)

    # Determine training params
    t_config = dict(TRAINING_CONFIG)
    if low_vram:
        t_config.update(LOW_VRAM_CONFIG)
        logger.info(f"Applied low-VRAM overrides: batch_size=1, grad_accum={t_config['gradient_accumulation_steps']}, epochs={t_config['num_train_epochs']}")

    if epochs is not None:
        t_config['num_train_epochs'] = epochs
    if learning_rate is not None:
        t_config['learning_rate'] = learning_rate
    if batch_size is not None:
        t_config['per_device_train_batch_size'] = batch_size

    # Load model
    load_start = time.time()
    model, tokenizer = load_model_with_lora(model_key, seq_len, logger)
    load_time = time.time() - load_start

    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    logger.info(f"Trainable parameters: {trainable:,} / {total:,} ({100*trainable/total:.2f}%)")
    logger.info(f"Model load time: {load_time:.1f}s")

    # Load dataset
    dataset = load_dataset_from_dir(data_dir, logger)

    # Format dataset
    logger.info("Formatting dataset with chat template...")
    formatted_train = dataset['train'].map(
        lambda x: format_chat_template(x, tokenizer),
        remove_columns=dataset['train'].column_names
    )
    formatted_val = dataset['validation'].map(
        lambda x: format_chat_template(x, tokenizer),
        remove_columns=dataset['validation'].column_names
    )

    # Filter empty examples
    formatted_train = formatted_train.filter(lambda x: len(x.get('text', '')) > 10)
    formatted_val = formatted_val.filter(lambda x: len(x.get('text', '')) > 10)
    logger.info(f"Formatted: {len(formatted_train)} train, {len(formatted_val)} val")

    # Detect bf16 support
    use_bf16 = False
    if has_gpu:
        try:
            use_bf16 = torch.cuda.get_device_capability()[0] >= 8
        except Exception:
            pass

    # Training arguments (SFTConfig replaces TrainingArguments in trl >= 0.12)
    model_output_dir = str(Path(output_dir) / output_name)
    sft_config = SFTConfig(
        output_dir=model_output_dir,
        learning_rate=t_config['learning_rate'],
        lr_scheduler_type=t_config['lr_scheduler_type'],
        warmup_steps=t_config['warmup_steps'],
        per_device_train_batch_size=t_config['per_device_train_batch_size'],
        per_device_eval_batch_size=1,
        gradient_accumulation_steps=t_config['gradient_accumulation_steps'],
        num_train_epochs=t_config['num_train_epochs'],
        save_strategy=t_config['save_strategy'],
        eval_strategy=t_config['eval_strategy'],
        save_total_limit=t_config['save_total_limit'],
        load_best_model_at_end=True,
        optim=t_config['optim'],
        weight_decay=t_config['weight_decay'],
        max_grad_norm=t_config['max_grad_norm'],
        fp16=not use_bf16,
        bf16=use_bf16,
        gradient_checkpointing=True,
        logging_steps=t_config['logging_steps'],
        report_to="none",
        seed=42,
        dataloader_pin_memory=False,
        # SFT-specific params (moved from SFTTrainer constructor)
        dataset_text_field="text",
        max_length=seq_len,
        packing=packing,
    )

    # Create SFTTrainer
    logger.info("Initializing SFTTrainer...")
    trainer = SFTTrainer(
        model=model,
        processing_class=tokenizer,
        train_dataset=formatted_train,
        eval_dataset=formatted_val,
        args=sft_config,
    )

    # Train with OOM recovery
    logger.info("=" * 60)
    logger.info("STARTING TRAINING")
    logger.info("=" * 60)

    train_start = time.time()
    try:
        log_gpu_memory(logger, "Before training: ")
        if resume_from_checkpoint:
            logger.info("Resuming from latest checkpoint...")
            trainer.train(resume_from_checkpoint=True)
        else:
            trainer.train()
    except RuntimeError as e:
        if "out of memory" in str(e).lower():
            logger.warning("OOM detected! Clearing cache and retrying with reduced settings...")
            torch.cuda.empty_cache()
            gc.collect()

            retry_seq_len = ULTRA_LOW_VRAM_CONFIG['max_seq_length_override']
            logger.info(f"Retrying with seq_len={retry_seq_len}, batch=1, grad_accum=8")

            sft_config.per_device_train_batch_size = 1
            sft_config.gradient_accumulation_steps = 8
            sft_config.max_length = retry_seq_len

            # Recreate trainer with reduced settings
            trainer = SFTTrainer(
                model=model,
                processing_class=tokenizer,
                train_dataset=formatted_train,
                eval_dataset=formatted_val,
                args=sft_config,
            )

            try:
                trainer.train()
            except RuntimeError as e2:
                logger.error(f"Training failed even with reduced settings: {e2}")
                return None, None, None
        else:
            logger.error(f"Training error: {e}")
            return None, None, None

    train_time = time.time() - train_start
    logger.info(f"Training completed in {train_time/60:.1f} minutes")
    log_gpu_memory(logger, "After training: ")

    # Save LoRA weights
    lora_path = Path(output_dir) / f"{output_name}-lora"
    logger.info(f"Saving LoRA weights to: {lora_path}")
    model.save_pretrained(str(lora_path))
    tokenizer.save_pretrained(str(lora_path))

    logger.info("TRAINING COMPLETE")
    return model, tokenizer, lora_path


# ============================================================
# GGUF Export
# ============================================================

def export_to_gguf(model, tokenizer, output_dir, model_key, quantization, logger):
    """Save LoRA adapter and prepare for merge+deploy.

    NOTE: Merging a 4-bit quantized model in-memory produces broken safetensors
    (flat 1D tensors). Use scripts/merge_and_deploy.py for proper float16 merge
    and Ollama deployment after training completes.
    """
    config = MODELS[model_key]
    output_name = config['output_name']
    lora_name = f"{output_name}-lora"

    logger.info("=" * 60)
    logger.info("POST-TRAINING EXPORT")
    logger.info("=" * 60)

    export_start = time.time()

    # Save LoRA adapter (already done in train(), but ensure it's saved)
    lora_dir = Path(output_dir) / f"{output_name}-lora"
    if not (lora_dir / 'adapter_config.json').exists():
        logger.info(f"Saving LoRA adapter to: {lora_dir}")
        model.save_pretrained(str(lora_dir))
        tokenizer.save_pretrained(str(lora_dir))

    logger.info(f"LoRA adapter saved: {lora_dir}")
    logger.info("")
    logger.info("NEXT STEP: Merge and deploy to Ollama using:")
    logger.info(f"  python scripts/merge_and_deploy.py --model {model_key}")
    logger.info("")
    logger.info("This will:")
    logger.info("  1. Load base model in float16 (not 4-bit)")
    logger.info("  2. Apply LoRA adapter")
    logger.info("  3. Merge weights")
    logger.info("  4. Save merged model")
    logger.info("  5. Deploy to Ollama as {lora_name}")

    export_time = time.time() - export_start
    logger.info(f"Export completed in {export_time/60:.1f} minutes")

    return lora_dir


# ============================================================
# Main
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description='ChiroClick LoRA Fine-Tuning',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python train_unsloth.py --model fast --low-vram
    python train_unsloth.py --model norwegian --low-vram --data-dir ../data/processed/norwegian-clinical
    python train_unsloth.py --model medical --epochs 5 --quantize q4_k_m
        """
    )
    parser.add_argument('--model', choices=MODELS.keys(), default='norwegian',
                        help='Model to fine-tune')
    parser.add_argument('--data', type=Path, default=None,
                        help='Training data directory (legacy, use --data-dir)')
    parser.add_argument('--data-dir', type=Path, default=None,
                        help='Training data directory with train.jsonl and validation.jsonl')
    parser.add_argument('--output', type=Path, default=Path('../models'),
                        help='Output directory')
    parser.add_argument('--log-dir', type=Path, default=Path('../logs'),
                        help='Log directory')
    parser.add_argument('--epochs', type=int, default=None)
    parser.add_argument('--lr', type=float, default=None)
    parser.add_argument('--batch-size', type=int, default=None)
    parser.add_argument('--max-seq-length', type=int, default=None,
                        help='Override max sequence length')
    parser.add_argument('--quantize', default='q4_k_m',
                        choices=['f16', 'q8_0', 'q5_k_m', 'q4_k_m', 'q4_0'])
    parser.add_argument('--low-vram', action='store_true',
                        help='Enable low-VRAM mode (batch=1, seq_len=2048, more epochs)')
    parser.add_argument('--skip-export', action='store_true',
                        help='Skip GGUF export')
    parser.add_argument('--resume', action='store_true',
                        help='Resume training from latest checkpoint in output dir')
    parser.add_argument('--no-packing', action='store_true',
                        help='Disable sequence packing (recommended for 7B models on <=12GB VRAM)')

    args = parser.parse_args()

    # Resolve data directory
    data_dir = args.data_dir or args.data or Path('../data/processed/all-clean')

    # Setup logging
    logger, log_file = setup_logging(args.model, args.log_dir)

    logger.info(f"Arguments: {vars(args)}")
    logger.info(f"Data directory: {data_dir}")

    overall_start = time.time()

    # Create output directory
    args.output.mkdir(parents=True, exist_ok=True)

    # Train
    model, tokenizer, lora_path = train(
        model_key=args.model,
        data_dir=data_dir,
        output_dir=args.output,
        logger=logger,
        epochs=args.epochs,
        learning_rate=args.lr,
        batch_size=args.batch_size,
        low_vram=args.low_vram,
        max_seq_length=args.max_seq_length,
        resume_from_checkpoint=args.resume,
        packing=not args.no_packing,
    )

    if model is None:
        logger.error("Training failed - see logs above")
        return 1

    # Export to GGUF
    if not args.skip_export:
        export_to_gguf(
            model=model,
            tokenizer=tokenizer,
            output_dir=args.output,
            model_key=args.model,
            quantization=args.quantize,
            logger=logger,
        )

    # Cleanup
    clear_gpu_memory(logger)

    overall_time = time.time() - overall_start
    logger.info("=" * 60)
    logger.info("ALL DONE!")
    logger.info(f"Total time: {overall_time/60:.1f} minutes")
    logger.info("=" * 60)

    lora_name = f"{MODELS[args.model]['output_name']}-lora"
    logger.info(f"Next steps:")
    logger.info(f"  1. Deploy: ollama create {lora_name} -f Modelfile.{lora_name}")
    logger.info(f"  2. Test: ollama run {lora_name} 'Test prompt'")
    logger.info(f"  3. Update .env to use {lora_name}")

    return 0


if __name__ == '__main__':
    sys.exit(main())
