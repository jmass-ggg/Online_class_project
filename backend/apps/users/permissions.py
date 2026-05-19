from rest_framework.permissions import BasePermission,SAFE_METHODS


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "ADMIN"
            and request.user.is_active
        )


class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "STUDENT"
            and request.user.is_active
        )


class IsTeacher(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "TEACHER"
            and request.user.is_active
        )
        
class IsAdminReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated
        request(
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )