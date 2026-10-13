from django.urls import path, re_path

from .views import TicketDetailView, TicketListCreateView, TicketStatsView

# "stats" must be declared before the <uuid> route. Trailing slash is optional.
urlpatterns = [
    re_path(r"^tickets/?$", TicketListCreateView.as_view(), name="ticket-list"),
    re_path(r"^tickets/stats/?$", TicketStatsView.as_view(), name="ticket-stats"),
    path("tickets/<uuid:pk>", TicketDetailView.as_view(), name="ticket-detail"),
    path("tickets/<uuid:pk>/", TicketDetailView.as_view()),
]