#Make necessary imports for the views.py file to handle API requests and responses for the Ticket model.
from rest_framework.pagination import PageNumberPagination
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateAPIView
from .serializers import TicketSerializer, TicketUpdateSerializer
from .models import Ticket
from rest_framework.exceptions import ValidationError


# Create your views here.
# A pagination view to control the number of tickets displayed per page in the API response.
class TicketPagination(PageNumberPagination):
    page_size = 10  # Number of tickets per page
    page_size_query_param = 'limit'  # Sets the limit query parameter to control the number of tickets per page
    max_page_size = 100  # Maximum number of tickets per page

#Create a POST view for listing all the tickets in the database. The view will use the TicketPagination class to paginate the results and return a paginated response.
class TicketListCreateView(ListCreateAPIView):
    serializer_class = TicketSerializer
    pagination_class = TicketPagination

    def get_queryset(self):
        qs = Ticket.objects.all()
        status_param = self.request.query_params.get("status")
        if status_param:
            if status_param not in Ticket.Status.values:
                raise ValidationError({"status": f"Must be one of: {', '.join(Ticket.Status.values)}"})
            qs = qs.filter(status=status_param)
        return qs