import os
from io import BytesIO
from django.conf import settings
from django.template.loader import get_template
from xhtml2pdf import pisa
from django.core.files.base import ContentFile

def generate_invoice_pdf(invoice):
    template_path = 'invoices/invoice_pdf.html'
    context = {
        'invoice': invoice,
        'hotel_name': settings.DEFAULT_FROM_EMAIL.split('<')[0].strip() or "RBMS EXECUTIVE HOTEL",
        'logo_url': 'https://rbms-logo.png' 
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
