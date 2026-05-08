from rest_framework import serializers
from .models import Room, RoomPhoto, Amenity


class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = ["id", "name", "icon"]


class RoomPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomPhoto
        fields = ["id", "cloudinary_url", "public_id", "is_primary", "order"]


class RoomListSerializer(serializers.ModelSerializer):
    primary_photo = serializers.SerializerMethodField()
    amenity_count = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = [
            "id", "room_number", "room_type", "floor",
            "bed_config", "capacity", "base_price", "status",
            "primary_photo", "amenity_count", "extra_bed", "address",
        ]

    def get_primary_photo(self, obj):
        photo = obj.photos.filter(is_primary=True).first() or obj.photos.first()
        return photo.cloudinary_url if photo else None

    def get_amenity_count(self, obj):
        return obj.amenities.count()


class RoomDetailSerializer(serializers.ModelSerializer):
    photos = RoomPhotoSerializer(many=True, read_only=True)
    amenities = AmenitySerializer(many=True, read_only=True)
    unavailable_dates = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = [
            "id", "room_number", "room_type", "floor",
            "bed_config", "capacity", "base_price", "status",
            "description", "photos", "amenities",
            "unavailable_dates", "created_at", "extra_bed", "address",
        ]

    def get_unavailable_dates(self, obj):
        from django.utils import timezone
        now = timezone.now()
        return obj.get_unavailable_dates(now.year, now.month)


class RoomWriteSerializer(serializers.ModelSerializer):
    amenity_ids = serializers.PrimaryKeyRelatedField(
        queryset=Amenity.objects.all(),
        many=True,
        source="amenities",
        required=False,
    )

    class Meta:
        model = Room
        fields = [
            "id", "room_number", "room_type", "floor",
            "bed_config", "capacity", "base_price", "status",
            "description", "amenity_ids", "extra_bed", "address",
        ]

    def create(self, validated_data):
        amenities = validated_data.pop("amenities", [])
        room = Room.objects.create(**validated_data)
        room.amenities.set(amenities)
        return room

    def update(self, instance, validated_data):
        amenities = validated_data.pop("amenities", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if amenities is not None:
            instance.amenities.set(amenities)
        return instance