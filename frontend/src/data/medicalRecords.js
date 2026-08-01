export const MEDICAL_ANIMALS = [
  {
    animalId: 'AN-0142',
    name: 'Bruno',
    species: 'Dog',
    photo: 'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=600&auto=format&fit=crop',
    records: [
      {
        id: 'MR-001',
        date: '2026-01-05',
        type: 'Vaccination',
        detail: 'Rabies vaccine administered',
        vetName: 'Dr. Priya Nair',
      },
      {
        id: 'MR-002',
        date: '2026-01-08',
        type: 'Treatment',
        detail: 'Wound cleaning and antibiotics for leg injury',
        vetName: 'Dr. Priya Nair',
      },
    ],
  },
  {
    animalId: 'AN-0138',
    name: 'Mitthu',
    species: 'Cat',
    photo: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=600&auto=format&fit=crop',
    records: [
      {
        id: 'MR-003',
        date: '2026-01-02',
        type: 'Diagnosis',
        detail: 'Mild respiratory infection, prescribed antibiotics',
        vetName: 'Dr. Arjun Rao',
      },
    ],
  },
  {
    animalId: 'AN-0190',
    name: 'Simba',
    species: 'Dog',
    photo: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=600&auto=format&fit=crop',
    records: [
      {
        id: 'MR-004',
        date: '2025-12-20',
        type: 'Treatment',
        detail: 'Minor leg injury treated, fully mobile now',
        vetName: 'Dr. Priya Nair',
      },
      {
        id: 'MR-005',
        date: '2026-01-10',
        type: 'Vaccination',
        detail: 'Booster shot administered',
        vetName: 'Dr. Arjun Rao',
      },
    ],
  },
]