import uuid
from django.db import models


class Course(models.Model):
    
    class Level(models.TextChoices):
        BEGINNER = "BEGINNER", "Beginner"
        INTERMEDIATE = "INTERMEDIATE", "Intermediate"
        ADVANCED = "ADVANCED", "Advanced"
        
    class Category(models.TextChoices):
        PROGRAMMING = "PROGRAMMING", "Programming"
        DESIGN = "DESIGN", "Design"
        BUSINESS = "BUSINESS", "Business"
        MARKETING = "MARKETING", "Marketing"
        DATA_SCIENCE = "DATA_SCIENCE", "Data Science"
        LANGUAGE = "LANGUAGE", "Language"
        OTHER = "OTHER", "Other"
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    title = models.CharField(max_length=255)
    description = models.TextField()

    category = models.CharField(
        max_length=50,
        choices=Category.choices,
        default=Category.OTHER
    )
    level = models.CharField(max_length=20, choices=Level.choices)

    duration_weeks = models.PositiveIntegerField()

    is_active = models.BooleanField(default=True)

    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_courses"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
    class Meta:
        indexes = [
            models.Index(fields=["category"]),
            models.Index(fields=["level"]),
            models.Index(fields=["is_active"]),
            models.Index(fields=["category", "level"]),
        ]