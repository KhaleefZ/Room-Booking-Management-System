from rest_framework import serializers
from .models import Guest


class GuestListSerializer(serializers.ModelSerializer):
    total_bookings = serializers.SerializerMethodField()

    class Meta:
        model = Guest
        fields = ["id", "full_name", "email", "phone", "id_type", "id_number", "created_at", "total_bookings"]

    def get_total_bookings(self, obj):
        return obj.bookings.count()


class GuestSerializer(serializers.ModelSerializer):
    total_bookings = serializers.SerializerMethodField()
    booking_history = serializers.SerializerMethodField()

    class Meta:
        model = Guest
        fields = [
            "id", "full_name", "email", "phone",
            "id_type", "id_number", "address", "extra_bed", "special_requests",
            "created_at", "total_bookings", "booking_history",
        ]

    def get_total_bookings(self, obj):
        return obj.bookings.count()

    def get_booking_history(self, obj):
        from bookings.serializers import BookingListSerializer
        return BookingListSerializer(
            obj.bookings.select_related("room").all(), many=True
        ).data