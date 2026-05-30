import mimetypes
from .models import CompressionStatus
import subprocess
import tempfile
from pathlib import Path
import os
from celery import shared_task
from django.apps import apps
from django.core.files import File
from django.db import transaction
from PIL import Image, ImageOps


try:
    import magic
except ImportError:
    magic = None
    

Image.MAX_IMAGE_PIXELS = 30_000_000


def make_temp_file(suffix):
    fd,path=tempfile.mkstemp(suffix=suffix)
    os.close(fd)
    return path

def copy_storage_file_to_temp(field_file):
    suffix = Path(field_file.name).suffix.lower()
    temp_path = make_temp_file(suffix)

    with field_file.storage.open(field_file.name, "rb") as source:
        with open(temp_path, "wb") as destination:
            for chunk in iter(lambda: source.read(1024 * 1024), b""):
                destination.write(chunk)

    return temp_path

def detect_mime(path, original_name):
    if magic:
        return magic.from_file(path, mime=True)

    guessed_mime, _ = mimetypes.guess_type(original_name)
    return guessed_mime or "application/octet-stream"

def compress_image(input_path):
    output_path=make_temp_file(".jpg")
    with Image.open(input_path) as f:
        img=ImageOps.exif_transpose(f)
        img.thumbnail(2000,2000)
        if img.mode in ("RGBA", "LA", "P"):
            img = img.convert("RGBA")
            background = Image.new("RGB", img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[-1])
            img = background
        else:
            img = img.convert("RGB")
        img.save(
            output_path,
            "JPEG",
            quality=75,
            optimize=True,
            progressive=True,
        )
    return output_path
  
def compress_pdf(input_path):
    output_path=make_temp_file(".pdf")
    command = [
        "gs",
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        "-dPDFSETTINGS=/ebook",
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        "-dSAFER",
        f"-sOutputFile={output_path}",
        input_path,
    ]
    subprocess.run(
        command,
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        timeout=300,
    )          
    return output_path

def get_new_file_name(old_name,output_path,mime_type):
    old_path=Path(old_name)
    if mime_type.startswith("image/"):
        return str(old_path.with_suffix(".jpg"))
    return old_name

@shared_task(
    bind=True,
    max_retries=3,
    acks_late=True,
    time_limit=600,
    soft_time_limit=540,
)
def compress_uploaded_file(self, model_label, object_id, original_field_name):
    Model = apps.get_model(model_label)

    input_path = None
    output_path = None

    try:
        with transaction.atomic():
            obj = Model.objects.select_for_update().get(pk=object_id)

            if obj.compression_status == CompressionStatus.PROCESSING:
                return "Already processing"

            obj.compression_status = CompressionStatus.PROCESSING
            obj.compression_error = ""
            obj.save(update_fields=["compression_status", "compression_error"])

        obj = Model.objects.get(pk=object_id)
        original_field = getattr(obj, original_field_name)

        if not original_field:
            Model.objects.filter(pk=object_id).update(
                compression_status=CompressionStatus.SKIPPED,
                compression_error="No file found.",
            )
            return "No file found"

        old_file_name = original_field.name
        storage = original_field.storage

        input_path = copy_storage_file_to_temp(original_field)
        mime_type = detect_mime(input_path, old_file_name)

        if mime_type.startswith("image/"):
            output_path = compress_image(input_path)
        elif mime_type == "application/pdf":
            output_path = compress_pdf(input_path)
        else:
            Model.objects.filter(pk=object_id).update(
                compression_status=CompressionStatus.SKIPPED,
                mime_type=mime_type,
                compression_error=f"Unsupported MIME type: {mime_type}",
            )
            return f"Unsupported MIME type: {mime_type}"

        original_size = original_field.size or os.path.getsize(input_path)
        compressed_size = os.path.getsize(output_path)

        if compressed_size >= original_size:
            Model.objects.filter(pk=object_id).update(
                compression_status=CompressionStatus.SKIPPED,
                original_size=original_size,
                compressed_size=compressed_size,
                mime_type=mime_type,
                compression_error="Compressed file was not smaller than original.",
            )
            return "Skipped because compressed file was not smaller"

        obj = Model.objects.get(pk=object_id)
        file_field = getattr(obj, original_field_name)

        new_file_name = get_new_file_name(old_file_name, output_path, mime_type)

        if storage.exists(old_file_name):
            storage.delete(old_file_name)

        with open(output_path, "rb") as compressed:
            file_field.save(
                new_file_name,
                File(compressed),
                save=False,
            )

        obj.original_size = original_size
        obj.compressed_size = compressed_size
        obj.mime_type = mime_type
        obj.compression_status = CompressionStatus.DONE
        obj.compression_error = ""

        obj.save(update_fields=[
            original_field_name,
            "compression_status",
            "original_size",
            "compressed_size",
            "mime_type",
            "compression_error",
        ])

        return "Compression finished and original file replaced"

    except Exception as exc:
        if self.request.retries >= 3:
            Model.objects.filter(pk=object_id).update(
                compression_status=CompressionStatus.FAILED,
                compression_error=str(exc)[:1000],
            )
            raise

        raise self.retry(
            exc=exc,
            countdown=min(60 * (2 ** self.request.retries), 300),
        )

    finally:
        for path in [input_path, output_path]:
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except OSError:
                    pass
                
                
# Student uploads photo/PDF
#         ↓
# File saved in original folder
#         ↓
# DB status = PENDING
#         ↓
# Celery starts
#         ↓
# File compressed
#         ↓
# Old original file deleted
#         ↓
# Compressed file saved back into original field
#         ↓
# DB status = DONE