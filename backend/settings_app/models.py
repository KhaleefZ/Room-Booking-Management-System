from django.db import models


class HotelSettings(models.Model):
    hotel_name = models.CharField(max_length=200, default="My Hotel")
    check_in_time = models.TimeField(default="14:00")
    check_out_time = models.TimeField(default="11:00")
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)
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
            "New Booking Alert!\n\n"
            "Reference: {{booking_reference}}\n"
            "Guest: {{guest_name}}\n"
            "Room: {{room_name}}\n"
            "Check-in: {{check_in}}\n"
            "Check-out: {{check_out}}\n"
            "Total: \u20b9{{total_amount}}"
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