from django.db import models
from django.conf import settings


class Ward(models.Model):
    ward_name    = models.CharField(max_length=100, primary_key=True)
    city         = models.CharField(max_length=100, default='Bengaluru')
    centroid_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    centroid_lon = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    def __str__(self):
        return self.ward_name

    class Meta:
        db_table = 'wards'


class AnimalType(models.Model):
    species = models.CharField(max_length=50)
    breed   = models.CharField(max_length=100)

    def __str__(self):
        return f'{self.species} — {self.breed}'

    class Meta:
        db_table = 'animal_types'
        unique_together = ('species', 'breed')


class Case(models.Model):

    STATUS_CHOICES = [
        ('Open',        'Open'),
        ('In_Progress', 'In Progress'),
        ('Resolved',    'Resolved'),
        ('Escalated',   'Escalated'),
        ('Unresolved',  'Unresolved'),
    ]

    AGE_CHOICES = [
        ('Puppy',    'Puppy'),
        ('Kitten',   'Kitten'),
        ('Calf',     'Calf'),
        ('Juvenile', 'Juvenile'),
        ('Adult',    'Adult'),
        ('Senior',   'Senior'),
    ]

    BYSTANDER_CHOICES = [
        ('none',          'None'),
        ('fed',           'Fed'),
        ('contacted_ngo', 'Contacted NGO'),
    ]

    # ── identifiers ──────────────────────────────────────────
    case_id   = models.CharField(max_length=20, unique=True, editable=False)

    # ── location ─────────────────────────────────────────────
    latitude   = models.DecimalField(max_digits=10, decimal_places=6)
    longitude  = models.DecimalField(max_digits=10, decimal_places=6)
    ward       = models.ForeignKey(
                    Ward, on_delete=models.SET_NULL,
                    null=True, blank=True, db_column='ward_name'
                 )

    # ── animal details ────────────────────────────────────────
    species          = models.CharField(max_length=50)
    breed            = models.CharField(max_length=100, blank=True, default='Unknown')
    estimated_age    = models.CharField(max_length=20, choices=AGE_CHOICES, default='Adult')
    severity         = models.SmallIntegerField(default=1)  # 1-5
    aggression_level = models.SmallIntegerField(default=1)  # 1-5
    injury_type      = models.CharField(max_length=200, blank=True, default='')
    bystander_action = models.CharField(
                          max_length=20, choices=BYSTANDER_CHOICES, default='none'
                       )
    description      = models.TextField(blank=True, default='')
    photo_url        = models.URLField(max_length=500, blank=True, default='')
    photo            = models.ImageField(
                          upload_to='case_photos/', null=True, blank=True
                       )

    # ── status ────────────────────────────────────────────────
    status            = models.CharField(
                           max_length=20, choices=STATUS_CHOICES, default='Open'
                        )
    response_time_min = models.DecimalField(
                           max_digits=6, decimal_places=1, null=True, blank=True
                        )

    # ── relationships ─────────────────────────────────────────
    reporter  = models.ForeignKey(
                   settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                   null=True, blank=True, related_name='reported_cases'
                )
    volunteer = models.ForeignKey(
                   settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                   null=True, blank=True, related_name='claimed_cases'
                )
    # animal FK will be added when animals app is built
    # animal = models.OneToOneField('animals.Animal', ...)

    # ── timestamps ────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.case_id:
            last = Case.objects.order_by('-created_at').first()
            if last and last.case_id:
                num = int(last.case_id.split('-')[1]) + 1
            else:
                num = 1
            self.case_id = f'CASE-{num:04d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.case_id} — {self.species} ({self.status})'

    class Meta:
        db_table = 'cases'
        ordering = ['-created_at']


class CaseStatusLog(models.Model):
    log_id     = models.CharField(max_length=20, unique=True, editable=False)
    case       = models.ForeignKey(
                    Case, on_delete=models.CASCADE, related_name='status_logs'
                 )
    actor      = models.ForeignKey(
                    settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                    null=True, blank=True, related_name='status_actions'
                 )
    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    changed_at = models.DateTimeField(auto_now_add=True)
    note       = models.CharField(max_length=500, blank=True, default='')
    is_auto_release = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.log_id:
            last = CaseStatusLog.objects.order_by('-changed_at').first()
            if last and last.log_id:
                num = int(last.log_id.split('-')[1]) + 1
            else:
                num = 1
            self.log_id = f'LOG-{num:04d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.log_id} — {self.old_status} → {self.new_status}'

    class Meta:
        db_table  = 'case_status_logs'
        ordering  = ['changed_at']