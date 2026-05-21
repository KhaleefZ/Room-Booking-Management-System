from django.db import models
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
from .utils import validate_aadhaar
import re


def validate_id_number(obj):
    id_type = obj.id_type
    id_number = str(obj.id_number).strip().upper() if obj.id_number else ""
    id_number = id_number.replace(" ", "").replace("-", "")
    
    if id_type == "Aadhaar":
        if not validate_aadhaar(id_number):
            raise ValidationError({"id_number": "Aadhaar Verhoeff check failed. Please use a valid UIDAI number (e.g. 5486 8452 0315)."})
    elif id_type == "PAN":
        if not re.fullmatch(r"^[A-Z]{5}[0-9]{4}[A-Z]$", id_number):
            raise ValidationError({"id_number": "PAN must be in format ABCDE1234F."})
    elif id_type == "Passport":
        if not re.fullmatch(r"^[A-Z]\d{7,8}$", id_number):
            raise ValidationError({"id_number": "Passport typically starts with a letter followed by 7-8 digits."})
    elif id_type == "DrivingLicense":
        if len(id_number) < 10 or len(id_number) > 16:
            raise ValidationError({"id_number": "Driving License should be 10-16 characters."})

    # Ensure the cleaned uppercase ID is saved
    obj.id_number = id_number


class Guest(models.Model):
    class IDType(models.TextChoices):
        AADHAAR = "Aadhaar", "Aadhaar"
        PAN = "PAN", "PAN"
        PASSPORT = "Passport", "Passport"
        DRIVING_LICENSE = "DrivingLicense", "Driving License"

    full_name = models.CharField(
        max_length=200,
        validators=[
            RegexValidator(
                regex=r"^[a-zA-Z\s]{3,200}$",
                message="Name must be 3-200 characters and contain only letters and spaces",
            )
        ],
    )
    email = models.EmailField(unique=True)
    phone = models.CharField(
        max_length=20,
        validators=[
            RegexValidator(
                regex=r"^\+\d{1,3}\d{10}$",
                message="Phone must include country code followed by 10 digits (e.g., +919876543210).",
            )
        ],
    )
    id_type = models.CharField(max_length=20, choices=IDType.choices)
    id_number = models.CharField(max_length=50, unique=True)
    address = models.TextField(
        help_text="Guest's physical address",
        validators=[
            RegexValidator(
                regex=r"^[a-zA-Z0-9\s,.-]{10,500}$",
                message="Address must be at least 10 characters long and contain valid characters.",
            )
        ],
    )
    extra_bed = models.BooleanField(default=False, help_text="Whether an extra bed is requested")
    special_requests = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def clean(self):
        super().clean()
        validate_id_number(self)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.full_name} ({self.email})"