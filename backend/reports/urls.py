from django.urls import path
from .views import RevenueReportView, OccupancyReportView, ExportCSVView

urlpatterns = [
    path("revenue/", RevenueReportView.as_view(), name="report_revenue"),
    path("occupancy/", OccupancyReportView.as_view(), name="report_occupancy"),
    path("export/", ExportCSVView.as_view(), name="report_export"),
]