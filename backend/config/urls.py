from django.contrib import admin
from django.urls import path,include
from apps.users.views import AdminViewSet
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import(
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView
)
router=DefaultRouter()
router.register(r"auth",AdminViewSet,basename="auth")


urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/", include(router.urls)),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
