import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { socket } from '../services/api';
import Button from './Button';
import { 
  Car, User, Navigation, ShieldCheck, Phone, AlertCircle, 
  RefreshCw, CheckCircle2, ArrowRight, Share2, Compass, Radio 
} from 'lucide-react';

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || import.meta.env.VITE_MAPBOX_TOKEN || '5ntZgp5HiwKhO1Dd4AEn';

export default function ActiveTripMap({ activeRide, userRole = 'seeker', onEndTrip }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const hostMarkerRef = useRef(null);
  const seekerMarkerRef = useRef(null);
  const watchIdRef = useRef(null);

  const rideId = activeRide?.rideId || activeRide?.id || activeRide?._id || 'ride_demo_101';
  
  // Coordinates state: [lng, lat]
  const [hostLocation, setHostLocation] = useState(
    activeRide?.hostLocation || [77.6280, 12.9340] // Koramangala
  );
  const [seekerLocation, setSeekerLocation] = useState(
    activeRide?.seekerLocation || [77.6600, 12.8450] // Electronic City
  );

  const [currentRole, setCurrentRole] = useState(userRole);
  const [gpsStatus, setGpsStatus] = useState('prompt'); // 'prompt' | 'granted' | 'denied'
  const [distanceKm, setDistanceKm] = useState(11.8);
  const [etaMinutes, setEtaMinutes] = useState(18);
  const [isSimulatingApproach, setIsSimulatingApproach] = useState(false);

  // 1. Initialize MapLibre GL JS Instance with MapTiler Dark Theme
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_KEY}`,
        center: [
          (hostLocation[0] + seekerLocation[0]) / 2,
          (hostLocation[1] + seekerLocation[1]) / 2
        ],
        zoom: 12,
        attributionControl: false
      });

      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

      map.on('load', () => {
        mapRef.current = map;

        // Create Custom HTML Marker for Host (🚗)
        const hostEl = document.createElement('div');
        hostEl.className = 'host-marker-container';
        hostEl.innerHTML = `
          <div style="
            background: linear-gradient(135deg, #6366f1, #4f46e5);
            width: 44px; height: 44px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.8);
            border: 2px solid white; cursor: pointer; transform: scale(1);
          ">
            <span style="font-size: 20px;">🚗</span>
          </div>
          <div style="
            background: rgba(9, 13, 22, 0.85); color: #818cf8;
            font-size: 11px; font-weight: 800; padding: 2px 8px;
            border-radius: 9999px; margin-top: 4px; white-space: nowrap;
            border: 1px solid rgba(99, 102, 241, 0.4); text-align: center;
          ">
            Host (Driver)
          </div>
        `;

        hostMarkerRef.current = new maplibregl.Marker({ element: hostEl, anchor: 'center' })
          .setLngLat(hostLocation)
          .addTo(map);

        // Create Custom HTML Marker for Seeker (🧍‍♂️)
        const seekerEl = document.createElement('div');
        seekerEl.className = 'seeker-marker-container';
        seekerEl.innerHTML = `
          <div style="
            background: linear-gradient(135deg, #06b6d4, #0891b2);
            width: 44px; height: 44px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 0 20px rgba(6, 182, 212, 0.8);
            border: 2px solid white; cursor: pointer;
          ">
            <span style="font-size: 20px;">🧍‍♂️</span>
          </div>
          <div style="
            background: rgba(9, 13, 22, 0.85); color: #38bdf8;
            font-size: 11px; font-weight: 800; padding: 2px 8px;
            border-radius: 9999px; margin-top: 4px; white-space: nowrap;
            border: 1px solid rgba(6, 182, 212, 0.4); text-align: center;
          ">
            Seeker (Pickup)
          </div>
        `;

        seekerMarkerRef.current = new maplibregl.Marker({ element: seekerEl, anchor: 'center' })
          .setLngLat(seekerLocation)
          .addTo(map);

        // Add Route Corridor Line Layer
        map.addSource('route-line', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [hostLocation, seekerLocation]
            }
          }
        });

        map.addLayer({
          id: 'route-line-layer',
          type: 'line',
          source: 'route-line',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#818cf8',
            'line-width': 4,
            'line-dasharray': [2, 2],
            'line-opacity': 0.85
          }
        });

        // Fit Bounds dynamically
        fitBoundsBetweenMarkers(map, hostLocation, seekerLocation);
      });

      // Cleanup
      return () => map.remove();
    } catch (err) {
      console.warn('Map initialization notice:', err.message);
    }
  }, []);

  // 2. Auto-Zoom / fitBounds Function
  const fitBoundsBetweenMarkers = (mapInstance, hLoc, sLoc) => {
    if (!mapInstance) return;

    const bounds = new maplibregl.LngLatBounds();
    bounds.extend(hLoc);
    bounds.extend(sLoc);

    mapInstance.fitBounds(bounds, {
      padding: { top: 100, bottom: 140, left: 80, right: 80 },
      maxZoom: 15,
      duration: 1200
    });
  };

  // 3. Browser Geolocation API (watchPosition)
  useEffect(() => {
    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setGpsStatus('granted');
          const liveCoords = [pos.coords.longitude, pos.coords.latitude];

          if (currentRole === 'host') {
            setHostLocation(liveCoords);
            socket.emit('location_update', {
              rideId,
              userRole: 'host',
              location: { lng: liveCoords[0], lat: liveCoords[1] }
            });
          } else {
            setSeekerLocation(liveCoords);
            socket.emit('location_update', {
              rideId,
              userRole: 'seeker',
              location: { lng: liveCoords[0], lat: liveCoords[1] }
            });
          }
        },
        (error) => {
          console.warn('Geolocation access error:', error.message);
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
  }, [currentRole, rideId]);

  // 4. Listen for Socket.io Location Broadcasts
  useEffect(() => {
    socket.emit('join_ride_room', rideId);

    socket.on('location_update', (data) => {
      if (!data || !data.location) return;
      const newCoords = [data.location.lng, data.location.lat];

      if (data.userRole === 'host') {
        setHostLocation(newCoords);
        if (hostMarkerRef.current) hostMarkerRef.current.setLngLat(newCoords);
      } else {
        setSeekerLocation(newCoords);
        if (seekerMarkerRef.current) seekerMarkerRef.current.setLngLat(newCoords);
      }

      // Update Mapbox Line & Fit Bounds
      if (mapRef.current && mapRef.current.getSource('route-line')) {
        mapRef.current.getSource('route-line').setData({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: data.userRole === 'host' ? [newCoords, seekerLocation] : [hostLocation, newCoords]
          }
        });
        fitBoundsBetweenMarkers(mapRef.current, hostLocation, seekerLocation);
      }
    });

    return () => {
      socket.off('location_update');
    };
  }, [rideId, hostLocation, seekerLocation]);

  // 5. Update Distance & ETA calculation
  useEffect(() => {
    const dLat = (seekerLocation[1] - hostLocation[1]) * 111;
    const dLng = (seekerLocation[0] - hostLocation[0]) * 111 * Math.cos((hostLocation[1] * Math.PI) / 180);
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    const calculatedKm = Math.round(dist * 10) / 10;
    
    setDistanceKm(calculatedKm);
    setEtaMinutes(Math.max(1, Math.round(calculatedKm * 1.6)));
  }, [hostLocation, seekerLocation]);

  // 6. Interactive Live Simulation: Host Approaching Seeker
  useEffect(() => {
    let simInterval;
    if (isSimulatingApproach) {
      simInterval = setInterval(() => {
        setHostLocation((prev) => {
          const stepFactor = 0.15;
          const nextLng = prev[0] + (seekerLocation[0] - prev[0]) * stepFactor;
          const nextLat = prev[1] + (seekerLocation[1] - prev[1]) * stepFactor;
          const newHostCoords = [nextLng, nextLat];

          if (hostMarkerRef.current) hostMarkerRef.current.setLngLat(newHostCoords);
          
          if (mapRef.current && mapRef.current.getSource('route-line')) {
            mapRef.current.getSource('route-line').setData({
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: [newHostCoords, seekerLocation]
              }
            });
            fitBoundsBetweenMarkers(mapRef.current, newHostCoords, seekerLocation);
          }

          socket.emit('location_update', {
            rideId,
            userRole: 'host',
            location: { lng: nextLng, lat: nextLat }
          });

          return newHostCoords;
        });
      }, 1500);
    }
    return () => clearInterval(simInterval);
  }, [isSimulatingApproach, seekerLocation, rideId]);

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 110px)', minHeight: '620px', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border-glow)' }}>
      {/* Fullscreen Mapbox Container */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Top Floating Telemetry & Handshake Bar */}
      <div style={{
        position: 'absolute', top: 16, left: 16, right: 16,
        background: 'rgba(9, 13, 22, 0.88)', backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-glow)', borderRadius: 14,
        padding: '1rem 1.4rem', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '1rem', zIndex: 10
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
              <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Live Corridor Handshake</span>
              <span className="badge-tag" style={{ color: 'var(--accent-green)', background: 'rgba(16,185,129,0.15)' }}>
                ● Active GPS Stream
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Room: <code>ride_{rideId}</code> • Host: <b>{activeRide?.hostName || 'Priya Sharma (Host)'}</b> (🚗)
            </div>
          </div>
        </div>

        {/* Real-time Distance & ETA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Distance to Pickup</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
              {distanceKm} km
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Arrival</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-green)' }}>
              ~{etaMinutes} mins
            </div>
          </div>

          <Button variant="danger" onClick={onEndTrip} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            End Journey
          </Button>
        </div>
      </div>

      {/* GPS Permission Denied Banner */}
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
            <span><b>Location Access Notice:</b> Location access is required for real-time live tracking. Please enable GPS permissions or use simulation below.</span>
          </div>
          <button
            onClick={() => setGpsStatus('granted')}
            style={{ background: 'white', color: '#e11d48', border: 'none', padding: '0.3rem 0.8rem', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
          >
            Enable Live Simulation
          </button>
        </div>
      )}

      {/* Bottom Floating Interactive Controls */}
      <div style={{
        position: 'absolute', bottom: 20, left: 16, right: 16,
        background: 'rgba(9, 13, 22, 0.92)', backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-color)', borderRadius: 14,
        padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '1rem', zIndex: 10
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
              🧍‍♂️ Seeker View
            </button>
            <button
              onClick={() => setCurrentRole('host')}
              style={{
                background: currentRole === 'host' ? 'var(--primary)' : 'none',
                color: 'white', border: 'none', padding: '0.35rem 0.8rem', borderRadius: 6,
                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
              }}
            >
              🚗 Host View
            </button>
          </div>
        </div>

        {/* Live Simulation Controls */}
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <Button
            variant={isSimulatingApproach ? 'danger' : 'success'}
            onClick={() => setIsSimulatingApproach(!isSimulatingApproach)}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            <RefreshCw size={15} className={isSimulatingApproach ? 'animate-spin' : ''} />
            {isSimulatingApproach ? 'Pause Simulation' : 'Simulate Host Approaching (Live GPS)'}
          </Button>

          <Button
            variant="secondary"
            onClick={() => fitBoundsBetweenMarkers(mapRef.current, hostLocation, seekerLocation)}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            <Compass size={15} /> Recenter Bounds
          </Button>
        </div>
      </div>
    </div>
  );
}
