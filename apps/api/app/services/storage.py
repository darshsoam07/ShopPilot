from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile

from app.core.config import settings


class LocalStorageService:
    """Development storage adapter. Swap this implementation for S3/MinIO later."""

    ALLOWED_CONTENT_TYPES = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }

    async def save_product_image(self, upload: UploadFile) -> str:
        extension = self.ALLOWED_CONTENT_TYPES.get(upload.content_type or "")
        if extension is None:
            raise HTTPException(status_code=415, detail="Only JPEG, PNG and WebP images are supported")

        content = await upload.read(settings.MAX_IMAGE_UPLOAD_BYTES + 1)
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded image is empty")
        if len(content) > settings.MAX_IMAGE_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="Image exceeds the configured upload limit")
        signatures = {
            ".jpg": content.startswith(b"\xff\xd8\xff"),
            ".png": content.startswith(b"\x89PNG\r\n\x1a\n"),
            ".webp": len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP",
        }
        if not signatures.get(extension, False):
            raise HTTPException(status_code=415, detail="Image content does not match its declared image type")

        destination = Path(settings.MEDIA_DIR)
        destination.mkdir(parents=True, exist_ok=True)
        filename = f"{uuid4().hex}{extension}"
        (destination / filename).write_bytes(content)
        return f"/media/{filename}"


storage_service = LocalStorageService()
