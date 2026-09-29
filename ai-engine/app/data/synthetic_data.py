import random

def generate_mock_rides(count: int = 10, center_lat: float = 37.7749, center_lon: float = -122.4194) -> list[dict]:
    """
    Generates synthetic ride offers and requests for demonstration and testing.
    """
    rides = []
    for i in range(count):
        lat_offset_orig = random.uniform(-0.05, 0.05)
        lon_offset_orig = random.uniform(-0.05, 0.05)
        lat_offset_dest = random.uniform(-0.08, 0.08)
        lon_offset_dest = random.uniform(-0.08, 0.08)

        rides.append({
            "id": f"ride_mock_{i+1}",
            "driver_name": f"Driver {i+1}",
            "origin": {
                "latitude": round(center_lat + lat_offset_orig, 6),
                "longitude": round(center_lon + lon_offset_orig, 6),
                "address": f"{100 + i*10} Market St"
            },
            "destination": {
                "latitude": round(center_lat + lat_offset_dest, 6),
                "longitude": round(center_lon + lon_offset_dest, 6),
                "address": f"{500 + i*20} Mission St"
            },
            "available_seats": random.randint(1, 4),
            "departure_time": "2026-09-29T16:00:00Z"
        })
    return rides
