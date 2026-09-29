from .geospatial import point_to_segment_distance

def check_route_deviation(
    current_gps: tuple[float, float],
    route_waypoints: list[tuple[float, float]],
    deviation_threshold_km: float = 1.5
) -> dict:
    """
    Evaluates vehicle's live GPS point against the planned multi-point corridor.
    If shortest distance from current_gps to any segment of route_waypoints exceeds
    deviation_threshold_km, an SOS Deviation Alert is triggered.
    """
    if len(route_waypoints) < 2:
        return {
            "is_deviated": False,
            "deviation_km": 0.0,
            "sos_alert": False,
            "message": "Insufficient waypoints to compute corridor."
        }

    min_dist_km = float("inf")
    for i in range(len(route_waypoints) - 1):
        p1 = route_waypoints[i]
        p2 = route_waypoints[i+1]
        dist = point_to_segment_distance(
            current_gps[0], current_gps[1],
            p1[0], p1[1],
            p2[0], p2[1]
        )
        if dist < min_dist_km:
            min_dist_km = dist

    is_deviated = min_dist_km > deviation_threshold_km
    
    return {
        "is_deviated": is_deviated,
        "deviation_km": round(min_dist_km, 3),
        "threshold_km": deviation_threshold_km,
        "sos_alert": is_deviated,
        "message": "DANGER: Significant Route Deviation Detected! SOS Alert Triggered." if is_deviated else "Vehicle within safety corridor."
    }
