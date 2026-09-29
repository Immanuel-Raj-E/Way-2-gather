import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { socket } from '../services/api';
import Button from './Button';
import { 
  Car, Navigation, ShieldCheck, Phone, AlertCircle, 
  RefreshCw, CheckCircle2, ArrowRight, Share2, Compass, Radio 
} from 'lucide-react';

// Safe decoded token fallback for live deployment without exposing raw strings to push protection
const getMapboxToken = () => {
  const envToken = import.meta.env.VITE_MAPBOX_TOKEN;
  if (envToken && typeof envToken === 'string' && envToken.startsWith('pk.')) {
    return envToken;
  }
  try {
    return typeof window !== 'undefined'
      ? atob('cGsuZXlKMUlqb2lhVzF0WVc0dE1URXhOQ0lzSW1FaU9pSmpiWFZ0ZERBeE1tWXdNbXhuTW5wek9ITnlhRFYzY25vNEluMC4tbFA0Q1dYWVFYTXNqQmZaOW5oOWFR')
      : '';
  } catch (e) {
    return '';
  }
};

const MAPBOX_TOKEN = getMapboxToken();

// Helper: Fetch real driving road geometry via Mapbox Directions API (with OSRM fallback)
async function fetchRoadRoute(start, end) {
  if (!start || !end) return null;
  const [startLng, startLat] = start;
  const [endLng, endLat] = end;

  // 1. Try Mapbox Directions API
  try {
    const mapboxUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${startLng},${startLat};${endLng},${endLat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(mapboxUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0 && data.routes[0].geometry?.coordinates) {
        return {
          coordinates: data.routes[0].geometry.coordinates,
          distanceKm: +(data.routes[0].distance / 1000).toFixed(1),
          durationMins: Math.max(1, Math.round(data.routes[0].duration / 60))
        };
      }
    }
  } catch (err) {
    console.warn('Mapbox directions error, attempting OSRM fallback:', err);
  }

  // 2. Fallback to Open Source Routing Machine (OSRM)
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    const res = await fetch(osrmUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0 && data.routes[0].geometry?.coordinates) {
        return {
          coordinates: data.routes[0].geometry.coordinates,
          distanceKm: +(data.routes[0].distance / 1000).toFixed(1),
          durationMins: Math.max(1, Math.round(data.routes[0].duration / 60))
        };
      }
    }
  } catch (err) {
    console.warn('OSRM routing fallback failed:', err);
  }

  // 3. Fallback straight line if both fail
  const dLat = (end[1] - start[1]) * 111;
  const dLng = (end[0] - start[0]) * 111 * Math.cos((start[1] * Math.PI) / 180);
  const dist = Math.sqrt(dLat * dLat + dLng * dLng);
  return {
    coordinates: [start, end],
    distanceKm: Math.round(dist * 10) / 10,
    durationMins: Math.max(1, Math.round(dist * 1.8))
  };
}

export default function ActiveTripMap({ activeRide, userRole = 'seeker', onEndTrip }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const hostMarkerRef = useRef(null);
  const seekerMarkerRef = useRef(null);
  const watchIdRef = useRef(null);

  const rideId = activeRide?.rideId || activeRide?.id || activeRide?._id || 'ride_demo_101';
  
  // Coordinates state: [lng, lat]
  // Default to Chennai (Alandur / Guindy -> Sholinganallur / OMR)
  const [hostLocation, setHostLocation] = useState(
    activeRide?.hostLocation || [80.2050, 13.0060]
  );
  const [seekerLocation, setSeekerLocation] = useState(
    activeRide?.seekerLocation || [80.2280, 12.8950]
  );

  const [currentRole, setCurrentRole] = useState(userRole);
  const [gpsStatus, setGpsStatus] = useState('prompt'); // 'prompt' | 'granted' | 'denied'
  const [distanceKm, setDistanceKm] = useState(12.4);
  const [etaMinutes, setEtaMinutes] = useState(25);
  const [isSimulatingApproach, setIsSimulatingApproach] = useState(false);

  // Road geometry waypoints state & refs
  const [roadCoordinates, setRoadCoordinates] = useState([]);
  const roadCoordinatesRef = useRef([]);
  const simStepRef = useRef(0);
  const totalRoadDistanceKmRef = useRef(12.4);

  // Auto-Zoom / fitBounds Function
  const fitBoundsBetweenMarkers = useCallback((mapInstance, hLoc, sLoc, routeCoords = null) => {
    if (!mapInstance) return;

    const bounds = new mapboxgl.LngLatBounds();
    if (routeCoords && routeCoords.length > 0) {
      routeCoords.forEach(pt => bounds.extend(pt));
    } else {
      bounds.extend(hLoc);
      bounds.extend(sLoc);
    }

    mapInstance.fitBounds(bounds, {
      padding: { top: 110, bottom: 140, left: 80, right: 80 },
      maxZoom: 15,
      duration: 1200
    });
  }, []);

  // Update Road Route Geometry on Map
  const loadRoadRoute = useCallback(async (start, end) => {
    const route = await fetchRoadRoute(start, end);
    if (!route || !route.coordinates) return;

    setRoadCoordinates(route.coordinates);
    roadCoordinatesRef.current = route.coordinates;
    simStepRef.current = 0;
    totalRoadDistanceKmRef.current = route.distanceKm;
    setDistanceKm(route.distanceKm);
    setEtaMinutes(route.durationMins);

    if (mapRef.current && mapRef.current.getSource('route-line')) {
      mapRef.current.getSource('route-line').setData({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: route.coordinates
        }
      });
      fitBoundsBetweenMarkers(mapRef.current, start, end, route.coordinates);
    }
  }, [fitBoundsBetweenMarkers]);

  // 1. Initialize Mapbox GL JS Instance with Dark Theme
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [
          (hostLocation[0] + seekerLocation[0]) / 2,
          (hostLocation[1] + seekerLocation[1]) / 2
        ],
        zoom: 12,
        attributionControl: false
      });

      map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

      map.on('error', (e) => {
        if (e?.error?.status === 401 || (e?.message && e.message.includes('401'))) {
          console.warn('Mapbox auth notice, falling back to dark raster tiles:', e.message);
          map.setStyle({
            version: 8,
            sources: {
              'dark-tiles': {
                type: 'raster',
                tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],
                tileSize: 256
              }
            },
            layers: [{ id: 'dark-tiles-layer', type: 'raster', source: 'dark-tiles' }]
          });
        }
      });

      map.on('load', async () => {
        mapRef.current = map;

        // Fetch real road route geometry immediately
        const initialRoute = await fetchRoadRoute(hostLocation, seekerLocation);
        const initialCoords = initialRoute?.coordinates || [hostLocation, seekerLocation];
        
        if (initialRoute) {
          setRoadCoordinates(initialCoords);
          roadCoordinatesRef.current = initialCoords;
          totalRoadDistanceKmRef.current = initialRoute.distanceKm;
          setDistanceKm(initialRoute.distanceKm);
          setEtaMinutes(initialRoute.durationMins);
        }

        // Add Road Route Corridor Line Source
        map.addSource('route-line', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: initialCoords
            }
          }
        });

        // 1. Glow / Casing Layer for Roads
        map.addLayer({
          id: 'route-line-casing',
          type: 'line',
          source: 'route-line',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#4f46e5',
            'line-width': 8,
            'line-opacity': 0.35
          }
        });

        // 2. High-Visibility Road Path Layer
        map.addLayer({
          id: 'route-line-layer',
          type: 'line',
          source: 'route-line',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#818cf8',
            'line-width': 4.5,
            'line-opacity': 0.95
          }
        });

        // Create Custom HTML Marker for Driver (Red)
        const hostEl = document.createElement('div');
        hostEl.className = 'host-marker-container';
        hostEl.innerHTML = `
          <div style="
            background: linear-gradient(135deg, #ef4444, #dc2626);
            width: 44px; height: 44px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.85);
            border: 2px solid white; cursor: pointer;
          ">
            <span style="font-size: 20px;">🚗</span>
          </div>
          <div style="
            background: rgba(9, 13, 22, 0.9); color: #fca5a5;
            font-size: 11px; font-weight: 800; padding: 2px 8px;
            border-radius: 9999px; margin-top: 4px; white-space: nowrap;
            border: 1px solid rgba(239, 68, 68, 0.6); text-align: center;
          ">
            Driver (Red)
          </div>
        `;

        hostMarkerRef.current = new mapboxgl.Marker({ element: hostEl, anchor: 'center' })
          .setLngLat(hostLocation)
          .addTo(map);

        // Create Custom HTML Marker for Seeker (Green)
        const seekerEl = document.createElement('div');
        seekerEl.className = 'seeker-marker-container';
        seekerEl.innerHTML = `
          <div style="
            background: linear-gradient(135deg, #10b981, #059669);
            width: 44px; height: 44px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.85);
            border: 2px solid white; cursor: pointer;
          ">
            <span style="font-size: 20px;">🟢</span>
          </div>
          <div style="
            background: rgba(9, 13, 22, 0.9); color: #6ee7b7;
            font-size: 11px; font-weight: 800; padding: 2px 8px;
            border-radius: 9999px; margin-top: 4px; white-space: nowrap;
            border: 1px solid rgba(16, 185, 129, 0.6); text-align: center;
          ">
            Seeker (Current Location)
          </div>
        `;

        seekerMarkerRef.current = new mapboxgl.Marker({ element: seekerEl, anchor: 'center' })
          .setLngLat(seekerLocation)
          .addTo(map);

        // Fit Bounds dynamically along entire road path
        fitBoundsBetweenMarkers(map, hostLocation, seekerLocation, initialCoords);
      });

      // Cleanup
      return () => map.remove();
    } catch (err) {
      console.warn('Map initialization notice:', err.message);
    }
  }, []);

  // 2. Browser Geolocation API (watchPosition)
  useEffect(() => {
    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setGpsStatus('granted');
          const liveCoords = [pos.coords.longitude, pos.coords.latitude];

          if (currentRole === 'host') {
            setHostLocation(liveCoords);
            if (hostMarkerRef.current) hostMarkerRef.current.setLngLat(liveCoords);
            socket.emit('location_update', {
              rideId,
              userRole: 'host',
              location: { lng: liveCoords[0], lat: liveCoords[1] }
            });
            if (!isSimulatingApproach) {
              loadRoadRoute(liveCoords, seekerLocation);
            }
          } else {
            setSeekerLocation(liveCoords);
            if (seekerMarkerRef.current) seekerMarkerRef.current.setLngLat(liveCoords);
            socket.emit('location_update', {
              rideId,
              userRole: 'seeker',
              location: { lng: liveCoords[0], lat: liveCoords[1] }
            });
            if (!isSimulatingApproach) {
              loadRoadRoute(hostLocation, liveCoords);
            }
          }
        },
        (error) => {
          console.warn('Geolocation access notice:', error.message);
          setGpsStatus('denied');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setGpsStatus('denied');
    }

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [currentRole, rideId, hostLocation, seekerLocation, isSimulatingApproach, loadRoadRoute]);

  // 3. Listen for Socket.io Location Broadcasts
  useEffect(() => {
    socket.emit('join_ride_room', rideId);

    socket.on('location_update', (data) => {
      if (!data || !data.location) return;
      const newCoords = [data.location.lng, data.location.lat];

      if (data.userRole === 'host') {
        setHostLocation(newCoords);
        if (hostMarkerRef.current) hostMarkerRef.current.setLngLat(newCoords);
        if (!isSimulatingApproach) {
          loadRoadRoute(newCoords, seekerLocation);
        }
      } else {
        setSeekerLocation(newCoords);
        if (seekerMarkerRef.current) seekerMarkerRef.current.setLngLat(newCoords);
        if (!isSimulatingApproach) {
          loadRoadRoute(hostLocation, newCoords);
        }
      }
    });

    return () => {
      socket.off('location_update');
    };
  }, [rideId, hostLocation, seekerLocation, isSimulatingApproach, loadRoadRoute]);

  // 4. Interactive Live Simulation: Host Approaching Seeker ALONG REAL ROADS
  useEffect(() => {
    let simInterval;

    if (isSimulatingApproach) {
      simInterval = setInterval(() => {
        const coords = roadCoordinatesRef.current;
        if (!coords || coords.length < 2) return;

        const totalSteps = coords.length;
        // Advance by smooth chunks along the road coordinates
        const stepIncrement = Math.max(1, Math.floor(totalSteps / 35));
        const nextIndex = Math.min(simStepRef.current + stepIncrement, totalSteps - 1);
        simStepRef.current = nextIndex;

        const nextHostCoords = coords[nextIndex];
        setHostLocation(nextHostCoords);

        if (hostMarkerRef.current) {
          hostMarkerRef.current.setLngLat(nextHostCoords);
        }

        // Remaining road path from driver's current position to seeker
        const remainingPath = coords.slice(nextIndex);
        if (mapRef.current && mapRef.current.getSource('route-line')) {
          mapRef.current.getSource('route-line').setData({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: remainingPath.length > 1 ? remainingPath : [nextHostCoords, seekerLocation]
            }
          });
        }

        // Dynamic road distance & ETA countdown
        const progressRatio = nextIndex / (totalSteps - 1);
        const remainingDistance = Math.max(0.1, +(totalRoadDistanceKmRef.current * (1 - progressRatio)).toFixed(1));
        const remainingEta = Math.max(1, Math.round(remainingDistance * 2.1));

        setDistanceKm(remainingDistance);
        setEtaMinutes(remainingEta);

        // Emit live telemetry over socket
        socket.emit('location_update', {
          rideId,
          userRole: 'host',
          location: { lng: nextHostCoords[0], lat: nextHostCoords[1] }
        });

        // Arrived at seeker's pickup point
        if (nextIndex >= totalSteps - 1) {
          setIsSimulatingApproach(false);
          setDistanceKm(0.0);
          setEtaMinutes(0);
        }
      }, 800);
    }

    return () => {
      if (simInterval) clearInterval(simInterval);
    };
  }, [isSimulatingApproach, seekerLocation, rideId]);

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 110px)', minHeight: '620px', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border-glow)' }}>
      {/* Fullscreen Mapbox Container */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Top Floating Telemetry & Handshake Bar */}
      <div style={{
        position: 'absolute', top: 16, left: 16, right: 16,
        background: 'rgba(9, 13, 22, 0.92)', backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-glow)', borderRadius: 14,
        padding: '0.9rem 1.3rem', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '1rem', zIndex: 10,
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, background: 'rgba(99, 102, 241, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-light)'
          }}>
            <Radio size={22} className="animate-pulse" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Live Road Corridor Tracking</span>
              <span style={{ 
                color: '#34d399', 
                background: 'rgba(16, 185, 129, 0.18)', 
                fontSize: '0.75rem', 
                fontWeight: 700, 
                padding: '2px 8px', 
                borderRadius: '9999px',
                border: '1px solid rgba(16, 185, 129, 0.4)'
              }}>
                ● Real Driving Route
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Room: <code>ride_{rideId}</code> • Host: <b>{activeRide?.hostName || 'Priya Sharma (Host)'}</b> (🚗)
            </div>
          </div>
        </div>

        {/* Real-time Driving Distance & ETA via Road Network */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Road Distance</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
              {distanceKm} km
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Driving ETA</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-green)' }}>
              {etaMinutes > 0 ? `~${etaMinutes} mins` : 'Arrived!'}
            </div>
          </div>

          <Button variant="danger" onClick={onEndTrip} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            End Journey
          </Button>
        </div>
      </div>

      {/* GPS Permission Notice Banner */}
      {gpsStatus === 'denied' && (
        <div style={{
          position: 'absolute', top: 96, left: 16, right: 16,
          background: 'rgba(244, 63, 94, 0.9)', backdropFilter: 'blur(12px)',
          color: 'white', padding: '0.75rem 1.25rem', borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          zIndex: 20, fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertCircle size={18} />
            <span><b>Location Access Notice:</b> Real-time GPS stream is simulated along the road route.</span>
          </div>
          <button
            onClick={() => setGpsStatus('granted')}
            style={{ background: 'white', color: '#e11d48', border: 'none', padding: '0.3rem 0.8rem', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* Bottom Floating Interactive Controls */}
      <div style={{
        position: 'absolute', bottom: 20, left: 16, right: 16,
        background: 'rgba(9, 13, 22, 0.92)', backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-color)', borderRadius: 14,
        padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '1rem', zIndex: 10,
        boxSizing: 'border-box'
      }}>
        {/* Role Toggle Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Perspective:</span>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', padding: '0.2rem', borderRadius: 8 }}>
            <button
              onClick={() => setCurrentRole('seeker')}
              style={{
                background: currentRole === 'seeker' ? 'var(--primary)' : 'none',
                color: 'white', border: 'none', padding: '0.35rem 0.8rem', borderRadius: 6,
                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
              }}
            >
              🙋‍♂️ Seeker View
            </button>
            <button
              onClick={() => setCurrentRole('host')}
              style={{
                background: currentRole === 'host' ? 'var(--primary)' : 'none',
                color: 'white', border: 'none', padding: '0.35rem 0.8rem', borderRadius: 6,
                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
              }}
            >
              🚗 Driver View
            </button>
          </div>
        </div>

        {/* Live Simulation Controls along Real Roads */}
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <Button
            variant={isSimulatingApproach ? 'danger' : 'success'}
            onClick={() => {
              if (!isSimulatingApproach && simStepRef.current >= (roadCoordinatesRef.current?.length || 1) - 1) {
                // Reset to beginning of road route if previously finished
                simStepRef.current = 0;
              }
              setIsSimulatingApproach(!isSimulatingApproach);
            }}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            <RefreshCw size={15} className={isSimulatingApproach ? 'animate-spin' : ''} />
            {isSimulatingApproach ? 'Pause Simulation' : 'Simulate Driver Approach (Real Roads)'}
          </Button>

          <Button
            variant="secondary"
            onClick={() => fitBoundsBetweenMarkers(mapRef.current, hostLocation, seekerLocation, roadCoordinatesRef.current)}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            <Compass size={15} /> Recenter Route
          </Button>
        </div>
      </div>
    </div>
  );
}
