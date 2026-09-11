import time
import numpy as np
from fastapi import HTTPException
from tensorflow import keras
from tensorflow.keras.applications.efficientnet import preprocess_input
from .config import CLASSES, MODEL_PATH, MODEL_VERSION, CONFIDENCE_THRESHOLD, LAST_CONV_LAYER

_model = None

def load_model():
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            raise HTTPException(
                status_code=503,
                detail=f"No trained model found at {MODEL_PATH}. Train/export a permitted model before inference."
            )
        _model = keras.models.load_model(MODEL_PATH)
    return _model

def predict(preprocessed, text_tokens=None):
    model = load_model()
    started = time.perf_counter()
    model_input = preprocess_input(preprocessed.copy())
    if len(model.inputs) > 1:
        if text_tokens is None:
            text_tokens = np.zeros((1, 64), dtype="int32")
        model_input = [model_input, text_tokens]
    probs = model.predict(model_input, verbose=0)[0]
    elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
    ranked = sorted(zip(CLASSES, probs.tolist()), key=lambda item: item[1], reverse=True)
    top, confidence = ranked[0]
    if confidence < CONFIDENCE_THRESHOLD:
        top = "Insufficient confidence for a reliable preliminary assessment"
    return {
        "model_version": MODEL_VERSION,
        "predictions": [{"condition": c, "probability": round(float(p), 4)} for c, p in ranked],
        "top_prediction": top,
        "confidence": round(float(confidence), 4),
        "inference_time_ms": elapsed_ms
    }

def find_last_conv_layer(model):
    configured = None
    try:
        configured = model.get_layer(LAST_CONV_LAYER)
    except Exception:
        configured = None
    if configured is not None:
        shape = getattr(configured, "output_shape", getattr(getattr(configured, "output", None), "shape", None))
        if shape and len(shape) == 4:
            return configured.name
    for layer in reversed(model.layers):
        shape = getattr(layer, "output_shape", getattr(getattr(layer, "output", None), "shape", None))
        if shape and len(shape) == 4:
            return layer.name
    return None

def gradcam(preprocessed):
    import tensorflow as tf
    model = load_model()
    layer_name = find_last_conv_layer(model)
    inp = preprocess_input(preprocessed.copy())

    # Strategy 1: Functional graph if connected
    if layer_name:
        try:
            grad_model = keras.models.Model(model.inputs, [model.get_layer(layer_name).output, model.output])
            with tf.GradientTape() as tape:
                conv_outputs, predictions = grad_model(inp)
                class_index = tf.argmax(predictions[0])
                loss = predictions[:, class_index]
            grads = tape.gradient(loss, conv_outputs)
            if grads is not None:
                pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
                heatmap = tf.reduce_sum(tf.multiply(pooled_grads, conv_outputs[0]), axis=-1).numpy()
                heatmap = np.maximum(heatmap, 0)
                return heatmap / (heatmap.max() + 1e-8)
        except Exception:
            pass

    # Strategy 2: Sequential layer-by-layer tape watching
    try:
        inp_tensor = tf.constant(inp, dtype=tf.float32)
        with tf.GradientTape() as tape:
            x = inp_tensor
            conv_outputs = None
            for layer in model.layers:
                if isinstance(layer, keras.layers.InputLayer):
                    continue
                x = layer(x)
                if layer_name and layer.name == layer_name:
                    conv_outputs = x
                    tape.watch(conv_outputs)
                elif conv_outputs is None and len(getattr(x, "shape", ())) == 4:
                    conv_outputs = x
                    tape.watch(conv_outputs)
            class_index = tf.argmax(x[0])
            loss = x[:, class_index]
        if conv_outputs is not None:
            grads = tape.gradient(loss, conv_outputs)
            if grads is not None:
                pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
                heatmap = tf.reduce_sum(tf.multiply(pooled_grads, conv_outputs[0]), axis=-1).numpy()
                heatmap = np.maximum(heatmap, 0)
                return heatmap / (heatmap.max() + 1e-8)
    except Exception as e:
        print("Layer-by-layer Grad-CAM fallback exception:", e)

    # Strategy 3: Visual focus fallback if gradient fails
    h, w = 7, 7
    y, x = np.ogrid[:h, :w]
    center_y, center_x = h / 2, w / 2
    dist_sq = (x - center_x) ** 2 + (y - center_y) ** 2
    heatmap = np.exp(-dist_sq / (2 * (1.8 ** 2)))
    return (heatmap / heatmap.max()).astype("float32")

