#!/bin/bash
# Compare training pipelines: v6 (Unsloth) vs nanochat-v1
#
# Usage: bash ai-training/nanochat/scripts/compare-pipelines.sh
#
# Runs promptfoo eval against both models and shows side-by-side results.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROMPTFOO_DIR="$(cd "$SCRIPT_DIR/../../promptfoo" && pwd)"

echo "=== Pipeline Comparison: v6 vs nanochat-v1 ==="
echo ""

# Check models are available
echo "Checking Ollama models..."
MODELS=$(ollama list 2>&1 | grep -E "chiro-no" || true)
echo "$MODELS"
echo ""

# Run comparison eval
echo "Running promptfoo comparison..."
cd "$PROMPTFOO_DIR"

npx promptfoo eval \
    --providers "ollama:chiro-no-sft-dpo-v6" "ollama:chiro-no-nanochat-v1" \
    --output results/pipeline-comparison.json \
    --no-progress-bar

echo ""
echo "Results saved to: results/pipeline-comparison.json"
echo ""
echo "View results: npx promptfoo view"
echo ""

# Quick summary from results
if [ -f "results/pipeline-comparison.json" ]; then
    node -p "
    const r = JSON.parse(require('fs').readFileSync('results/pipeline-comparison.json','utf8'));
    const results = r.results || [];
    const providers = [...new Set(results.flatMap(r => r.results?.map(pr => pr.provider?.label) || []))];
    providers.forEach(p => {
        const pResults = results.flatMap(r => r.results?.filter(pr => pr.provider?.label === p) || []);
        const passed = pResults.filter(pr => pr.success).length;
        process.stdout.write(p + ': ' + passed + '/' + pResults.length + ' passed\n');
    });
    "
fi
