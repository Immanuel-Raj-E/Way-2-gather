from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from app.core.tracking import check_route_deviation

router = APIRouter()

class Coordinate(BaseModel):
    latitude: float
    longitude: float

class TrackingCheckRequest(BaseModel):
    current_gps: Coordinate
    route_waypoints: List[Coordinate]
    deviation_threshold_km: float = 1.5

@router.post("/check-deviation")
def evaluate_deviation(req: TrackingCheckRequest):
    curr = (req.current_gps.latitude, req.current_gps.longitude)
    waypoints = [(wp.latitude, wp.longitude) for wp in req.route_waypoints]

    result = check_route_deviation(
        current_gps=curr,
        route_waypoints=waypoints,
        deviation_threshold_km=req.deviation_threshold_km
    )
    return {
        "status": "success",
        "data": result
    }
