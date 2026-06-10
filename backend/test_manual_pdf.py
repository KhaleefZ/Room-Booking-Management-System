import os
import django
from io import BytesIO
import base64
from PIL import Image, ImageDraw
from decimal import Decimal

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from django.template.loader import get_template
from xhtml2pdf import pisa
from bookings.models import Invoice
from settings_app.models import HotelSettings
from django.utils import timezone

class MockInvoice:
    def __init__(self):
        self.invoice_number = "INV-MANUAL-001"
        self.booking = None
        self.issue_date = timezone.now()
        self.guest_name = "TEST MANUAL GUEST"
        self.guest_email = "manual_guest@example.com"
        self.guest_phone = "+919999999999"
        self.guest_address = "456 Side Street, Coimbatore - 641002"
        self.room_details = "Room 101 (Standard), Room 102 (Standard)"
        self.room_count = 5
        self.check_in = timezone.now().date()
        self.check_out = timezone.now().date() + timezone.timedelta(days=2)
        self.nights = 2
        self.base_amount = Decimal("10000.00")
        self.tax_amount = Decimal("1800.00")
        self.discount_amount = Decimal("1000.00")
        self.total_amount = Decimal("10800.00")
        self.description = "This is a manually created invoice for test purposes."
        self.breakdown = None

invoice = MockInvoice()

h_settings = HotelSettings.get_settings()
rooms = [r.strip() for r in invoice.room_details.split(",") if r.strip()]
num_rooms = len(rooms) if rooms else 1
base_amount = Decimal(str(invoice.base_amount))
price_per_room = (base_amount / num_rooms).quantize(Decimal("0.01"))
rooms_list = [{'name': r, 'price': price_per_room} for r in rooms]

context = {
    'invoice': invoice,
    'hotel_name': h_settings.hotel_name,
    'hotel_address': h_settings.hotel_address,
    'hotel_contact': h_settings.hotel_phone,
    'hotel_email': h_settings.hotel_email,
    'tax_rate': h_settings.tax_rate,
    'check_in_time': h_settings.check_in_time,
    'check_out_time': h_settings.check_out_time,
    'rooms_list': rooms_list,
}

# base64 encode Invoice Logo.png
try:
    logo_path = '../frontend/public/src/assets/Invoice Logo.png'
    if not os.path.exists(logo_path):
        logo_path = 'bookings/Invoice Logo.png'
    with open(logo_path, 'rb') as img_f:
        logo_data = base64.b64encode(img_f.read()).decode('utf-8')
    context['logo_base64'] = logo_data
except Exception as e:
    print("Logo read error:", e)
    context['logo_base64'] = ""

# Generate a 16x16 globe icon
try:
    img = Image.new('RGBA', (16, 16), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    gold = (166, 124, 82, 255)
    draw.ellipse([1, 1, 14, 14], outline=gold, width=1)
    draw.line([1, 7, 14, 7], fill=gold, width=1)
    draw.line([7, 1, 7, 14], fill=gold, width=1)
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
    gold = (166, 124, 82, 255)
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
    gold = (166, 124, 82, 255)
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

with open('../test_manual_invoice.pdf', 'wb') as f:
    pisa.pisaDocument(BytesIO(html.encode("UTF-8")), f)
print("PDF Compiled successfully to test_manual_invoice.pdf")
