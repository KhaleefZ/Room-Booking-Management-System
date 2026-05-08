import uuid
from decimal import Decimal
from django.db import models
from django.utils import timezone


from .invoice_model import Invoice

class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = "Pending", "Pending"
        CONFIRMED = "Confirmed", "Confirmed"
        CHECKED_IN = "CheckedIn", "Checked In"
        CHECKED_OUT = "CheckedOut", "Checked Out"
        CANCELLED = "Cancelled", "Cancelled"

    reference = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    room = models.ForeignKey(
        "rooms.Room", on_delete=models.PROTECT, related_name="bookings"
    )
    guest = models.ForeignKey(
        "guests.Guest", on_delete=models.PROTECT, related_name="bookings"
    )
    check_in = models.DateField()
    check_out = models.DateField()
    nights = models.PositiveIntegerField()
    base_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    promo_code = models.ForeignKey(
        "promos.PromoCode", null=True, blank=True, on_delete=models.SET_NULL
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    razorpay_order_id = models.CharField(max_length=100, blank=True)
    payment_id = models.CharField(max_length=100, blank=True)
    extra_bed = models.BooleanField(default=False)
    guest_count = models.PositiveIntegerField(
        default=1, 
        help_text="Number of guests staying in the room (for admin records)"
    )
    expires_at = models.DateTimeField(null=True, blank=True)
    special_requests = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Booking {self.reference} — {self.room} ({self.guest})"

    def save(self, *args, **kwargs):
        if not self.pk and self.status == self.Status.PENDING:
            self.expires_at = timezone.now() + timezone.timedelta(minutes=15)
        super().save(*args, **kwargs)

    @classmethod
    def has_conflict(cls, room_id, check_in, check_out, exclude_id=None):
        qs = cls.objects.filter(
            room_id=room_id,
            status__in=[cls.Status.PENDING, cls.Status.CONFIRMED, cls.Status.CHECKED_IN],
            check_in__lt=check_out,
            check_out__gt=check_in,
        )
        if exclude_id:
            qs = qs.exclude(pk=exclude_id)
        return qs.exists()

    @classmethod
    def calculate_price(cls, room, check_in, check_out, promo=None, extra_bed=False):
        from settings_app.models import HotelSettings

        nights = (check_out - check_in).days
        base_amount = room.base_price * nights
        
        if extra_bed:
            base_amount += Decimal("500.00") * nights

        discount_amount = Decimal("0")
        if promo and promo.is_valid():
            discount_amount = promo.apply(base_amount)

        settings = HotelSettings.get_settings()
        taxable = base_amount - discount_amount
        tax_amount = (taxable * settings.tax_rate / 100).quantize(Decimal("0.01"))
        total_amount = taxable + tax_amount

        return {
            "nights": nights,
            "base_amount": base_amount,
            "discount_amount": discount_amount,
            "tax_amount": tax_amount,
            "total_amount": total_amount,
        }