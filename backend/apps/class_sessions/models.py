import uuid

from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from apps.batch.models import Batch

class ClassSession(models.Model):
    class Status(models.TextChoices):
        UPCOMING = "UPCOMING", "Upcoming"
        LIVE = "LIVE", "Live"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    classroom = models.ForeignKey(
        Batch,
        on_delete=models.CASCADE,
        related_name="class_sessions"
    )

    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="class_sessions",
        limit_choices_to={"role": "TEACHER"}
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    scheduled_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()

    livekit_room_name = models.CharField(
        max_length=255,
        unique=True,
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.UPCOMING
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.teacher and self.teacher.role != "TEACHER":
            raise ValidationError("Only teachers can create live class sessions.")
        if self.classroom and self.teacher:
            if self.classroom.teacher != self.teacher:
                raise ValidationError("Only teachers can create live class sessions.")
        if self.start_time and self.end_time:
            if self.start_time>= self.end_time:
                raise ValidationError("Start time must be before than end time")
            
    def save(self, *args, **kwargs):
        if not self.livekit_room_name:
            self.livekit_room_name = f"class-session-{self.id}"

        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} - {self.classroom.name}"
            
class ClassSessionAttendance(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    session = models.ForeignKey(
        ClassSession,
        on_delete=models.CASCADE,
        related_name="attendances"
    )

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="class_attendances",
        limit_choices_to={"role": "STUDENT"}
    )

    joined_at = models.DateTimeField(auto_now_add=True)
    left_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        unique_together = ["session", "student"]

    def clean(self):
        if self.student and self.student.role != "STUDENT":
            raise ValidationError("Only students can have attendance records.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student} attended {self.session.title}"