from rest_framework import viewsets
from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
    OpenApiParameter,
    OpenApiTypes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from apps.users.permissions import IsTeacherCourseOwner
from .serializers import BatchCreateSerializer, BatchSerializer
from .models import Batch


@extend_schema_view(
    list=extend_schema(
        tags=["Batch"],
        summary="List all batches",
        description="Get all batches",
        responses=BatchSerializer(many=True),
    ),

    retrieve=extend_schema(
        tags=["Batch"],
        summary="Get batch by ID",
        description="Retrieve a single batch using batch ID",
        responses=BatchSerializer,
    ),
    create=extend_schema(
         tags=["Batch"],
        summary="List course batches",
        description="List batches under a course.",
        parameters=[
            OpenApiParameter(
                 name="course_id",
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH,
                description="Course ID",
            )
        ],
            request=BatchCreateSerializer,
            responses=BatchSerializer
    )
)
class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all().order_by("-created_at")
    permission_classes = [IsTeacherCourseOwner,IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return BatchCreateSerializer
        return BatchSerializer

    def perform_create(self, serializer):
        user = self.request.user
        course = serializer.validated_data["course"]

        if user.role != "TEACHER":
            raise PermissionDenied("Only teachers can create batches.")

        if course.teacher != user:
            raise PermissionDenied("You can only create batches for your own courses.")

        serializer.save(teacher=user)

    def perform_update(self, serializer):
        batch = self.get_object()

        if batch.teacher != self.request.user:
            raise PermissionDenied("Only the batch owner can update this batch.")

        serializer.save()

    def perform_destroy(self, instance):
        if instance.teacher != self.request.user:
            raise PermissionDenied("Only the batch owner can delete this batch.")

        instance.delete()