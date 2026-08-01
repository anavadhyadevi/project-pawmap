// Personal stats scoped to the logged-in volunteer — in the real version,
// the backend should filter these by the authenticated user's own ID.
export function getVolunteerStats(fullName) {
  return {
    summary: [
      { label: 'Cases resolved', value: '11' },
      { label: 'Avg. response time', value: '25 min' },
      { label: 'Reliability score', value: '4.5 / 5.0' },
      { label: 'Active since', value: 'Jan 2026' },
    ],
    recentCases: [
      { id: 'CASE-0190', species: 'Dog', location: 'HSR Layout', status: 'In Progress', date: '2026-01-14' },
      { id: 'CASE-0184', species: 'Cat', location: 'HSR Layout', status: 'Resolved', date: '2026-01-12' },
      { id: 'CASE-0176', species: 'Dog', location: 'HSR Layout', status: 'Resolved', date: '2026-01-09' },
    ],
    reliabilityBreakdown: [
      { factor: 'Claims completed on time', score: 92 },
      { factor: 'Cases resolved vs. abandoned', score: 88 },
      { factor: 'Response speed', score: 81 },
    ],
  }
}