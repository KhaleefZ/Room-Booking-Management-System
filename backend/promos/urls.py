from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PromoCodeViewSet, PromoValidateView

router = DefaultRouter()
router.register(r"", PromoCodeViewSet, basename="promo")

urlpatterns = [
    path("validate/", PromoValidateView.as_view(), name="promo_validate"),
    path("", include(router.urls)),
]