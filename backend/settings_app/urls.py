from django.urls import path
from .views import HotelSettingsView

urlpatterns = [
    path("", HotelSettingsView.as_view(), name="hotel_settings"),
]