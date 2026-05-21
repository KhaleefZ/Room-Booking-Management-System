from rest_framework import serializers
from .models import Booking, Invoice
from rooms.serializers import RoomListSerializer
from guests.serializers import GuestListSerializer


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = "__all__"


class BookingCreateSerializer(serializers.Serializer):
    guest_id = serializers.IntegerField(required=False, allow_null=True)
    room_id = serializers.IntegerField()
    check_in = serializers.DateField()
    check_out = serializers.DateField()
    full_name = serializers.CharField(max_length=200, required=False)
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(max_length=20, required=False)
    id_type = serializers.ChoiceField(choices=["Aadhaar", "PAN", "Passport", "DrivingLicense"], required=False)
    id_number = serializers.CharField(max_length=50, required=False)
    address = serializers.CharField(required=False)
    extra_bed = serializers.BooleanField(default=False)
    special_requests = serializers.CharField(required=False, allow_blank=True, default="")
    guest_count = serializers.IntegerField(min_value=1, default=1)
    promo_code = serializers.CharField(required=False, allow_blank=True, default="")
    status = serializers.ChoiceField(choices=Booking.Status.choices, required=False, default=Booking.Status.PENDING)

    def validate(self, data):
        import datetime
        import re
        from rooms.models import Room
        from promos.models import PromoCode
        from guests.models import Guest
        from guests.utils import validate_aadhaar
        from django.core.exceptions import ValidationError as DjangoValidationError

        guest_id = data.get("guest_id")
        if not guest_id:
            # Required fields for new guest
            required_fields = ["full_name", "email", "phone", "id_type", "id_number", "address"]
            errors = {}
            for field in required_fields:
                if not data.get(field):
                    errors[field] = "This field is required for new guests."
            if errors:
                raise serializers.ValidationError(errors)

            # ID Validation Logic (only for new guest)
            id_type = data.get("id_type")
            id_number = data.get("id_number", "").strip().upper()
            # Remove spaces/hyphens for storage consistency
            id_number = id_number.replace(" ", "").replace("-", "")
            data["id_number"] = id_number
            
            if id_type == "Aadhaar":
                if not validate_aadhaar(id_number):
                    # For testing purposes, if you know the number is 12 digits but checksum is failing
                    raise serializers.ValidationError({"id_number": "Aadhaar Verhoeff check failed. Please use a valid UIDAI number (e.g. 5486 8452 0315)."})
            elif id_type == "PAN":
                if not re.fullmatch(r"^[A-Z]{5}[0-9]{4}[A-Z]$", id_number):
                    raise serializers.ValidationError({"id_number": "PAN must be in format ABCDE1234F."})
            elif id_type == "Passport":
                if not re.fullmatch(r"^[A-Z][1-9]\d{6}$", id_number):
                    # Relaxing slightly to any digit after letter for non-Indian or variant passports
                    if not re.fullmatch(r"^[A-Z]\d{7,8}$", id_number):
                        raise serializers.ValidationError({"id_number": "Passport typically starts with a letter followed by 7-8 digits."})
            elif id_type == "DrivingLicense":
                # DL sizes vary by state (10-15 chars). Standardizing on common patterns.
                if len(id_number) < 10 or len(id_number) > 16:
                    raise serializers.ValidationError({"id_number": "Driving License should be 10-16 characters."})

            # Phone validation
            phone = data.get("phone")
            if phone:
                # Remove spaces/dashes before regex check
                phone = phone.replace(" ", "").replace("-", "")
                if not re.fullmatch(r"^\+\d{10,15}$", phone):
                    raise serializers.ValidationError({"phone": "Phone must include '+' and country code followed by 10+ digits."})
                data["phone"] = phone
        else:
            try:
                data["_guest"] = Guest.objects.get(pk=guest_id)
            except Guest.DoesNotExist:
                raise serializers.ValidationError({"guest_id": "Guest not found."})

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
        if Booking.has_conflict(room.pk, check_in, check_out):
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
        guest = validated_data.get("_guest")

        if not guest:
            guest, _ = Guest.objects.get_or_create(
                email=validated_data["email"],
                defaults={
                    "full_name": validated_data["full_name"],
                    "phone": validated_data["phone"],
                    "id_type": validated_data["id_type"],
                    "id_number": validated_data["id_number"],
                    "address": validated_data["address"],
                    "extra_bed": validated_data["extra_bed"],
                },
            )

        pricing = Booking.calculate_price(
            room, 
            validated_data["check_in"], 
            validated_data["check_out"], 
            promo,
            extra_bed=validated_data.get("extra_bed", False)
        )

        booking = Booking.objects.create(
            room=room,
            guest=guest,
            guest_count=validated_data.get("guest_count", 1),
            check_in=validated_data["check_in"],
            check_out=validated_data["check_out"],
            nights=pricing["nights"],
            base_amount=pricing["base_amount"],
            discount_amount=pricing["discount_amount"],
            tax_amount=pricing["tax_amount"],
            total_amount=pricing["total_amount"],
            promo_code=promo,
            special_requests=validated_data.get("special_requests", ""),
            status=validated_data.get("status", Booking.Status.PENDING),
            extra_bed=validated_data["extra_bed"],
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
            "payment_id",
        ]


class BookingDetailSerializer(serializers.ModelSerializer):
    room = RoomListSerializer(read_only=True)
    guest = GuestListSerializer(read_only=True)
    invoice = InvoiceSerializer(read_only=True)
    reference = serializers.UUIDField()
    promo_code_str = serializers.CharField(source="promo_code.code", read_only=True, default=None)

    class Meta:
        model = Booking
        fields = [
            "id", "reference", "room", "guest", "guest_count",
            "check_in", "check_out", "nights",
            "base_amount", "discount_amount", "tax_amount", "total_amount",
            "promo_code_str", "status",
            "razorpay_order_id", "payment_id",
            "special_requests", "expires_at",
            "created_at", "updated_at",
            "invoice",
        ]
        read_only_fields = ["id", "reference", "nights", "base_amount", "discount_amount", "tax_amount", "total_amount", "created_at", "updated_at"]


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
        current = self.instance.status if self.instance else ""
        allowed = self.VALID_TRANSITIONS.get(str(current), [])
        if value not in allowed:
            raise serializers.ValidationError(
                f"Cannot transition from '{current}' to '{value}'. Allowed: {allowed}"
            )
        return value

    def update(self, instance, validated_data):
        instance.status = validated_data["status"]
        instance.save(update_fields=["status", "updated_at"])
        return instance