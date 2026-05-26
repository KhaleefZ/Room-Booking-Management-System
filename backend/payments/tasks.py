import logging
from celery import shared_task
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


def _render_html_template(template_content: str, context: dict) -> str:
    """Renders the user-provided template with context and wraps it in a modern HTML layout."""
    from settings_app.models import HotelSettings
    hotel = HotelSettings.get_settings()
    
    # Process placeholders
    processed_content = template_content
    for key, value in context.items():
        processed_content = processed_content.replace(f"{{{{{key}}}}}", str(value))
    
    # Convert line breaks to <br> for HTML
    html_content = processed_content.replace("\n", "<br>")

    # Modern visual wrapper
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            .email-container {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                background-color: #f8fafc;
                padding: 40px 20px;
            }}
            .card {{
                background-color: #ffffff;
                border-radius: 32px;
                padding: 40px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
                border: 1px solid #f1f5f9;
            }}
            .header {{
                text-align: center;
                margin-bottom: 40px;
            }}
            .logo {{
                width: 56px;
                height: 56px;
                background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
                border-radius: 16px;
                display: inline-block;
                color: #ffffff;
                font-weight: 900;
                font-size: 28px;
                line-height: 56px;
                box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.3);
            }}
            .title {{
                font-size: 11px;
                font-weight: 800;
                color: #0f172a;
                text-transform: uppercase;
                letter-spacing: 0.3em;
                margin-top: 20px;
            }}
            .content {{
                color: #334155;
                font-size: 15px;
                line-height: 1.6;
            }}
            .footer {{
                text-align: center;
                margin-top: 30px;
                font-size: 11px;
                font-weight: 700;
                color: #94a3b8;
                text-transform: uppercase;
                letter-spacing: 0.1em;
            }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">{hotel.hotel_name[0] if hotel.hotel_name else 'H'}</div>
                <div class="title">{hotel.hotel_name} Global Operations</div>
            </div>
            <div class="card">
                <div class="content">
                    {html_content}
                </div>
            </div>
            <div class="footer">
                Operated by {hotel.hotel_name} — Automated Log System
            </div>
        </div>
    </body>
    </html>
    """


@shared_task(name="payments.tasks.send_booking_confirmation")
def send_booking_confirmation(booking_id: int):
    from bookings.models import Booking
    from settings_app.models import HotelSettings

    try:
        booking = Booking.objects.select_related("room", "guest").get(pk=booking_id)
        hotel_settings = HotelSettings.get_settings()
        hotel_name = hotel_settings.hotel_name if hotel_settings else "Sri ASK Residency"

        context = {
            "guest_name": booking.guest.full_name,
            "booking_reference": str(booking.reference)[:8].upper(),
            "room_name": f"Room {booking.room.room_number}",
            "room_type": booking.room.room_type,
            "check_in": booking.check_in.strftime("%d %B %Y"),
            "check_out": booking.check_out.strftime("%d %B %Y"),
            "check_in_time": hotel_settings.check_in_time if hotel_settings else "14:00",
            "check_out_time": hotel_settings.check_out_time if hotel_settings else "11:00",
            "total_amount": f"₹{booking.total_amount:,.2f}",
        }

        confirmation_html = f"""
        <div style="text-align: center; margin-bottom: 35px;">
            <div style="display: inline-block; padding: 10px 20px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 99px; margin-bottom: 20px;">
                <span style="color: #15803d; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em;">Official Reservation Confirmation</span>
            </div>
            <h1 style="color: #0f172a; margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -0.04em;">Your Stay is Confirmed.</h1>
            <p style="color: #64748b; margin-top: 12px; font-size: 16px; line-height: 1.5; font-weight: 500;">Dear {context['guest_name']}, your upcoming reservation at <span style="color: #0f172a; font-weight: 700;">{hotel_name}</span> has been successfully authenticated and secured.</p>
        </div>

        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; margin-bottom: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="background-color: #f8fafc; padding: 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                <div style="width: 100%;">
                    <span style="display: block; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 4px;">System Reference Number</span>
                    <span style="font-size: 22px; font-weight: 900; color: #4f46e5; letter-spacing: 0.05em;">{context['booking_reference']}</span>
                </div>
            </div>
            
            <div style="padding: 30px;">
                <div style="display: flex; gap: 30px; margin-bottom: 30px;">
                    <div style="flex: 1;">
                        <span style="display: block; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">Check-In Protocol</span>
                        <span style="display: block; font-size: 16px; font-weight: 800; color: #1e293b; margin-top: 6px;">{context['check_in']}</span>
                        <span style="display: block; font-size: 13px; font-weight: 600; color: #6366f1; margin-top: 4px;">Entry from {context['check_in_time']}</span>
                    </div>
                    <div style="flex: 1; text-align: right;">
                        <span style="display: block; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">Check-Out Protocol</span>
                        <span style="display: block; font-size: 16px; font-weight: 800; color: #1e293b; margin-top: 6px;">{context['check_out']}</span>
                        <span style="display: block; font-size: 13px; font-weight: 600; color: #6366f1; margin-top: 4px;">Vacate by {context['check_out_time']}</span>
                    </div>
                </div>

                <div style="padding-top: 25px; border-top: 1px solid #f1f5f9;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                        <span style="color: #64748b; font-size: 14px; font-weight: 600;">Inventory Allocated</span>
                        <span style="color: #0f172a; font-size: 14px; font-weight: 800;">{context['room_name']} <span style="font-size: 12px; color: #64748b; font-weight: 500;">({context['room_type']})</span></span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                        <span style="color: #64748b; font-size: 14px; font-weight: 600;">Primary Occupant</span>
                        <span style="color: #0f172a; font-size: 14px; font-weight: 800;">{context['guest_name']}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding-top: 20px; margin-top: 20px; border-top: 2px solid #f8fafc;">
                        <span style="color: #0f172a; font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em;">Total Settlement</span>
                        <span style="color: #4f46e5; font-size: 22px; font-weight: 900;">{context['total_amount']}</span>
                    </div>
                </div>
            </div>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 30px;">
            <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.6;">
                <strong>Note to Guest:</strong> Professional credentials and identification are required at the point of entry. To modify this protocol, please reach out to our Guest Relations desk.
            </p>
        </div>

        <div style="text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.6;">
            <p>Thank you for choosing {hotel_name}. This is a system-generated secure transmission.</p>
        </div>
        """

        html_body = _render_html_template(confirmation_html, {})
        text_body = strip_tags(html_body)

        msg = EmailMultiAlternatives(
            subject=f"RESERVATION CONFIRMED: Log {context['booking_reference']} — {hotel_name}",
            body=text_body,
            from_email=f"{hotel_name} <{settings.EMAIL_HOST_USER}>",
            to=[booking.guest.email],
        )
        msg.attach_alternative(html_body, "text/html")
        msg.send()
        
        logger.info(f"Visual confirmation email sent to {booking.guest.email}")

    except Exception as e:
        logger.error(f"Failed to send confirmation email for booking {booking_id}: {e}")
        raise


@shared_task(name="payments.tasks.send_admin_notification")
def send_admin_notification(booking_id: int):
    from bookings.models import Booking
    from settings_app.models import HotelSettings

    try:
        booking = Booking.objects.select_related("room", "guest").get(pk=booking_id)
        hotel_settings = HotelSettings.get_settings()

        context = {
            "guest_name": booking.guest.full_name,
            "booking_reference": str(booking.reference)[:8].upper(),
            "room_name": f"Room {booking.room.room_number}",
            "check_in": booking.check_in.strftime("%d %B %Y"),
            "check_out": booking.check_out.strftime("%d %B %Y"),
            "total_amount": f"₹{booking.total_amount:,.2f}",
        }

        html_body = _render_html_template(hotel_settings.admin_email_template, context)
        text_body = strip_tags(html_body)

        msg = EmailMultiAlternatives(
            subject=f"CORE LOG: {booking.guest.full_name.upper()} | REF {context['booking_reference']}",
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[hotel_settings.admin_email_address],
        )
        msg.attach_alternative(html_body, "text/html")
        msg.send()

        logger.info(f"Visual admin notification sent to {hotel_settings.admin_email_address}")

    except Exception as e:
        logger.error(f"Failed to send admin notification for booking {booking_id}: {e}")
        raise


@shared_task(name="payments.tasks.send_checkout_invoice")
def send_checkout_invoice(invoice_id: int):
    from bookings.models import Invoice
    from settings_app.models import HotelSettings
    from bookings.utils import generate_invoice_pdf

    try:
        invoice = Invoice.objects.get(pk=invoice_id)
        hotel_settings = HotelSettings.get_settings()

        # Generate PDF first
        pdf_success = generate_invoice_pdf(invoice)

        invoice_html = f"""
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; padding: 8px 16px; background-color: #f1f5f9; border-radius: 99px; margin-bottom: 16px;">
                <span style="color: #475569; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">Final Statement</span>
            </div>
            <h1 style="color: #0f172a; margin: 0; font-size: 28px; font-weight: 900; tracking: tight;">Thank you!</h1>
            <p style="color: #64748b; margin-top: 8px; font-size: 15px;">It was a pleasure having you at {hotel_settings.hotel_name if hotel_settings else "Sri ASK Residency"}.</p>
        </div>

        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; margin-bottom: 25px;">
            <div style="background-color: #f8fafc; padding: 20px; border-bottom: 1px solid #e2e8f0; text-align: center;">
                <span style="display: block; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">Invoice Number</span>
                <span style="font-size: 20px; font-weight: 900; color: #0f172a;">{invoice.invoice_number}</span>
            </div>
            
            <div style="padding: 24px;">
                <p style="margin-top: 0; font-size: 15px; color: #1e293b; line-height: 1.6;">Hello <strong>{invoice.guest_name}</strong>,</p>
                <p style="font-size: 14px; color: #64748b; line-height: 1.6;">Your checkout process is complete. We've attached the formal PDF invoice to this email for your records. Below is a summary of your stay.</p>
                
                <div style="margin: 24px 0; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                        <span style="color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase;">Unit & Type</span>
                        <span style="color: #0f172a; font-size: 14px; font-weight: 800;">{invoice.room_details}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                        <span style="color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase;">Duration</span>
                        <span style="color: #0f172a; font-size: 14px; font-weight: 800;">{invoice.check_in.strftime("%b %d")} - {invoice.check_out.strftime("%b %d, %Y")}</span>
                    </div>
                </div>

                <div style="padding: 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; color: white; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span style="display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; opacity: 0.7;">Grand Total Paid</span>
                        <span style="font-size: 22px; font-weight: 900;">₹{invoice.total_amount:,.2f}</span>
                    </div>
                    <div style="text-align: right;">
                        <div style="width: 40px; height: 40px; background-color: rgba(255,255,255,0.1); border-radius: 10px; display: inline-flex; align-items: center; justify-content: center;">
                            <span style="font-size: 18px;">📄</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div style="text-align: center; color: #64748b; font-size: 13px;">
            <p>Safe travels and we hope to see you again soon!</p>
        </div>
        
        <div style="background-color: #eff6ff; padding: 16px; border-radius: 12px; font-size: 13px; color: #1e40af; border-left: 4px solid #3b82f6; margin-top: 20px;">
            <strong>Digital Archive:</strong> A PDF copy of this transaction has been securely archived in our vault. You can download the attachment for your company reimbursements.
        </div>
        """

        # Wrap in layout
        html_body = _render_html_template(invoice_html, {})
        text_body = strip_tags(html_body)

        # SEND TO GUEST
        msg_guest = EmailMultiAlternatives(
            subject=f"FINAL INVOICE: {invoice.invoice_number} — {hotel_settings.hotel_name}",
            body=text_body,
            from_email=f"{hotel_settings.hotel_name} <{settings.EMAIL_HOST_USER}>",
            to=[invoice.guest_email],
        )
        msg_guest.attach_alternative(html_body, "text/html")
        if pdf_success and invoice.pdf_file:
            msg_guest.attach(f"Invoice_{invoice.invoice_number}.pdf", invoice.pdf_file.read(), 'application/pdf')
        msg_guest.send()

        # SEND TO ADMIN
        msg_admin = EmailMultiAlternatives(
            subject=f"ARCHIVE: Checkout {invoice.invoice_number} | {invoice.guest_name}",
            body=text_body,
            from_email=f"{hotel_settings.hotel_name} <{settings.EMAIL_HOST_USER}>",
            to=[hotel_settings.admin_email_address],
        )
        msg_admin.attach_alternative(html_body, "text/html")
        if pdf_success and invoice.pdf_file:
            msg_admin.attach(f"Invoice_{invoice.invoice_number}.pdf", invoice.pdf_file.read(), 'application/pdf')
        msg_admin.send()

        logger.info(f"Invoice {invoice.invoice_number} with PDF sent to {invoice.guest_email} and admin.")

    except Exception as e:
        logger.error(f"Failed to send invoice {invoice_id}: {e}")
        raise