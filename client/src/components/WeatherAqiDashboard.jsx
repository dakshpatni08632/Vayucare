import React from 'react';
import { Thermometer, Droplets, Wind, MapPin, Clock, ShieldCheck } from 'lucide-react';
import { getAQIMetadata, getWeatherCodeMeta } from '../utils/aqiUtils';

export default function WeatherAqiDashboard({ weather, aqi, locationName }) {
  if (!weather || !aqi) return null;

  const aqiMeta = getAQIMetadata(aqi.aqi);
  const weatherMeta = getWeatherCodeMeta(weather.weatherCode);

  // Parse key pollutants with units
  const iaqi = aqi.iaqi || {};
  const pollutants = [
    { name: 'PM2.5', key: 'pm25', val: iaqi.pm25?.v, unit: 'µg/m³' },
    { name: 'PM10', key: 'pm10', val: iaqi.pm10?.v, unit: 'µg/m³' },
    { name: 'NO2', key: 'no2', val: iaqi.no2?.v, unit: 'µg/m³' },
    { name: 'SO2', key: 'so2', val: iaqi.so2?.v, unit: 'µg/m³' },
    { name: 'CO', key: 'co', val: iaqi.co?.v, unit: 'mg/m³' },
    { name: 'O3', key: 'o3', val: iaqi.o3?.v, unit: 'µg/m³' },
  ].filter(p => p.val !== undefined && p.val !== null);

  return (
    <div className="weather-aqi-wrapper fade-in-slide">
      {/* AQI Primary Gauge Card */}
      <div className="glass-card aqi-gauge-card" style={{ borderTop: `4px solid ${aqiMeta.color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 700, letterSpacing: '0.05em' }}>
                INDIAN NATIONAL AQI (CPCB)
              </span>
              <ShieldCheck size={14} style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px', color: 'var(--text-primary)' }}>
              {locationName}
            </h2>
          </div>

          <span className="severity-pill" style={{ backgroundColor: aqiMeta.bgColor, color: aqiMeta.color, border: `1px solid ${aqiMeta.color}` }}>
            {aqiMeta.label}
          </span>
        </div>

        {/* Source Station & Observation Timestamp Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', borderBottom: '1px dashed var(--border-color)', paddingBottom: '10px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={13} style={{ color: 'var(--accent-cyan)' }} />
            <strong>Station:</strong> {aqi.stationName || 'Local Monitoring Station'}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} style={{ color: 'var(--accent-teal)' }} />
            <strong>Updated:</strong> {aqi.observationTime}
          </span>
        </div>

        {/* Main AQI Gauge & Breakdown */}
        <div className="aqi-main-display">
          <div className="aqi-number-box" style={{ backgroundColor: aqiMeta.bgColor, border: `1px solid ${aqiMeta.color}` }}>
            <span className="aqi-val" style={{ color: aqiMeta.color }}>{aqi.aqi}</span>
            <span className="aqi-status-text" style={{ color: aqiMeta.color }}>CPCB IND</span>
            {aqi.usAqi && (
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                (US EPA: {aqi.usAqi})
              </span>
            )}
          </div>

          <div className="aqi-breakdown">
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: '1.5' }}>
              {aqiMeta.description}
            </p>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Dominant Pollutant: <strong style={{ color: 'var(--text-primary)', textTransform: 'uppercase' }}>{aqi.dominantPollutant}</strong>
            </div>

            {/* Pollutants Breakdown Grid */}
            {pollutants.length > 0 && (
              <div className="pollutant-grid">
                {pollutants.map((p) => (
                  <div key={p.key} className="pollutant-chip">
                    <div className="pollutant-name">{p.name}</div>
                    <div className="pollutant-val">{p.val} <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{p.unit}</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weather Metrics Grid */}
      <div className="metrics-row">
        {/* Temperature Card */}
        <div className="glass-card metric-card">
          <div className="metric-top">
            <span className="metric-label">TEMPERATURE</span>
            <div className="metric-icon-box">
              <Thermometer size={18} />
            </div>
          </div>
          <div className="metric-value-container">
            <span className="metric-value">{Math.round(weather.temperature)}</span>
            <span className="metric-unit">°C</span>
          </div>
          <div className="metric-subtext">
            Feels like {Math.round(weather.apparentTemperature ?? weather.temperature)}°C • {weatherMeta.text}
          </div>
        </div>

        {/* Humidity Card */}
        <div className="glass-card metric-card">
          <div className="metric-top">
            <span className="metric-label">HUMIDITY</span>
            <div className="metric-icon-box">
              <Droplets size={18} />
            </div>
          </div>
          <div className="metric-value-container">
            <span className="metric-value">{weather.humidity}</span>
            <span className="metric-unit">%</span>
          </div>
          <div className="metric-subtext">
            {weather.humidity > 70 ? 'High Humidity' : weather.humidity < 30 ? 'Dry Air' : 'Comfortable'}
          </div>
        </div>

        {/* Wind Speed Card */}
        <div className="glass-card metric-card">
          <div className="metric-top">
            <span className="metric-label">WIND SPEED</span>
            <div className="metric-icon-box">
              <Wind size={18} />
            </div>
          </div>
          <div className="metric-value-container">
            <span className="metric-value">{Math.round(weather.windSpeed)}</span>
            <span className="metric-unit">km/h</span>
          </div>
          <div className="metric-subtext">
            Station: {aqi.stationName ? aqi.stationName.split(',')[0] : locationName}
          </div>
        </div>
      </div>
    </div>
  );
}

