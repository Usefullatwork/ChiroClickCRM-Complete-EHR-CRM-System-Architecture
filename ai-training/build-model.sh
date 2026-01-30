#!/bin/bash
# Build script for chiro-no Ollama model
# Run this script after generating the Modelfile

echo "Building chiro-no model for Ollama..."

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "Error: Ollama is not running. Start it with 'ollama serve'"
    exit 1
fi

# Create the model
cd "D:/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/ai-training"
ollama create chiro-no -f Modelfile

echo ""
echo "Model created successfully!"
echo "Test it with: ollama run chiro-no"
echo ""
echo "Example prompts:"
echo "  - Skriv en subjektiv seksjon for en pasient med nakkesmerter"
echo "  - Generer et SOPE-notat for en pasient med korsryggsmerter"
echo "  - Dokumenter VNG-funn for en pasient med BPPV"
