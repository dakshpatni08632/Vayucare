import React, { useState } from 'react';
import { History, TrendingUp, Trash2, Zap } from 'lucide-react';
import { getAQIMetadata } from '../utils/aqiUtils';

export default function HistoryTrend({ historyStore, activeCity, onClearHistory, onSeedDemoData, onSelectHistoryCity }) {
  // Extract all available cities from historyStore
  const cityKeys = Object.keys(historyStore || {});

  // Determine current active city tab for trend view
  const defaultTab = activeCity ? activeCity.toLowerCase().trim() : (cityKeys[0] || '');
  const [selectedCityTab, setSelectedCityTab] = useState(defaultTab);

  // Sync selected tab if activeCity changes and exists in store
  const currentTabKey = cityKeys.includes(selectedCityTab) ? selectedCityTab : (cityKeys[0] || '');
  const activeHistoryList = historyStore?.[currentTabKey] || [];

  if (cityKeys.length === 0 || activeHistoryList.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <History size={24} style={{ marginBottom: '6px', opacity: 0.5 }} />
        <p style={{ fontSize: '0.88rem', marginBottom: '14px' }}>
          No recent alert history stored yet. Search a city or seed demo trend data for judging.
        </p>
        <button
          onClick={() => onSeedDemoData && onSeedDemoData(activeCity)}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid var(--accent-cyan)',
            background: 'rgba(56, 189, 248, 0.15)',
            color: 'var(--accent-cyan)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Zap size={14} />
          <span>⚡ Seed Demo Trend Data (For Judging)</span>
        </button>
      </div>
    );
  }

  // Prepare trend line data points (reverse list so left-to-right is chronological: oldest -> newest)
  const chronologicalList = [...activeHistoryList].reverse();
  const maxAQI = Math.max(...chronologicalList.map(item => Number(item.aqi) || 0), 100);

  // SVG dimensions for trend chart
  const svgWidth = 600;
  const svgHeight = 130;
  const paddingX = 45;
  const paddingY = 28;

  const points = chronologicalList.map((item, index) => {
    const x = chronologicalList.length === 1
      ? svgWidth / 2
      : paddingX + (index / (chronologicalList.length - 1)) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingY - ((Number(item.aqi) || 0) / (maxAQI * 1.2)) * (svgHeight - paddingY * 2);
    return { x, y, aqi: item.aqi, temp: item.temperature, time: item.timestamp, item };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="history-section glass-card" style={{ padding: '24px' }}>
      {/* Header with Title and Control Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 className="section-heading" style={{ margin: 0 }}>
          <TrendingUp size={18} className="text-cyan" />
          <span>Alert History & AQI Trend Chart (Last 7 Advisories per City)</span>
        </h3>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* DEV DEMO SEED BUTTON */}
          <button
            onClick={() => onSeedDemoData && onSeedDemoData(currentTabKey)}
            style={{
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '6px',
              color: 'var(--accent-cyan)',
              padding: '5px 12px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Seed 6 realistic varying AQI trend entries for demo judging"
          >
            <Zap size={14} />
            <span>⚡ Seed Demo Trend</span>
          </button>

          {/* CLEAR HISTORY BUTTON */}
          <button
            onClick={onClearHistory}
            style={{
              background: 'none',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--text-muted)',
              padding: '5px 10px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Clear all stored history"
          >
            <Trash2 size={14} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* City Selector Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {cityKeys.map(key => {
          const firstItem = historyStore[key]?.[0];
          const displayName = firstItem?.cityName || firstItem?.city || key;
          const isSelected = key === currentTabKey;
          return (
            <button
              key={key}
              onClick={() => setSelectedCityTab(key)}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                background: isSelected ? 'rgba(2, 132, 199, 0.12)' : 'var(--bg-main)',
                color: isSelected ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                fontWeight: isSelected ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {displayName} ({historyStore[key].length})
            </button>
          );
        })}
      </div>

      {/* AQI Trend Line Chart (SVG) */}
      <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px 12px 10px 12px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px', padding: '0 8px' }}>
          <span>AQI Progression (Oldest → Recent)</span>
          <span>Max AQI: {maxAQI}</span>
        </div>

        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
          <defs>
            <linearGradient id="aqiAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area under curve */}
          {points.length > 1 && (
            <polygon
              points={`${points[0].x},${svgHeight - 12} ${polylinePoints} ${points[points.length - 1].x},${svgHeight - 12}`}
              fill="url(#aqiAreaGradient)"
            />
          )}

          {/* Connecting Line */}
          {points.length > 1 && (
            <polyline
              fill="none"
              stroke="#0284c7"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylinePoints}
            />
          )}

          {/* Data Points */}
          {points.map((p, i) => {
            const meta = getAQIMetadata(p.aqi);
            const timeLabel = new Date(p.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <g key={i}>
                {/* Connecting vertical line to axis */}
                <line x1={p.x} y1={p.y} x2={p.x} y2={svgHeight - 14} stroke="#cbd5e1" strokeDasharray="3 3" />
                
                {/* Outer halo circle */}
                <circle cx={p.x} cy={p.y} r="8" fill={meta.bgColor} stroke={meta.color} strokeWidth="2" />
                <circle cx={p.x} cy={p.y} r="3.5" fill="#ffffff" />

                {/* AQI text badge above point */}
                <text x={p.x} y={p.y - 12} textAnchor="middle" fill={meta.color} fontSize="11" fontWeight="800">
                  {p.aqi}
                </text>

                {/* Timestamp label below */}
                <text x={p.x} y={svgHeight - 2} textAnchor="middle" fill="#64748b" fontSize="9">
                  {timeLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Stored Advisories History List */}
      <div className="history-list">
        {activeHistoryList.map((item, idx) => {
          const meta = getAQIMetadata(item.aqi);
          const timeFormatted = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const dateFormatted = new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });

          return (
            <div
              key={`${item.city}-${item.timestamp}-${idx}`}
              className="history-item"
              onClick={() => onSelectHistoryCity && onSelectHistoryCity(item.cityName || item.city)}
              style={{ cursor: onSelectHistoryCity ? 'pointer' : 'default' }}
            >
              <div className="history-city-time">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="history-city-name">{item.cityName || item.city}</span>
                  {item.isDemoSeed && (
                    <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-cyan)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                      Demo Seed
                    </span>
                  )}
                </div>
                <span className="history-timestamp">
                  {dateFormatted} at {timeFormatted} • Temp: {item.temperature}°C
                </span>
                {item.advisoryText && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    "{item.advisoryText}"
                  </p>
                )}
              </div>

              <div className="history-badges" style={{ alignSelf: 'flex-start' }}>
                <span
                  className="history-badge"
                  style={{ backgroundColor: meta.bgColor, color: meta.color, border: `1px solid ${meta.color}` }}
                >
                  AQI {item.aqi} ({meta.level.toUpperCase()})
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
