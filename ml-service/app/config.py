from pathlib import Path
import json
import os
import yaml

BASE_DIR = Path(__file__).resolve().parents[1]
CONFIG = yaml.safe_load((BASE_DIR / "config" / "model_config.yaml").read_text())
CLASSES = json.loads((BASE_DIR / "config" / "classes.json").read_text())["classes"]

MODEL_PATH = Path(os.getenv("MODEL_PATH", str((BASE_DIR / CONFIG["model_path"]).resolve())))
INPUT_SIZE = tuple(CONFIG.get("input_size", [224, 224]))
MODEL_VERSION = os.getenv("MODEL_VERSION", CONFIG.get("model_version", "unknown"))
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", CONFIG.get("confidence_threshold", 0.55)))
LAST_CONV_LAYER = os.getenv("LAST_CONV_LAYER", CONFIG.get("last_conv_layer", "top_conv"))
