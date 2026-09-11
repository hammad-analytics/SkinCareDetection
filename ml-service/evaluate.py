"""Evaluation note.

Run `python train.py --data-dir <HAM10000_DIR>` to train and emit
`models/metrics.json` from the held-out test split. Metrics must come from that
file; do not manually invent project performance.
"""

from pathlib import Path
import json

metrics = Path("../models/metrics.json")
if not metrics.exists():
    raise SystemExit("No metrics found. Train/evaluate the model first.")
print(json.dumps(json.loads(metrics.read_text()), indent=2))
