from django.db import models


class HotspotRun(models.Model):
    run_id                = models.CharField(max_length=20, unique=True, editable=False)
    run_date              = models.DateField(auto_now_add=True)
    eps_m                 = models.DecimalField(max_digits=6, decimal_places=1, default=500.0)
    min_samples           = models.SmallIntegerField(default=5)
    total_cases_processed = models.IntegerField(default=0)
    created_at            = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.run_id:
            last = HotspotRun.objects.order_by('-id').first()
            if last and last.run_id:
                num = int(last.run_id.split('-')[1]) + 1
            else:
                num = 1
            self.run_id = f'RUN-{num:04d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.run_id} — {self.run_date}'

    class Meta:
        db_table = 'hotspot_runs'
        ordering = ['-created_at']


class HotspotCluster(models.Model):
    run             = models.ForeignKey(
                         HotspotRun,
                         on_delete=models.CASCADE,
                         related_name='clusters'
                      )
    cluster_label   = models.SmallIntegerField()  # -1 = noise
    centroid_lat    = models.DecimalField(max_digits=9, decimal_places=6)
    centroid_lon    = models.DecimalField(max_digits=9, decimal_places=6)
    case_count      = models.IntegerField(default=0)
    dominant_species = models.CharField(max_length=50, blank=True, default='')

    def __str__(self):
        return f'Cluster {self.cluster_label} — {self.case_count} cases'

    class Meta:
        db_table = 'hotspot_clusters'