# Capture quality evaluation

`npm run eval:captures` runs a small, inspectable set of capture fixtures against the configured Groq model. Each fixture checks classification, expected action extraction, a required theme, and confidence bounds.

The evaluation is intentionally separate from CI because it makes paid network calls and model output is non-deterministic. Add regression fixtures whenever a real capture is misclassified or an action is invented.
