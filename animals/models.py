from django.db import models
from django.conf import settings


class Animal(models.Model):

    ADOPTION_STATUS = [
        ('Not_Available',    'Not Available'),
        ('Available',        'Available'),
        ('Adoption_Pending', 'Adoption Pending'),
        ('Adopted',          'Adopted'),
        ('Fostered',         'Fostered'),
    ]

    OWNERSHIP_STATUS = [
        ('Stray',     'Stray'),
        ('Abandoned', 'Abandoned'),
        ('Owned',     'Owned'),
        ('Unknown',   'Unknown'),
    ]

    # ── identifiers ──────────────────────────────────────────
    animal_id = models.CharField(max_length=20, unique=True, editable=False)

    # ── type ─────────────────────────────────────────────────
    species = models.CharField(max_length=50)
    breed   = models.CharField(max_length=100, blank=True, default='Unknown')
    name    = models.CharField(max_length=100, blank=True, default='')

    # ── details ───────────────────────────────────────────────
    estimated_age           = models.CharField(max_length=50, blank=True, default='')
    distinguishing_features = models.TextField(blank=True, default='')
    photo                   = models.ImageField(
                                upload_to='animal_photos/',
                                null=True, blank=True
                              )

    # ── computed/scored fields ────────────────────────────────
    temperament_score = models.DecimalField(
                            max_digits=3, decimal_places=1,
                            null=True, blank=True
                        )  # weighted average of TemperamentRating

    # ── status ────────────────────────────────────────────────
    adoption_status  = models.CharField(
                          max_length=20,
                          choices=ADOPTION_STATUS,
                          default='Not_Available'
                       )
    ownership_status = models.CharField(
                          max_length=20,
                          choices=OWNERSHIP_STATUS,
                          default='Unknown'
                       )

    # ── relationships ─────────────────────────────────────────
    # case that led to this animal being rescued
    case = models.OneToOneField(
              'cases.Case',
              on_delete=models.SET_NULL,
              null=True, blank=True,
              related_name='animal'
           )
    # current foster/caretaker
    current_foster = models.ForeignKey(
                        settings.AUTH_USER_MODEL,
                        on_delete=models.SET_NULL,
                        null=True, blank=True,
                        related_name='fostered_animals'
                     )

    # ── timestamps ────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.animal_id:
            last = Animal.objects.order_by('-id').first()
            if last and last.animal_id:
                num = int(last.animal_id.split('-')[1]) + 1
            else:
                num = 1
            self.animal_id = f'ANIMAL-{num:04d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.animal_id} — {self.species} ({self.adoption_status})'

    class Meta:
        db_table = 'animals'
        ordering = ['-created_at']


class TemperamentRating(models.Model):
    animal    = models.ForeignKey(
                   Animal, on_delete=models.CASCADE,
                   related_name='temperament_ratings'
                )
    volunteer = models.ForeignKey(
                   settings.AUTH_USER_MODEL,
                   on_delete=models.SET_NULL,
                   null=True, blank=True,
                   related_name='temperament_ratings'
                )
    score     = models.SmallIntegerField()  # 1-5
    timestamp = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # recompute weighted average on animal after every new rating
        self.animal.refresh_from_db()
        ratings = TemperamentRating.objects.filter(animal=self.animal)
        from django.utils import timezone
        from datetime import timedelta
        cutoff = timezone.now() - timedelta(days=30)
        total_weight = 0
        weighted_sum = 0
        for r in ratings:
            weight = 1.5 if r.timestamp >= cutoff else 1.0
            weighted_sum += r.score * weight
            total_weight += weight
        if total_weight > 0:
            self.animal.temperament_score = round(weighted_sum / total_weight, 1)
            self.animal.save()

    def __str__(self):
        return f'{self.animal.animal_id} — score {self.score}'

    class Meta:
        db_table = 'temperament_ratings'