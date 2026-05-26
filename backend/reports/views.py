import csv
import io
import datetime
from django.db.models import Sum, Count, F
from django.http import StreamingHttpResponse, HttpResponse
from django.utils.dateparse import parse_date
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from bookings.models import Booking
from rooms.models import Room
from settings_app.models import HotelSettings

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
            .annotate(
                revenue=Sum("total_amount"), 
                tax=Sum("tax_amount"),
                base=Sum("base_amount"),
                discount=Sum("discount_amount"),
                booking_count=Count("id")
            )
            .order_by("check_in")
        )

        total_revenue = sum(row["revenue"] or 0 for row in data)
        total_tax = sum(row["tax"] or 0 for row in data)
        total_base = sum(row["base"] or 0 for row in data)
        total_discount = sum(row["discount"] or 0 for row in data)
        total_bookings = sum(row["booking_count"] for row in data)
        
        today = datetime.date.today()
        today_bookings_count = Booking.objects.filter(
            check_in=today,
            status__in=CONFIRMED_STATUSES
        ).count()

        return Response({
            "from": str(from_date),
            "to": str(to_date),
            "total_revenue": total_revenue,
            "total_tax": total_tax,
            "total_base": total_base,
            "total_discount": total_discount,
            "total_bookings": total_bookings,
            "today_bookings_count": today_bookings_count,
            "inventory": {
                "available": Room.objects.filter(status="Available").count(),
                "occupied": Room.objects.filter(status="Occupied").count(),
                "maintenance": Room.objects.filter(status__in=["Maintenance", "Cleaning"]).count(),
            },
            "daily": [
                {
                    "date": str(row["check_in"]),
                    "revenue": row["revenue"],
                    "tax": row["tax"],
                    "base": row["base"],
                    "discount": row["discount"],
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
            bookings = Booking.objects.filter(
                room=room,
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
                "room_id": room.pk,
                "room_number": room.room_number,
                "room_type": room.room_type,
                "occupied_nights": occupied_nights,
                "total_nights": total_nights,
                "occupancy_percent": pct,
            })

        overall_pct = (
            round(sum(r["occupied_nights"] for r in result) / (total_nights * len(result)) * 100, 1)
            if result and total_nights and len(result) > 0 else 0
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
        from settings_app.models import HotelSettings
        h_settings = HotelSettings.get_settings()

        bookings = (
            Booking.objects.filter(check_in__gte=from_date, check_in__lte=to_date)
            .select_related("room", "guest", "promo_code")
            .order_by("check_in")
        )

        # Use pseudo-buffer for better streaming if large, but stay with CSV writer
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="luxury_ledger_{from_date}_{to_date}.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            "TRANSACTION REF", "GUEST NAME", "ID TYPE", "ID NUMBER", 
            "ROOM", "ROOM TYPE", "CHECK-IN", "CHECK-OUT", "NIGHTS",
            "BASE REVENUE", "DISCOUNT APPLIED", "TAXABLE AMOUNT", 
            f"GST ({h_settings.tax_rate:.0f}%)", "TOTAL SETTLEMENT", "STATUS", "PAYMENT REF"
        ])

        for b in bookings:
            taxable = b.base_amount - b.discount_amount
            writer.writerow([
                str(b.reference).upper()[:8],
                b.guest.full_name.upper(),
                b.guest.id_type,
                b.guest.id_number,
                f"Suite {b.room.room_number}",
                b.room.room_type,
                b.check_in,
                b.check_out,
                b.nights,
                float(b.base_amount),
                float(b.discount_amount),
                float(taxable),
                float(b.tax_amount),
                float(b.total_amount),
                b.status.upper(),
                b.payment_id or "N/A"
            ])

        return response
