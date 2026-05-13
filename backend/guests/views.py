from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from .models import Guest
from .serializers import GuestSerializer, GuestListSerializer


class GuestViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ["full_name", "email", "phone"]
    ordering_fields = ["created_at", "full_name"]

    def get_serializer_class(self):
        if self.action == "list":
            return GuestListSerializer
        return GuestSerializer

    def get_queryset(self):
        return Guest.objects.prefetch_related("bookings__room").all()