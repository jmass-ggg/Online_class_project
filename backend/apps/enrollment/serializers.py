from rest_framework import serializers
from apps.users.models import StudentProfile
from apps.users.models import User
from apps.batch.models import Batch
from .models import Enrollment
from apps.batch.serializers import BatchSerializer

class JoinClassroomSerializer(serializers.Serializer):
    join_code=serializers.CharField()
    
    def validate_join_code(self,value):
        try:
            batch=Batch.objects.get(enrollment_code=value)
        except Batch.DoesNotExist:
            raise serializers.ValidationError("Invalid Code")
        return batch
    def create(self, validated_data):
        request=self.context["request"]
        student=request.user.student_profile
        
        batch=validated_data["join_code"]
        enrollment,created=Enrollment.objects.get_or_create(
            student=student.user,
            batch=batch
        )
        if not created:
            raise serializers.ValidationError("Already enrolled in this classroom")

        return enrollment
    
class EnrollmentListSerializer(serializers.ModelSerializer):
    batch = BatchSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            "id",
            "batch",
            "status",
            "enrolled_at",
            "updated_at",
        ]