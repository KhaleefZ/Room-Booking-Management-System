from django.urls import path
from .views import CreateOrderView, VerifyPaymentView, WebhookView

urlpatterns = [
    path("create-order/", CreateOrderView.as_view(), name="payment_create_order"),
    path("verify/", VerifyPaymentView.as_view(), name="payment_verify"),
    path("webhook/", WebhookView.as_view(), name="payment_webhook"),
]