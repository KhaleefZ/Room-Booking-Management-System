import csv
import datetime
from django.db.models import Sum, Count
from django.http import StreamingHttpResponse
from django.utils.dateparse import parse_date
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from bookings.models import Booking
from rooms.models import Room

CONFIRMED_STATUSES = [
    Booking.Status.CONFIRMED,
    Booking.Status.CHECKED_IN,
    Booking.Status.CHECKED_OUT,
]


def _parse_date_params(request):
    today = datetime.date.today()
    from_date = parse_date(request.query_params.get("from", "")) or today.replace(day=1)
    to_date = parse_date(request.query_params.get("to", "")) or today
    return from_date, to_date


class RevenueReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from_date, to_date = _parse_date_params(request)

        data = (
            Booking.objects.filter(
                status__in=CONFIRMED_STATUSES,
                check_in__gte=from_date,
                check_in__lte=to_date,
            )
            .values("check_in")
            .annotate(revenue=Sum("total_amount"), booking_count=Count("id"))
            .order_by("check_in")
        )

        total_revenue = sum(row["revenue"] for row in data)
        total_bookings = sum(row["booking_count"] for row in data)

        return Response({
            "from": str(from_date),
            "to": str(to_date),
            "total_revenue": total_revenue,
            "total_bookings": total_bookings,
            "daily": [
                {
                    "date": str(row["check_in"]),
                    "revenue": row["revenue"],
                    "booking_count": row["booking_count"],
                }
                for row in data
            ],
        })


class OccupancyReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from_date, to_date = _parse_date_params(request)
        total_nights = (to_date - from_date).days + 1
        rooms = Room.objects.prefetch_related("bookings").all()
        result = []

        for room in rooms:
            bookings = room.bookings.filter(
                status__in=CONFIRMED_STATUSES,
                check_in__lte=to_date,
                check_out__gt=from_date,
            )
            occupied_nights = 0
            for booking in bookings:
                start = max(booking.check_in, from_date)
                end = min(booking.check_out, to_date + datetime.timedelta(days=1))
                occupied_nights += (end - start).days

            pct = round((occupied_nights / total_nights) * 100, 1) if total_nights else 0
            result.append({
                "room_id": room.id,
                "room_number": room.room_number,
                "room_type": room.room_type,
                "occupied_nights": occupied_nights,
                "total_nights": total_nights,
                "occupancy_percent": pct,
            })

        overall_pct = (
            round(sum(r["occupied_nights"] for r in result) / (total_nights * len(result)) * 100, 1)
            if result and total_nights else 0
        )

        return Response({
            "from": str(from_date),
            "to": str(to_date),
            "total_nights": total_nights,
            "overall_occupancy_percent": overall_pct,
            "rooms": result,
        })


class ExportCSVView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from_date, to_date = _parse_date_params(request)

        bookings = (
            Booking.objects.filter(check_in__gte=from_date, check_in__lte=to_date)
            .select_related("room", "guest", "promo_code")
            .order_by("check_in")
        )

        def row_generator():
            yield [
                "Reference", "Guest Name", "Email", "Room", "Check-in",
                "Check-out", "Nights", "Base Amount", "Discount",
                "Tax", "Total Amount", "Status", "Promo Code",
                "Payment ID", "Created At",
            ]
            for b in bookings:
                yield [
                    str(b.reference),
                    b.guest.full_name,
                    b.guest.email,
                    f"Room {b.room.room_number} ({b.room.room_type})",
                    str(b.check_in),
                    str(b.check_out),
                    b.nights,
                    b.base_amount,
                    b.discount_amount,
                    b.tax_amount,
                    b.total_amount,
                    b.status,
                    b.promo_code.code if b.promo_code else "",
                    b.payment_id,
                    b.created_at.strftime("%Y-%m-%d %H:%M"),
                ]

        class EchoBuffer:
            def write(self, value):
                return value

        writer = csv.writer(EchoBuffer())
        response = StreamingHttpResponse(
            (writer.writerow(row) for row in row_generator()),
            content_type="text/csv",
        )
        response["Content-Disposition"] = (
            f'attachment; filename="bookings_{from_date}_to_{to_date}.csv"'
        )
        return response