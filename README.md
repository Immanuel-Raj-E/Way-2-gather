# SyncRide 🚗⚡
> AI-Powered Ride-Pooling Platform with XGBoost Match Acceptance & Real-Time Safety Corridor Monitoring

SyncRide is an end-to-end microservice-based carpooling architecture featuring:
1. **User Intent (React -> Node.js)**: Host creates ride offers; Seeker specifies pickup, drop-off, seats, and time preferences (stored in MongoDB).
2. **Hard Filtering (Node -> Mongo)**: Ultra-fast elimination of impossible candidates (zero available seats, departure window gap > 90 mins, unserviceable status).
3. **Geospatial Math (Python -> Mapbox / Great-Circle)**: Computes 2km radius proximity, corridor overlap ratio, exact detour distance (km), and detour time (mins).
4. **AI Inference (Python + XGBoost)**: Extracts a **6-feature vector** per candidate and predicts the **Match Acceptance Probability (0-100%)**:
   - `detour_distance_km`
   - `detour_time_mins`
   - `origin_proximity_km` (pickup to driver corridor)
   - `destination_proximity_km` (dropoff to driver corridor)
   - `time_difference_mins` (departure discrepancy)
   - `route_overlap_ratio` (corridor alignment 0.0 - 1.0)
5. **Handshake & Execution (React -> Node via WebSockets)**: Ranked match cards display acceptance probabilities; Seeker requests, Host accepts via Socket.io, locking the ride with a **4-digit Trip OTP**.
6. **Live Ride & Settlement (React -> Node)**: Real-time GPS tracking along route waypoints. If the vehicle deviates > 1.5 km from the planned corridor, an **SOS Deviation Alert** is triggered. Upon completion, dynamic cost splitting and CO₂ savings (`0.192 kg CO2/km`) are calculated.

---

## 🏗️ Microservice Architecture

```
syncride/
├── frontend/        # React 18 + Vite + Socket.io UI (Telemetry, OTP, Heatmap & Matches)
├── backend/         # Node.js + Express + Mongoose + Socket.io Server
└── ai-engine/       # Python + FastAPI + XGBoost 6D Vector Matching & Tracking Engine
```

---

## 🚀 Running the Microservices Locally

### 1. Python AI Engine (`ai-engine`)
```bash
cd ai-engine
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- API Docs: `http://localhost:8000/docs`

### 2. Node.js Backend & WebSockets (`backend`)
```bash
cd backend
npm install
npm run dev
```
- Server runs on `http://localhost:5000`

### 3. React Frontend UI (`frontend`)
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173`
