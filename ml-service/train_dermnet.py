"""
=============================================================================
DermAI — DermNet Deep Learning Training Pipeline
Dataset: DermNet Dataset (Real-world clinical camera / phone skin diseases)
Backbone: EfficientNetB0 with Transfer Learning & Fine-Tuning
Classes: Acne, Eczema, Psoriasis, Fungal Ringworm (Daad), Vitiligo, Rosacea, Dermatitis
=============================================================================
"""

import os
import sys
import json
import argparse
from pathlib import Path
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, callbacks
from tensorflow.keras.applications import EfficientNetB0
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.utils.class_weight import compute_class_weight

CLASSES = [
    "acne",
    "eczema",
    "psoriasis",
    "fungal",
    "vitiligo",
    "rosacea",
    "dermatitis",
    "melanocytic_nevi"
]

FOLDER_ALIASES = {
    "acne": ["acne", "acne and rosacea photos", "pimples"],
    "eczema": ["eczema", "eczema photos", "atopic dermatitis", "atopic_dermatitis"],
    "psoriasis": ["psoriasis", "psoriasis pictures lichen planus and related diseases"],
    "fungal": ["fungal", "tinea", "ringworm", "tinea ringworm candidiasis and other fungal infections"],
    "vitiligo": ["vitiligo", "pigmentation disorders", "melasma", "hyperpigmentation"],
    "rosacea": ["rosacea", "erythema"],
    "dermatitis": ["dermatitis", "contact dermatitis", "poison ivy photos and other contact dermatitis"],
    "melanocytic_nevi": ["melanocytic nevi", "moles", "nevi", "benign lesions"]
}

def scan_dataset_directory(data_dir):
    """Scans DermNet folder structure and returns list of (file_path, label_idx)."""
    data_path = Path(data_dir)
    image_paths = []
    labels = []

    for label_idx, target_class in enumerate(CLASSES):
        aliases = FOLDER_ALIASES.get(target_class, [target_class])
        found_for_class = 0

        for folder in data_path.rglob("*"):
            if folder.is_dir():
                folder_lower = folder.name.lower()
                if any(alias in folder_lower for alias in aliases):
                    for img in folder.glob("*.*"):
                        if img.suffix.lower() in [".jpg", ".jpeg", ".png"]:
                            image_paths.append(str(img))
                            labels.append(label_idx)
                            found_for_class += 1

        print(f"[*] Class '{target_class}': found {found_for_class} images")

    return np.array(image_paths), np.array(labels)

def preprocess_image(path, label, img_size=(224, 224)):
    img = tf.io.read_file(path)
    img = tf.image.decode_jpeg(img, channels=3)
    img = tf.image.resize_with_pad(img, img_size[0], img_size[1])
    img = tf.keras.applications.efficientnet.preprocess_input(tf.cast(img, tf.float32))
    return img, label

def create_dermnet_model(num_classes=len(CLASSES), img_size=(224, 224), dropout_rate=0.35):
    inputs = layers.Input(shape=(*img_size, 3), name="image")

    # Data augmentation block
    x = layers.RandomFlip("horizontal_and_vertical")(inputs)
    x = layers.RandomRotation(0.2)(x)
    x = layers.RandomZoom(0.15)(x)
    x = layers.RandomContrast(0.15)(x)

    # Backbone
    base_model = EfficientNetB0(include_top=False, weights="imagenet", input_tensor=x)
    base_model.trainable = False  # Freeze initially

    x = layers.GlobalAveragePooling2D(name="avg_pool")(base_model.output)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(dropout_rate)(x)
    x = layers.Dense(256, activation="relu", kernel_regularizer=keras.regularizers.l2(1e-4))(x)
    x = layers.Dropout(dropout_rate)(x)
    outputs = layers.Dense(num_classes, activation="softmax", name="predictions")(x)

    model = keras.Model(inputs=inputs, outputs=outputs, name="DermNet_EfficientNetB0")
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )
    return model, base_model

def main():
    parser = argparse.ArgumentParser(description="Train DermNet model on clinical skin diseases")
    parser.add_argument("--data-dir", required=True, help="Path to DermNet dataset directory")
    parser.add_argument("--epochs", type=int, default=15, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size")
    parser.add_argument("--out", default="../models/dermnet_model.keras", help="Output model path")
    args = parser.parse_args()

    print("==================================================================")
    print("  DermAI — DermNet Training Pipeline for Clinical Skin Diseases   ")
    print("==================================================================")

    paths, labels = scan_dataset_directory(args.data_dir)
    if len(paths) == 0:
        print("[-] Error: No images found. Check the dataset path.")
        sys.exit(1)

    print(f"[*] Total dataset images: {len(paths)} across {len(CLASSES)} target classes")

    # Split train, val, test (70%, 15%, 15%)
    x_train, x_temp, y_train, y_temp = train_test_split(paths, labels, test_size=0.3, stratify=labels, random_state=42)
    x_val, x_test, y_val, y_test = train_test_split(x_temp, y_temp, test_size=0.5, stratify=y_temp, random_state=42)

    # Balanced class weights
    class_weights = compute_class_weight("balanced", classes=np.unique(y_train), y=y_train)
    class_weight_dict = dict(enumerate(class_weights))

    # Datasets
    train_ds = tf.data.Dataset.from_tensor_slices((x_train, y_train))\
        .shuffle(2048, seed=42)\
        .map(preprocess_image, num_parallel_calls=tf.data.AUTOTUNE)\
        .batch(args.batch_size).prefetch(tf.data.AUTOTUNE)

    val_ds = tf.data.Dataset.from_tensor_slices((x_val, y_val))\
        .map(preprocess_image, num_parallel_calls=tf.data.AUTOTUNE)\
        .batch(args.batch_size).prefetch(tf.data.AUTOTUNE)

    test_ds = tf.data.Dataset.from_tensor_slices((x_test, y_test))\
        .map(preprocess_image, num_parallel_calls=tf.data.AUTOTUNE)\
        .batch(args.batch_size).prefetch(tf.data.AUTOTUNE)

    model, base_model = create_dermnet_model(num_classes=len(CLASSES))

    cb = [
        callbacks.EarlyStopping(monitor="val_loss", patience=5, restore_best_weights=True),
        callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2, min_lr=1e-6)
    ]

    print("[*] Phase 1: Training top classification layers...")
    model.fit(train_ds, validation_data=val_ds, epochs=max(5, args.epochs // 2), class_weight=class_weight_dict, callbacks=cb)

    print("[*] Phase 2: Unfreezing top 30 layers for fine-tuning...")
    base_model.trainable = True
    for layer in base_model.layers[:-30]:
        layer.trainable = False

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-4),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )
    model.fit(train_ds, validation_data=val_ds, epochs=args.epochs, class_weight=class_weight_dict, callbacks=cb)

    # Evaluate
    print("[*] Evaluating on held-out test split...")
    probs = model.predict(test_ds)
    y_pred = np.argmax(probs, axis=1)
    report = classification_report(y_test, y_pred, target_names=CLASSES, output_dict=True, zero_division=0)
    matrix = confusion_matrix(y_test, y_pred).tolist()

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    model.save(out_path)

    metrics_file = out_path.parent / "dermnet_metrics.json"
    metrics_file.write_text(json.dumps({
        "dataset": "DermNet 23k",
        "classes": CLASSES,
        "accuracy": round(report["accuracy"], 4),
        "macro_f1": round(report["macro avg"]["f1-score"], 4),
        "classification_report": report,
        "confusion_matrix": matrix
    }, indent=2))

    print(f"[+] Saved model to: {out_path}")
    print(f"[+] Saved metrics to: {metrics_file}")
    print(f"[+] Test Accuracy: {report['accuracy'] * 100:.2f}% | Macro F1: {report['macro avg']['f1-score']:.4f}")

if __name__ == "__main__":
    main()
