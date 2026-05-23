from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from drf_spectacular.utils import extend_schema, extend_schema_view

from .serializers import BatchCreateSerializer, BatchSerializer
from .models import Batch


@extend_schema_view(
    list=extend_schema(
        tags=["Batch"],
        summary="List all batches",
        description="Get all batches.",
        responses=BatchSerializer(many=True),
    ),
    retrieve=extend_schema(
        tags=["Batch"],
        summary="Get batch by ID",
        description="Retrieve a single batch using batch ID.",
        responses=BatchSerializer,
    ),
    create=extend_schema(
        tags=["Batch"],
        summary="Create batch",
        description="Teacher creates a batch.",
        request=BatchCreateSerializer,
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
    ),
)
class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.select_related("course", "teacher").all().order_by("-created_at")
    permission_classes = [IsAuthenticated]

    lookup_field = "id"
    lookup_url_kwarg = "id"

    def get_queryset(self):
        user=self.request.user
        
        queryset=Batch.objects.select_related("course","teacher").order_by("-created_at")
        if user.role == "TEACHER":
            queryset=queryset.filter(teacher=user)
            
        course_id = self.request.query_params.get("course")
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset
        
        
    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return BatchCreateSerializer
        return BatchSerializer

    def perform_create(self, serializer):
        user = self.request.user

        if user.role != "TEACHER":
            raise PermissionDenied("Only teachers can create batches.")
        course=serializer.validated_data["course"]
        if course.created_by != user:
            raise PermissionDenied("You can only create batches for your own course.")
        serializer.save(teacher=user)

    def perform_update(self, serializer):
        batch = self.get_object()
        user = self.request.user

        if user.role != "TEACHER":
            raise PermissionDenied("Only teachers can update batches.")

        if batch.teacher != user:
            raise PermissionDenied("Only the batch owner can update this batch.")
        course=serializer.validated_data["course"]
        if course.created_by != user:
            raise PermissionDenied("You can only create batches for your own course.")
        serializer.save(teacher=user)

    def perform_destroy(self, instance):
        user = self.request.user

        if user.role != "TEACHER":
            raise PermissionDenied("Only teachers can delete batches.")

        if instance.teacher != user:
            raise PermissionDenied("Only the batch owner can delete this batch.")

        instance.delete()
        
        
        
        