from rest_framework import serializers
from .models import Batch

class BatchSerializer(serializers.ModelSerializer):
    teacher=serializers.StringRelatedField(read_only=True)
    course_title = serializers.CharField(source="course.title", read_only=True)
    class Meta:
        model=Batch
        fields=[
            "id",
            "course",
            "course_title",
            "teacher",
            "name",
            "description",
            "enrollment_code",
            "max_students",
            "allow_self_enrollment",
            "is_active",
            "start_date",
            "end_date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "teacher",
            "enrollment_code",
            "created_at",
            "updated_at",
        ]
        
class BatchCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model=Batch
        fields=[
            "name",
            "description",
            "enrollment_code",
            "max_students",
            "allow_self_enrollment",
            "is_active",
            "start_date",
            "end_date",
        ]