import os
import django
import random
from django.utils import timezone
from datetime import timedelta

# Setup Django if run directly
if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pawmap_backend.settings')
    django.setup()

from django.contrib.auth import get_user_model
from cases.models import Case, CaseNotification, CaseStatusLog, Ward
from animals.models import Animal, TemperamentRating
from medical.models import MedicalRecord
from adoption.models import AdoptionListing
from volunteers.models import VolunteerReliabilityScore

User = get_user_model()

# Wards list with realistic centroid coordinates in Bengaluru
WARDS_DATA = [
    ('Koramangala', 12.9348, 77.6189),
    ('Indiranagar', 12.9719, 77.6412),
    ('Jayanagar', 12.9250, 77.5938),
    ('JP Nagar', 12.9063, 77.5857),
    ('HSR Layout', 12.9121, 77.6446),
    ('Whitefield', 12.9698, 77.7500),
    ('Malleshwaram', 12.9982, 77.5683),
    ('Hebbal', 13.0358, 77.5970),
    ('Yelahanka', 13.1007, 77.5963),
    ('Marathahalli', 12.9569, 77.7011)
]

SPECIES_OPTIONS = ['Dog', 'Cat', 'Cow', 'Bird', 'Other']
BREED_OPTIONS = {
    'Dog': ['Indie', 'Labrador Mix', 'Golden Retriever Mix', 'Unknown'],
    'Cat': ['Indie Cat', 'Persian Mix', 'Unknown'],
    'Cow': ['Desi Cow', 'Holstein Mix', 'Unknown'],
    'Bird': ['Pigeon', 'Kite', 'Unknown'],
    'Other': ['Unknown']
}

STATUS_OPTIONS = ['Open', 'In_Progress', 'On_Site', 'Resolved', 'Escalated']
INJURY_TYPES = [
    'Limping / possible fracture',
    'Open wound / laceration',
    'Severe dehydration & weakness',
    'Skin infection / scabies',
    'High fever / lethargic',
    'Healthy / needs sterilisation'
]
DESCRIPTIONS = [
    'Found lying near the main road junction, unable to stand on hind legs.',
    'Has a visible gash on the left front leg, bleeding slightly.',
    'Extremely thin and dehydrated. Needs immediate food and water.',
    'Showing signs of heavy skin scratching and hair loss across body.',
    'Shivering despite the warm weather, refusing food from bystanders.',
    'Friendly local community animal ready for vaccination and birth control.'
]

def run():
    print("Starting pilot data generation...")

    # 1. Ensure Wards are created
    wards = []
    for name, lat, lon in WARDS_DATA:
        ward, created = Ward.objects.get_or_create(
            ward_name=name,
            defaults={'city': 'Bengaluru', 'centroid_lat': lat, 'centroid_lon': lon}
        )
        wards.append(ward)
    print(f"Verified {len(wards)} wards.")

    # 2. Ensure Users are created
    ngo_admin, _ = User.objects.get_or_create(
        email='ngo_admin@pawmap.org',
        defaults={'full_name': 'Bengaluru Rescue NGO', 'role': 'NGO_Admin', 'is_verified': True}
    )
    if _:
        ngo_admin.set_password('pawmap123')
        ngo_admin.save()

    reporters = []
    for i in range(1, 6):
        rep, created = User.objects.get_or_create(
            email=f'reporter{i}@pawmap.org',
            defaults={'full_name': f'Reporter User {i}', 'role': 'Reporter'}
        )
        if created:
            rep.set_password('pawmap123')
            rep.save()
        reporters.append(rep)

    volunteers = []
    for i in range(1, 6):
        vol, created = User.objects.get_or_create(
            email=f'volunteer{i}@pawmap.org',
            defaults={'full_name': f'Volunteer Companion {i}', 'role': 'Volunteer', 'is_verified': True, 'ngo': ngo_admin}
        )
        if created:
            vol.set_password('pawmap123')
            vol.save()
        volunteers.append(vol)

    vets = []
    for i in range(1, 3):
        vet, created = User.objects.get_or_create(
            email=f'vet{i}@pawmap.org',
            defaults={'full_name': f'Dr. Vet Specialist {i}', 'role': 'Vet', 'is_verified': True}
        )
        if created:
            vet.set_password('pawmap123')
            vet.save()
        vets.append(vet)

    print("Verified users: NGO Admin, Vets, Volunteers, and Reporters.")

    # 3. Create missing cases to hit 100 cases
    current_count = Case.objects.count()
    target_count = 100
    needed = max(0, target_count - current_count)
    print(f"Currently {current_count} cases exist. Generating {needed} more to reach 100.")

    created_cases = []
    for i in range(needed):
        ward = random.choice(wards)
        lat = float(ward.centroid_lat) + random.uniform(-0.01, 0.01)
        lon = float(ward.centroid_lon) + random.uniform(-0.01, 0.01)
        species = random.choice(SPECIES_OPTIONS)
        breed = random.choice(BREED_OPTIONS[species])
        status = random.choice(STATUS_OPTIONS)
        severity = random.randint(1, 5)
        aggression = random.randint(1, 4)
        injury = random.choice(INJURY_TYPES)
        desc = random.choice(DESCRIPTIONS)
        reporter = random.choice(reporters)

        case = Case(
            latitude=lat,
            longitude=lon,
            ward=ward,
            species=species,
            breed=breed,
            status=status,
            severity=severity,
            aggression_level=aggression,
            injury_type=injury,
            description=desc,
            reporter=reporter
        )
        
        # Determine volunteer mapping based on status
        if status != 'Open':
            volunteer = random.choice(volunteers)
            case.volunteer = volunteer
            case.response_time_min = round(random.uniform(5.0, 45.0), 1)
        
        case.save()
        created_cases.append(case)

        # Set historic timestamps retrospectively
        days_ago = random.randint(1, 30)
        time_offset = timezone.now() - timedelta(days=days_ago, hours=random.randint(0, 23))
        Case.objects.filter(id=case.id).update(created_at=time_offset, updated_at=time_offset)
        case.refresh_from_db()

        # Audit logs & notifications
        CaseStatusLog.objects.create(
            case=case, old_status='Open', new_status=case.status,
            changed_at=case.created_at, note='Initial report status', actor=case.reporter
        )

        if case.volunteer:
            notif = CaseNotification.objects.create(
                case=case,
                volunteer=case.volunteer,
                responded_at=case.created_at + timedelta(minutes=float(case.response_time_min))
            )
            # update timestamps on notifications
            CaseNotification.objects.filter(id=notif.id).update(notified_at=case.created_at)

    print(f"Generated {len(created_cases)} cases successfully.")

    # 4. Create Animal profiles for Resolved/In-Progress cases
    active_cases = Case.objects.filter(status__in=['Resolved', 'In_Progress', 'On_Site']).exclude(animal__isnull=False)
    print(f"Creating Animal profiles for {active_cases.count()} active/resolved cases...")
    animals_created = 0
    for case in active_cases:
        # Determine adoption status
        if case.status == 'Resolved':
            adoption_status = random.choice(['Available', 'Adopted', 'Fostered'])
        else:
            adoption_status = 'Not_Available'

        animal = Animal.objects.create(
            name=f"Companion {case.case_id.split('-')[1]}",
            species=case.species,
            breed=case.breed,
            estimated_age=case.estimated_age,
            distinguishing_features=case.description,
            adoption_status=adoption_status,
            ownership_status='Stray',
            case=case,
            current_foster=random.choice(volunteers) if adoption_status == 'Fostered' else None
        )
        animals_created += 1

        # Set random temperament ratings
        for vol in random.sample(volunteers, random.randint(1, 3)):
            rating = TemperamentRating.objects.create(
                animal=animal,
                volunteer=vol,
                score=random.randint(3, 5)
            )
            # shift rating timestamp back
            TemperamentRating.objects.filter(id=rating.id).update(timestamp=case.created_at)

        # Create Medical records
        for j in range(random.randint(1, 3)):
            record = MedicalRecord.objects.create(
                animal=animal,
                vet=random.choice(vets + volunteers),
                entry_type=random.choice(['vaccination', 'deworming', 'treatment', 'diagnosis']),
                details=f"Administered regular checkup and primary care treatment relating to case {case.case_id}."
            )
            # shift medical record timestamp back
            MedicalRecord.objects.filter(id=record.id).update(timestamp=case.created_at + timedelta(hours=j))

        # Create Adoption listing if Available
        if adoption_status == 'Available':
            AdoptionListing.objects.get_or_create(
                animal=animal,
                defaults={'published_by': ngo_admin, 'status': 'Active'}
            )

    print(f"Created {animals_created} animal profiles, along with temperament ratings, medical records, and listings.")

    # 5. Compute VRS for all volunteers
    print("Computing VRS for all volunteers...")
    for vol in volunteers:
        # Create some random notifications to compute reliability rates
        for c in Case.objects.exclude(volunteer=vol)[:random.randint(3, 8)]:
            CaseNotification.objects.get_or_create(
                case=c,
                volunteer=vol,
                defaults={'responded_at': None}
            )
        
        vrs = VolunteerReliabilityScore.compute_for_volunteer(vol)
        print(f"computed VRS for {vol.full_name}: score={vrs.vrs_score}")

    print("Pilot data seeding complete!")

if __name__ == '__main__':
    run()
