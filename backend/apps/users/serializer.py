from django.contrib.auth import authenticate
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, TeacherProfile, StudentProfile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "full_name",
            "email",
            "role",
        ]


class TeacherProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = TeacherProfile
        fields = [
            "id",
            "user",
            "phone",
            "qualification",
            "experience",
            "bio",
            "created_at",
        ]


class StudentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = StudentProfile
        fields = [
            "id",
            "user",
            "phone",
            "address",
            "date_of_birth",
            "guardian_name",
            "created_at",
        ]


class TeacherRegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)

    phone = serializers.CharField(required=False, allow_blank=True)
    qualification = serializers.CharField(required=False, allow_blank=True)
    experience = serializers.IntegerField(required=False, default=0)
    bio = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        phone = validated_data.pop("phone", "")
        qualification = validated_data.pop("qualification", "")
        experience = validated_data.pop("experience", 0)
        bio = validated_data.pop("bio", "")

        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            full_name=validated_data["full_name"],
            role=User.RoleType.TEACHER,
            is_active=True,
        )

        TeacherProfile.objects.create(
            user=user,
            phone=phone,
            qualification=qualification,
            experience=experience,
            bio=bio,
        )

        return user

    def to_representation(self, instance):
        return {
            "message": "Teacher account created successfully.",
            "user": UserSerializer(instance).data,
        }


class StudentRegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)

    phone = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    guardian_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        phone = validated_data.pop("phone", "")
        address = validated_data.pop("address", "")
        date_of_birth = validated_data.pop("date_of_birth", None)
        guardian_name = validated_data.pop("guardian_name", None)

        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            full_name=validated_data["full_name"],
            role=User.RoleType.STUDENT,
            is_active=True,
        )

        StudentProfile.objects.create(
            user=user,
            phone=phone,
            address=address,
            date_of_birth=date_of_birth,
            guardian_name=guardian_name,
        )

        return user

    def to_representation(self, instance):
        return {
            "message": "Student account created successfully.",
            "user": UserSerializer(instance).data,
        }


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        user = authenticate(
            email=email,
            password=password
        )

        if user is None:
            raise serializers.ValidationError("Invalid email or password.")

        if not user.is_active:
            raise serializers.ValidationError("This account is inactive.")

        refresh = RefreshToken.for_user(user)

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UserSerializer(user).data,
        }