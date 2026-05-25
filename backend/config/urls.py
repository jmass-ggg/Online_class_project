from django.contrib import admin
from django.urls import path,include
from apps.users.views import (TeacherRegisterViewSet,
             StudentRegisterViewSet,   AuthViewSet              
                              )
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import(
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView
)
from apps.courses.views import CourseViewSet
from apps.batch.views import BatchViewSet
from apps.class_sessions.views import ClassSessionViewSet
from apps.StudyMaterial.views import StudyMaterialViewSet
router=DefaultRouter()
router.register(
    r"auth/teacher",
    TeacherRegisterViewSet,
    basename="teacher-auth"
)

router.register(
    r"auth/student",
    StudentRegisterViewSet,
    basename="student-auth"
)

router.register(
    r"auth",
    AuthViewSet,
    basename="auth"
)

router.register(
    r"Course",
    CourseViewSet,
    basename="Course"
)
router.register(
     r"Batch",
    BatchViewSet,
    basename="Batch"
)
router.register(
    r"ClassSession",
    ClassSessionViewSet,
    basename="ClassSession"
)
router.register(
    r"StudyMaterial",
    StudyMaterialViewSet,
    basename="StudyMaterial"
)
urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/", include(router.urls)),
     path("api/enrollment/", include("apps.enrollment.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
