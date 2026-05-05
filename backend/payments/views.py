import hmac
import hashlib
import logging

from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

from bookings.models import Booking

logger = logging.getLogger(__name__)


def get_razorpay_client():
    import razorpay
    return razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )


class CreateOrderView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from django.utils import timezone

        booking_id = request.data.get("booking_id")
        if not booking_id:
            return Response({"error": "booking_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            booking = Booking.objects.select_related("room", "guest").get(pk=booking_id)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        if booking.status != Booking.Status.PENDING:
            return Response(
                {"error": f"Booking is already {booking.status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if booking.expires_at and booking.expires_at < timezone.now():
            return Response(
                {"error": "Booking has expired. Please make a new booking."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        razorpay_client = get_razorpay_client()
        order = razorpay_client.order.create({
            "amount": int(booking.total_amount * 100),
            "currency": "INR",
            "receipt": str(booking.reference),
        })

        booking.razorpay_order_id = order["id"]
        booking.save(update_fields=["razorpay_order_id"])

        return Response({
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "razorpay_key": settings.RAZORPAY_KEY_ID,
            "booking_id": booking.id,
            "booking_reference": str(booking.reference),
            "guest_name": booking.guest.full_name,
            "guest_email": booking.guest.email,
        })


class VerifyPaymentView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from payments.tasks import send_booking_confirmation, send_admin_notification

        booking_id = request.data.get("booking_id")
        razorpay_order_id = request.data.get("razorpay_order_id")
        razorpay_payment_id = request.data.get("razorpay_payment_id")
        razorpay_signature = request.data.get("razorpay_signature")

        if not all([booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            return Response(
                {"error": "Missing required payment fields."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        body = f"{razorpay_order_id}|{razorpay_payment_id}"
        expected_sig = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
            body.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(expected_sig, razorpay_signature):
            return Response(
                {"error": "Invalid payment signature."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            booking = Booking.objects.get(pk=booking_id)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        booking.status = Booking.Status.CONFIRMED
        booking.payment_id = razorpay_payment_id
        booking.save(update_fields=["status", "payment_id", "updated_at"])

        send_booking_confirmation.delay(booking.id)
        send_admin_notification.delay(booking.id)

        return Response({
            "message": "Payment confirmed successfully.",
            "booking_reference": str(booking.reference),
        })


class WebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        import json

        webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET
        signature = request.META.get("HTTP_X_RAZORPAY_SIGNATURE", "")
        body = request.body

        try:
            expected = hmac.new(
                webhook_secret.encode("utf-8"),
                body,
                hashlib.sha256,
            ).hexdigest()
            if not hmac.compare_digest(expected, signature):
                logger.warning("Razorpay webhook: invalid signature")
                return Response({"status": "ok"})
        except Exception as e:
            logger.error(f"Webhook signature error: {e}")
            return Response({"status": "ok"})

        try:
            payload = json.loads(body)
            event = payload.get("event")

            if event == "payment.captured":
                payment = payload["payload"]["payment"]["entity"]
                order_id = payment.get("order_id")
                payment_id = payment.get("id")

                booking = Booking.objects.filter(
                    razorpay_order_id=order_id,
                    status=Booking.Status.PENDING,
                ).first()

                if booking:
                    from payments.tasks import send_booking_confirmation, send_admin_notification
                    booking.status = Booking.Status.CONFIRMED
                    booking.payment_id = payment_id
                    booking.save(update_fields=["status", "payment_id", "updated_at"])
                    send_booking_confirmation.delay(booking.id)
                    send_admin_notification.delay(booking.id)

        except Exception as e:
            logger.error(f"Webhook processing error: {e}")

        return Response({"status": "ok"})