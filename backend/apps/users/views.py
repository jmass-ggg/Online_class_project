from rest_framework import generics,status,viewsets
from rest_framework.permissions import AllowAny,IsAuthenticated
from .permissions import IsAdminRole
from rest_framework.views import APIView    
from .serializer import(
    AdminLoginSerializers,AdminRegisterSerializer,AdminMeSerializer
)
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action

from rest_framework.response import Response
from django.contrib.auth import get_user_model

class AdminViewSet(viewsets.ViewSet):
    @extend_schema(request=AdminRegisterSerializer, responses=AdminRegisterSerializer)
    @action(
        detail=False,
        methods=["post"],
        permission_classes=[AllowAny],
    )
    def register(self,reuqest):
        serializer=AdminRegisterSerializer(data=self.request.data)
        serializer.is_valid(raise_exception=True)
        user=serializer.save()
        return Response(
            
                AdminRegisterSerializer(user).data,
                status=status.HTTP_201_CREATED
            
        )
    @extend_schema(request=AdminLoginSerializers, responses=AdminLoginSerializers)
    @action(
        detail=False,
        methods=["post"],
        permission_classes=[AllowAny],
        
    )
    def login(self,request):
        serializer=AdminLoginSerializers(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data,status=status.HTTP_200_OK)
    @extend_schema(responses=AdminMeSerializer)
    @action(
    detail=False,
    methods=["get"],
        permission_classes=[IsAuthenticated, IsAdminRole],
    )
    def me(self, request):

        serializer = AdminMeSerializer(request.user)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )