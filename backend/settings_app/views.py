from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import HotelSettings
from .serializers import HotelSettingsSerializer


class HotelSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        settings = HotelSettings.get_settings()
        return Response(HotelSettingsSerializer(settings).data)

    def put(self, request):
        settings = HotelSettings.get_settings()
        serializer = HotelSettingsSerializer(settings, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request):
        settings = HotelSettings.get_settings()
        serializer = HotelSettingsSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)