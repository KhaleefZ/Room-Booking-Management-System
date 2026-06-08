import os
import django
from io import BytesIO
import base64
from PIL import Image, ImageDraw

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from django.template.loader import get_template
from xhtml2pdf import pisa
from bookings.models import Booking, Invoice
from settings_app.models import HotelSettings
from django.utils import timezone
from decimal import Decimal

booking = Booking.objects.first()
if not booking:
    from rooms.models import Room
    from guests.models import Guest
    room, _ = Room.objects.get_or_create(
        room_number="101", 
        defaults={"base_price": Decimal("2500.00"), "capacity": 2, "bed_config": "Double"}
    )
    guest, _ = Guest.objects.get_or_create(
        email="guest@example.com", 
        defaults={
            "full_name": "JOHN DOE", 
            "phone": "+919876543210", 
            "id_type": "Aadhaar", 
            "id_number": "548684520315", 
            "address": "123 Main Street, Chennai, Tamil Nadu - 600001"
        }
    )
    booking = Booking.objects.create(
        room=room,
        guest=guest,
        check_in=timezone.now().date(),
        check_out=timezone.now().date() + timezone.timedelta(days=2),
        nights=2,
        base_amount=Decimal("5000.00"),
        tax_amount=Decimal("900.00"),
        discount_amount=Decimal("500.00"),
        total_amount=Decimal("5400.00"),
        status="CheckedIn"
    )

invoice = Invoice.objects.filter(booking=booking).first()
if not invoice:
    invoice = Invoice.objects.create(
        booking=booking,
        guest_name=booking.guest.full_name,
        guest_email=booking.guest.email,
        room_details=f"{booking.room.room_type} - Room {booking.room.room_number}",
        check_in=booking.check_in,
        check_out=booking.check_out,
        nights=booking.nights,
        base_amount=booking.base_amount,
        tax_amount=booking.tax_amount,
        discount_amount=booking.discount_amount,
        total_amount=booking.total_amount,
    )

h_settings = HotelSettings.get_settings()
context = {
    'invoice': invoice,
    'hotel_name': h_settings.hotel_name,
    'hotel_address': h_settings.hotel_address,
    'hotel_contact': h_settings.hotel_phone,
    'hotel_email': h_settings.hotel_email,
    'tax_rate': h_settings.tax_rate,
    'check_in_time': h_settings.check_in_time,
    'check_out_time': h_settings.check_out_time,
}

# base64 encode Nav Logo.png
try:
    with open('../frontend/public/src/assets/Nav Logo.png', 'rb') as img_f:
        logo_data = base64.b64encode(img_f.read()).decode('utf-8')
    context['logo_base64'] = logo_data
except Exception as e:
    print("Logo read error:", e)
    context['logo_base64'] = ""

# Generate a 16x16 globe icon
try:
    img = Image.new('RGBA', (16, 16), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    gold = (194, 154, 91, 255)
    
    # Outer circle
    draw.ellipse([1, 1, 14, 14], outline=gold, width=1)
    # Equator (horizontal line)
    draw.line([1, 7, 14, 7], fill=gold, width=1)
    # Prime meridian (vertical line)
    draw.line([7, 1, 7, 14], fill=gold, width=1)
    # Vertical ellipse
    draw.ellipse([4, 1, 11, 14], outline=gold, width=1)
    
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    globe_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
    context['globe_base64'] = globe_base64
except Exception as e:
    print("Globe icon generate error:", e)
    context['globe_base64'] = ""

# Generate a 16x16 phone icon
try:
    img = Image.new('RGBA', (16, 16), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    gold = (194, 154, 91, 255)
    draw.line([4, 11, 11, 4], fill=gold, width=2)
    draw.ellipse([2, 10, 6, 14], fill=gold)
    draw.ellipse([10, 2, 14, 6], fill=gold)
    
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    phone_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
    context['phone_base64'] = phone_base64
except Exception as e:
    print("Phone icon generate error:", e)
    context['phone_base64'] = ""

# Generate a 16x16 email icon
try:
    img = Image.new('RGBA', (16, 16), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    gold = (194, 154, 91, 255)
    draw.rectangle([1, 4, 14, 12], outline=gold, width=1)
    draw.line([1, 4, 7, 8], fill=gold, width=1)
    draw.line([14, 4, 7, 8], fill=gold, width=1)
    
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    email_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
    context['email_base64'] = email_base64
except Exception as e:
    print("Email icon generate error:", e)
    context['email_base64'] = ""

template = get_template('invoices/invoice_pdf.html')
html = template.render(context)

with open('../test_invoice.pdf', 'wb') as f:
    pisa.pisaDocument(BytesIO(html.encode("UTF-8")), f)
print("PDF Compiled successfully to test_invoice.pdf")
