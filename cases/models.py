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
        ('On_Site',      'On Site'),
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
            last = Case.objects.order_by('-id').first()
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
            last = CaseStatusLog.objects.order_by('-id').first()
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


class LostPetReport(models.Model):
    STATUS_CHOICES = [
        ('Active',   'Active'),
        ('Matched',  'Matched'),
        ('Closed',   'Closed'),
    ]

    lost_report_id          = models.CharField(max_length=20, unique=True, editable=False)
    owner                   = models.ForeignKey(
                                settings.AUTH_USER_MODEL,
                                on_delete=models.CASCADE,
                                related_name='lost_reports'
                              )
    pet_name                = models.CharField(max_length=100)
    species                 = models.CharField(max_length=50)
    breed                   = models.CharField(max_length=100, blank=True, default='Unknown')
    photo                   = models.ImageField(upload_to='lost_photos/', null=True, blank=True)
    last_seen_location      = models.CharField(max_length=200)
    last_seen_date          = models.DateField()
    distinguishing_features = models.TextField(blank=True, default='')
    collar_tag              = models.CharField(max_length=100, blank=True, default='')
    microchip_id            = models.CharField(max_length=100, blank=True, default='')
    reward                  = models.CharField(max_length=100, blank=True, default='')
    status                  = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    created_at              = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.lost_report_id:
            last = LostPetReport.objects.order_by('-id').first()
            if last and last.lost_report_id:
                num = int(last.lost_report_id.split('-')[1]) + 1
            else:
                num = 1
            self.lost_report_id = f'LOST-{num:04d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.lost_report_id} — {self.pet_name} ({self.species})'

    class Meta:
        db_table = 'lost_pet_reports'
        ordering = ['-created_at']


class FoundPetReport(models.Model):
    STATUS_CHOICES = [
        ('Active',  'Active'),
        ('Matched', 'Matched'),
        ('Closed',  'Closed'),
    ]

    found_report_id         = models.CharField(max_length=20, unique=True, editable=False)
    reporter                = models.ForeignKey(
                                settings.AUTH_USER_MODEL,
                                on_delete=models.CASCADE,
                                related_name='found_reports'
                              )
    species                 = models.CharField(max_length=50)
    breed                   = models.CharField(max_length=100, blank=True, default='Unknown')
    photo                   = models.ImageField(upload_to='found_photos/', null=True, blank=True)
    found_location          = models.CharField(max_length=200)
    found_date              = models.DateField()
    ownership_signs         = models.TextField(blank=True, default='')
    current_custody         = models.CharField(max_length=200, blank=True, default='')
    distinguishing_features = models.TextField(blank=True, default='')
    linked_animal           = models.ForeignKey(
                                'animals.Animal',
                                on_delete=models.SET_NULL,
                                null=True, blank=True,
                                related_name='found_reports'
                              )
    status                  = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    created_at              = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.found_report_id:
            last = FoundPetReport.objects.order_by('-id').first()
            if last and last.found_report_id:
                num = int(last.found_report_id.split('-')[1]) + 1
            else:
                num = 1
            self.found_report_id = f'FOUND-{num:04d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.found_report_id} — {self.species}'

    class Meta:
        db_table = 'found_pet_reports'
        ordering = ['-created_at']

class CaseNotification(models.Model):
    case         = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='notifications')
    volunteer    = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='case_notifications')
    notified_at  = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'case_notifications'
        unique_together = ('case', 'volunteer')