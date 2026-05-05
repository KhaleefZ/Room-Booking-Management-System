from decimal import Decimal
from django.db import models
from django.utils import timezone


class PromoCode(models.Model):
    class DiscountType(models.TextChoices):
        FIXED = "fixed", "Fixed Amount"
        PERCENT = "percent", "Percentage"

    code = models.CharField(max_length=50, unique=True)
    discount_type = models.CharField(max_length=10, choices=DiscountType.choices)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    expiry_date = models.DateField()
    usage_limit = models.PositiveIntegerField(default=100)
    times_used = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-is_active", "expiry_date"]

    def __str__(self):
        return self.code

    def save(self, *args, **kwargs):
        self.code = self.code.upper()
        super().save(*args, **kwargs)

    def is_valid(self):
        return (
            self.is_active
            and self.expiry_date >= timezone.now().date()
            and self.times_used < self.usage_limit
        )

    def apply(self, amount):
        if self.discount_type == self.DiscountType.FIXED:
            return min(Decimal(str(self.discount_value)), amount)
        elif self.discount_type == self.DiscountType.PERCENT:
            return (amount * Decimal(str(self.discount_value)) / 100).quantize(Decimal("0.01"))
        return Decimal("0")