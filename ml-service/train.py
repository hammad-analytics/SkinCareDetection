"""Train a HAM10000-ready multimodal CNN + RNN model.

Expected data:
- HAM10000_images_part_1/
- HAM10000_images_part_2/
- HAM10000_metadata.csv

The CNN branch learns from lesion images. The RNN branch learns from structured
metadata converted into short text-like sequences: localization, sex, age bucket,
and dataset diagnosis type. This is an academic multimodal prototype, not a
clinically validated diagnostic system.
"""

from pathlib import Path
import argparse
import json
import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
from tensorflow import keras
from tensorflow.keras import layers


CLASSES = ["akiec", "bcc", "bkl", "df", "mel", "nv", "vasc"]


def metadata_sentence(row):
    age = "age_unknown" if pd.isna(row.get("age")) else f"age_{int(row['age'] // 10) * 10}s"
    return f"{row.get('localization', 'unknown')} {row.get('sex', 'unknown')} {age} {row.get('dx_type', 'unknown')}"


def resolve_image_path(data_dir, image_id):
    for folder in ["HAM10000_images_part_1", "HAM10000_images_part_2"]:
        path = data_dir / folder / f"{image_id}.jpg"
        if path.exists():
            return str(path)
    raise FileNotFoundError(f"Missing image for {image_id}")


def load_image(path, image_size):
    image = tf.io.read_file(path)
    image = tf.image.decode_jpeg(image, channels=3)
    image = tf.image.resize_with_pad(image, image_size[0], image_size[1])
    return tf.keras.applications.efficientnet.preprocess_input(tf.cast(image, tf.float32))


def build_dataset(frame, tokenizer, image_size, batch_size, shuffle):
    paths = frame["path"].tolist()
    texts = tokenizer.texts_to_sequences(frame["context"].tolist())
    texts = keras.preprocessing.sequence.pad_sequences(texts, maxlen=64, padding="post")
    labels = frame["label"].to_numpy()
    ds = tf.data.Dataset.from_tensor_slices((paths, texts, labels))
    if shuffle:
        ds = ds.shuffle(min(len(frame), 2048), seed=42)
    ds = ds.map(lambda p, t, y: ((load_image(p, image_size), t), y), num_parallel_calls=tf.data.AUTOTUNE)
    return ds.batch(batch_size).prefetch(tf.data.AUTOTUNE)


def build_model(num_classes):
    image_input = keras.Input(shape=(224, 224, 3), name="image")
    base = keras.applications.EfficientNetB0(include_top=False, weights="imagenet", input_tensor=image_input)
    base.trainable = False
    x = layers.GlobalAveragePooling2D()(base.output)
    x = layers.Dropout(0.25)(x)

    text_input = keras.Input(shape=(64,), dtype="int32", name="context_tokens")
    t = layers.Embedding(input_dim=10000, output_dim=64, mask_zero=True)(text_input)
    t = layers.Bidirectional(layers.GRU(64))(t)
    t = layers.Dropout(0.25)(t)

    fused = layers.Concatenate()([x, t])
    fused = layers.Dense(256, activation="relu")(fused)
    fused = layers.Dropout(0.35)(fused)
    output = layers.Dense(num_classes, activation="softmax")(fused)
    model = keras.Model(inputs=[image_input, text_input], outputs=output)
    model.compile(optimizer=keras.optimizers.Adam(1e-3), loss="sparse_categorical_crossentropy", metrics=["accuracy"])
    return model


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--epochs", type=int, default=8)
    parser.add_argument("--batch-size", type=int, default=24)
    parser.add_argument("--out", default="../models/skin_model.keras")
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    meta = pd.read_csv(data_dir / "HAM10000_metadata.csv")
    meta["path"] = meta["image_id"].apply(lambda image_id: resolve_image_path(data_dir, image_id))
    meta["context"] = meta.apply(metadata_sentence, axis=1)
    meta["label"] = meta["dx"].map({name: idx for idx, name in enumerate(CLASSES)})
    meta = meta.dropna(subset=["label"]).copy()
    meta["label"] = meta["label"].astype(int)

    train, temp = train_test_split(meta, test_size=0.3, stratify=meta["label"], random_state=42)
    val, test = train_test_split(temp, test_size=0.5, stratify=temp["label"], random_state=42)

    tokenizer = keras.preprocessing.text.Tokenizer(num_words=10000, oov_token="[UNK]")
    tokenizer.fit_on_texts(train["context"].tolist())

    model = build_model(len(CLASSES))
    train_ds = build_dataset(train, tokenizer, (224, 224), args.batch_size, True)
    val_ds = build_dataset(val, tokenizer, (224, 224), args.batch_size, False)
    model.fit(train_ds, validation_data=val_ds, epochs=args.epochs)

    test_ds = build_dataset(test, tokenizer, (224, 224), args.batch_size, False)
    probs = model.predict(test_ds)
    y_pred = np.argmax(probs, axis=1)
    y_true = test["label"].to_numpy()
    report = classification_report(y_true, y_pred, target_names=CLASSES, output_dict=True, zero_division=0)
    matrix = confusion_matrix(y_true, y_pred).tolist()

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    model.save(out)
    (out.parent / "tokenizer.json").write_text(tokenizer.to_json())
    (out.parent / "metrics.json").write_text(json.dumps({"classification_report": report, "confusion_matrix": matrix}, indent=2))
    print(f"Saved model to {out}")
    print(json.dumps({"accuracy": report["accuracy"], "macro_f1": report["macro avg"]["f1-score"]}, indent=2))


if __name__ == "__main__":
    main()
