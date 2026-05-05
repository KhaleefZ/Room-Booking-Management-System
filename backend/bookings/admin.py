from django.contrib import admin
from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ["reference", "room", "guest", "check_in", "check_out", "status", "total_amount"]
    list_filter = ["status", "check_in"]
    search_fields = ["reference", "guest__email", "guest__full_name"]
    raw_id_fields = ["room", "guest", "promo_code"]
    readonly_fields = ["reference", "created_at", "updated_at", "expires_at"]