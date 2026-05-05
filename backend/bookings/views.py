from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Booking
from .serializers import (
    BookingCreateSerializer, BookingListSerializer,
    BookingDetailSerializer, BookingStatusUpdateSerializer,
)


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.select_related("room", "guest", "promo_code").all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "room", "check_in", "check_out"]
    search_fields = ["guest__full_name", "guest__email", "reference"]
    ordering_fields = ["created_at", "check_in", "total_amount"]

    def get_serializer_class(self):
        if self.action == "create":
            return BookingCreateSerializer
        if self.action == "list":
            return BookingListSerializer
        if self.action == "update_status":
            return BookingStatusUpdateSerializer
        return BookingDetailSerializer

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        serializer = BookingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        return Response(
            BookingDetailSerializer(booking).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["patch"], permission_classes=[IsAuthenticated])
    def update_status(self, request, pk=None):  
        booking = self.get_object()
        serializer = BookingStatusUpdateSerializer(
            instance=booking, data=request.data
        )
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()

        # Fire confirmation emails when manually confirmed by admin
        if updated.status == "Confirmed":
            from payments.tasks import send_booking_confirmation, send_admin_notification
            send_booking_confirmation.delay(updated.id)
            send_admin_notification.delay(updated.id)

        return Response(BookingDetailSerializer(updated).data)