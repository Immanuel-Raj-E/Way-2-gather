import math
from .haversine import haversine_distance

def point_to_segment_distance(
    px: float, py: float, 
    ax: float, ay: float, 
    bx: float, by: float
) -> float:
    """
    Computes shortest distance in km from point P(px, py) to line segment A(ax, ay) -> B(bx, by).
    Coordinates in (lat, lon).
    """
    # Vector AB
    dx = bx - ax
    dy = by - ay
    
    if dx == 0 and dy == 0:
        return haversine_distance(px, py, ax, ay)
    
    # Projection factor t
    t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    
    proj_lat = ax + t * dx
    proj_lon = ay + t * dy
    return haversine_distance(px, py, proj_lat, proj_lon)

def compute_corridor_overlap(
    driver_orig: tuple[float, float],
    driver_dest: tuple[float, float],
    rider_orig: tuple[float, float],
    rider_dest: tuple[float, float]
) -> dict:
    """
    Computes geospatial metrics:
    - 2km radius proximity for pickup & dropoff along the driver corridor
    - Direct distances
    - Detour distance & time (assuming average 40 km/h in urban/suburban)
    - Route overlap ratio (0.0 to 1.0)
    """
    driver_direct_km = haversine_distance(driver_orig[0], driver_orig[1], driver_dest[0], driver_dest[1])
    rider_direct_km = haversine_distance(rider_orig[0], rider_orig[1], rider_dest[0], rider_dest[1])

    # Shortest distance from rider origin & dest to the driver line
    orig_prox_km = point_to_segment_distance(
        rider_orig[0], rider_orig[1],
        driver_orig[0], driver_orig[1],
        driver_dest[0], driver_dest[1]
    )

    dest_prox_km = point_to_segment_distance(
        rider_dest[0], rider_dest[1],
        driver_orig[0], driver_orig[1],
        driver_dest[0], driver_dest[1]
    )

    # Detour routing: Driver Orig -> Rider Orig -> Rider Dest -> Driver Dest
    d_to_r_orig = haversine_distance(driver_orig[0], driver_orig[1], rider_orig[0], rider_orig[1])
    r_shared_seg = haversine_distance(rider_orig[0], rider_orig[1], rider_dest[0], rider_dest[1])
    r_to_d_dest = haversine_distance(rider_dest[0], rider_dest[1], driver_dest[0], driver_dest[1])

    pooled_total_km = d_to_r_orig + r_shared_seg + r_to_d_dest
    detour_dist_km = max(0.0, pooled_total_km - driver_direct_km)

    # Approx 40 km/h avg speed => 1.5 mins per km
    detour_time_mins = detour_dist_km * 1.5

    # Overlap Ratio: How well rider's trip aligns with driver's trip (0.0 - 1.0)
    # Cosine alignment approximation or direct ratio
    overlap_ratio = min(1.0, max(0.0, rider_direct_km / max(driver_direct_km, 0.1)))
    # Penalize if detour is large relative to trip
    overlap_ratio = max(0.05, overlap_ratio * (1.0 / (1.0 + (detour_dist_km / max(rider_direct_km, 1.0)))))

    within_2km_origin = orig_prox_km <= 2.5
    within_2km_dest = dest_prox_km <= 2.5

    return {
        "driver_direct_km": round(driver_direct_km, 2),
        "rider_direct_km": round(rider_direct_km, 2),
        "pooled_total_km": round(pooled_total_km, 2),
        "detour_dist_km": round(detour_dist_km, 2),
        "detour_time_mins": round(detour_time_mins, 1),
        "origin_proximity_km": round(orig_prox_km, 2),
        "destination_proximity_km": round(dest_prox_km, 2),
        "route_overlap_ratio": round(overlap_ratio, 3),
        "within_2km_origin": within_2km_origin,
        "within_2km_dest": within_2km_dest,
        "co2_saved_kg": round(max(0.1, (rider_direct_km * 0.192) - (detour_dist_km * 0.192)), 2)
    }
