from .models import Course
from rest_framework import serializers

class CourseSerializer(serializers.Serializer):
    class Meta:
        model=Course
        fields = "__all__"
    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user if request else None

        return Course.objects.create(created_by=user, **validated_data)