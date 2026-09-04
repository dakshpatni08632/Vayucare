import React, { useState } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { geocodeCity } from '../services/api';

export default function CitySearch({ onSelectCity, isLoading }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [geoError, setGeoError] = useState('');

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setGeoError('');
    try {
      const results = await geocodeCity(query.trim());
      if (results && results.length > 0) {
        selectLocation(results[0]);
      }
    } catch (err) {
      setGeoError(err.message || 'Could not find city.');
      onSelectCity(null, err.message || 'Geocoding failed');
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = (loc) => {
    const cityName = loc.name;
    const region = loc.admin1 ? `, ${loc.admin1}` : '';
    const country = loc.country ? `, ${loc.country}` : '';
    const displayName = `${cityName}${region}${country}`;

    onSelectCity({
      name: displayName,
      shortName: cityName,
      lat: loc.latitude,
      lon: loc.longitude,
    });
    setSuggestions([]);
    setQuery(displayName);
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsSearching(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSelectCity({
          name: 'Current Location',
          shortName: 'My Location',
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
        setIsSearching(false);
        setQuery('Current Location');
      },
      (err) => {
        setGeoError('Could not access current location: ' + err.message);
        setIsSearching(false);
      }
    );
  };

  return (
    <section className="search-section">
      <form onSubmit={handleSearchSubmit} className="search-form">
        <div className="search-input-wrapper">
          <Search className="search-icon-inside" size={20} />
          <input
            type="text"
            className="search-input"
            placeholder="Enter city name (e.g. Delhi, London, Tokyo)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (geoError) setGeoError('');
            }}
          />
        </div>

        <button type="submit" className="btn-primary" disabled={isLoading || isSearching}>
          {isSearching || isLoading ? <Loader2 className="spinner-icon" size={18} /> : <Search size={18} />}
          <span>Search</span>
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={handleUseLocation}
          title="Use my current GPS location"
          disabled={isLoading || isSearching}
        >
          <MapPin size={18} />
          <span>Near Me</span>
        </button>
      </form>

      {/* Geocoding Error Message */}
      {geoError && <div className="error-banner" style={{ marginTop: '10px' }}>{geoError}</div>}

      {/* City Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <div className="search-suggestions">
          {suggestions.map((item) => (
            <div
              key={`${item.id}-${item.latitude}-${item.longitude}`}
              className="suggestion-item"
              onClick={() => selectLocation(item)}
            >
              <div>
                <span className="suggestion-city">{item.name}</span>
                <span className="suggestion-country">
                  {item.admin1 ? ` ${item.admin1}, ` : ' '}{item.country || ''}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {item.latitude.toFixed(2)}°, {item.longitude.toFixed(2)}°
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
