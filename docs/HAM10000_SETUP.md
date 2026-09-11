# HAM10000 Dataset Setup

Use the HAM10000 dataset only from an approved source and follow its license terms.

Expected folder layout:

```text
data/HAM10000/
  HAM10000_metadata.csv
  HAM10000_images_part_1/
  HAM10000_images_part_2/
```

Train the multimodal CNN + RNN model:

```bash
cd ml-service
python train.py --data-dir ../data/HAM10000 --epochs 8 --out ../models/skin_model.keras
```

Outputs:
- `models/skin_model.keras`
- `models/tokenizer.json`
- `models/metrics.json`

After training, update `docs/MODEL_CARD.md` with real metrics. Do not write guessed metrics.
