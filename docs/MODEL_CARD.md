# Model Card

This model is an academic prototype and must not be treated as a clinically validated diagnostic system.

Architecture: configurable multimodal EfficientNet-B0 CNN + bidirectional GRU RNN fusion model.

Dataset: HAM10000 is supported by the training script but not bundled. Download it from an approved source and document license, classes, class distribution, and train/validation/test split before training.

Metrics: not reported until evaluated on a held-out test set.

Known limitations: image quality, lighting, focus, skin-tone/generalization, dataset bias, confidence calibration, and non-clinical validation.

Intended use: educational demonstration of AI-assisted preliminary assessment.

Non-intended use: confirmed diagnosis, emergency triage, prescription, dosage, or replacement for professional medical care.
