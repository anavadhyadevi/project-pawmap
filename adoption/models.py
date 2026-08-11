from django.db import models
from django.conf import settings


class AdoptionListing(models.Model):

    STATUS_CHOICES = [
        ('Active',     'Active'),
        ('Pending',    'Pending'),
        ('Completed',  'Completed'),
        ('Withdrawn',  'Withdrawn'),
    ]

    listing_id   = models.CharField(max_length=20, unique=True, editable=False)
    animal       = models.OneToOneField(
                      'animals.Animal',
                      on_delete=models.CASCADE,
                      related_name='adoption_listing'
                   )
    published_by = models.ForeignKey(
                      settings.AUTH_USER_MODEL,
                      on_delete=models.SET_NULL,
                      null=True, blank=True,
                      related_name='published_listings'
                   )
    published_at = models.DateTimeField(auto_now_add=True)
    status       = models.CharField(
                      max_length=20,
                      choices=STATUS_CHOICES,
                      default='Active'
                   )

    def save(self, *args, **kwargs):
        if not self.listing_id:
            last = AdoptionListing.objects.order_by('-published_at').first()
            if last and last.listing_id:
                num = int(last.listing_id.split('-')[1]) + 1
            else:
                num = 1
            self.listing_id = f'LIST-{num:04d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.listing_id} — {self.animal.animal_id} ({self.status})'

    class Meta:
        db_table = 'adoption_listings'
        ordering = ['-published_at']


class AdopterInterest(models.Model):
    listing                = models.ForeignKey(
                                AdoptionListing,
                                on_delete=models.CASCADE,
                                related_name='interests'
                             )
    adopter                = models.ForeignKey(
                                settings.AUTH_USER_MODEL,
                                on_delete=models.CASCADE,
                                related_name='adoption_interests'
                             )
    home_readiness_complete = models.BooleanField(default=False)
    expressed_at           = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.adopter.full_name} → {self.listing.listing_id}'

    class Meta:
        db_table        = 'adopter_interests'
        unique_together = ('listing', 'adopter')
        ordering        = ['expressed_at']


class AdoptionRecord(models.Model):
    adoption_id              = models.CharField(max_length=20, unique=True, editable=False)
    listing                  = models.OneToOneField(
                                  AdoptionListing,
                                  on_delete=models.CASCADE,
                                  related_name='adoption_record'
                               )
    adopter                  = models.ForeignKey(
                                  settings.AUTH_USER_MODEL,
                                  on_delete=models.CASCADE,
                                  related_name='adoptions'
                               )
    approved_at              = models.DateTimeField(auto_now_add=True)
    completed_at             = models.DateTimeField(null=True, blank=True)
    welfare_survey_30d_sent  = models.BooleanField(default=False)
    welfare_survey_90d_sent  = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.adoption_id:
            last = AdoptionRecord.objects.order_by('-approved_at').first()
            if last and last.adoption_id:
                num = int(last.adoption_id.split('-')[1]) + 1
            else:
                num = 1
            self.adoption_id = f'ADOPT-{num:04d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.adoption_id} — {self.adopter.full_name}'

    class Meta:
        db_table = 'adoption_records'