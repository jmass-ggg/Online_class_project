from django.db import transaction
from rest_framework import serializers

from .models import StudyMaterial, StudyMaterialAttachment,Submission


class StudyMaterialImageserializer(serializers.ModelSerializer):
    class Meta:
        model = StudyMaterialAttachment
        fields = ["id", "file"]


class StudyMaterialserializer(serializers.ModelSerializer):
    images = StudyMaterialImageserializer(
        many=True,
        read_only=True
    )

    uploaded_images = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = StudyMaterial
        fields = [
            "id",
            "classroom",
            "upload_by",
            "upload_at",
            "images",
            "uploaded_images",
        ]
        read_only_fields = ["upload_by", "upload_at"]

    def validate(self, attrs):
        request = self.context.get("request")

        if request and request.method == "POST":
            if not attrs.get("uploaded_images"):
                raise serializers.ValidationError({
                    "uploaded_images": "Please upload at least one image."
                })

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        images = validated_data.pop("uploaded_images", [])

        study_material = StudyMaterial.objects.create(**validated_data)

        for img in images:
            StudyMaterialAttachment.objects.create(
                study_material=study_material,
                file=img
            )

        return study_material
    
class SubmissionSerializers(serializers.ModelSerializer):
    student_name=serializers.CharField(
        source="student.full_name",
        read_only=True
    )
    class Meta:
        model = Submission
        fields = [
            "id",
            "assignment",
            "student",
            "student_name",
            "submitted_file",
            "submitted_at",
        ]

        read_only_fields = [
            "id",
            "student",
            "submitted_at",
        ]