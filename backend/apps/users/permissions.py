from rest_framework.permissions import BasePermission

class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and  getattr(request.user,"role",None) == "ADMIN"
            and request.user.is_active
        )