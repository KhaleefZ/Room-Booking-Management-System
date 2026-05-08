from django.db import models
from django.utils import timezone


class Amenity(models.Model):
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, blank=True)

    class Meta:
        verbose_name_plural = "amenities"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Room(models.Model):
    class RoomType(models.TextChoices):
        STANDARD = "Standard", "Standard"

    class Status(models.TextChoices):
        AVAILABLE = "Available", "Available"
        OCCUPIED = "Occupied", "Occupied"
        CLEANING = "Cleaning", "Cleaning"
        MAINTENANCE = "Maintenance", "Maintenance"
        BLOCKED = "Blocked", "Blocked"

    room_number = models.CharField(max_length=20, unique=True)
    room_type = models.CharField(max_length=20, choices=RoomType.choices, default=RoomType.STANDARD)
    floor = models.PositiveIntegerField(default=1)
    bed_config = models.CharField(max_length=50)
    capacity = models.PositiveIntegerField(default=2)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    extra_bed = models.IntegerField(default=0, choices=[(0, 'No'), (1, 'Yes')])
    address = models.TextField(help_text="Compulsory physical address of the room/unit")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE)
    description = models.TextField(blank=True)
    amenities = models.ManyToManyField(Amenity, blank=True, related_name="rooms")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["room_number"]

    def __str__(self):
        return f"Room {self.room_number} ({self.room_type})"

    def get_unavailable_dates(self, year, month):
        import calendar
        from datetime import date, timedelta

        month_start = date(year, month, 1)
        month_end = date(year, month, calendar.monthrange(year, month)[1])

        bookings = self.bookings.filter(
            status__in=["Pending", "Confirmed", "CheckedIn"],
            check_in__lte=month_end,
            check_out__gt=month_start,
        )

        blocked = set()
        for booking in bookings:
            d = max(booking.check_in, month_start)
            end = min(booking.check_out, month_end + timedelta(days=1))
            while d < end:
                blocked.add(d.isoformat())
                d += timedelta(days=1)

        return sorted(blocked)


class RoomPhoto(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="photos")
    cloudinary_url = models.URLField()
    public_id = models.CharField(max_length=255)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"Photo for {self.room}"

    def save(self, *args, **kwargs):
        if self.is_primary:
            RoomPhoto.objects.filter(room=self.room, is_primary=True).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)