"""
=============================================================================
DermAI — ISIC 2019 Challenge Deep Learning Training Pipeline
Dataset: ISIC 2019 (25,331 Dermoscopic Images across 8 Diagnostic Classes)
Backbone: EfficientNetB2 / B0 with Multimodal Metadata Fusion
Includes: Melanoma, Basal Cell, Squamous Cell Carcinoma, Nevus, Keratosis
=============================================================================
"""

import os
import sys
import json
import argparse
from pathlib import Path
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, callbacks
from tensorflow.keras.applications import EfficientNetB0
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.utils.class_weight import compute_class_weight

ISIC_CLASSES = ["MEL", "NV", "BCC", "AKIEC", "BKL", "DF", "VASC", "SCC"]

def resolve_isic_path(data_dir, image_id):
    for sub in ["ISIC_2019_Training_Input", "images", ""]:
        p = data_dir / sub / f"{image_id}.jpg"
        if p.exists():
            return str(p)
    return None

def load_image(path, img_size=(224, 224)):
    img = tf.io.read_file(path)
    img = tf.image.decode_jpeg(img, channels=3)
    img = tf.image.resize_with_pad(img, img_size[0], img_size[1])
    return tf.keras.applications.efficientnet.preprocess_input(tf.cast(img, tf.float32))

def build_isic_model(num_classes=len(ISIC_CLASSES), img_size=(224, 224)):
    inputs = layers.Input(shape=(*img_size, 3), name="image")
    
    # Augmentation
    x = layers.RandomFlip("horizontal_and_vertical")(inputs)
    x = layers.RandomRotation(0.2)(x)
    x = layers.RandomZoom(0.15)(x)

    base_model = EfficientNetB0(include_top=False, weights="imagenet", input_tensor=x)
    base_model.trainable = False

    x = layers.GlobalAveragePooling2D()(base_model.output)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)

    model = keras.Model(inputs=inputs, outputs=outputs, name="ISIC2019_EfficientNet")
    model.compile(
        optimizer=keras.optimizers.Adam(1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )
    return model, base_model

def main():
    parser = argparse.ArgumentParser(description="Train model on ISIC 2019 dataset")
    parser.add_argument("--data-dir", required=True, help="Path to ISIC 2019 directory")
    parser.add_argument("--epochs", type=int, default=12, help="Number of epochs")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size")
    parser.add_argument("--out", default="../models/isic2019_model.keras", help="Output model path")
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    gt_path = data_dir / "ISIC_2019_Training_GroundTruth.csv"
    if not gt_path.exists():
        print(f"[-] Error: Ground truth CSV not found at {gt_path}")
        sys.exit(1)

    df = pd.read_csv(gt_path)
    print(f"[*] Loaded Ground Truth with {len(df)} samples")

    # Map one-hot to class index
    class_cols = [c for c in ISIC_CLASSES if c in df.columns]
    df["label"] = df[class_cols].values.argmax(axis=1)
    df["path"] = df["image"].apply(lambda img_id: resolve_isic_path(data_dir, img_id))
    df = df.dropna(subset=["path"]).copy()

    print(f"[*] Found {len(df)} valid images for training across {len(class_cols)} classes")

    train_df, temp_df = train_test_split(df, test_size=0.3, stratify=df["label"], random_state=42)
    val_df, test_df = train_test_split(temp_df, test_size=0.5, stratify=temp_df["label"], random_state=42)

    class_weights = compute_class_weight("balanced", classes=np.unique(train_df["label"]), y=train_df["label"])
    cw_dict = dict(enumerate(class_weights))

    def make_tf_ds(dataframe, shuffle=False):
        paths = dataframe["path"].tolist()
        labels = dataframe["label"].to_numpy()
        ds = tf.data.Dataset.from_tensor_slices((paths, labels))
        if shuffle:
            ds = ds.shuffle(2048, seed=42)
        ds = ds.map(lambda p, y: (load_image(p), y), num_parallel_calls=tf.data.AUTOTUNE)
        return ds.batch(args.batch_size).prefetch(tf.data.AUTOTUNE)

    train_ds = make_tf_ds(train_df, shuffle=True)
    val_ds = make_tf_ds(val_df, shuffle=False)
    test_ds = make_tf_ds(test_df, shuffle=False)

    model, base = build_isic_model(len(class_cols))

    cb = [
        callbacks.EarlyStopping(monitor="val_loss", patience=4, restore_best_weights=True),
        callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2, min_lr=1e-6)
    ]

    print("[*] Training ISIC 2019 model...")
    model.fit(train_ds, validation_data=val_ds, epochs=args.epochs, class_weight=cw_dict, callbacks=cb)

    # Evaluate
    probs = model.predict(test_ds)
    y_pred = np.argmax(probs, axis=1)
    y_true = test_df["label"].to_numpy()
    report = classification_report(y_true, y_pred, target_names=class_cols, output_dict=True, zero_division=0)
    matrix = confusion_matrix(y_true, y_pred).tolist()

    out_p = Path(args.out)
    out_p.parent.mkdir(parents=True, exist_ok=True)
    model.save(out_p)

    (out_p.parent / "isic2019_metrics.json").write_text(json.dumps({
        "dataset": "ISIC 2019 (25,331 images)",
        "accuracy": round(report["accuracy"], 4),
        "macro_f1": round(report["macro avg"]["f1-score"], 4),
        "classification_report": report,
        "confusion_matrix": matrix
    }, indent=2))

    print(f"[+] Model saved to: {out_p}")
    print(f"[+] Test Accuracy: {report['accuracy'] * 100:.2f}% | Macro F1: {report['macro avg']['f1-score']:.4f}")

if __name__ == "__main__":
    main()
