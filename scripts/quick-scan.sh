#!/bin/bash
# Quick PHI + security scan (2 minutes)
claude -p "Run phi-check skill and npm audit on both backend and frontend. Report only CRITICAL and HIGH findings. Be concise." \
  --dangerously-skip-permissions \
  --output-format text
