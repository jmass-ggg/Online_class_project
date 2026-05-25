from django.db import transaction
from rest_framework import serializers

from .models import StudyMaterial, StudyMaterialImages


class StudyMaterialImageserializer(serializers.ModelSerializer):
    class Meta:
        model = StudyMaterialImages
        fields = ["id", "image"]


class StudyMaterialserializer(serializers.ModelSerializer):
    images = StudyMaterialImageserializer(
        many=True,
        read_only=True
    )

    uploaded_images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = StudyMaterial
        fields = [
            "id",
            "classroom",
            "upload_by",
            "title",
            "description",
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
            StudyMaterialImages.objects.create(
                study_material=study_material,
                image=img
            )

        return study_material