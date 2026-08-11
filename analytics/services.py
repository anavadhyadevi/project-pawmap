import numpy as np
from sklearn.cluster import DBSCAN
from collections import Counter
from django.utils import timezone
from datetime import timedelta
from cases.models import Case
from .models import HotspotRun, HotspotCluster


def run_dbscan(eps_m=500, min_samples=5, days=30):
    """
    Run DBSCAN on geo-tagged case coordinates from the last `days` days.
    eps_m is in metres, converted to radians for haversine metric.
    Returns the HotspotRun object.
    """
    cutoff = timezone.now() - timedelta(days=days)

    # fetch cases with valid coordinates
    cases = Case.objects.filter(
        created_at__gte=cutoff,
        latitude__isnull=False,
        longitude__isnull=False,
    ).values('case_id', 'latitude', 'longitude', 'species')

    if len(cases) < min_samples:
        return None, f'Not enough cases ({len(cases)}) to run clustering. Minimum is {min_samples}.'

    # convert to numpy array
    coords = np.array([
        [float(c['latitude']), float(c['longitude'])]
        for c in cases
    ])

    # convert eps from metres to radians (earth radius = 6371000 m)
    eps_rad = eps_m / 6371000.0

    # run DBSCAN
    coords_rad = np.radians(coords)
    db = DBSCAN(
        eps=eps_rad,
        min_samples=min_samples,
        algorithm='ball_tree',
        metric='haversine'
    ).fit(coords_rad)

    labels = db.labels_

    # create HotspotRun record
    run = HotspotRun.objects.create(
        eps_m=eps_m,
        min_samples=min_samples,
        total_cases_processed=len(cases)
    )

    # process each cluster (ignore noise = -1)
    unique_labels = set(labels)
    species_list  = [c['species'] for c in cases]

    for label in unique_labels:
        if label == -1:
            continue  # skip noise

        mask            = labels == label
        cluster_coords  = coords[mask]
        cluster_species = [species_list[i] for i, m in enumerate(mask) if m]

        centroid_lat = float(np.mean(cluster_coords[:, 0]))
        centroid_lon = float(np.mean(cluster_coords[:, 1]))
        dominant     = Counter(cluster_species).most_common(1)[0][0]

        HotspotCluster.objects.create(
            run=run,
            cluster_label=int(label),
            centroid_lat=round(centroid_lat, 6),
            centroid_lon=round(centroid_lon, 6),
            case_count=int(np.sum(mask)),
            dominant_species=dominant
        )

    return run, None