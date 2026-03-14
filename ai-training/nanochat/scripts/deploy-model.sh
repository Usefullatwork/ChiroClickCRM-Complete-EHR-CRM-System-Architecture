#!/bin/bash
# Deploy trained nanochat model to Ollama
#
# Usage: bash ai-training/nanochat/scripts/deploy-model.sh [model-name]
#
# Steps:
# 1. Export merged model to GGUF Q8_0
# 2. Create Ollama Modelfile
# 3. Import into Ollama
# 4. Verify with test prompt

set -euo pipefail

MODEL_NAME="${1:-chiro-no-nanochat-v1}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
GGUF_DIR="$BASE_DIR/models"
MODELFILE="$BASE_DIR/Modelfile.$MODEL_NAME"

echo "=== Deploying $MODEL_NAME to Ollama ==="
echo ""

# Step 1: Check GGUF exists
GGUF_FILE="$GGUF_DIR/${MODEL_NAME}.Q8_0.gguf"
if [ ! -f "$GGUF_FILE" ]; then
    echo "ERROR: GGUF file not found: $GGUF_FILE"
    echo "Run the export step first."
    exit 1
fi

echo "1. GGUF file: $GGUF_FILE ($(du -h "$GGUF_FILE" | cut -f1))"

# Step 2: Create Modelfile
cat > "$MODELFILE" << 'MODELFILE_EOF'
FROM ./models/MODEL_NAME_PLACEHOLDER.Q8_0.gguf

TEMPLATE """<|im_start|>system
{{ .System }}<|im_end|>
<|im_start|>user
{{ .Prompt }}<|im_end|>
<|im_start|>assistant
{{ .Response }}<|im_end|>"""

SYSTEM "Du er en klinisk AI-assistent for kiropraktikk i Norge. Du hjelper kiropraktorer med dokumentasjon, diagnosekoding, røde flagg-analyse og pasientkommunikasjon. Svar alltid på norsk med korrekt medisinsk terminologi."

PARAMETER temperature 0.3
PARAMETER num_predict 4096
PARAMETER stop "<|im_end|>"
PARAMETER stop "<|im_start|>"
MODELFILE_EOF

# Replace placeholder with actual model name
sed -i "s/MODEL_NAME_PLACEHOLDER/$MODEL_NAME/g" "$MODELFILE"

echo "2. Modelfile created: $MODELFILE"

# Step 3: Import to Ollama
echo "3. Importing to Ollama..."
cd "$BASE_DIR"
ollama create "$MODEL_NAME" -f "$MODELFILE"
echo "   Model imported successfully!"

# Step 4: Verify with test prompt
echo ""
echo "4. Verification test..."
RESPONSE=$(ollama run "$MODEL_NAME" "Skriv subjektiv for en pasient med akutte nakkesmerter etter løfting." 2>&1 | head -5)
echo "   Response preview:"
echo "   $RESPONSE"

echo ""
echo "=== Deployment complete ==="
echo "Run eval: npm run ai:eval"
echo "Compare:  npm run ai:eval:compare"
