# AI Training — Portable Setup Guide

Copy this entire `ai-training/` folder to a new machine. Do **not** copy `ml-env/` (it's non-portable and listed in `.gitignore`).

## Prerequisites

- Python 3.10+ (3.13 tested)
- NVIDIA GPU with CUDA 12.x toolkit
- Ollama installed and running (`ollama serve`)
- ~80 GB disk space (77 GB models + data/scripts)

## 1. Create Virtual Environment

```bash
cd ai-training
python -m venv ml-env

# Windows
ml-env\Scripts\activate

# Linux/Mac
source ml-env/bin/activate

pip install -r training/requirements.txt
```

For Unsloth (optional, 2-5x faster training):

```bash
pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
```

## 2. Deploy Models to Ollama

Four merged models are ready to deploy from `models/`:

```bash
# Deploy all 4 models
ollama create chiro-fast-lora -f models/chiro-fast-merged/Modelfile
ollama create chiro-medical-lora -f models/chiro-medical-merged/Modelfile
ollama create chiro-norwegian-lora -f models/chiro-norwegian-merged/Modelfile
ollama create chiro-no-lora -f models/chiro-no-merged/Modelfile
```

Or use the batch script:

```bash
build-all-models.bat
```

Verify:

```bash
ollama list | grep chiro
```

## 3. Validate Models

```bash
python scripts/validate_models.py
```

Expected scores:
| Model | Score |
|-------|-------|
| chiro-norwegian-lora | ~89.8% |
| chiro-no-lora | ~85.6% |
| chiro-medical-lora | baseline |
| chiro-fast-lora | baseline |

## 4. Recommended Model Routing

| Task                                | Model                | Why                                |
| ----------------------------------- | -------------------- | ---------------------------------- |
| SOAP notes, Norwegian clinical text | chiro-norwegian-lora | Best Norwegian + clinical accuracy |
| General Norwegian                   | chiro-no-lora        | Good all-round 7B model            |
| Quick autocomplete                  | chiro-fast-lora      | Fast 3B model                      |
| Diagnosis, red flags                | chiro-medical-lora   | MedGemma-based                     |

## Folder Structure

```
ai-training/
├── data/              # Training data (11,882 examples)
├── models/            # Trained LoRA adapters + merged models (77 GB)
├── training/          # Trainer scripts + requirements.txt
├── scripts/           # Utility scripts (mining, merging, validation)
├── logs/              # Training logs and validation results
├── llama-cpp-convert/ # GGUF conversion tool
├── Modelfile*         # Ollama model definitions
├── *.bat              # Windows batch scripts
└── PORTABLE-SETUP.md  # This file
```

## Re-training (Optional)

To re-train or fine-tune further:

```bash
# Mine new data from website
python scripts/mine_website_content.py /path/to/website

# Train a specific model
python training/train_unsloth.py --model norwegian --data data/processed

# Merge LoRA adapter and deploy
python scripts/merge_and_deploy.py --model chiro-norwegian --low-memory
```

**Important:** Never run Ollama while GPU is training — causes 30x slowdown and memory fragmentation.

## What NOT to Copy

| Item                    | Why                                                               |
| ----------------------- | ----------------------------------------------------------------- |
| `ml-env/`               | Contains absolute paths and CUDA version bindings — must recreate |
| `~/.cache/huggingface/` | Auto-downloads on first training run                              |
