from rest_framework import serializers
from .models import HotelSettings


class HotelSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = HotelSettings
        fields = [
            "id", "hotel_name", "hotel_address", "hotel_phone", "hotel_email",
            "check_in_time", "check_out_time",
            "tax_rate", "cancellation_policy",
            "guest_email_template", "admin_email_template",
            "admin_email_address",
        ]