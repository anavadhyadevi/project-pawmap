// Org-scoped stats — in the real version, the backend should filter these
// by the logged-in NGO_Admin's linked `ngo` field (see users/models.py,
// User.ngo is a self-referencing FK for exactly this).
export const NGO_SUMMARY = [
  { label: 'Volunteers under your NGO', value: '18' },
  { label: 'Pending applications', value: '2' },
  { label: 'Cases resolved this month', value: '64' },
  { label: 'Avg. response time', value: '22 min' },
]

export const VOLUNTEER_ACTIVITY = [
  { name: 'Karan Verma', casesResolved: 14, avgResponseMin: 18, reliability: 4.7 },
  { name: 'Anjali Rao', casesResolved: 11, avgResponseMin: 25, reliability: 4.5 },
  { name: 'Meera Iyer', casesResolved: 9, avgResponseMin: 20, reliability: 4.8 },
  { name: 'Sanjay Patil', casesResolved: 6, avgResponseMin: 34, reliability: 4.1 },
]

export const CASES_BY_WARD = [
  { ward: 'BTM Layout', count: 21 },
  { ward: 'HSR Layout', count: 18 },
  { ward: 'Koramangala', count: 14 },
  { ward: 'JP Nagar', count: 11 },
]