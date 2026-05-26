import datetime
from decimal import Decimal
from django.db import models


class HotelSettings(models.Model):
    hotel_name = models.CharField(max_length=200, default="Sri ASK Residency")
    hotel_address = models.TextField(default="1, Karaya Rayappa, Thevar Street, Sulur, Coimbatore - 641402")
    hotel_phone = models.CharField(max_length=20, default="+91 9444551122")
    hotel_email = models.EmailField(default="sriaskresidency@gmail.com")
    check_in_time = models.TimeField(default=datetime.time(12, 0))
    check_out_time = models.TimeField(default=datetime.time(12, 0))
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("18.00"))
    cancellation_policy = models.TextField(
        default="All cancellations are handled by the hotel team. Please contact us directly."
    )
    guest_email_template = models.TextField(
        default=(
            "Dear {{guest_name}},\n\n"
            "Thank you for booking with us!\n\n"
            "Booking Reference: {{booking_reference}}\n"
            "Room: {{room_name}}\n"
            "Check-in: {{check_in}}\n"
            "Check-out: {{check_out}}\n"
            "Total Amount: \u20b9{{total_amount}}\n\n"
            "We look forward to welcoming you.\n\n"
            "Warm regards,\nThe Hotel Team"
        )
    )
    admin_email_template = models.TextField(
        default=(
            "<div style='border-left: 4px solid #4f46e5; padding-left: 15px;'>\n"
            "<p style='font-size: 11px; font-weight: 800; color: #6366f1; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 5px;'>System Notification: New Core Transaction</p>\n"
            "<h2 style='font-size: 20px; font-weight: 900; color: #0f172a; margin-top: 0;'>New Reservation Logged</h2>\n"
            "<div style='margin-top: 20px;'>\n"
            "   <p><strong>REFERENCE ID:</strong> {{booking_reference}}</p>\n"
            "   <p><strong>PRINCIPAL GUEST:</strong> {{guest_name}}</p>\n"
            "   <p><strong>INVENTORY UNIT:</strong> {{room_name}}</p>\n"
            "   <p><strong>SCHEDULE:</strong> {{check_in}} to {{check_out}}</p>\n"
            "   <p><strong>VALUATION:</strong> \u20b9{{total_amount}}</p>\n"
            "</div>\n"
            "<p style='font-size: 12px; color: #64748b; margin-top: 25px; font-style: italic;'>Action Required: Verify transaction liquidity and update occupancy logs.</p>\n"
            "</div>"
        )
    )
    admin_email_address = models.EmailField(default="admin@hotel.com")

    class Meta:
        verbose_name = "Hotel Settings"
        verbose_name_plural = "Hotel Settings"

    def __str__(self):
        return "Hotel Settings"

    def save(self, *args, **kwargs):
        if not self.pk and HotelSettings.objects.exists():
            raise ValueError("Only one HotelSettings instance is allowed.")
        super().save(*args, **kwargs)

    @classmethod
    def get_settings(cls):
        settings, _ = cls.objects.get_or_create(pk=1)
        return settings