import uuid

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError("Username is required")

        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault("role", User.RoleType.ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if not extra_fields.get("email"):
            raise ValueError("Admin must have an email")

        return self.create_user(username, password, **extra_fields)


class User(AbstractUser):
    class RoleType(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        TEACHER = "TEACHER", "Teacher"
        STUDENT = "STUDENT", "Student"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    username = models.CharField(max_length=100, unique=True)

    first_name = None
    last_name = None

    full_name = models.CharField(max_length=100)

    
    email = models.EmailField(
        max_length=100,
        unique=True,
        null=True,
        blank=True
    )

    role = models.CharField(
        max_length=20,
        choices=RoleType.choices
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email", "full_name"]

    objects = UserManager()

    def __str__(self):
        return f"{self.full_name} - {self.role}"


class StudentProfile(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="student_profile"
    )

    phone = models.CharField(max_length=50)
    address = models.TextField()
    date_of_birth = models.DateField()

    guardian_name = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Student Profile - {self.user.full_name}"


class TeacherProfile(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="teacher_profile"
    )

    phone = models.CharField(max_length=50)
    qualification = models.CharField(max_length=150)
    experience = models.PositiveIntegerField(help_text="Experience in years")
    bio = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Teacher Profile - {self.user.full_name}"