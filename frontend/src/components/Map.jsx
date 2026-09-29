import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Navigation, ShieldCheck, MapPin } from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

// Exact Tamil Nadu Geographical Bounding Box [Southwest lng, lat], [Northeast lng, lat]
export const TN_BOUNDS = [
  [76.15, 8.05], // SW: Kanyakumari / Western Ghats boundary
  [80.35, 13.55] // NE: Chennai / Pulicat Lake boundary
];

export const CHENNAI_CENTER = [80.2707, 13.0827];

// Helper: Fetch real road driving route geometry
async function fetchRoadRoute(start, end) {
  if (!start || !end) return null;
  const [startLng, startLat] = start;
  const [endLng, endLat] = end;

  try {
    const mapboxUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${startLng},${startLat};${endLng},${endLat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(mapboxUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.routes?.[0]?.geometry?.coordinates) {
        return data.routes[0].geometry.coordinates;
      }
    }
  } catch (err) {
    console.warn('Mapbox directions error:', err);
  }

  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    const res = await fetch(osrmUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.routes?.[0]?.geometry?.coordinates) {
        return data.routes[0].geometry.coordinates;
      }
    }
  } catch (err) {
    console.warn('OSRM directions error:', err);
  }

  return [start, end];
}

export default function Map({ origin, destination, matches = [], hasRequested = false, height = '380px' }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: CHENNAI_CENTER,
        zoom: 10,
        maxBounds: TN_BOUNDS,
        attributionControl: false
      });

      map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

      map.on('load', () => {
        mapRef.current = map;

        // Initialize road route layers
        map.addSource('route-corridor', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: []
            }
          }
        });

        map.addLayer({
          id: 'route-corridor-casing',
          type: 'line',
          source: 'route-corridor',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#4f46e5',
            'line-width': 7,
            'line-opacity': 0.3
          }
        });

        map.addLayer({
          id: 'route-corridor-line',
          type: 'line',
          source: 'route-corridor',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#6366f1',
            'line-width': 4,
            'line-opacity': 0.9
          }
        });

        renderMapElements(map);
      });

      return () => {
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];
        map.remove();
      };
    } catch (err) {
      console.warn('Map initialization notice:', err.message);
    }
  }, []);

  // Re-render markers and road route whenever props change
  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      renderMapElements(mapRef.current);
    }
  }, [origin, destination, matches, hasRequested]);

  const renderMapElements = async (map) => {
    // Clean up existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Points only appear after a ride is requested or searched!
    if (!hasRequested && !origin?.latitude) {
      if (map.getSource('route-corridor')) {
        map.getSource('route-corridor').setData({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: [] }
        });
      }
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();
    let hasCoords = false;

    // 1. SEEKER REPRESENTATION IN GREEN (Current / Pickup Location)
    if (origin?.latitude && origin?.longitude) {
      const seekerEl = document.createElement('div');
      seekerEl.className = 'seeker-map-marker';
      seekerEl.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="
            background: linear-gradient(135deg, #10b981, #059669);
            width: 36px; height: 36px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 0 16px rgba(16, 185, 129, 0.75);
            border: 2.5px solid white;
          ">
            <span style="font-size: 16px;">🟢</span>
          </div>
          <div style="
            background: #064e3b; color: #a7f3d0;
            font-size: 11px; font-weight: 800; padding: 2px 8px;
            border-radius: 9999px; margin-top: 3px; white-space: nowrap;
            border: 1px solid #10b981; box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          ">
            Seeker (Pickup)
          </div>
        </div>
      `;

      const seekerMarker = new mapboxgl.Marker({ element: seekerEl, anchor: 'center' })
        .setLngLat([origin.longitude, origin.latitude])
        .addTo(map);

      markersRef.current.push(seekerMarker);
      bounds.extend([origin.longitude, origin.latitude]);
      hasCoords = true;
    }

    // 2. DROPOFF DESTINATION MARKER
    if (destination?.latitude && destination?.longitude) {
      const destEl = document.createElement('div');
      destEl.className = 'destination-map-marker';
      destEl.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="
            background: linear-gradient(135deg, #6366f1, #4f46e5);
            width: 34px; height: 34px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 0 16px rgba(99, 102, 241, 0.75);
            border: 2.5px solid white;
          ">
            <span style="font-size: 15px;">🏁</span>
          </div>
          <div style="
            background: #1e1b4b; color: #c7d2fe;
            font-size: 11px; font-weight: 800; padding: 2px 8px;
            border-radius: 9999px; margin-top: 3px; white-space: nowrap;
            border: 1px solid #6366f1; box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          ">
            Dropoff
          </div>
        </div>
      `;

      const destMarker = new mapboxgl.Marker({ element: destEl, anchor: 'center' })
        .setLngLat([destination.longitude, destination.latitude])
        .addTo(map);

      markersRef.current.push(destMarker);
      bounds.extend([destination.longitude, destination.latitude]);
      hasCoords = true;
    }

    // 3. DRIVERS REPRESENTATION IN RED
    if (matches && matches.length > 0) {
      matches.forEach((match, idx) => {
        const driverLat = match.origin?.latitude || match.startLocation?.coordinates?.[1] || 13.0827;
        const driverLng = match.origin?.longitude || match.startLocation?.coordinates?.[0] || 80.2707;
        const driverName = match.driver_name || match.driver?.name || `Driver ${idx + 1}`;

        const driverEl = document.createElement('div');
        driverEl.className = 'driver-map-marker';
        driverEl.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="
              background: linear-gradient(135deg, #ef4444, #dc2626);
              width: 36px; height: 36px; border-radius: 50%;
              display: flex; align-items: center; justify-content: center;
              box-shadow: 0 0 16px rgba(239, 68, 68, 0.75);
              border: 2.5px solid white;
            ">
              <span style="font-size: 16px;">🚗</span>
            </div>
            <div style="
              background: #7f1d1d; color: #fecaca;
              font-size: 11px; font-weight: 800; padding: 2px 8px;
              border-radius: 9999px; margin-top: 3px; white-space: nowrap;
              border: 1px solid #ef4444; box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            ">
              Driver (${driverName})
            </div>
          </div>
        `;

        const driverMarker = new mapboxgl.Marker({ element: driverEl, anchor: 'center' })
          .setLngLat([driverLng, driverLat])
          .addTo(map);

        markersRef.current.push(driverMarker);
        bounds.extend([driverLng, driverLat]);
        hasCoords = true;
      });
    }

    // 4. DRAW REAL ROAD ROUTE PATH THROUGH ROADS
    if (origin?.latitude && destination?.latitude) {
      const start = [origin.longitude, origin.latitude];
      const end = [destination.longitude, destination.latitude];
      const roadPath = await fetchRoadRoute(start, end);

      if (roadPath && roadPath.length > 0 && map.getSource('route-corridor')) {
        map.getSource('route-corridor').setData({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: roadPath
          }
        });
        roadPath.forEach(pt => bounds.extend(pt));
      }
    } else if (map.getSource('route-corridor')) {
      map.getSource('route-corridor').setData({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [] }
      });
    }

    // Auto-fit bounds if we have coordinates to display
    if (hasCoords) {
      map.fitBounds(bounds, {
        padding: { top: 70, bottom: 70, left: 70, right: 70 },
        maxZoom: 13,
        duration: 1000
      });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
      {/* Map Container */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating Tamil Nadu Boundary Tag */}
      <div style={{
        position: 'absolute', top: 12, left: 12,
        background: '#ffffff', border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)', borderRadius: 9999,
        padding: '0.35rem 0.85rem', display: 'flex', alignItems: 'center',
        gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)',
        zIndex: 1
      }}>
        <ShieldCheck size={14} />
        <span>Tamil Nadu Service Network</span>
      </div>

      {/* Map Legend: Drivers (Red) vs Seeker (Green) */}
      <div style={{
        position: 'absolute', top: 12, right: 54,
        background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)',
        border: '1px solid var(--border-color)', borderRadius: 8,
        padding: '0.3rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
        fontSize: '0.75rem', fontWeight: 700, zIndex: 1, boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#dc2626' }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }}></span>
          <span>Drivers (Red)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#059669' }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
          <span>Seeker (Green)</span>
        </div>
      </div>

      {/* Corridor Summary footer */}
      {matches.length > 0 && hasRequested && (
        <div style={{
          position: 'absolute', bottom: 12, left: 12, right: 12,
          background: '#ffffff', border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-md)', borderRadius: 10,
          padding: '0.65rem 1rem', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', fontSize: '0.85rem', zIndex: 1
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontWeight: 600 }}>
            <Navigation size={16} color="var(--primary)" />
            <span>{matches.length} matching driver routes found</span>
          </div>
          <span className="badge-score" style={{ background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' }}>
            🔴 {matches.length} Drivers Live
          </span>
        </div>
      )}
    </div>
  );
}
