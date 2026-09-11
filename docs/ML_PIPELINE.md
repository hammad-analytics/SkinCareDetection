# ML Pipeline

The ML service validates file type/signature, detects corrupt images, applies EXIF orientation, converts to RGB, checks resolution/blur/brightness/contrast, resizes with aspect-ratio preservation and padding, and applies EfficientNet preprocessing before inference.

Training uses HAM10000 when downloaded by the developer from an approved source. The project expects `HAM10000_metadata.csv`, `HAM10000_images_part_1`, and `HAM10000_images_part_2`.

The model is multimodal:
- CNN image branch: EfficientNet-B0
- RNN context branch: embedding + bidirectional GRU over metadata/context tokens
- Fusion head: concatenated visual/context features with dense classification

Do not report accuracy, precision, recall, F1, confusion matrix, or inference-time claims until `ml-service/train.py` generates real metrics from the held-out test split.
