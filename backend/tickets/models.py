import uuid

from django.db import models

# Create your models here.
# Create the Tickets model with the Ticket Status, the Priority to be given to the ticekt and the Meta for ordering 
class Ticket(models.Model): 
    class Status(models.TextChoices):
        OPEN = 'open',
        IN_PROGRESS = 'in_progress',
        CLOSED = 'closed',

    class Priority(models.TextChoices):
        LOW = 'low',
        MEDIUM = 'medium',
        HIGH = 'high',

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN, db_index=True)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at', 'id']

    def __str__(self):
        return self.title