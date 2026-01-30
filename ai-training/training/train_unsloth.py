#!/usr/bin/env python3
"""
ChiroClick LoRA Fine-Tuning with Unsloth
2-5x faster training with direct GGUF export for Ollama.

Usage:
    python train_unsloth.py --model norwegian --data ../data/processed
    python train_unsloth.py --model medical --epochs 3 --quantize q4_k_m

Models:
    norwegian - NorwAI-Mistral-7B-Instruct (best for Norwegian clinical)
    medical   - MedGemma 4B (red flags, clinical safety)
    fast      - Llama 3.2 3B (autocomplete)
    default   - Mistral 7B (general clinical)

Requirements:
    pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
    pip install xformers trl peft transformers bitsandbytes datasets
"""

import argparse
import os
from pathlib import Path
from datetime import datetime

# Model configurations
MODELS = {
    'norwegian': {
        'name': 'NorwAI/NorwAI-Mistral-7B-Instruct',
        'fallback': 'mistralai/Mistral-7B-Instruct-v0.3',
        'output_name': 'chiro-norwegian',
        'description': 'Norwegian clinical documentation (95% accuracy after tuning)',
        'max_seq_length': 4096,
    },
    'medical': {
        'name': 'google/medgemma-4b',
        'fallback': 'google/gemma-2-2b-it',
        'output_name': 'chiro-medical',
        'description': 'Medical safety and red flag detection (85-88% accuracy)',
        'max_seq_length': 2048,
    },
    'fast': {
        'name': 'meta-llama/Llama-3.2-3B-Instruct',
        'fallback': 'meta-llama/Llama-3.2-1B-Instruct',
        'output_name': 'chiro-fast',
        'description': 'Quick autocomplete and suggestions',
        'max_seq_length': 2048,
    },
    'default': {
        'name': 'mistralai/Mistral-7B-Instruct-v0.3',
        'fallback': 'mistralai/Mistral-7B-Instruct-v0.2',
        'output_name': 'chiro-no',
        'description': 'General clinical documentation',
        'max_seq_length': 4096,
    },
}

# LoRA configuration (medical-optimized based on 2025 research)
LORA_CONFIG = {
    'r': 16,                    # Rank - clinical domain needs adequate capacity
    'lora_alpha': 16,           # Scaling factor
    'lora_dropout': 0.05,       # Low dropout for clinical
    'target_modules': [
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj"
    ],
    'bias': "none",
    'use_rslora': True,         # Rank-Stabilized LoRA for better convergence
}

# Training configuration (medical-optimized)
TRAINING_CONFIG = {
    'learning_rate': 2e-4,      # Lower LR for medical accuracy
    'lr_scheduler_type': "linear",
    'warmup_steps': 50,
    'per_device_train_batch_size': 4,
    'gradient_accumulation_steps': 4,  # Effective batch = 16
    'num_train_epochs': 3,
    'weight_decay': 0.01,
    'max_grad_norm': 0.3,
    'optim': "adamw_8bit",
    'logging_steps': 10,
    'save_strategy': "epoch",
    'eval_strategy': "epoch",
    'save_total_limit': 2,
}


def check_gpu():
    """Check GPU availability and print info."""
    try:
        import torch
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1e9
            print(f"GPU: {gpu_name}")
            print(f"VRAM: {gpu_memory:.1f} GB")
            return True
        else:
            print("WARNING: No GPU detected. Training will be slow.")
            return False
    except Exception as e:
        print(f"WARNING: Could not check GPU: {e}")
        return False


def load_model_with_lora(model_key: str, max_seq_length: int = None):
    """Load model with LoRA adapters using Unsloth."""
    from unsloth import FastLanguageModel

    config = MODELS[model_key]
    model_name = config['name']
    max_seq = max_seq_length or config['max_seq_length']

    print(f"\nLoading model: {model_name}")
    print(f"Max sequence length: {max_seq}")

    try:
        model, tokenizer = FastLanguageModel.from_pretrained(
            model_name=model_name,
            max_seq_length=max_seq,
            dtype=None,  # Auto-detect (bfloat16 if available)
            load_in_4bit=True,
        )
    except Exception as e:
        print(f"Failed to load primary model: {e}")
        print(f"Trying fallback: {config['fallback']}")
        model, tokenizer = FastLanguageModel.from_pretrained(
            model_name=config['fallback'],
            max_seq_length=max_seq,
            dtype=None,
            load_in_4bit=True,
        )

    print("\nAdding LoRA adapters...")
    model = FastLanguageModel.get_peft_model(
        model,
        r=LORA_CONFIG['r'],
        lora_alpha=LORA_CONFIG['lora_alpha'],
        lora_dropout=LORA_CONFIG['lora_dropout'],
        target_modules=LORA_CONFIG['target_modules'],
        bias=LORA_CONFIG['bias'],
        use_rslora=LORA_CONFIG['use_rslora'],
        use_gradient_checkpointing="unsloth",
        random_state=42,
    )

    return model, tokenizer


def load_dataset(data_dir: Path):
    """Load training and validation datasets."""
    from datasets import load_dataset

    train_file = data_dir / 'train.jsonl'
    val_file = data_dir / 'validation.jsonl'

    if not train_file.exists():
        raise FileNotFoundError(f"Training file not found: {train_file}")

    print(f"\nLoading datasets from: {data_dir}")

    dataset = load_dataset('json', data_files={
        'train': str(train_file),
        'validation': str(val_file) if val_file.exists() else str(train_file),
    })

    print(f"Train examples: {len(dataset['train'])}")
    print(f"Validation examples: {len(dataset['validation'])}")

    return dataset


def format_chat_template(example, tokenizer):
    """Format example using chat template."""
    messages = example.get('messages', [])
    if not messages:
        return None

    # Use tokenizer's chat template if available
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
            role = msg['role']
            content = msg['content']
            if role == 'system':
                text += f"<|im_start|>system\n{content}<|im_end|>\n"
            elif role == 'user':
                text += f"<|im_start|>user\n{content}<|im_end|>\n"
            elif role == 'assistant':
                text += f"<|im_start|>assistant\n{content}<|im_end|>\n"
        return {"text": text}


def train(
    model_key: str,
    data_dir: Path,
    output_dir: Path,
    epochs: int = None,
    learning_rate: float = None,
    batch_size: int = None,
):
    """Run the training pipeline."""
    from unsloth import is_bfloat16_supported
    from trl import SFTTrainer, SFTConfig

    config = MODELS[model_key]
    output_name = config['output_name']

    print("=" * 60)
    print(f"ChiroClick LoRA Fine-Tuning")
    print("=" * 60)
    print(f"Model: {model_key} ({config['description']})")
    print(f"Output: {output_name}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # Check GPU
    has_gpu = check_gpu()

    # Load model
    model, tokenizer = load_model_with_lora(model_key)

    # Print trainable parameters
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total_params = sum(p.numel() for p in model.parameters())
    print(f"\nTrainable parameters: {trainable_params:,} / {total_params:,} ({100*trainable_params/total_params:.2f}%)")

    # Load dataset
    dataset = load_dataset(data_dir)

    # Format dataset
    print("\nFormatting dataset with chat template...")
    formatted_train = dataset['train'].map(
        lambda x: format_chat_template(x, tokenizer),
        remove_columns=dataset['train'].column_names
    )
    formatted_val = dataset['validation'].map(
        lambda x: format_chat_template(x, tokenizer),
        remove_columns=dataset['validation'].column_names
    )

    # Training arguments
    training_args = SFTConfig(
        output_dir=str(output_dir / output_name),

        # Learning
        learning_rate=learning_rate or TRAINING_CONFIG['learning_rate'],
        lr_scheduler_type=TRAINING_CONFIG['lr_scheduler_type'],
        warmup_steps=TRAINING_CONFIG['warmup_steps'],

        # Batch
        per_device_train_batch_size=batch_size or TRAINING_CONFIG['per_device_train_batch_size'],
        per_device_eval_batch_size=batch_size or TRAINING_CONFIG['per_device_train_batch_size'],
        gradient_accumulation_steps=TRAINING_CONFIG['gradient_accumulation_steps'],

        # Epochs
        num_train_epochs=epochs or TRAINING_CONFIG['num_train_epochs'],

        # Saving
        save_strategy=TRAINING_CONFIG['save_strategy'],
        eval_strategy=TRAINING_CONFIG['eval_strategy'],
        save_total_limit=TRAINING_CONFIG['save_total_limit'],
        load_best_model_at_end=True,

        # Optimization
        optim=TRAINING_CONFIG['optim'],
        weight_decay=TRAINING_CONFIG['weight_decay'],
        max_grad_norm=TRAINING_CONFIG['max_grad_norm'],

        # Precision
        fp16=not is_bfloat16_supported(),
        bf16=is_bfloat16_supported(),
        gradient_checkpointing=True,

        # Logging
        logging_steps=TRAINING_CONFIG['logging_steps'],
        report_to="none",

        # Data
        dataset_text_field="text",
        max_seq_length=config['max_seq_length'],
        packing=True,  # Pack sequences for efficiency

        # Seed
        seed=42,
    )

    # Create trainer
    print("\nInitializing trainer...")
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=formatted_train,
        eval_dataset=formatted_val,
        args=training_args,
    )

    # Train
    print("\n" + "=" * 60)
    print("STARTING TRAINING")
    print("=" * 60 + "\n")

    trainer.train()

    # Save LoRA weights
    lora_path = output_dir / f"{output_name}-lora"
    print(f"\nSaving LoRA weights to: {lora_path}")
    model.save_pretrained(lora_path)
    tokenizer.save_pretrained(lora_path)

    print("\n" + "=" * 60)
    print("✓ TRAINING COMPLETE")
    print("=" * 60)

    return model, tokenizer, lora_path


def export_to_gguf(
    model,
    tokenizer,
    output_dir: Path,
    output_name: str,
    quantization: str = "q4_k_m"
):
    """Export model to GGUF format for Ollama."""
    from unsloth import FastLanguageModel

    print("\n" + "=" * 60)
    print("EXPORTING TO GGUF")
    print("=" * 60)

    # Merge LoRA weights
    print("\nMerging LoRA weights with base model...")
    model = model.merge_and_unload()

    # Export to GGUF
    gguf_dir = output_dir / 'gguf'
    gguf_dir.mkdir(parents=True, exist_ok=True)

    gguf_path = gguf_dir / f"{output_name}.gguf"
    print(f"\nExporting to: {gguf_path}")
    print(f"Quantization: {quantization}")

    try:
        model.save_pretrained_gguf(
            str(gguf_path).replace('.gguf', ''),
            tokenizer,
            quantization_method=quantization
        )
        print(f"✓ GGUF saved: {gguf_path}")
    except Exception as e:
        print(f"WARNING: GGUF export failed: {e}")
        print("You can manually convert using llama.cpp")
        return None

    # Create Ollama Modelfile
    modelfile_path = gguf_dir / f"Modelfile.{output_name}"
    modelfile_content = f'''FROM ./{output_name}.gguf

# ChiroClick fine-tuned model
# Created: {datetime.now().strftime('%Y-%m-%d')}

PARAMETER temperature 0.3
PARAMETER top_p 0.85
PARAMETER top_k 40
PARAMETER num_ctx 4096
PARAMETER repeat_penalty 1.0

SYSTEM """Du er en klinisk dokumentasjonsspesialist for kiropraktikk i Norge.
Generer nøyaktige, profesjonelle SOAP-notater og klinisk dokumentasjon.
Bruk korrekt norsk medisinsk terminologi og følg norske retningslinjer.
Prioriter alltid pasientsikkerhet og korrekt medisinsk informasjon."""
'''

    with open(modelfile_path, 'w') as f:
        f.write(modelfile_content)

    print(f"✓ Modelfile created: {modelfile_path}")
    print(f"\nTo deploy with Ollama:")
    print(f"  cd {gguf_dir}")
    print(f"  ollama create {output_name} -f Modelfile.{output_name}")

    return gguf_path


def main():
    parser = argparse.ArgumentParser(
        description='ChiroClick LoRA Fine-Tuning with Unsloth',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python train_unsloth.py --model norwegian
    python train_unsloth.py --model medical --epochs 5
    python train_unsloth.py --model fast --quantize q8_0

Models:
    norwegian - NorwAI-Mistral-7B (best for Norwegian clinical docs)
    medical   - MedGemma 4B (red flags, safety)
    fast      - Llama 3.2 3B (autocomplete)
    default   - Mistral 7B (general)
        """
    )
    parser.add_argument('--model', choices=MODELS.keys(), default='norwegian',
                        help='Model to fine-tune (default: norwegian)')
    parser.add_argument('--data', type=Path, default=Path('../data/processed'),
                        help='Training data directory')
    parser.add_argument('--output', type=Path, default=Path('../models'),
                        help='Output directory')
    parser.add_argument('--epochs', type=int, default=None,
                        help='Number of epochs (default: 3)')
    parser.add_argument('--lr', type=float, default=None,
                        help='Learning rate (default: 2e-4)')
    parser.add_argument('--batch-size', type=int, default=None,
                        help='Batch size (default: 4)')
    parser.add_argument('--quantize', default='q4_k_m',
                        choices=['f16', 'q8_0', 'q5_k_m', 'q4_k_m', 'q4_0'],
                        help='GGUF quantization (default: q4_k_m)')
    parser.add_argument('--skip-export', action='store_true',
                        help='Skip GGUF export')

    args = parser.parse_args()

    # Create output directory
    args.output.mkdir(parents=True, exist_ok=True)

    # Train
    model, tokenizer, lora_path = train(
        model_key=args.model,
        data_dir=args.data,
        output_dir=args.output,
        epochs=args.epochs,
        learning_rate=args.lr,
        batch_size=args.batch_size,
    )

    # Export to GGUF
    if not args.skip_export:
        export_to_gguf(
            model=model,
            tokenizer=tokenizer,
            output_dir=args.output,
            output_name=MODELS[args.model]['output_name'],
            quantization=args.quantize,
        )

    print("\n" + "=" * 60)
    print("ALL DONE!")
    print("=" * 60)
    print(f"\nNext steps:")
    print(f"  1. Deploy model: ollama create {MODELS[args.model]['output_name']} -f Modelfile")
    print(f"  2. Test: ollama run {MODELS[args.model]['output_name']} 'Test prompt'")
    print(f"  3. Update backend ai.js to use new model")


if __name__ == '__main__':
    main()
