import logging
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


def _render_template(template: str, context: dict) -> str:
    for key, value in context.items():
        template = template.replace(f"{{{{{key}}}}}", str(value))
    return template


@shared_task(name="payments.tasks.send_booking_confirmation")
def send_booking_confirmation(booking_id: int):
    from bookings.models import Booking
    from settings_app.models import HotelSettings

    try:
        booking = Booking.objects.select_related("room", "guest").get(pk=booking_id)
        hotel_settings = HotelSettings.get_settings()

        context = {
            "guest_name": booking.guest.full_name,
            "booking_reference": str(booking.reference),
            "room_name": f"Room {booking.room.room_number} ({booking.room.room_type})",
            "check_in": booking.check_in.strftime("%d %B %Y"),
            "check_out": booking.check_out.strftime("%d %B %Y"),
            "total_amount": f"{booking.total_amount:,.2f}",
        }

        body = _render_template(hotel_settings.guest_email_template, context)

        send_mail(
            subject=f"Booking Confirmed — Ref {str(booking.reference)[:8].upper()}",
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[booking.guest.email],
            fail_silently=False,
        )
        logger.info(f"Confirmation email sent to {booking.guest.email}")

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
            "booking_reference": str(booking.reference),
            "room_name": f"Room {booking.room.room_number} ({booking.room.room_type})",
            "check_in": booking.check_in.strftime("%d %B %Y"),
            "check_out": booking.check_out.strftime("%d %B %Y"),
            "total_amount": f"{booking.total_amount:,.2f}",
        }

        body = _render_template(hotel_settings.admin_email_template, context)

        send_mail(
            subject=f"New Booking — {booking.guest.full_name} | Ref {str(booking.reference)[:8].upper()}",
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[hotel_settings.admin_email_address],
            fail_silently=False,
        )
        logger.info(f"Admin notification sent to {hotel_settings.admin_email_address}")

    except Exception as e:
        logger.error(f"Failed to send admin notification for booking {booking_id}: {e}")
        raise