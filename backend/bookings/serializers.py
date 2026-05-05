from rest_framework import serializers
from .models import Booking
from rooms.serializers import RoomListSerializer
from guests.serializers import GuestListSerializer


class BookingCreateSerializer(serializers.Serializer):
    room_id = serializers.IntegerField()
    check_in = serializers.DateField()
    check_out = serializers.DateField()
    full_name = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    id_type = serializers.ChoiceField(choices=["Aadhaar", "PAN", "Passport", "DrivingLicense"])
    id_number = serializers.CharField(max_length=50)
    special_requests = serializers.CharField(required=False, allow_blank=True, default="")
    guest_count = serializers.IntegerField(min_value=1, default=1)
    promo_code = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, data):
        import datetime
        from rooms.models import Room
        from promos.models import PromoCode

        try:
            room = Room.objects.get(pk=data["room_id"], status="Available")
        except Room.DoesNotExist:
            raise serializers.ValidationError({"room_id": "Room not found or unavailable."})

        check_in = data["check_in"]
        check_out = data["check_out"]
        today = datetime.date.today()

        if check_in < today:
            raise serializers.ValidationError({"check_in": "Check-in date cannot be in the past."})
        if check_out <= check_in:
            raise serializers.ValidationError({"check_out": "Check-out must be after check-in."})
        if data.get("guest_count", 1) > room.capacity:
            raise serializers.ValidationError(
                {"guest_count": f"Room capacity is {room.capacity} guests."}
            )
        if Booking.has_conflict(room.id, check_in, check_out):
            raise serializers.ValidationError(
                "This room is already booked for the selected dates."
            )

        promo = None
        promo_code_str = data.get("promo_code", "").strip().upper()
        if promo_code_str:
            try:
                promo = PromoCode.objects.get(code=promo_code_str)
                if not promo.is_valid():
                    raise serializers.ValidationError({"promo_code": "Promo code is not valid."})
            except PromoCode.DoesNotExist:
                raise serializers.ValidationError({"promo_code": "Promo code not found."})

        data["_room"] = room
        data["_promo"] = promo
        return data

    def create(self, validated_data):
        from guests.models import Guest

        room = validated_data["_room"]
        promo = validated_data["_promo"]

        guest, _ = Guest.objects.get_or_create(
            email=validated_data["email"],
            defaults={
                "full_name": validated_data["full_name"],
                "phone": validated_data["phone"],
                "id_type": validated_data["id_type"],
                "id_number": validated_data["id_number"],
            },
        )

        pricing = Booking.calculate_price(room, validated_data["check_in"], validated_data["check_out"], promo)

        booking = Booking.objects.create(
            room=room,
            guest=guest,
            check_in=validated_data["check_in"],
            check_out=validated_data["check_out"],
            nights=pricing["nights"],
            base_amount=pricing["base_amount"],
            discount_amount=pricing["discount_amount"],
            tax_amount=pricing["tax_amount"],
            total_amount=pricing["total_amount"],
            promo_code=promo,
            special_requests=validated_data.get("special_requests", ""),
            status=Booking.Status.PENDING,
        )

        if promo:
            promo.times_used += 1
            promo.save(update_fields=["times_used"])

        return booking


class BookingListSerializer(serializers.ModelSerializer):
    room_number = serializers.CharField(source="room.room_number", read_only=True)
    room_type = serializers.CharField(source="room.room_type", read_only=True)
    guest_name = serializers.CharField(source="guest.full_name", read_only=True)
    guest_email = serializers.CharField(source="guest.email", read_only=True)
    reference = serializers.UUIDField()

    class Meta:
        model = Booking
        fields = [
            "id", "reference", "room_number", "room_type",
            "guest_name", "guest_email", "check_in", "check_out",
            "nights", "total_amount", "status", "created_at",
        ]


class BookingDetailSerializer(serializers.ModelSerializer):
    room = RoomListSerializer(read_only=True)
    guest = GuestListSerializer(read_only=True)
    reference = serializers.UUIDField()
    promo_code_str = serializers.CharField(source="promo_code.code", read_only=True, default=None)

    class Meta:
        model = Booking
        fields = [
            "id", "reference", "room", "guest",
            "check_in", "check_out", "nights",
            "base_amount", "discount_amount", "tax_amount", "total_amount",
            "promo_code_str", "status",
            "razorpay_order_id", "payment_id",
            "special_requests", "expires_at",
            "created_at", "updated_at",
        ]


class BookingStatusUpdateSerializer(serializers.Serializer):
    VALID_TRANSITIONS = {
        "Pending": ["Confirmed", "Cancelled"],
        "Confirmed": ["CheckedIn", "Cancelled"],
        "CheckedIn": ["CheckedOut"],
        "CheckedOut": [],
        "Cancelled": [],
    }

    status = serializers.ChoiceField(choices=Booking.Status.choices)

    def validate_status(self, value):
        current = self.instance.status if self.instance else None
        allowed = self.VALID_TRANSITIONS.get(current, [])
        if value not in allowed:
            raise serializers.ValidationError(
                f"Cannot transition from '{current}' to '{value}'. Allowed: {allowed}"
            )
        return value

    def update(self, instance, validated_data):
        instance.status = validated_data["status"]
        instance.save(update_fields=["status", "updated_at"])
        return instance