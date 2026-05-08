from django.contrib import admin
from .models import PromoCode


@admin.register(PromoCode)
class PromoCodeAdmin(admin.ModelAdmin):
    list_display = ["code", "discount_type", "discount_value", "expiry_date", "times_used", "usage_limit", "is_active"]
    list_filter = ["discount_type", "is_active"]