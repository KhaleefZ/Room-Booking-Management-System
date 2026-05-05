from django.db import models


class Guest(models.Model):
    class IDType(models.TextChoices):
        AADHAAR = "Aadhaar", "Aadhaar"
        PAN = "PAN", "PAN"
        PASSPORT = "Passport", "Passport"
        DRIVING_LICENSE = "DrivingLicense", "Driving License"

    full_name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    id_type = models.CharField(max_length=20, choices=IDType.choices)
    id_number = models.CharField(max_length=50)
    special_requests = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.full_name} ({self.email})"