from django.db import models
from django.conf import settings


class MedicalRecord(models.Model):

    ENTRY_TYPES = [
        ('diagnosis',   'Diagnosis'),
        ('vaccination', 'Vaccination'),
        ('treatment',   'Treatment'),
        ('deworming',   'Deworming'),
        ('sterilisation', 'Sterilisation'),
        ('weight',      'Weight Check'),
        ('other',       'Other'),
    ]

    record_id    = models.CharField(max_length=20, unique=True, editable=False)
    animal       = models.ForeignKey(
                      'animals.Animal',
                      on_delete=models.CASCADE,
                      related_name='medical_records'
                   )
    vet          = models.ForeignKey(
                      settings.AUTH_USER_MODEL,
                      on_delete=models.SET_NULL,
                      null=True, blank=True,
                      related_name='medical_entries'
                   )
    entry_type   = models.CharField(max_length=20, choices=ENTRY_TYPES)
    details      = models.TextField()
    next_due_date = models.DateField(null=True, blank=True)
    timestamp    = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.record_id:
            last = MedicalRecord.objects.order_by('-timestamp').first()
            if last and last.record_id:
                num = int(last.record_id.split('-')[1]) + 1
            else:
                num = 1
            self.record_id = f'MED-{num:04d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.record_id} — {self.animal.animal_id} ({self.entry_type})'

    class Meta:
        db_table = 'medical_records'
        ordering = ['timestamp']