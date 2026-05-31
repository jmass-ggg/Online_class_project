from rest_framework.permissions import BasePermission, SAFE_METHODS


def has_role(request, role):
    user = getattr(request, "user", None)

    return bool(
        user
        and user.is_authenticated
        and getattr(user, "role", None) == role
        and user.is_active
    )


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return has_role(request, "ADMIN")


class IsTeacher(BasePermission):
    def has_permission(self, request, view):
        return has_role(request, "TEACHER")


class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return has_role(request, "STUDENT")


class IsAdminReadOnly(BasePermission):
    def has_permission(self, request, view):
        user = getattr(request, "user", None)

        if request.method in SAFE_METHODS:
            return bool(user and user.is_authenticated and user.is_active)

        return has_role(request, "ADMIN")


class IsTeacherCourseOwner(BasePermission):
    def has_permission(self, request, view):
        user = getattr(request, "user", None)

        if request.method in SAFE_METHODS:
            return bool(user and user.is_authenticated and user.is_active)

        return has_role(request, "TEACHER")

    def has_object_permission(self, request, view, obj):
        user = getattr(request, "user", None)

        if not user or not user.is_authenticated or not user.is_active:
            return False

        if request.method in SAFE_METHODS:
            return True

        owner = (
            getattr(obj, "created_by", None)
            or getattr(obj, "upload_by", None)
            or getattr(obj, "teacher", None)
        )

        return owner == user