from datetime import timedelta

from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from drf_spectacular.utils import extend_schema, extend_schema_view

from livekit import api

from .models import ClassSession, ClassSessionAttendance
from .serializer import (
    ClassSessionSerializer,
    ClassSessionCreateUpdateSerializer,
    ClassSessionAttendanceSerializer,
)


@extend_schema_view(
    list=extend_schema(
        tags=["ClassSession"],
        summary="List all class sessions",
        responses=ClassSessionSerializer(many=True),
    ),
    retrieve=extend_schema(
        tags=["ClassSession"],
        summary="Get class session by ID",
        responses=ClassSessionSerializer,
    ),
    create=extend_schema(
        tags=["ClassSession"],
        summary="Create live class session",
        request=ClassSessionCreateUpdateSerializer,
        responses=ClassSessionSerializer,
    ),
    update=extend_schema(
        tags=["ClassSession"],
        summary="Update class session",
        request=ClassSessionCreateUpdateSerializer,
        responses=ClassSessionSerializer,
    ),
    partial_update=extend_schema(
        tags=["ClassSession"],
        summary="Partially update class session",
        request=ClassSessionCreateUpdateSerializer,
        responses=ClassSessionSerializer,
    ),
    destroy=extend_schema(
        tags=["ClassSession"],
        summary="Delete class session",
    ),
)
class ClassSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    lookup_field = "id"

    queryset = ClassSession.objects.select_related(
        "classroom",
        "classroom__course",
        "teacher",
    ).all().order_by("-created_at")

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return ClassSessionCreateUpdateSerializer
        return ClassSessionSerializer

    def get_queryset(self):
        user = self.request.user

        queryset = ClassSession.objects.select_related(
            "classroom",
            "classroom__course",
            "teacher",
        ).all().order_by("-created_at")

        if user.role == "TEACHER":
            return queryset.filter(teacher=user)

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        response_serializer = ClassSessionSerializer(
            serializer.instance,
            context=self.get_serializer_context()
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=partial
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        response_serializer = ClassSessionSerializer(
            serializer.instance,
            context=self.get_serializer_context()
        )

        return Response(response_serializer.data)

    def perform_create(self, serializer):
        user = self.request.user
        classroom = serializer.validated_data["classroom"]

        if user.role != "TEACHER":
            raise PermissionDenied("Only teachers can create live class sessions.")

        if classroom.teacher != user:
            raise PermissionDenied("You can only create sessions for your own classroom.")

        serializer.save(teacher=user)

    def perform_update(self, serializer):
        session = self.get_object()
        user = self.request.user

        if user.role != "TEACHER":
            raise PermissionDenied("Only teachers can update live class sessions.")

        if session.teacher != user:
            raise PermissionDenied("Only the session owner can update this session.")

        classroom = serializer.validated_data.get("classroom", session.classroom)

        if classroom.teacher != user:
            raise PermissionDenied("You can only assign your own classroom.")

        serializer.save(teacher=user)

    def perform_destroy(self, instance):
        user = self.request.user

        if user.role != "TEACHER":
            raise PermissionDenied("Only teachers can delete live class sessions.")

        if instance.teacher != user:
            raise PermissionDenied("Only the session owner can delete this session.")

        instance.delete()

    def create_livekit_token(self, session, user):
        if not settings.LIVEKIT_API_KEY or not settings.LIVEKIT_API_SECRET:
            raise ValidationError(
                "LiveKit API key and secret are not configured in Django settings."
            )

        identity = f"user-{user.id}"

        participant_name = (
            getattr(user, "full_name", None)
            or getattr(user, "email", None)
            or str(user.id)
        )

        token = (
            api.AccessToken(
                settings.LIVEKIT_API_KEY,
                settings.LIVEKIT_API_SECRET,
            )
            .with_identity(identity)
            .with_name(participant_name)
            .with_ttl(timedelta(hours=2))
            .with_grants(
                api.VideoGrants(
                    room_join=True,
                    room=session.livekit_room_name,
                    can_publish=True,
                    can_subscribe=True,
                    can_publish_data=True,
                )
            )
            .to_jwt()
        )

        return token

    @action(detail=True, methods=["post"], url_path="start")
    def start(self, request, id=None):
        session = self.get_object()
        user = request.user

        if user.role != "TEACHER":
            raise PermissionDenied("Only teachers can start live class sessions.")

        if session.teacher != user:
            raise PermissionDenied("Only the session owner can start this session.")

        if session.status == ClassSession.Status.CANCELLED:
            raise ValidationError("Cancelled session cannot be started.")

        if session.status == ClassSession.Status.COMPLETED:
            raise ValidationError("Completed session cannot be started again.")

        session.status = ClassSession.Status.LIVE
        session.save()

        token = self.create_livekit_token(session, user)

        return Response(
            {
                "message": "Class session started.",
                "session": ClassSessionSerializer(session).data,
                "server_url": settings.LIVEKIT_URL,
                "participant_token": token,
                "room_name": session.livekit_room_name,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="join")
    def join(self, request, id=None):
        session = self.get_object()
        user = request.user

        if session.status != ClassSession.Status.LIVE:
            raise ValidationError("This class session is not live yet.")

        if user.role == "STUDENT":
            ClassSessionAttendance.objects.get_or_create(
                session=session,
                student=user,
            )

        elif user.role == "TEACHER":
            if session.teacher != user:
                raise PermissionDenied("Only the session teacher can join as teacher.")

        else:
            raise PermissionDenied("Only teachers and students can join live classes.")

        token = self.create_livekit_token(session, user)

        return Response(
            {
                "server_url": settings.LIVEKIT_URL,
                "participant_token": token,
                "room_name": session.livekit_room_name,
                "session": ClassSessionSerializer(session).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, id=None):
        session = self.get_object()
        user = request.user

        if user.role != "TEACHER":
            raise PermissionDenied("Only teachers can complete live class sessions.")

        if session.teacher != user:
            raise PermissionDenied("Only the session owner can complete this session.")

        session.status = ClassSession.Status.COMPLETED
        session.save()

        return Response(
            ClassSessionSerializer(session).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, id=None):
        session = self.get_object()
        user = request.user

        if user.role != "TEACHER":
            raise PermissionDenied("Only teachers can cancel live class sessions.")

        if session.teacher != user:
            raise PermissionDenied("Only the session owner can cancel this session.")

        session.status = ClassSession.Status.CANCELLED
        session.save()

        return Response(
            ClassSessionSerializer(session).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["get"], url_path="attendance")
    def attendance(self, request, id=None):
        session = self.get_object()
        user = request.user

        if user.role != "TEACHER":
            raise PermissionDenied("Only teachers can view attendance.")

        if session.teacher != user:
            raise PermissionDenied("Only the session owner can view attendance.")

        attendances = session.attendances.select_related("student").all()

        return Response(
            ClassSessionAttendanceSerializer(attendances, many=True).data,
            status=status.HTTP_200_OK,
        )