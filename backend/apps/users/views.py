from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action


from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
    OpenApiResponse,
)

from .permissions import IsAdmin
from .serializer import (
    AdminLoginSerializers,
    AdminRegisterSerializer,
    AdminMeSerializer,
    CreateTeacherSerializer,
    CreateStudentSerializer,
    StudentManagementSerializer,
    TeacherManagementSerializer,
)
from .models import StudentProfile, User, TeacherProfile


class AdminViewSet(viewsets.ViewSet):
    @extend_schema(
        request=AdminRegisterSerializer,
        responses=AdminRegisterSerializer
    )
    @action(
        detail=False,
        methods=["post"],
        permission_classes=[AllowAny],
    )
    def register(self, request):
        admin_exists = User.objects.filter(role=User.RoleType.ADMIN).exists()

        if admin_exists:
            return Response(
                {
                    "detail": "Admin registration is closed. Ask an existing admin to create another admin."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = AdminRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            AdminRegisterSerializer(user).data,
            status=status.HTTP_201_CREATED
        )

    @extend_schema(
        request=AdminLoginSerializers,
        responses=AdminLoginSerializers
    )
    @action(
        detail=False,
        methods=["post"],
        permission_classes=[AllowAny],
    )
    def login(self, request):
        serializer = AdminLoginSerializers(data=request.data)
        serializer.is_valid(raise_exception=True)

        return Response(
            serializer.validated_data,
            status=status.HTTP_200_OK
        )

    @extend_schema(responses=AdminMeSerializer)
    @action(
        detail=False,
        methods=["get"],
        permission_classes=[IsAuthenticated, IsAdmin],
    )
    def me(self, request):
        serializer = AdminMeSerializer(request.user)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

@extend_schema_view(
    list=extend_schema(
        responses={200: StudentManagementSerializer},
        tags=["Admin Students"],
        summary="List students",
    ),
    create=extend_schema(
        request=CreateStudentSerializer,
        responses={201: CreateStudentSerializer},
        tags=["Admin Students"],
        summary="Create student",
        description="Admin creates a student account. Username and password are generated automatically.",
    ),
    retrieve=extend_schema(
        responses={200: StudentManagementSerializer},
        tags=["Admin Students"],
        summary="Get student detail",
    ),
    update=extend_schema(
        request=StudentManagementSerializer,
        responses={200: StudentManagementSerializer},
        tags=["Admin Students"],
        summary="Update student",
    ),
    partial_update=extend_schema(
        request=StudentManagementSerializer,
        responses={200: StudentManagementSerializer},
        tags=["Admin Students"],
        summary="Partially update student",
    ),
    destroy=extend_schema(
        responses={204: OpenApiResponse(description="Student deleted successfully")},
        tags=["Admin Students"],
        summary="Delete student",
        description="Deletes both StudentProfile and linked User account.",
    ),
)
class StudentManagementViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        return StudentProfile.objects.select_related("user").filter(
            user__role=User.RoleType.STUDENT
        ).order_by("-created_at")

    def get_serializer_class(self):
        if self.action == "create":
            return CreateStudentSerializer

        return StudentManagementSerializer

    def perform_destroy(self, instance):
        instance.user.delete()

@extend_schema_view(
    list=extend_schema(
        responses={200: TeacherManagementSerializer},
        tags=["Admin Teachers"],
        summary="List teachers",
    ),
    create=extend_schema(
        request=CreateTeacherSerializer,
        responses={201: CreateTeacherSerializer},
        tags=["Admin Teachers"],
        summary="Create teacher",
        description="Admin creates a teacher account. Username and password are generated automatically.",
    ),
    retrieve=extend_schema(
        responses={200: TeacherManagementSerializer},
        tags=["Admin Teachers"],
        summary="Get teacher detail",
    ),
    update=extend_schema(
        request=TeacherManagementSerializer,
        responses={200: TeacherManagementSerializer},
        tags=["Admin Teachers"],
        summary="Update teacher",
    ),
    partial_update=extend_schema(
        request=TeacherManagementSerializer,
        responses={200: TeacherManagementSerializer},
        tags=["Admin Teachers"],
        summary="Partially update teacher",
    ),
    destroy=extend_schema(
        responses={204: OpenApiResponse(description="Teacher deleted successfully")},
        tags=["Admin Teachers"],
        summary="Delete teacher",
        description="Deletes both TeacherProfile and linked User account.",
    ),
)
class TeacherManagementViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        return TeacherProfile.objects.select_related("user").filter(
            user__role=User.RoleType.TEACHER
        ).order_by("-created_at")

    def get_serializer_class(self):
        if self.action == "create":
            return CreateTeacherSerializer

        return TeacherManagementSerializer

    def perform_destroy(self, instance):
        instance.user.delete()