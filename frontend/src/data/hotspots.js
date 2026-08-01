// Simulated output of a DBSCAN clustering pass over reported case coordinates.
// In the real pipeline (scikit-learn DBSCAN, per the tech stack), this would
// run server-side over Case.latitude/longitude and return cluster labels;
// points labelled -1 are noise (didn't meet the density threshold to join
// a cluster) — we surface that distinction here too, since it's part of
// what DBSCAN actually returns, not just "here are some circles on a map."
export const HOTSPOTS = [
  {
    id: 'cluster-1',
    ward: 'BTM Layout',
    centroid: { lat: 12.9166, lng: 77.6101 },
    caseCount: 21,
    radiusM: 850,
    dominantSpecies: 'Dog',
    avgSeverity: 'Medium',
  },
  {
    id: 'cluster-2',
    ward: 'HSR Layout',
    centroid: { lat: 12.9121, lng: 77.6446 },
    caseCount: 18,
    radiusM: 700,
    dominantSpecies: 'Dog',
    avgSeverity: 'High',
  },
  {
    id: 'cluster-3',
    ward: 'Koramangala',
    centroid: { lat: 12.9352, lng: 77.6146 },
    caseCount: 14,
    radiusM: 600,
    dominantSpecies: 'Cat',
    avgSeverity: 'Low',
  },
  {
    id: 'cluster-4',
    ward: 'JP Nagar',
    centroid: { lat: 12.9077, lng: 77.5851 },
    caseCount: 11,
    radiusM: 900,
    dominantSpecies: 'Dog',
    avgSeverity: 'Medium',
  },
]

export const NOISE_POINT_COUNT = 9 // cases too sparse to form a cluster