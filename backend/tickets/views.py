#Make necessary imports for the views.py file to handle API requests and responses for the Ticket model.
from rest_framework.pagination import PageNumberPagination


# Create your views here.
# A pagination view to control the number of tickets displayed per page in the API response.
class TicketPagination(PageNumberPagination):
    page_size = 10  # Number of tickets per page
    page_size_query_param = 'limit'  # Sets the limit query parameter to control the number of tickets per page
    max_page_size = 100  # Maximum number of tickets per page

# 