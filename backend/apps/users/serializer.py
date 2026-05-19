import secrets
import string

from django.contrib.auth import get_user_model,authenticate
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import StudentProfile,User,TeacherProfile

User = get_user_model()


def get_token_for_user(user):
    refresh = RefreshToken.for_user(user)

    refresh["user_id"] = str(user.id)
    refresh["role"] = str(user.role)
    refresh["full_name"] = str(user.full_name)

    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }

def generate_password(length=12):
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return "".join(secrets.choice(alphabet) for _ in range(length))

def generate_unique_username(prefix):
    while True:
        username = f"{prefix}_{secrets.randbelow(900000) + 100000}"

        if not User.objects.filter(username=username).exists():
            return username


class AdminRegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        value = value.lower()

        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already exists")

        return value

    def validate(self, attrs):
        password = attrs.get("password")
        confirm_password = attrs.get("confirm_password")

        if password != confirm_password:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match"
            })

        validate_password(password)

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop("confirm_password")

        username = generate_unique_username("admin")

        user = User.objects.create_user(
            username=username,
            email=validated_data["email"],
            password=validated_data["password"],
            full_name=validated_data["full_name"],
            role=User.RoleType.ADMIN,
            is_staff=True,
            is_active=True,
        )

        return user

    def to_representation(self, instance):
        return {
            "message": "Admin account created successfully",
            "user": {
                "id": str(instance.id),
                "username": instance.username,
                "email": instance.email,
                "full_name": instance.full_name,
                "role": instance.role,
                "is_staff": instance.is_staff,
            }
        }

class TeacherStudentLoginSerializer(serializers.Serializer):
    username=serializers.CharField()
    password=serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        username=attrs.get("username")
        password=attrs.get("password")
        request = self.context.get("request")
        
        user=authenticate(
            request=request,
            username=username,
            password=password
        )
        if not user:
            raise serializers.ValidationError("Invalid username or password")

        if not user.is_active:
            raise serializers.ValidationError("This account is inactive")

        if user.role not in [User.RoleType.TEACHER, User.RoleType.STUDENT]:
            raise serializers.ValidationError("Admins must login using email")
        tokens=get_token_for_user(user)
        return {
            **tokens,
            "user": {
                "id": str(user.id),
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
            }
        }
        
       
class AdminLoginSerializers(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email").lower()
        password = attrs.get("password")

        try:
            user = User.objects.get(
                email__iexact=email,
                role=User.RoleType.ADMIN
            )
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email or password")

        if not user.check_password(password):
            raise serializers.ValidationError("Invalid email or password")

        if not user.is_active:
            raise serializers.ValidationError("This admin account is inactive")

        if not user.is_staff:
            raise serializers.ValidationError("This account is not allowed as admin")

        tokens = get_token_for_user(user)

        return {
            **tokens,
            "user": {
                "id": str(user.id),
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "is_staff": user.is_staff,
            }
        }


class AdminMeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "full_name",
            "email",
            "role",
            "is_staff",
        ]
        
class CreateTeacherSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=50)
    qualification = serializers.CharField(max_length=150)
    experience = serializers.IntegerField(min_value=0)
    bio = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True
    )
   
    
    @transaction.atomic
    def create(self, validated_data):
        full_name = validated_data.pop("full_name")
        phone = validated_data.pop("phone")
        qualification = validated_data.pop("qualification")
        experience = validated_data.pop("experience")
        bio = validated_data.pop("bio", None)
        
        username=generate_unique_username("tch")
        password=generate_password()
        
        user=User.objects.create_user(
            username=username,
            password=password,
            full_name=full_name,
            role=User.RoleType.TEACHER,
            is_active=True
        )
        
        teacher_profile=TeacherProfile.objects.create(
            user=user,
            phone=phone,
            qualification=qualification,
            experience=experience
            ,bio=bio
        )
        teacher_profile.generated_password = password
        return teacher_profile
    def to_representation(self, instance):
        return {
            "message": "Teacher account created successfully",
            "user_id":str(instance.user.id),
            "teacher_id": str(instance.id),
            "full_name": instance.full_name,
            "role": instance.role,
            "username": instance.username,
            "password": getattr(instance, "generated_password", None),
        }
        
        
        
        
class CreateStudentSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=50)
    address = serializers.CharField()
    date_of_birth = serializers.DateField()
    guardian_name = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
        allow_null=True
    )
    
    
    
    @transaction.atomic
    def create(self,validated_data):
        full_name=validated_data.pop("full_name")
        phone=validated_data.pop("phone")
        address=validated_data.pop("address")
        date_of_birth=validated_data.pop("date_of_birth")
        guardian_name=validated_data.pop("guardian_name",None)
        
        username = generate_unique_username("std")
        password = generate_password()
        
        user=User.objects.create_user(
            username=username,
            password=password,
            full_name=full_name,
            role=User.RoleType.STUDENT,
            is_active=True
        )
        
        student_profile=StudentProfile.objects.create(
            user=user,
            phone=phone,
            address=address,
            date_of_birth=date_of_birth,
            guardian_name=guardian_name
        )
        student_profile.generated_password = password
        return student_profile
    
    def to_representation(self, instance):
        return {
            "message": "Student account created successfully",
            "user_id": str(instance.user.id),
            "student_id": str(instance.id),
            "full_name": instance.user.full_name,
            "role": instance.user.role,
            "username": instance.user.username,
            "password": getattr(instance, "generated_password", None),
        }
        
class StudentManagementSerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    full_name = serializers.CharField(source="user.full_name", required=False)
    role = serializers.CharField(source="user.role", read_only=True)
    is_active = serializers.BooleanField(source="user.is_active", required=False)

    class Meta:
        model = StudentProfile
        fields = [
            "id",
            "user_id",
            "username",
            "full_name",
            "role",
            "is_active",
            "phone",
            "address",
            "date_of_birth",
            "guardian_name",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "user_id",
            "username",
            "role",
            "created_at",
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})

        for attr, value in user_data.items():
            setattr(instance.user, attr, value)

        instance.user.save()

        return super().update(instance, validated_data)


class TeacherManagementSerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    full_name = serializers.CharField(source="user.full_name", required=False)
    role = serializers.CharField(source="user.role", read_only=True)
    is_active = serializers.BooleanField(source="user.is_active", required=False)

    class Meta:
        model = TeacherProfile
        fields = [
            "id",
            "user_id",
            "username",
            "full_name",
            "role",
            "is_active",
            "phone",
            "qualification",
            "experience",
            "bio",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "user_id",
            "username",
            "role",
            "created_at",
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})

        for attr, value in user_data.items():
            setattr(instance.user, attr, value)

        instance.user.save()

        return super().update(instance, validated_data)