import math
import redis

redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)


def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def get_nearby_volunteer_ids(case_lat, case_lon, radius_km=5):
    nearby = []
    for key in redis_client.scan_iter('volunteer_location:*'):
        value = redis_client.get(key)
        if not value:
            continue
        try:
            lat_str, lon_str = value.split(',')
            v_lat, v_lon = float(lat_str), float(lon_str)
        except ValueError:
            continue
        if haversine_km(float(case_lat), float(case_lon), v_lat, v_lon) <= radius_km:
            nearby.append(key.split(':')[1])
    return nearby