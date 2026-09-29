import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.api.match import router as match_router
from app.api.detour import router as detour_router
from app.api.tracking import router as tracking_router

load_dotenv()

app = FastAPI(
    title="way-2-gather AI Engine",
    description="Ride-Pooling XGBoost Compatibility Prediction & Geospatial Corridor Engine",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(match_router, prefix="/api", tags=["Matching & XGBoost"])
app.include_router(detour_router, prefix="/api", tags=["Detour Calculation"])
app.include_router(tracking_router, prefix="/api", tags=["Live Tracking & SOS"])

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "way-2-gather AI Engine",
        "model": "XGBoost 6-Feature Acceptance Classifier",
        "features": [
            "detour_distance_km",
            "detour_time_mins",
            "origin_proximity_km",
            "destination_proximity_km",
            "time_difference_mins",
            "route_overlap_ratio"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
