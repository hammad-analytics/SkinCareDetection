from PIL import Image
from io import BytesIO

from app.image_pipeline import decode_image, quality_metrics, preprocess


def test_decode_quality_and_preprocess_jpeg():
    image = Image.new("RGB", (300, 300), (120, 130, 125))
    buffer = BytesIO()
    image.save(buffer, format="JPEG")
    decoded = decode_image(buffer.getvalue())
    metrics = quality_metrics(decoded)
    arr = preprocess(decoded)
    assert metrics["width"] == 300
    assert arr.shape == (1, 224, 224, 3)
