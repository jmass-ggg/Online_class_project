from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import Course
from .serializer import CourseSerializer
from apps.users.permissions import IsAdmin


@extend_schema_view(
    list=extend_schema(
        tags=["Courses"],
        summary="List all courses",
        description="Retrieve all available courses ordered by latest created.",
        responses=CourseSerializer
    ),
    create=extend_schema(
        tags=["Courses"],
        summary="Create a course",
        description="Admin creates a new course. `created_by` is auto-assigned.",
        request=CourseSerializer,
        responses=CourseSerializer
    ),
    retrieve=extend_schema(
        tags=["Courses"],
        summary="Get course detail",
        responses=CourseSerializer
    ),
    update=extend_schema(
        tags=["Courses"],
        summary="Update course",
        request=CourseSerializer,
        responses=CourseSerializer
    ),
    partial_update=extend_schema(
        tags=["Courses"],
        summary="Partially update course",
        request=CourseSerializer,
        responses=CourseSerializer
    ),
    destroy=extend_schema(
        tags=["Courses"],
        summary="Delete course",
        description="Deletes a course permanently.",
        responses=None
    ),
)
class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all().order_by("-created_at")
    serializer_class = CourseSerializer

    permission_classes = [IsAuthenticated, IsAdmin]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)