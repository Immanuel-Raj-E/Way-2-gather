from .haversine import haversine_distance

def calculate_compatibility_score(
    driver_origin: tuple[float, float],
    driver_dest: tuple[float, float],
    rider_origin: tuple[float, float],
    rider_dest: tuple[float, float],
    max_detour_ratio: float = 1.3
) -> dict:
    """
    Computes detour distance and compatibility score (0 - 100) between a driver's route and rider's request.
    """
    # Direct driver route
    direct_driver_dist = haversine_distance(driver_origin[0], driver_origin[1], driver_dest[0], driver_dest[1])
    
    # Direct rider distance
    rider_dist = haversine_distance(rider_origin[0], rider_origin[1], rider_dest[0], rider_dest[1])

    # Pooled route distance: Driver Origin -> Rider Origin -> Rider Dest -> Driver Dest
    seg1 = haversine_distance(driver_origin[0], driver_origin[1], rider_origin[0], rider_origin[1])
    seg2 = haversine_distance(rider_origin[0], rider_origin[1], rider_dest[0], rider_dest[1])
    seg3 = haversine_distance(rider_dest[0], rider_dest[1], driver_dest[0], driver_dest[1])
    
    pooled_dist = seg1 + seg2 + seg3
    detour_dist = max(0.0, pooled_dist - direct_driver_dist)
    detour_ratio = pooled_dist / max(direct_driver_dist, 0.1)

    # Score calculation
    # Detour penalty
    penalty = (detour_ratio - 1.0) * 100
    base_score = 100.0 - penalty
    score = max(0.0, min(100.0, base_score))

    is_compatible = detour_ratio <= max_detour_ratio

    return {
        "direct_driver_km": round(direct_driver_dist, 2),
        "rider_km": round(rider_dist, 2),
        "pooled_km": round(pooled_dist, 2),
        "detour_km": round(detour_dist, 2),
        "detour_percentage": round((detour_ratio - 1.0) * 100, 2),
        "score": round(score, 1),
        "is_compatible": is_compatible
    }
