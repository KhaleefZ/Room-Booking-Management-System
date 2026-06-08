import os
from io import BytesIO
from django.conf import settings
from django.template.loader import get_template
from xhtml2pdf import pisa
from django.core.files.base import ContentFile
from settings_app.models import HotelSettings

def generate_invoice_pdf(invoice):
    template_path = 'invoices/invoice_pdf.html'
    h_settings = HotelSettings.get_settings()
    
    # Read logo base64
    import base64
    from PIL import Image, ImageDraw
    logo_base64 = ""
    try:
        logo_path = os.path.join(settings.BASE_DIR.parent, 'frontend', 'public', 'src', 'assets', 'Nav Logo.png')
        with open(logo_path, 'rb') as f:
            logo_base64 = base64.b64encode(f.read()).decode('utf-8')
    except Exception as e:
        pass

    globe_base64 = ""
    try:
        img = Image.new('RGBA', (16, 16), (255, 255, 255, 0))
        draw = ImageDraw.Draw(img)
        gold = (194, 154, 91, 255)
        draw.ellipse([1, 1, 14, 14], outline=gold, width=1)
        draw.line([1, 7, 14, 7], fill=gold, width=1)
        draw.line([7, 1, 7, 14], fill=gold, width=1)
        draw.ellipse([4, 1, 11, 14], outline=gold, width=1)
        
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        globe_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
    except Exception as e:
        pass

    phone_base64 = ""
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
    except Exception as e:
        pass

    email_base64 = ""
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
    except Exception as e:
        pass

    context = {
        'invoice': invoice,
        'hotel_name': h_settings.hotel_name,
        'hotel_address': h_settings.hotel_address,
        'hotel_contact': h_settings.hotel_phone,
        'hotel_email': h_settings.hotel_email,
        'tax_rate': h_settings.tax_rate,
        'check_in_time': h_settings.check_in_time.strftime("%I:%M %p"),
        'check_out_time': h_settings.check_out_time.strftime("%I:%M %p"),
        'logo_url': 'https://rbms-logo.png',
        'logo_base64': logo_base64,
        'globe_base64': globe_base64,
        'phone_base64': phone_base64,
        'email_base64': email_base64
    }
    
    # Create a Django response object, and specify content_type as pdf
    template = get_template(template_path)
    html = template.render(context)
    
    result = BytesIO()
    pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result)
    
    if not getattr(pdf, 'err', True): # type: ignore
        filename = f"Invoice_{invoice.invoice_number}.pdf"
        invoice.pdf_file.save(filename, ContentFile(result.getvalue()), save=False)
        invoice.pdf_generated = True
        invoice.save(update_fields=['pdf_file', 'pdf_generated'])
        return True
    return False
