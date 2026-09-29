import React, { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Navigation, ShieldCheck } from 'lucide-react';

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || import.meta.env.VITE_MAPBOX_TOKEN || '5ntZgp5HiwKhO1Dd4AEn';

// Exact Tamil Nadu Geographical Bounding Box [Southwest lng, lat], [Northeast lng, lat]
export const TN_BOUNDS = [
  [76.15, 8.05], // SW: Kanyakumari / Western Ghats boundary
  [80.35, 13.55] // NE: Chennai / Pulicat Lake boundary
];

export const CHENNAI_CENTER = [80.2707, 13.0827];

export default function Map({ origin, destination, matches = [], height = '380px' }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const originMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      // MapTiler Vector Streets Style with Active Key
      const mapStyle = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: mapStyle,
        center: CHENNAI_CENTER,
        zoom: 10,
        maxBounds: TN_BOUNDS, // Strictly restricts panning & zooming to Tamil Nadu only!
        attributionControl: false
      });

      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

      map.on('load', () => {
        mapRef.current = map;

        // Origin Marker (Emerald Pin)
        if (origin?.latitude && origin?.longitude) {
          const origEl = document.createElement('div');
          origEl.innerHTML = `
            <div style="background: #059669; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 10px rgba(5, 150, 105, 0.4); border: 2px solid white; font-size: 16px;">
              🟢
            </div>
          `;
          originMarkerRef.current = new maplibregl.Marker({ element: origEl })
            .setLngLat([origin.longitude, origin.latitude])
            .addTo(map);
        }

        // Destination Marker (Sky Blue Pin)
        if (destination?.latitude && destination?.longitude) {
          const destEl = document.createElement('div');
          destEl.innerHTML = `
            <div style="background: #0284c7; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 10px rgba(2, 132, 199, 0.4); border: 2px solid white; font-size: 16px;">
              🏁
            </div>
          `;
          destMarkerRef.current = new maplibregl.Marker({ element: destEl })
            .setLngLat([destination.longitude, destination.latitude])
            .addTo(map);
        }
      });

      return () => map.remove();
    } catch (err) {
      console.warn('Map initialization notice:', err.message);
    }
  }, []);

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
        gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)'
      }}>
        <ShieldCheck size={14} />
        <span>Tamil Nadu Service Corridor (Strict Geo-Constraint)</span>
      </div>

      {/* Corridor Summary footer */}
      {matches.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 12, left: 12, right: 12,
          background: '#ffffff', border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-md)', borderRadius: 10,
          padding: '0.65rem 1rem', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontWeight: 600 }}>
            <Navigation size={16} color="var(--primary)" />
            <span>{matches.length} active pooling routes verified in corridor</span>
          </div>
          <span className="badge-score">
            Chennai Center: 10.0 Zoom
          </span>
        </div>
      )}
    </div>
  );
}
