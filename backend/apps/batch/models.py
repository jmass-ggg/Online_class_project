from django.db import models
import uuid
import string
import secrets
from django.conf import settings
from django.core.exceptions import ValidationError

def generate_enrollment_code(length=6):
    characters = string.ascii_uppercase + string.digits

    while True:
        code = "".join(secrets.choice(characters) for _ in range(length))
        if not Batch.objects.filter(enrollment_code=code).exists():
            return code

class Batch(models.Model):
    course = models.ForeignKey(
        "courses.Course",
        on_delete=models.CASCADE,
        related_name="classrooms"
    )

    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="courses",
        limit_choices_to={"role": "TEACHER"}
    )
    id=models.UUIDField(primary_key=True,editable=False,default=uuid.uuid4)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    enrollment_code = models.CharField(
        max_length=20,
        unique=True,
        blank=True
    )

    max_students = models.PositiveIntegerField(default=30)
    allow_self_enrollment = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)

    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.teacher and self.teacher.role != "TEACHER":
            raise ValidationError("Only teachers can create classrooms.")

        if self.end_date and self.start_date > self.end_date:
            raise ValidationError("Start date cannot be after end date.")
    def save(self, *args, **kwargs):
        if not self.enrollment_code:
            self.enrollment_code = generate_enrollment_code()

        self.clean()
        super().save(*args, **kwargs)
    def __str__(self):
        return f"{self.name} - {self.course.title}"