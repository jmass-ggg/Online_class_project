from rest_framework import viewsets
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from apps.users.permissions import IsTeacherCourseOwner
from .serializers import BatchCreateSerializer, BatchSerializer
from .models import Batch


@extend_schema_view(
    list=extend_schema(
        tags=["Batch"],
        summary="List all batches",
        description="Retrieve all available batches ordered by latest created.",
        responses=BatchSerializer,
    ),
    create=extend_schema(
        tags=["Batch"],
        summary="Create a batch",
        description="Teacher creates a new batch for their own course.",
        request=BatchCreateSerializer,
        responses=BatchSerializer,
    ),
    retrieve=extend_schema(
        tags=["Batch"],
        summary="Get batch detail",
        responses=BatchSerializer,
    ),
    update=extend_schema(
        tags=["Batch"],
        summary="Update batch",
        request=BatchCreateSerializer,
        responses=BatchSerializer,
    ),
    partial_update=extend_schema(
        tags=["Batch"],
        summary="Partially update batch",
        request=BatchCreateSerializer,
        responses=BatchSerializer,
    ),
    destroy=extend_schema(
        tags=["Batch"],
        summary="Delete batch",
        description="Only the batch owner teacher can delete this batch.",
        responses=None,
    ),
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