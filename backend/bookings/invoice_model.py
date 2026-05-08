from django.db import models
import uuid

class Invoice(models.Model):
    invoice_number = models.CharField(max_length=20, unique=True, editable=False)
    booking = models.OneToOneField("bookings.Booking", on_delete=models.CASCADE, related_name="invoice")
    issue_date = models.DateTimeField(auto_now_add=True)
    
    # Snapshot of billing at time of checkout
    guest_name = models.CharField(max_length=255)
    guest_email = models.EmailField()
    room_details = models.CharField(max_length=255)
    check_in = models.DateField()
    check_out = models.DateField()
    nights = models.PositiveIntegerField()
    
    base_amount = models.DecimalField(max_digits=10, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    pdf_file = models.FileField(upload_to="invoices/", null=True, blank=True)
    pdf_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            # Generate a unique invoice number like INV-20260508-XXXX
            import datetime
            import random
            import string
            date_str = datetime.datetime.now().strftime("%Y%m%d")
            random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
            self.invoice_number = f"INV-{date_str}-{random_str}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Invoice {self.invoice_number} ({self.guest_name})"
