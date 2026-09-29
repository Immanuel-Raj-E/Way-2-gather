from fastapi import APIRouter
from pydantic import BaseModel
from app.core.scoring import calculate_compatibility_score

router = APIRouter()

class Coordinate(BaseModel):
    latitude: float
    longitude: float

class DetourRequest(BaseModel):
    driver_origin: Coordinate
    driver_destination: Coordinate
    rider_origin: Coordinate
    rider_destination: Coordinate
    max_detour_ratio: float = 1.3

@router.post("/calculate-detour")
def calculate_detour(req: DetourRequest):
    result = calculate_compatibility_score(
        driver_origin=(req.driver_origin.latitude, req.driver_origin.longitude),
        driver_dest=(req.driver_destination.latitude, req.driver_destination.longitude),
        rider_origin=(req.rider_origin.latitude, req.rider_origin.longitude),
        rider_dest=(req.rider_destination.latitude, req.rider_destination.longitude),
        max_detour_ratio=req.max_detour_ratio
    )
    return {
        "status": "success",
        "data": result
    }
