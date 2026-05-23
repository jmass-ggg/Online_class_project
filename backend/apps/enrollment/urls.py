from django.urls import path
from .views import JoinClassViewSet,MyClassroomView

urlpatterns = [
    path("join/",JoinClassViewSet.as_view(),name="join-classroom"),
    path("my-classrooms/", MyClassroomView.as_view(), name="my-classrooms"),
]
