from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/v1/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/v1/rooms/", include("rooms.urls")),
    path("api/v1/bookings/", include("bookings.urls")),
    path("api/v1/guests/", include("guests.urls")),
    path("api/v1/payments/", include("payments.urls")),
    path("api/v1/promos/", include("promos.urls")),
    path("api/v1/reports/", include("reports.urls")),
    path("api/v1/hotel-settings/", include("settings_app.urls")),
]