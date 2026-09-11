from io import BytesIO
import cv2
import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError
from fastapi import HTTPException
from .config import INPUT_SIZE

ALLOWED_SIGNATURES = {
    b"\xff\xd8\xff": "jpeg",
    b"\x89PNG\r\n\x1a\n": "png",
    b"RIFF": "webp",
    b"\x00\x00\x00": "heif"
}

def validate_signature(data: bytes) -> None:
    if not any(data.startswith(sig) for sig in ALLOWED_SIGNATURES):
        raise HTTPException(status_code=415, detail="Unsupported or invalid image file signature.")

def decode_image(data: bytes) -> Image.Image:
    validate_signature(data[:16])
    try:
        image = Image.open(BytesIO(data))
        image.verify()
        image = Image.open(BytesIO(data))
        image = ImageOps.exif_transpose(image)
        return image.convert("RGB")
    except (UnidentifiedImageError, OSError) as exc:
        raise HTTPException(status_code=400, detail="The image appears corrupted or unsupported.") from exc

def auto_enhance(image: Image.Image) -> tuple[Image.Image, dict]:
    """
    Automatically enhances skin images to make them suitable for AI classification:
    1. Upscaling if resolution is low
    2. Adaptive CLAHE contrast enhancement in LAB color space
    3. Auto-gamma & brightness normalization
    4. Unsharp masking to recover lesion edges from mild blur
    """
    applied = []
    w, h = image.size

    # 1. Upscale if too small
    if min(w, h) < 224:
        scale = max(224 / w, 224 / h) * 1.1
        new_w, new_h = int(w * scale), int(h * scale)
        image = image.resize((new_w, new_h), Image.Resampling.LANCZOS)
        applied.append(f"super_resolution_upscale_to_{new_w}x{new_h}")
        w, h = image.size

    arr = np.asarray(image).copy()
    gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
    brightness = float(gray.mean())
    contrast = float(gray.std())
    blur = float(cv2.Laplacian(gray, cv2.CV_64F).var())

    # 2. Brightness & Gamma Correction
    if brightness < 85:
        # Dark image -> boost with gamma curve
        gamma = max(0.45, np.log(0.48) / np.log(max(brightness, 10.0) / 255.0))
        table = np.array([((i / 255.0) ** gamma) * 255 for i in np.arange(0, 256)]).astype("uint8")
        arr = cv2.LUT(arr, table)
        applied.append("auto_gamma_brightness_boost")
    elif brightness > 215:
        # Overexposed -> compress highlights
        table = np.array([min(255, int((i / 255.0) ** 1.35 * 255)) for i in np.arange(0, 256)]).astype("uint8")
        arr = cv2.LUT(arr, table)
        applied.append("highlight_compression")

    # 3. Contrast Optimization with CLAHE in LAB space
    if contrast < 40 or brightness < 100:
        lab = cv2.cvtColor(arr, cv2.COLOR_RGB2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(8, 8))
        l_enhanced = clahe.apply(l_channel)
        lab_enhanced = cv2.merge((l_enhanced, a_channel, b_channel))
        arr = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2RGB)
        applied.append("clahe_contrast_optimization")

    # 4. Sharpening / De-blurring via Unsharp Mask
    if blur < 65:
        gaussian = cv2.GaussianBlur(arr, (0, 0), 2.0)
        arr = cv2.addWeighted(arr, 1.45, gaussian, -0.45, 0)
        # Ensure values stay in 0-255 range
        arr = np.clip(arr, 0, 255).astype("uint8")
        applied.append("unsharp_mask_edge_sharpening")

    enhanced_img = Image.fromarray(arr)
    enhanced_gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)

    details = {
        "auto_enhanced": len(applied) > 0,
        "enhancements_applied": applied,
        "original_blur": round(blur, 2),
        "original_brightness": round(brightness, 2),
        "original_contrast": round(contrast, 2),
        "enhanced_blur": round(float(cv2.Laplacian(enhanced_gray, cv2.CV_64F).var()), 2),
        "enhanced_brightness": round(float(enhanced_gray.mean()), 2),
        "enhanced_contrast": round(float(enhanced_gray.std()), 2)
    }

    return enhanced_img, details

def quality_metrics(image: Image.Image) -> dict:
    w, h = image.size
    arr = np.asarray(image)
    gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
    blur = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    brightness = float(gray.mean())
    contrast = float(gray.std())

    raw_issues = []
    if min(w, h) < 180:
        raw_issues.append("low_resolution")
    if blur < 25:
        raw_issues.append("blurry")
    if brightness < 30:
        raw_issues.append("too_dark")
    if brightness > 230:
        raw_issues.append("overexposed")
    if contrast < 14:
        raw_issues.append("low_contrast")

    # Automatically enhance to make it suitable for the model
    enhanced_img, enhance_details = auto_enhance(image)

    # An image is usable if it is not completely solid/empty
    is_usable = (contrast > 2.0) and (brightness > 5.0) and (brightness < 252.0)

    return {
        "width": w,
        "height": h,
        "blur": round(blur, 2),
        "brightness": round(brightness, 2),
        "contrast": round(contrast, 2),
        "raw_issues": raw_issues,
        "auto_enhanced": enhance_details["auto_enhanced"],
        "enhancements_applied": enhance_details["enhancements_applied"],
        "post_enhancement": {
            "blur": enhance_details["enhanced_blur"],
            "brightness": enhance_details["enhanced_brightness"],
            "contrast": enhance_details["enhanced_contrast"]
        },
        "usable": is_usable,
        "note": "Image automatically enhanced and optimized for model inference." if enhance_details["auto_enhanced"] else "Image meets model criteria."
    }

def preprocess(image: Image.Image) -> np.ndarray:
    # Always apply intelligent auto-enhancement before feeding to model
    enhanced, _ = auto_enhance(image)
    enhanced.thumbnail(INPUT_SIZE, Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", INPUT_SIZE, (0, 0, 0))
    canvas.paste(enhanced, ((INPUT_SIZE[0] - enhanced.width) // 2, (INPUT_SIZE[1] - enhanced.height) // 2))
    arr = np.asarray(canvas).astype("float32")
    return np.expand_dims(arr, axis=0)
