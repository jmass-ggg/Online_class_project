from django.db import models
import uuid

from apps.batch.models import Batch
from .validator import validate_file_extension


class CompressionStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    PROCESSING = "PROCESSING", "Processing"
    DONE = "DONE", "Done"
    FAILED = "FAILED", "Failed"
    SKIPPED = "SKIPPED", "Skipped"


class StudyMaterial(models.Model):
    id = models.UUIDField(
        primary_key=True,
        editable=False,
        default=uuid.uuid4,
    )

    classroom = models.ForeignKey(
        Batch,
        on_delete=models.CASCADE,
        related_name="study_material",
    )
    
    upload_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="study_material",
    )
    title=models.CharField(
        max_length=40
    )
    description = models.TextField()
    
    upload_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        indexes = [
            models.Index(fields=["classroom"]),
            models.Index(fields=["upload_by"]),
            models.Index(fields=["upload_at"]),
        ]
    def __str__(self):
        return f"Study Material {self.id}"


class StudyMaterialAttachment(models.Model):
    id = models.UUIDField(
        primary_key=True,
        editable=False,
        default=uuid.uuid4,
    )

    study_material = models.ForeignKey(
        StudyMaterial,
        on_delete=models.CASCADE,
        related_name="images",
    )

    file = models.FileField(
        upload_to="student_material/",
        validators=[validate_file_extension],
    )

    compression_status = models.CharField(
        max_length=20,
        choices=CompressionStatus.choices,
        default=CompressionStatus.PENDING,
    )

    original_size = models.PositiveBigIntegerField(null=True, blank=True)
    compressed_size = models.PositiveBigIntegerField(null=True, blank=True)
    mime_type = models.CharField(max_length=100, blank=True)
    compression_error = models.TextField(blank=True)

    uploaded_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        indexes = [
            models.Index(fields=["compression_status"]),
            models.Index(fields=["uploaded_at"]),
        ]
    def __str__(self):
        return f"Attachment {self.id}"


class Submission(models.Model):
    id = models.UUIDField(
        primary_key=True,
        editable=False,
        default=uuid.uuid4,
    )

    assignment = models.ForeignKey(
        StudyMaterial,
        on_delete=models.CASCADE,
        related_name="submission",
    )

    student = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="submission",
    )

    submitted_file = models.FileField(
        upload_to="submitted/",
        validators=[validate_file_extension],
        null=True,
        blank=True,
    )

    compression_status = models.CharField(
        max_length=20,
        choices=CompressionStatus.choices,
        default=CompressionStatus.PENDING,
    )

    original_size = models.PositiveBigIntegerField(null=True, blank=True)
    compressed_size = models.PositiveBigIntegerField(null=True, blank=True)
    mime_type = models.CharField(max_length=100, blank=True)
    compression_error = models.TextField(blank=True)

    submitted_at = models.DateTimeField(auto_now=True)
    class Meta:
        indexes = [
            models.Index(fields=["compression_status"]),
            models.Index(fields=["submitted_at"]),
            models.Index(fields=["assignment", "student"]),
        ]

        constraints = [
            models.UniqueConstraint(
                fields=["assignment", "student"],
                name="unique_assignment_student"
            )
        ]
    def __str__(self):
        return f"Submission {self.id}"