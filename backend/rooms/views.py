import cloudinary.uploader
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Room, RoomPhoto, Amenity
from .serializers import (
    RoomListSerializer, RoomDetailSerializer,
    RoomWriteSerializer, RoomPhotoSerializer, AmenitySerializer,
)


class AmenityViewSet(viewsets.ModelViewSet):
    queryset = Amenity.objects.all()
    serializer_class = AmenitySerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsAuthenticated()]


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.prefetch_related("photos", "amenities").all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["room_type", "status", "floor", "capacity"]
    search_fields = ["room_number", "room_type", "bed_config"]
    ordering_fields = ["base_price", "room_number", "floor"]

    def get_serializer_class(self):
        if self.action == "list":
            return RoomListSerializer
        if self.action in ["create", "update", "partial_update"]:
            return RoomWriteSerializer
        return RoomDetailSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve", "availability"]:
            return [AllowAny()]
        return [IsAuthenticated()]

    @action(detail=True, methods=["patch"], permission_classes=[IsAuthenticated])
    def update_status(self, request, pk=None):
        room = self.get_object()
        new_status = request.data.get("status")
        if new_status not in Room.Status.values:
            return Response(
                {"error": "Invalid status."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        room.status = new_status
        room.save(update_fields=["status"])
        return Response({"status": room.status})

    @action(detail=True, methods=["get"], permission_classes=[AllowAny])
    def availability(self, request, pk=None):
        from django.utils import timezone
        room = self.get_object()
        now = timezone.now()
        year = int(request.query_params.get("year", now.year))
        month = int(request.query_params.get("month", now.month))
        unavailable = room.get_unavailable_dates(year, month)
        return Response({"unavailable_dates": unavailable, "year": year, "month": month})

    @action(
        detail=True, methods=["post"],
        permission_classes=[IsAuthenticated],
        parser_classes=[MultiPartParser, FormParser],
        url_path="photos",
    )
    def upload_photo(self, request, pk=None):
        room = self.get_object()
        file = request.FILES.get("image")
        if not file:
            return Response({"error": "No image file provided."}, status=status.HTTP_400_BAD_REQUEST)

        result = cloudinary.uploader.upload(
            file,
            folder=f"rbms/rooms/{room.room_number}",
            resource_type="image",
        )
        photo = RoomPhoto.objects.create(
            room=room,
            cloudinary_url=result["secure_url"],
            public_id=result["public_id"],
            is_primary=not room.photos.exists(),
            order=room.photos.count(),
        )
        return Response(RoomPhotoSerializer(photo).data, status=status.HTTP_201_CREATED)

    @action(
        detail=True, methods=["delete"],
        permission_classes=[IsAuthenticated],
        url_path="photos/(?P<photo_id>[0-9]+)",
    )
    def delete_photo(self, request, pk=None, photo_id=None):
        room = self.get_object()
        try:
            photo = room.photos.get(pk=photo_id)
        except RoomPhoto.DoesNotExist:
            return Response({"error": "Photo not found."}, status=status.HTTP_404_NOT_FOUND)
        cloudinary.uploader.destroy(photo.public_id)
        photo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)