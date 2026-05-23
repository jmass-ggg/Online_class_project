from rest_framework import generics
from rest_framework.views import APIView
from rest_framework import status
from .serializers import JoinClassroomSerializer,EnrollmentListSerializer
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiResponse
from apps.users.permissions import IsStudent
from apps.enrollment.models import Enrollment

class JoinClassViewSet(APIView):
    @extend_schema(
        request=JoinClassroomSerializer,
        responses={
            201: OpenApiResponse(
                description="Successfully joined batch",
                response={
                    "type": "object",
                    "properties": {
                        "success": {"type": "boolean"},
                        "message": {"type": "string"},
                        "data": {
                            "type": "object",
                            "properties": {
                                "enrollment_id": {"type": "integer"},
                                "batch_id": {"type": "integer"},
                                "batch_name": {"type": "string"},
                                "status": {"type": "string"},
                            },
                        },
                    },
                },
            )
        },
        description="Join a batch using enrollment code",
        summary="Join Batch"
    )
    def post(self, request):
        serializer = JoinClassroomSerializer(
            data=request.data,
            context={"request": request}
        )

        serializer.is_valid(raise_exception=True)
        enrollment = serializer.save()

        return Response({
            "success": True,
            "message": "Successfully joined batch",
            "data": {
                "enrollment_id": enrollment.id,
                "batch_id": enrollment.batch.id,
                "batch_name": enrollment.batch.name,
                "status": enrollment.status,
            }
        }, status=status.HTTP_201_CREATED)
        
class MyClassroomView(generics.ListAPIView):
    permission_classes=[IsStudent]
    serializer_class=EnrollmentListSerializer
    
    def get_queryset(self):
        return Enrollment.objects.select_related(
            "batch",
            "batch__teacher",
            "batch__course",
        ).filter(
            student=self.request.user
        )