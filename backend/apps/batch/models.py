from django.db import models
import uuid

class Batch(models.Model):
    id=models.UUIDField(primary_key=True,editable=False,default=uuid.uuid4)