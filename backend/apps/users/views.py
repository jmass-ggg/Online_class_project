from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema

from rest_framework_simplejwt.tokens import RefreshToken

from .permissions import IsStudent, IsTeacher
from .serializer import (
    TeacherRegisterSerializer,
    StudentRegisterSerializer,
    LoginSerializer,
    UserSerializer,
    TeacherProfileSerializer,
    StudentProfileSerializer,
)


class TeacherRegisterViewSet(viewsets.ViewSet):
    @extend_schema(
        request=TeacherRegisterSerializer,
        responses=TeacherRegisterSerializer,
        tags=["Auth"]
    )
    @action(
        detail=False,
        methods=["post"],
        permission_classes=[AllowAny],
        url_path="register"
    )
    def register(self, request):
        serializer = TeacherRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            TeacherRegisterSerializer(user).data,
            status=status.HTTP_201_CREATED
        )


class StudentRegisterViewSet(viewsets.ViewSet):
    @extend_schema(
        request=StudentRegisterSerializer,
        responses=StudentRegisterSerializer,
        tags=["Auth"]
    )
    @action(
        detail=False,
        methods=["post"],
        permission_classes=[AllowAny],
        url_path="register"
    )
    def register(self, request):
        serializer = StudentRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            StudentRegisterSerializer(user).data,
            status=status.HTTP_201_CREATED
        )


class AuthViewSet(viewsets.ViewSet):
    @extend_schema(
        request=LoginSerializer,
        responses=LoginSerializer,
        tags=["Auth"]
    )
    @action(
        detail=False,
        methods=["post"],
        permission_classes=[AllowAny],
        url_path="login"
    )
    def login(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        refresh = serializer.validated_data["refresh"]
        access = serializer.validated_data["access"]
        user = serializer.validated_data["user"]

        response = Response(
            {
                "access": access,
                "user": user,
            },
            status=status.HTTP_200_OK
        )

        response.set_cookie(
            key="refresh_token",
            value=refresh,
            httponly=True,
            secure=False,
            samesite="Lax",
            max_age=7 * 24 * 60 * 60
        )

        return response

    @action(
        detail=False,
        methods=["post"],
        permission_classes=[AllowAny],
        url_path="refresh"
    )
    def refresh(self, request):
        refresh_token = request.COOKIES.get("refresh_token")

        if not refresh_token:
            return Response(
                {"detail": "Refresh token not found in cookie."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            refresh = RefreshToken(refresh_token)

            return Response(
                {
                    "access": str(refresh.access_token)
                },
                status=status.HTTP_200_OK
            )

        except Exception:
            return Response(
                {"detail": "Invalid refresh token."},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(
        detail=False,
        methods=["get"],
        permission_classes=[IsAuthenticated],
        url_path="me"
    )
    def me(self, request):
        serializer = UserSerializer(request.user)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    @extend_schema(
        responses=TeacherProfileSerializer,
        tags=["Auth"]
    )
    @action(
        detail=False,
        methods=["get"],
        permission_classes=[IsAuthenticated, IsTeacher],
        url_path="me/teacher"
    )
    def me_teacher(self, request):
        serializer = TeacherProfileSerializer(request.user.teacher_profile)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    @extend_schema(
        responses=StudentProfileSerializer,
        tags=["Auth"]
    )
    @action(
        detail=False,
        methods=["get"],
        permission_classes=[IsAuthenticated, IsStudent],
        url_path="me/student"
    )
    def me_student(self, request):
        serializer = StudentProfileSerializer(request.user.student_profile)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )