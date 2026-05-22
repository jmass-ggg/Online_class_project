from django.urls import path
from .views import JoinClassViewSet

urlpatterns = [
    path("join/",JoinClassViewSet.as_view(),name="join-classroom")
]
