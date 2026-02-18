# Sprint 1 LoRA vs Sprint 2 Base Evaluation (2026-02-18)

Sprint 1 LoRA models were trained on old architectures (Llama 3.2, MedGemma).
Sprint 2 replaced all base models with Qwen2.5. Architecture mismatch makes
these comparisons informational only — Sprint 2 LoRA training is in progress.

## chiro-fast-lora vs chiro-fast (Qwen2.5-1.5B)

| Metric      | LoRA    | Base     | Winner |
| ----------- | ------- | -------- | ------ |
| Pass rate   | 30.0%   | 50.0%    | Base   |
| Avg latency | 6,087ms | 12,753ms | LoRA   |

### Category breakdown

| Category           | LoRA  | Base   |
| ------------------ | ----- | ------ |
| soap_notes         | 40.0% | 100.0% |
| norwegian_language | 25.0% | 62.5%  |
| quick_fields       | 83.3% | 83.3%  |
| letters            | 50.0% | 75.0%  |
| communication      | 16.7% | 16.7%  |
| red_flags          | 12.5% | 12.5%  |
| diagnosis_codes    | 0.0%  | 0.0%   |

## chiro-medical-lora vs chiro-medical (Qwen2.5-3B)

| Metric      | LoRA    | Base     | Winner |
| ----------- | ------- | -------- | ------ |
| Pass rate   | 36.0%   | 48.0%    | Base   |
| Avg latency | 8,649ms | 67,963ms | LoRA   |

### Category breakdown

| Category           | LoRA  | Base  |
| ------------------ | ----- | ----- |
| quick_fields       | 83.3% | 50.0% |
| soap_notes         | 60.0% | 80.0% |
| communication      | 50.0% | 66.7% |
| norwegian_language | 37.5% | 62.5% |
| letters            | 25.0% | 75.0% |
| red_flags          | 0.0%  | 12.5% |
| diagnosis_codes    | 0.0%  | 0.0%  |

## Conclusion

Both Sprint 1 LoRA models are worse than Sprint 2 Qwen2.5 bases.
A/B testing disabled until Sprint 2 LoRA training completes.
Sprint 2 models (chiro-fast, chiro-medical, chiro-norwegian done; chiro-no in progress).
