import os
import requests

MAPBOX_API_KEY = os.getenv("MAPBOX_API_KEY", "")

def get_route_directions(coordinates: list[tuple[float, float]]) -> dict:
    """
    Fetch directions and polyline coordinates from Mapbox Directions API.
    coordinates: list of (lon, lat) tuples
    """
    if not MAPBOX_API_KEY or MAPBOX_API_KEY.startswith("pk.dummy"):
        # Fallback / mock polyline generation when no real API key is set
        return {
            "routes": [{
                "distance": 12500,
                "duration": 1500,
                "geometry": "sample_mock_polyline_string",
                "legs": []
            }],
            "waypoints": [{"location": list(c)} for c in coordinates]
        }

    coords_str = ";".join([f"{lon},{lat}" for lon, lat in coordinates])
    url = f"https://api.mapbox.com/directions/v5/mapbox/driving/{coords_str}?geometries=geojson&access_token={MAPBOX_API_KEY}"
    
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": str(e), "routes": []}
