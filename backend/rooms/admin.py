from django.contrib import admin
from .models import Room, RoomPhoto, Amenity


class RoomPhotoInline(admin.TabularInline):
    model = RoomPhoto
    extra = 0


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ["room_number", "room_type", "floor", "capacity", "base_price", "status"]
    list_filter = ["room_type", "status", "floor"]
    search_fields = ["room_number"]
    filter_horizontal = ["amenities"]
    inlines = [RoomPhotoInline]


@admin.register(Amenity)
class AmenityAdmin(admin.ModelAdmin):
    list_display = ["name", "icon"]