#Create serializers for the Ticket model to convert the model instances to JSON format and vice versa hence controlling what comes in and what goes out of the API endpoints.
from rest_framework import serializers
from .models import Ticket

class TicketSerializer(serializers.ModelSerializer):
    #Will be used to create and read  all status or priority values for the ticket model
    class Meta:
        model = Ticket
        fields = '__all__'
        read_only_fields = ['id', 'created_at']  # Make 'id' and 'created_at' read-only 
        extra_kwargs = {"title": {"allow_blank": False, "trim_whitespace": True}}  # Ensure title is not blank and whitespace is trimmed"}

class TicketUpdateSerializer(serializers.ModelSerializer):
    #Will be used to update the status or priority values for the ticket model
    class Meta:
        model = Ticket
        fields = ['status', 'priority']  # Only allow updating status and priority
        