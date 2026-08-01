export const ANIMALS = [
  {
    id: 'A-0142',
    name: 'Bruno',
    species: 'Dog',
    size: 'Large',
    gender: 'Male',
    age: 'Adult · ~3 years',
    location: 'JP Nagar',
    tag: 'Friendly',
    rating: 4.2,
    photo: 'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=900&auto=format&fit=crop',
    story:
      'Bruno was found limping near a construction site and has since recovered fully. He\u2019s calm around people, gets along with other dogs, and loves a good walk.',
    vaccinated: true,
    neutered: true,
    temperamentObservations: [
      { date: '2025-12-10', score: 2.5, note: 'Skittish, kept distance from volunteers', observedBy: 'Rahul Menon' },
      { date: '2025-12-22', score: 3.8, note: 'Approached for food, tail wagging', observedBy: 'Anjali Rao' },
      { date: '2026-01-08', score: 4.6, note: 'Calm during vet checkup, friendly with other dogs', observedBy: 'Dr. Priya Nair' },
    ],
  },
  {
    id: 'A-0138',
    name: 'Mitthu',
    species: 'Cat',
    size: 'Small',
    gender: 'Female',
    age: 'Kitten · ~5 months',
    location: 'Koramangala',
    tag: 'Very Friendly',
    rating: 4.8,
    photo: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=900&auto=format&fit=crop',
    story:
      'Mitthu was rescued from a storm drain as a tiny kitten and has been hand-raised since. Very affectionate, loves lap time, still a little nervous around loud noises.',
    vaccinated: true,
    neutered: false,
    temperamentObservations: [
      { date: '2025-12-28', score: 4.2, note: 'Affectionate from day one, purrs when held', observedBy: 'Divya Shetty' },
      { date: '2026-01-10', score: 4.7, note: 'Very comfortable, seeks out attention', observedBy: 'Divya Shetty' },
    ],
  },
  {
    id: 'A-0131',
    name: 'Kalu',
    species: 'Dog',
    size: 'Medium',
    gender: 'Male',
    age: 'Puppy · ~4 months',
    location: 'Indiranagar',
    tag: 'Very Friendly',
    rating: 4.5,
    photo: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=900&auto=format&fit=crop',
    story:
      'Kalu is a playful pup found wandering alone near a market. Full of energy, great with kids, still working on leash training.',
    vaccinated: true,
    neutered: false,
  },
  {
    id: 'A-0119',
    name: 'Coco',
    species: 'Cat',
    size: 'Small',
    gender: 'Female',
    age: 'Adult · ~2 years',
    location: 'HSR Layout',
    tag: 'Shy at first',
    rating: 4.0,
    photo: 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?q=80&w=900&auto=format&fit=crop',
    story:
      'Coco takes a little time to warm up but is deeply loyal once she does. Best suited to a quiet home without small children.',
    vaccinated: true,
    neutered: true,
  },
  {
    id: 'A-0104',
    name: 'Simba',
    species: 'Dog',
    size: 'Medium',
    gender: 'Male',
    age: 'Adult · ~4 years',
    location: 'Whitefield',
    tag: 'Friendly',
    rating: 4.6,
    photo: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=900&auto=format&fit=crop',
    story:
      'Simba was treated for a minor leg injury and is now fully mobile. Easygoing, house-trained, gets along well with other dogs.',
    vaccinated: true,
    neutered: true,
  },
  {
    id: 'A-0097',
    name: 'Motu',
    species: 'Dog',
    size: 'Large',
    gender: 'Male',
    age: 'Senior · ~7 years',
    location: 'BTM Layout',
    tag: 'Calm',
    rating: 4.3,
    photo: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=900&auto=format&fit=crop',
    story:
      'Motu is a gentle senior looking for a calm home to relax into. Low energy, great with other pets, needs regular joint check-ups.',
    vaccinated: true,
    neutered: true,
  },
]

export function getAnimalById(id) {
  return ANIMALS.find((a) => a.id === id)
}

// Recency-weighted temperament scoring: each observation counts less the
// older it is, so a dog that was fearful right after rescue but has been
// calm in every observation since reads as "calm" — not stuck at its
// worst-ever score. Exponential decay with a ~14 day half-life.
export function getTemperamentScore(animal) {
  const observations = animal.temperamentObservations || []
  if (observations.length === 0) return null

  const now = Date.now()
  const HALF_LIFE_DAYS = 14

  let weightedSum = 0
  let totalWeight = 0

  observations.forEach((obs) => {
    const ageDays = (now - new Date(obs.date).getTime()) / (1000 * 60 * 60 * 24)
    const weight = Math.pow(0.5, ageDays / HALF_LIFE_DAYS)
    weightedSum += obs.score * weight
    totalWeight += weight
  })

  return totalWeight > 0 ? weightedSum / totalWeight : null
}