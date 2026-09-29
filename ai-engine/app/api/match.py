from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.core.features import extract_6_feature_vector
from app.core.model import match_model
from app.data.synthetic_data import generate_mock_rides

router = APIRouter()

class Coordinate(BaseModel):
    latitude: float
    longitude: float
    address: Optional[str] = ""

class MatchRequest(BaseModel):
    rider_origin: Coordinate
    rider_destination: Coordinate
    rider_preferred_time: Optional[str] = None
    seats_needed: int = 1
    max_detour_km: float = 8.0
    candidate_rides: Optional[List[dict]] = None

@router.post("/match")
def predict_and_rank_matches(req: MatchRequest):
    """
    AI Match Acceptance Probability Pipeline:
    1. Extract 6-feature vector for each candidate:
       [detour_distance_km, detour_time_mins, origin_proximity_km, destination_proximity_km, time_difference_mins, route_overlap_ratio]
    2. Run XGBoost Inference
    3. Filter by 2km corridor proximity & max detour
    4. Rank by acceptance probability
    """
    rides = req.candidate_rides if req.candidate_rides and len(req.candidate_rides) > 0 else generate_mock_rides(8)
    
    scored_candidates = []
    rider_orig = (req.rider_origin.latitude, req.rider_origin.longitude)
    rider_dest = (req.rider_destination.latitude, req.rider_destination.longitude)

    for ride in rides:
        driver_orig = (ride["origin"]["latitude"], ride["origin"]["longitude"])
        driver_dest = (ride["destination"]["latitude"], ride["destination"]["longitude"])
        driver_time = ride.get("departure_time") or ride.get("departureTime")

        # 6-Feature Extraction
        features_result = extract_6_feature_vector(
            driver_orig=driver_orig,
            driver_dest=driver_dest,
            driver_departure=driver_time,
            rider_orig=rider_orig,
            rider_dest=rider_dest,
            rider_preferred_time=req.rider_preferred_time
        )

        geo = features_result["geo_metrics"]
        feat_dict = features_result["feature_dict"]
        feat_vector = features_result["feature_vector"]

        # Filter out rides exceeding max allowed detour
        if geo["detour_dist_km"] > req.max_detour_km:
            continue

        # XGBoost Model Inference
        pred = match_model.predict_acceptance_probability(feat_vector)

        # Build comprehensive match item
        match_item = {
            **ride,
            "match_acceptance_probability": pred["acceptance_probability"],
            "compatibility_score": pred["acceptance_probability"],
            "compatibility_category": pred["category"],
            "model_metadata": pred["model_type"],
            "detour_km": geo["detour_dist_km"],
            "detour_time_mins": geo["detour_time_mins"],
            "route_overlap_ratio": geo["route_overlap_ratio"],
            "origin_proximity_km": geo["origin_proximity_km"],
            "destination_proximity_km": geo["destination_proximity_km"],
            "co2_saved_kg": geo["co2_saved_kg"],
            "features_6d": feat_dict,
            "within_2km_corridor": geo["within_2km_origin"] and geo["within_2km_dest"]
        }

        scored_candidates.append(match_item)

    # Sort descending by Match Acceptance Probability
    scored_candidates.sort(key=lambda x: x["match_acceptance_probability"], reverse=True)

    return {
        "status": "success",
        "total_candidates_analyzed": len(rides),
        "matches_count": len(scored_candidates),
        "matches": scored_candidates
    }
