from django.contrib import admin
from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ["reference", "room", "guest", "guest_count", "check_in", "check_out", "status", "total_amount"]
    list_filter = ["status", "check_in"]
    search_fields = ["reference", "guest__email", "guest__full_name"]
    raw_id_fields = ["room", "guest", "promo_code"]
    readonly_fields = ["reference", "created_at", "updated_at", "expires_at"]
    
    fieldsets = (
        ("Core Information", {
            "fields": ("reference", "status", "room", "guest", "guest_count")
        }),
        ("Dates & Stay", {
            "fields": ("check_in", "check_out", "nights", "extra_bed")
        }),
        ("Financials", {
            "fields": ("base_amount", "discount_amount", "tax_amount", "total_amount", "promo_code")
        }),
        ("Payment Details", {
            "fields": ("razorpay_order_id", "payment_id", "expires_at")
        }),
        ("Others", {
            "fields": ("special_requests", "created_at", "updated_at")
        }),
    )