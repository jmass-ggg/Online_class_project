from django.db import transaction
from rest_framework import serializers

from .models import StudyMaterial, StudyMaterialAttachment, Submission


class StudyMaterialImageserializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = StudyMaterialAttachment
        fields = [
            "id",
            "file",
            "file_url",
            "compression_status",
            "original_size",
            "compressed_size",
            "mime_type",
            "compression_error",
        ]
        read_only_fields = [
            "id",
            "file_url",
            "compression_status",
            "original_size",
            "compressed_size",
            "mime_type",
            "compression_error",
        ]

    def get_file_url(self, obj):
        request = self.context.get("request")

        if not obj.file:
            return None

        url = obj.file.url
        return request.build_absolute_uri(url) if request else url


class StudyMaterialserializer(serializers.ModelSerializer):
    images = StudyMaterialImageserializer(
        many=True,
        read_only=True,
    )

    uploaded_images = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False,
        allow_empty=False,
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
        read_only_fields = [
            "id",
            "upload_by",
            "upload_at",
            "images",
        ]

    def validate(self, attrs):
        request = self.context.get("request")

        if request and request.method == "POST":
            if not attrs.get("uploaded_images"):
                raise serializers.ValidationError({
                    "uploaded_images": "Please upload at least one file."
                })

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        uploaded_files = validated_data.pop("uploaded_images", [])

        study_material = StudyMaterial.objects.create(**validated_data)

        for uploaded_file in uploaded_files:
            StudyMaterialAttachment.objects.create(
                study_material=study_material,
                file=uploaded_file,
                original_size=uploaded_file.size,
            )

        return study_material


class SubmissionSerializers(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="student.full_name",
        read_only=True,
    )

    submitted_file_url = serializers.SerializerMethodField()

    class Meta:
        model = Submission
        fields = [
            "id",
            "assignment",
            "student",
            "student_name",
            "submitted_file",
            "submitted_file_url",
            "compression_status",
            "original_size",
            "compressed_size",
            "mime_type",
            "compression_error",
            "submitted_at",
        ]

        read_only_fields = [
            "id",
            "student",
            "student_name",
            "submitted_file_url",
            "compression_status",
            "original_size",
            "compressed_size",
            "mime_type",
            "compression_error",
            "submitted_at",
        ]

    def get_submitted_file_url(self, obj):
        request = self.context.get("request")

        if not obj.submitted_file:
            return None

        url = obj.submitted_file.url
        return request.build_absolute_uri(url) if request else url