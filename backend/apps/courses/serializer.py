from rest_framework import serializers
from .models import Course


class CourseSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "description",
            "category",
            "level",
            "duration_weeks",
            "is_active",
            "created_by",
        ]
        read_only_fields = ["id", "is_active", "created_by"]


class CourseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = [
            "title",
            "description",
            "category",
            "level",
            "duration_weeks",
        ]