import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';

// Popular Tamil Nadu NLP Hubs & Coordinates fallback dataset
const TAMIL_NADU_HUBS = [
  { placeName: 'Chennai Central Railway Station, Chennai', address: 'Chennai Central, Chennai', coords: [80.2707, 13.0827] },
  { placeName: 'Siruseri SIPCOT IT Park, OMR, Chennai', address: 'Siruseri SIPCOT, OMR Corridor', coords: [80.2220, 12.8310] },
  { placeName: 'Sholinganallur Junction, OMR, Chennai', address: 'Sholinganallur, Chennai', coords: [80.2280, 12.8950] },
  { placeName: 'Thiruvanmiyur Beach / Bus Terminus, Chennai', address: 'Thiruvanmiyur, Chennai', coords: [80.2580, 12.9830] },
  { placeName: 'Tidel Park, Tharamani, Chennai', address: 'Tidel Park, Chennai', coords: [80.2450, 12.9880] },
  { placeName: 'Guindy Industrial Estate / Metro, Chennai', address: 'Guindy, Chennai', coords: [80.2180, 13.0070] },
  { placeName: 'Koyambedu CMBT Bus Station, Chennai', address: 'Koyambedu, Chennai', coords: [80.2050, 13.0690] },
  { placeName: 'Tambaram Railway Station, Chennai', address: 'Tambaram, Chennai', coords: [80.1170, 12.9250] },
  { placeName: 'Airport International / Domestic, Meenambakkam, Chennai', address: 'Chennai Airport, Chennai', coords: [80.1700, 12.9800] },
  { placeName: 'Gandhipuram Bus Stand, Coimbatore', address: 'Gandhipuram, Coimbatore', coords: [76.9670, 11.0180] },
  { placeName: 'TIDEL Park Coimbatore, Peelamedu', address: 'Peelamedu, Coimbatore', coords: [77.0100, 11.0250] },
  { placeName: 'Pollachi Main Road, Coimbatore', address: 'Pollachi, Coimbatore', coords: [77.0080, 10.6600] },
  { placeName: 'Mattuthavani Integrated Bus Terminus, Madurai', address: 'Mattuthavani, Madurai', coords: [78.1560, 9.9400] },
  { placeName: 'Meenakshi Amman Temple, Madurai', address: 'Meenakshi Temple, Madurai', coords: [78.1190, 9.9190] },
  { placeName: 'Central Bus Stand, Trichy (Tiruchirappalli)', address: 'Central Bus Stand, Trichy', coords: [78.6850, 10.7950] },
  { placeName: 'New Bus Stand, Salem', address: 'New Bus Stand, Salem', coords: [78.1460, 11.6640] },
  { placeName: 'Vannarpettai / Junction, Tirunelveli', address: 'Vannarpettai, Tirunelveli', coords: [77.7280, 8.7290] }
];

export default function LocationAutocomplete({ 
  value, 
  onChange, 
  onSelect,
  placeholder = "Search location in Tamil Nadu...",
  icon: CustomIcon = MapPin,
  iconColor = "var(--primary)",
  required = false
}) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const debounceTimer = useRef(null);

  const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || import.meta.env.VITE_MAPBOX_TOKEN || '5ntZgp5HiwKhO1Dd4AEn';

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Click outside listener to dismiss suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (onChange) onChange(val);

    if (!val || val.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
    setLoading(true);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        // Query MapTiler Geocoding API with Tamil Nadu Bounding Box
        const endpoint = `https://api.maptiler.com/geocoding/${encodeURIComponent(val)}.json?key=${MAPTILER_KEY}&bbox=76.15,8.05,80.35,13.55`;
        const res = await fetch(endpoint);
        const data = await res.json();

        if (data.features && data.features.length > 0) {
          const maptilerMatches = data.features.map(f => ({
            placeName: f.place_name,
            address: f.text || f.place_name.split(',')[0],
            coords: f.center // [longitude, latitude]
          }));
          setSuggestions(maptilerMatches);
        } else {
          // Fallback to local Tamil Nadu NLP Hubs
          const localFiltered = TAMIL_NADU_HUBS.filter(h => 
            h.placeName.toLowerCase().includes(val.toLowerCase()) || 
            h.address.toLowerCase().includes(val.toLowerCase())
          );
          setSuggestions(localFiltered);
        }
      } catch (err) {
        // Fallback on network/API failure
        const localFiltered = TAMIL_NADU_HUBS.filter(h => 
          h.placeName.toLowerCase().includes(val.toLowerCase()) || 
          h.address.toLowerCase().includes(val.toLowerCase())
        );
        setSuggestions(localFiltered);
      } finally {
        setLoading(false);
      }
    }, 250);
  };

  const handleSelectSuggestion = (item) => {
    setQuery(item.address || item.placeName);
    setIsOpen(false);
    if (onChange) onChange(item.address || item.placeName);
    if (onSelect) {
      onSelect({
        address: item.address || item.placeName,
        fullText: item.placeName,
        latitude: item.coords[1],
        longitude: item.coords[0]
      });
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="input-light"
          required={required}
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.length >= 2 && suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          style={{ paddingLeft: '2.4rem', paddingRight: loading ? '2.4rem' : '1rem' }}
          autoComplete="off"
        />
        <CustomIcon 
          size={16} 
          color={iconColor} 
          style={{ position: 'absolute', left: 12, top: 13 }} 
        />
        {loading && (
          <Loader2 
            size={16} 
            className="animate-spin" 
            color="var(--text-muted)" 
            style={{ position: 'absolute', right: 12, top: 13 }} 
          />
        )}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: '#ffffff',
          borderRadius: 8,
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-md)',
          zIndex: 1000,
          maxHeight: '230px',
          overflowY: 'auto'
        }}>
          {suggestions.length === 0 ? (
            <div style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              No matching locations found in Tamil Nadu
            </div>
          ) : (
            suggestions.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectSuggestion(item)}
                style={{
                  padding: '0.65rem 1rem',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                  cursor: 'pointer',
                  borderBottom: idx === suggestions.length - 1 ? 'none' : '1px solid #f1f5f9',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
              >
                <MapPin size={15} color="var(--primary)" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                    {item.address}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    {item.placeName}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
