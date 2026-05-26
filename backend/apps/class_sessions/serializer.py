from rest_framework import serializers

from apps.batch.models import Batch
from .models import ClassSession, ClassSessionAttendance


class ClassSessionSerializer(serializers.ModelSerializer):
    teacher = serializers.StringRelatedField(read_only=True)
    classroom_name = serializers.CharField(source="classroom.name", read_only=True)
    
    class Meta:
        model = ClassSession
        fields = [
            "id",
            "classroom",
            "classroom_name",
  
            "teacher",
            "scheduled_date",
            "start_time",
            "end_time",
            "livekit_room_name",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "teacher",
            "livekit_room_name",
            "status",
            "created_at",
            "updated_at",
        ]


class ClassSessionCreateUpdateSerializer(serializers.ModelSerializer):
    classroom = serializers.PrimaryKeyRelatedField(
        queryset=Batch.objects.all()
    )

    class Meta:
        model = ClassSession
        fields = [
            "classroom",
            "scheduled_date",
            "start_time",
            "end_time",
        ]

    def validate(self, attrs):
        start_time = attrs.get("start_time")
        end_time = attrs.get("end_time")

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError(
                {"end_time": "End time must be after start time."}
            )

        return attrs


class ClassSessionAttendanceSerializer(serializers.ModelSerializer):
    student = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = ClassSessionAttendance
        fields = [
            "id",
            "session",
            "student",
            "joined_at",
            "left_at",
        ]
        read_only_fields = [
            "id",
            "session",
            "student",
            "joined_at",
            "left_at",
        ]