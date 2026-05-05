from decimal import Decimal
from rest_framework import serializers
from .models import PromoCode


class PromoCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromoCode
        fields = [
            "id", "code", "discount_type", "discount_value",
            "expiry_date", "usage_limit", "times_used", "is_active",
        ]

    def validate_code(self, value):
        return value.upper()


class PromoValidateSerializer(serializers.Serializer):
    code = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)

    def validate(self, data):
        code = data["code"].upper()
        amount = data["amount"]

        try:
            promo = PromoCode.objects.get(code=code)
        except PromoCode.DoesNotExist:
            return {
                "is_valid": False,
                "discount_amount": Decimal("0"),
                "message": "Promo code not found.",
                "code": code,
                "amount": amount,
            }

        if not promo.is_valid():
            return {
                "is_valid": False,
                "discount_amount": Decimal("0"),
                "message": "Promo code is expired, inactive, or usage limit reached.",
                "code": code,
                "amount": amount,
            }

        discount = promo.apply(amount)
        return {
            "is_valid": True,
            "discount_amount": discount,
            "message": f"Promo applied! You save ₹{discount}.",
            "code": code,
            "amount": amount,
            "promo_id": promo.id,
        }