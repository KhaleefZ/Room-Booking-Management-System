from django.urls import path
from .views import HotelSettingsView, PublicHotelSettingsView

urlpatterns = [
    path("", HotelSettingsView.as_view(), name="hotel_settings"),
    path("public/", PublicHotelSettingsView.as_view(), name="public_hotel_settings"),
]