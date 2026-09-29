from datetime import datetime
from .geospatial import compute_corridor_overlap

def extract_6_feature_vector(
    driver_orig: tuple[float, float],
    driver_dest: tuple[float, float],
    driver_departure: str | datetime,
    rider_orig: tuple[float, float],
    rider_dest: tuple[float, float],
    rider_preferred_time: str | datetime | None = None
) -> dict:
    """
    Extracts the exact 6-feature vector required by the XGBoost acceptance model:
    [
        1. detour_distance_km,
        2. detour_time_mins,
        3. origin_proximity_km,
        4. destination_proximity_km,
        5. time_difference_mins,
        6. route_overlap_ratio
    ]
    """
    geo_metrics = compute_corridor_overlap(driver_orig, driver_dest, rider_orig, rider_dest)

    # Time difference calculation (in minutes)
    time_diff_mins = 0.0
    if driver_departure and rider_preferred_time:
        try:
            if isinstance(driver_departure, str):
                d_time = datetime.fromisoformat(driver_departure.replace("Z", "+00:00"))
            else:
                d_time = driver_departure

            if isinstance(rider_preferred_time, str):
                r_time = datetime.fromisoformat(rider_preferred_time.replace("Z", "+00:00"))
            else:
                r_time = rider_preferred_time

            diff_seconds = abs((d_time - r_time).total_seconds())
            time_diff_mins = round(diff_seconds / 60.0, 1)
        except Exception:
            time_diff_mins = 5.0  # Safe nominal default

    features_dict = {
        "detour_distance_km": geo_metrics["detour_dist_km"],
        "detour_time_mins": geo_metrics["detour_time_mins"],
        "origin_proximity_km": geo_metrics["origin_proximity_km"],
        "destination_proximity_km": geo_metrics["destination_proximity_km"],
        "time_difference_mins": time_diff_mins,
        "route_overlap_ratio": geo_metrics["route_overlap_ratio"]
    }

    feature_vector = [
        features_dict["detour_distance_km"],
        features_dict["detour_time_mins"],
        features_dict["origin_proximity_km"],
        features_dict["destination_proximity_km"],
        features_dict["time_difference_mins"],
        features_dict["route_overlap_ratio"]
    ]

    return {
        "feature_vector": feature_vector,
        "feature_dict": features_dict,
        "geo_metrics": geo_metrics
    }
