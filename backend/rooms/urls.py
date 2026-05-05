from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoomViewSet, AmenityViewSet

router = DefaultRouter()
router.register(r"amenities", AmenityViewSet, basename="amenity")
router.register(r"", RoomViewSet, basename="room")

urlpatterns = [
    path("", include(router.urls)),
]