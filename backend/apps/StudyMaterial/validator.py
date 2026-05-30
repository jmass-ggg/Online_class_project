

from pathlib import Path
from django.conf import settings
from django.core.exceptions import ValidationError


ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".pdf",
}


def validate_file_extension(value):
    ext = Path(value.name).suffix.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError("Only JPG, JPEG, PNG, WEBP, and PDF files are allowed.")

    max_size = getattr(settings, "MAX_UPLOAD_SIZE", 25 * 1024 * 1024)

    if value.size > max_size:
        raise ValidationError(f"File too large. Maximum allowed size is {max_size // (1024 * 1024)} MB.")