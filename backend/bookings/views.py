from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
import datetime

from .models import Booking, Invoice
from .serializers import (
    BookingCreateSerializer, BookingListSerializer,
    BookingDetailSerializer, BookingStatusUpdateSerializer,
    InvoiceSerializer
)


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.select_related("room", "guest", "promo_code").all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "room", "check_in", "check_out"]
    search_fields = ["guest__full_name", "guest__email", "reference"]
    ordering_fields = ["created_at", "check_in", "total_amount"]

    def get_serializer_class(self):
        if self.action == "create":
            return BookingCreateSerializer
        if self.action == "list":
            return BookingListSerializer
        if self.action == "update_status":
            return BookingStatusUpdateSerializer
        return BookingDetailSerializer

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        serializer = BookingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        return Response(
            BookingDetailSerializer(booking).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def checkout(self, request, pk=None):
        booking = self.get_object()
        
        if booking.status != Booking.Status.CHECKED_IN:
            return Response(
                {"error": "Only CheckedIn bookings can be checked out."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1. Create Invoice
        invoice, created = Invoice.objects.get_or_create(
            booking=booking,
            defaults={
                "guest_name": booking.guest.full_name,
                "guest_email": booking.guest.email,
                "guest_phone": booking.guest.phone,
                "guest_address": booking.guest.address,
                "room_details": f"{booking.room.room_type} - Room {booking.room.room_number}",
                "check_in": booking.check_in,
                "check_out": booking.check_out,
                "nights": booking.nights,
                "base_amount": booking.base_amount,
                "tax_amount": booking.tax_amount,
                "discount_amount": booking.discount_amount,
                "total_amount": booking.total_amount,
            }
        )

        # 2. Update Booking Status
        booking.status = Booking.Status.CHECKED_OUT
        booking.save(update_fields=["status", "updated_at"])

        # 3. Update Room Status
        room = booking.room
        from rooms.models import Room
        room.status = Room.Status.CLEANING
        # Room model does not have updated_at
        room.save(update_fields=["status"])

        # 4. Trigger Email Task
        from payments.tasks import send_checkout_invoice
        send_checkout_invoice.delay(invoice.id)

        return Response({
            "message": "Checkout successful",
            "invoice": InvoiceSerializer(invoice).data,
            "booking": BookingDetailSerializer(booking).data
        })

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def download_invoice(self, request, pk=None):
        booking = self.get_object()
        try:
            from .invoice_model import Invoice
            invoice = Invoice.objects.filter(booking=booking).first()
            
            if not invoice or not invoice.pdf_file or not invoice.pdf_generated:
                from .utils import generate_invoice_pdf
                if not invoice:
                    invoice = Invoice.objects.create(
                        booking=booking,
                        guest_name=booking.guest.full_name,
                        guest_email=booking.guest.email,
                        guest_phone=booking.guest.phone,
                        guest_address=booking.guest.address,
                        room_details=f"Unit {booking.room.room_number} ({booking.room.room_type})",
                        check_in=booking.check_in,
                        check_out=booking.check_out,
                        nights=booking.nights,
                        total_amount=booking.total_amount,
                        tax_amount=booking.tax_amount,
                        base_amount=booking.base_amount,
                        discount_amount=booking.discount_amount,
                    )
                generate_invoice_pdf(invoice)
                invoice.refresh_from_db()

            # Method: Generate PDF on the fly and stream it directly
            # This is the most reliable method as it avoids all cloud storage 401/404 issues
            from django.template.loader import get_template
            from xhtml2pdf import pisa
            from io import BytesIO
            from django.http import HttpResponse
            from django.conf import settings
            from settings_app.models import HotelSettings
            from rooms.models import Room

            hotel = HotelSettings.get_settings()
            hotel_name = hotel.hotel_name
            hotel_address = hotel.hotel_address
            hotel_phone = hotel.hotel_phone
            hotel_email = hotel.hotel_email
            
            # Fetch full room object for physical address if available
            room_obj = None
            try:
                # Based on room_details link it back to a room number
                room_num = invoice.room_details.split(' ')[1] 
                room_obj = Room.objects.filter(room_number=room_num).first()
            except:
                pass

            import os
            import base64
            from PIL import Image, ImageDraw
            logo_base64 = ""
            try:
                logo_path = os.path.join(settings.BASE_DIR.parent, 'frontend', 'public', 'src', 'assets', 'Invoice Logo.png')
                if not os.path.exists(logo_path):
                    logo_path = os.path.join(settings.BASE_DIR, 'bookings', 'Invoice Logo.png')
                with open(logo_path, 'rb') as f:
                    logo_base64 = base64.b64encode(f.read()).decode('utf-8')
            except Exception as e:
                pass

            globe_base64 = ""
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
            except Exception as e:
                pass

            phone_base64 = ""
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
            except Exception as e:
                pass

            email_base64 = ""
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
            except Exception as e:
                pass

            from decimal import Decimal
            rooms = [r.strip() for r in invoice.room_details.split(",") if r.strip()]
            num_rooms = len(rooms) if rooms else 1
            base_amount = Decimal(str(invoice.base_amount))
            price_per_room = (base_amount / num_rooms).quantize(Decimal("0.01"))
            rooms_list = [{'name': r, 'price': price_per_room} for r in rooms]

            context = {
                'invoice': invoice,
                'hotel_name': hotel_name,
                'hotel_address': hotel_address,
                'hotel_contact': f"{hotel_phone} | {hotel_email}",
                'check_in_time': hotel.check_in_time.strftime("%I:%M %p"),
                'check_out_time': hotel.check_out_time.strftime("%I:%M %p"),
                'tax_rate': hotel.tax_rate,
                'room': room_obj,
                'is_formal': True,
                'logo_base64': logo_base64,
                'globe_base64': globe_base64,
                'phone_base64': phone_base64,
                'email_base64': email_base64,
                'rooms_list': rooms_list
            }
            
            template = get_template('invoices/invoice_pdf.html')
            html = template.render(context)
            
            result = BytesIO()
            pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result)
            
            response = HttpResponse(result.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="Invoice_{invoice.invoice_number}.pdf"'
            return response

        except Exception as e:
            return Response({"error": f"Invoice generation error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=["patch"], permission_classes=[IsAuthenticated])
    def update_status(self, request, pk=None):  
        booking = self.get_object()
        serializer = BookingStatusUpdateSerializer(
            instance=booking, data=request.data
        )
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()

        # Fire confirmation emails when manually confirmed by admin
        if updated.status == "Confirmed":
            from payments.tasks import send_booking_confirmation, send_admin_notification
            send_booking_confirmation.delay(updated.id)
            send_admin_notification.delay(updated.id)

        return Response(BookingDetailSerializer(updated).data)


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        invoice = serializer.save()
        invoice.pdf_generated = False
        invoice.save(update_fields=['pdf_generated'])

    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        invoice = self.get_object()
        
        try:
            if not invoice.pdf_file or not invoice.pdf_generated:
                from .utils import generate_invoice_pdf
                generate_invoice_pdf(invoice)
                invoice.refresh_from_db()

            from django.template.loader import get_template
            from xhtml2pdf import pisa
            from io import BytesIO
            from django.http import HttpResponse
            from django.conf import settings
            from settings_app.models import HotelSettings

            hotel = HotelSettings.get_settings()
            
            import os
            import base64
            from PIL import Image, ImageDraw
            
            logo_base64 = ""
            try:
                logo_path = os.path.join(settings.BASE_DIR.parent, 'frontend', 'public', 'src', 'assets', 'Invoice Logo.png')
                if not os.path.exists(logo_path):
                    logo_path = os.path.join(settings.BASE_DIR, 'bookings', 'Invoice Logo.png')
                with open(logo_path, 'rb') as f:
                    logo_base64 = base64.b64encode(f.read()).decode('utf-8')
            except Exception:
                pass

            globe_base64 = ""
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
            except Exception:
                pass

            phone_base64 = ""
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
            except Exception:
                pass

            email_base64 = ""
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
            except Exception:
                pass

            from decimal import Decimal
            rooms = [r.strip() for r in invoice.room_details.split(",") if r.strip()]
            num_rooms = len(rooms) if rooms else 1
            base_amount = Decimal(str(invoice.base_amount))
            price_per_room = (base_amount / num_rooms).quantize(Decimal("0.01"))
            rooms_list = [{'name': r, 'price': price_per_room} for r in rooms]

            context = {
                'invoice': invoice,
                'hotel_name': hotel.hotel_name,
                'hotel_address': hotel.hotel_address,
                'hotel_contact': f"{hotel.hotel_phone} | {hotel.hotel_email}",
                'check_in_time': hotel.check_in_time.strftime("%I:%M %p"),
                'check_out_time': hotel.check_out_time.strftime("%I:%M %p"),
                'tax_rate': hotel.tax_rate,
                'is_formal': True,
                'logo_base64': logo_base64,
                'globe_base64': globe_base64,
                'phone_base64': phone_base64,
                'email_base64': email_base64,
                'rooms_list': rooms_list
            }
            
            template = get_template('invoices/invoice_pdf.html')
            html = template.render(context)
            
            result = BytesIO()
            pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result)
            
            response = HttpResponse(result.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="Invoice_{invoice.invoice_number}.pdf"'
            return response

        except Exception as e:
            return Response({"error": f"Invoice generation error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)