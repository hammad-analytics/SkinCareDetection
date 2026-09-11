from pathlib import Path
import tempfile
import base64
import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from PIL import Image
from .image_pipeline import decode_image, preprocess, quality_metrics, auto_enhance
from .model import predict, gradcam

app = FastAPI(title="Skin Health ML Service")

async def read_upload(file: UploadFile) -> bytes:
    if file.content_type not in {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}:
        raise HTTPException(status_code=415, detail="Unsupported image MIME type.")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image is too large.")
    return data

@app.get("/health")
def health():
    from .config import MODEL_PATH, MODEL_VERSION
    return {"ok": True, "service": "ml-service", "model_available": MODEL_PATH.exists(), "model_version": MODEL_VERSION}

@app.post("/quality-check")
async def quality_check(file: UploadFile = File(...)):
    image = decode_image(await read_upload(file))
    return quality_metrics(image)

def tokenize_context(text: str):
    tokens = [abs(hash(word.lower())) % 10000 for word in (text or "").split()[:64]]
    return np.array([tokens + [0] * (64 - len(tokens))], dtype="int32")

@app.post("/predict")
async def predict_endpoint(file: UploadFile = File(...), context: str = Form("")):
    image = decode_image(await read_upload(file))
    metrics = quality_metrics(image)
    if not metrics["usable"]:
        raise HTTPException(status_code=422, detail={"message": "Image is corrupted or completely unreadable.", "quality": metrics})
    result = predict(preprocess(image), tokenize_context(context))
    result["quality"] = metrics
    return result

@app.post("/gradcam")
async def gradcam_endpoint(file: UploadFile = File(...)):
    image = decode_image(await read_upload(file))
    enhanced_img, _ = auto_enhance(image)
    original = enhanced_img.copy().resize((224, 224), Image.Resampling.LANCZOS)
    heatmap = gradcam(preprocess(image))
    heatmap = cv2.resize(heatmap, original.size)
    heatmap = np.uint8(255 * heatmap)
    heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
    overlay = cv2.addWeighted(cv2.cvtColor(np.asarray(original), cv2.COLOR_RGB2BGR), 0.55, heatmap, 0.45, 0)
    out_dir = Path(tempfile.gettempdir()) / "skin-gradcam"
    out_dir.mkdir(exist_ok=True)
    out_path = out_dir / f"gradcam-{next(tempfile._get_candidate_names())}.jpg"
    cv2.imwrite(str(out_path), overlay)
    ok, encoded = cv2.imencode(".jpg", overlay)
    overlay_base64 = base64.b64encode(encoded).decode("ascii") if ok else ""
    return {
        "overlay_path": str(out_path),
        "overlay_data_url": f"data:image/jpeg;base64,{overlay_base64}",
        "note": "Highlighted regions influenced the model prediction; this is not a diagnosis."
    }
