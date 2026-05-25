from django.core.exceptions import ValidationError
import os

def validate_file_extension(value):
    ext=os.path.split(value.name)[1]
    validated_extension=[
        ".jpg",
        ".jpeg",
        ".png",
        ".pdf"
    ]
    if ext.lower() not in validated_extension:
        raise ValidationError(
           "Unsupported file type."
        )
        