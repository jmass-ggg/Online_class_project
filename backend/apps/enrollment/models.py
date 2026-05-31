import uuid
from django.db import models
from django.conf import settings
from apps.batch.models import Batch

class Enrollment(models.Model):

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
        DROPPED = "DROPPED", "Dropped"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    batch = models.ForeignKey(
        Batch,
        on_delete=models.CASCADE,
        related_name="enrollments"
    )

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="enrollments",limit_choices_to={"role": "STUDENT"}
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.APPROVED
    )

    enrolled_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["batch", "student"]),
            models.Index(fields=["status"]),
            models.Index(fields=["batch", "status"]),
        ]

        constraints = [
            models.UniqueConstraint(
                fields=["batch", "student"],
                name="unique_batch_student"
            )
        ]

    def __str__(self):
        return f"{self.student} -> {self.batch} ({self.status})"