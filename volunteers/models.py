from django.db import models
from django.conf import settings
from django.utils import timezone


class VolunteerReliabilityScore(models.Model):
    vrs_id                 = models.CharField(max_length=20, unique=True, editable=False)
    volunteer               = models.ForeignKey(
                                 settings.AUTH_USER_MODEL,
                                 on_delete=models.CASCADE,
                                 related_name='vrs_scores'
                              )
    score_date              = models.DateField()
    cases_notified           = models.SmallIntegerField(default=0)
    cases_responded          = models.SmallIntegerField(default=0)
    cases_completed          = models.SmallIntegerField(default=0)
    avg_response_time_min    = models.DecimalField(max_digits=6, decimal_places=1, default=0)
    response_rate            = models.DecimalField(max_digits=4, decimal_places=3, default=0)
    completion_rate          = models.DecimalField(max_digits=4, decimal_places=3, default=0)
    vrs_score                = models.DecimalField(max_digits=4, decimal_places=3, default=0)
    flag_for_review          = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.vrs_id:
            last = VolunteerReliabilityScore.objects.order_by('-id').first()
            if last and last.vrs_id:
                num = int(last.vrs_id.split('-')[1]) + 1
            else:
                num = 1
            self.vrs_id = f'VRS-{num:04d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.vrs_id} — {self.volunteer.full_name} ({self.score_date})'

    class Meta:
        db_table = 'volunteer_reliability_scores'
        unique_together = ('volunteer', 'score_date')
        ordering = ['-score_date']

    @classmethod
    def compute_for_volunteer(cls, volunteer, score_date=None):
        from cases.models import Case, CaseNotification

        score_date = score_date or timezone.now().date()

        notifications = CaseNotification.objects.filter(volunteer=volunteer)
        cases_notified = notifications.count()
        cases_responded = notifications.filter(responded_at__isnull=False).count()

        claimed_cases = Case.objects.filter(volunteer=volunteer)
        cases_completed = claimed_cases.filter(status='Resolved').count()

        response_rate = (cases_responded / cases_notified) if cases_notified else 0
        # A volunteer can legitimately claim a case from the shared queue without
        # first receiving a notification.  Completion must therefore be measured
        # against cases they actually claimed, otherwise resolved work is omitted.
        completion_rate = (cases_completed / claimed_cases.count()) if claimed_cases.exists() else 0

        response_times = list(
            claimed_cases.exclude(response_time_min__isnull=True).values_list('response_time_min', flat=True)
        )
        avg_response_time = float(sum(response_times) / len(response_times)) if response_times else 0
        norm_rt = min(avg_response_time / 30, 1)  # capped so the score can't go negative

        vrs_score = 0.4 * response_rate + 0.4 * completion_rate + 0.2 * (1 - norm_rt)

        obj, _ = cls.objects.update_or_create(
            volunteer=volunteer,
            score_date=score_date,
            defaults=dict(
                cases_notified=cases_notified,
                cases_responded=cases_responded,
                cases_completed=cases_completed,
                avg_response_time_min=round(avg_response_time, 1),
                response_rate=round(response_rate, 3),
                completion_rate=round(completion_rate, 3),
                vrs_score=round(vrs_score, 3),
            )
        )
        obj.flag_for_review = cls.check_consecutive_low(volunteer)
        obj.save()
        return obj

    @classmethod
    def check_consecutive_low(cls, volunteer):
        recent = list(cls.objects.filter(volunteer=volunteer).order_by('-score_date')[:3])
        if len(recent) < 3:
            return False
        return all(r.vrs_score < 0.4 for r in recent)
