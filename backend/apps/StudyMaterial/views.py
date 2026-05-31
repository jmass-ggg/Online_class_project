from django.db import transaction

from rest_framework import viewsets
from rest_framework.parsers import FormParser, MultiPartParser

from drf_spectacular.utils import extend_schema, extend_schema_view

from .serializer import StudyMaterialserializer, SubmissionSerializers
from .models import StudyMaterial, Submission
from .tasks import compress_uploaded_file

from apps.users.permissions import IsTeacherCourseOwner, IsStudent


@extend_schema_view(
    list=extend_schema(
        tags=["Study Material"],
        summary="List Study Materials",
        description="Retrieve all study materials.",
    ),
    retrieve=extend_schema(
        tags=["Study Material"],
        summary="Retrieve Study Material",
        description="Retrieve single study material with files.",
    ),
    create=extend_schema(
        tags=["Study Material"],
        summary="Create Study Material",
        description="Create study material with multiple file uploads.",
        request=StudyMaterialserializer,
        responses={201: StudyMaterialserializer},
    ),
    update=extend_schema(
        tags=["Study Material"],
        summary="Update Study Material",
    ),
    partial_update=extend_schema(
        tags=["Study Material"],
        summary="Partial Update Study Material",
    ),
    destroy=extend_schema(
        tags=["Study Material"],
        summary="Delete Study Material",
    ),
)
class StudyMaterialViewSet(viewsets.ModelViewSet):
    queryset = StudyMaterial.objects.all()
    serializer_class = StudyMaterialserializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsTeacherCourseOwner]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return StudyMaterial.objects.none()

        user = self.request.user

        if not user.is_authenticated:
            return StudyMaterial.objects.none()

        queryset = (
            StudyMaterial.objects
            .select_related("classroom", "upload_by")
            .prefetch_related("images")
            .order_by("-upload_at")
        )

        classroom_id = self.request.query_params.get("classroom_id")
        role = getattr(user, "role", None)

        if role == "TEACHER":
            queryset = queryset.filter(upload_by=user)

        elif role == "STUDENT":
            queryset = queryset.filter(
                classroom__enrollments__student=user
            )

        else:
            return StudyMaterial.objects.none()

        if classroom_id:
            queryset = queryset.filter(classroom_id=classroom_id)

        return queryset.distinct()

    def perform_create(self, serializer):
        study_material = serializer.save(
            upload_by=self.request.user,
        )

        for attachment in study_material.images.all():
            transaction.on_commit(
                lambda model=attachment._meta.label, pk=str(attachment.pk): compress_uploaded_file.delay(
                    model,
                    pk,
                    "file",
                )
            )


class StudentSubmissionView(viewsets.ModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializers
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsStudent]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Submission.objects.none()

        user = self.request.user

        if not user.is_authenticated:
            return Submission.objects.none()

        queryset = (
            Submission.objects
            .select_related("assignment", "student")
            .order_by("-submitted_at")
        )

        role = getattr(user, "role", None)

        if role == "STUDENT":
            queryset = queryset.filter(student=user)

        elif role == "TEACHER":
            queryset = queryset.filter(
                assignment__upload_by=user
            )

        else:
            return Submission.objects.none()

        return queryset.distinct()

    def perform_create(self, serializer):
        submission = serializer.save(
            student=self.request.user,
        )

        if submission.submitted_file:
            transaction.on_commit(
                lambda model=submission._meta.label, pk=str(submission.pk): compress_uploaded_file.delay(
                    model,
                    pk,
                    "submitted_file",
                )
            )