import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(name="bookings.tasks.cancel_expired_bookings")
def cancel_expired_bookings():
    from .models import Booking

    now = timezone.now()
    expired_qs = Booking.objects.filter(status=Booking.Status.PENDING, expires_at__lt=now)
    count = expired_qs.count()
    expired_qs.update(status=Booking.Status.CANCELLED)

    if count:
        logger.info(f"Auto-cancelled {count} expired booking(s).")
    return f"Cancelled {count} expired bookings"