import React from 'react';
import { Sparkles, CheckCircle, ShieldAlert, UserCheck, HeartPulse, Briefcase } from 'lucide-react';
import { getAQIMetadata } from '../utils/aqiUtils';

export default function AdvisoryCard({ advisory, aqi, profile }) {
  if (!advisory || !aqi) return null;

  const aqiMeta = getAQIMetadata(aqi.aqi);

  // Determine icon & severity style
  const isHighSeverity = aqi.aqi > 150;

  return (
    <div
      className="glass-card advisory-card fade-in-slide"
      style={{
        borderLeftColor: aqiMeta.color,
        background: `linear-gradient(135deg, #ffffff, ${aqiMeta.bgColor})`
      }}
    >
      <div className="advisory-header">
        <div className="advisory-title-group">
          <div
            className="advisory-icon-wrapper"
            style={{ backgroundColor: aqiMeta.bgColor, color: aqiMeta.color }}
          >
            {isHighSeverity ? <ShieldAlert size={22} /> : <Sparkles size={22} />}
          </div>
          <div>
            <h3 className="advisory-title">
              Personalized AI Health Advisory
            </h3>
            <p className="advisory-subtitle">
              Tailored for {profile?.ageGroup || 'General Adult'} • {profile?.healthCondition || 'No Conditions'} • {profile?.occupation || 'General'}
            </p>
          </div>
        </div>

        <span
          className="severity-pill"
          style={{ backgroundColor: aqiMeta.bgColor, color: aqiMeta.color, border: `1px solid ${aqiMeta.color}` }}
        >
          {isHighSeverity ? <ShieldAlert size={13} /> : <Sparkles size={13} />}
          <span>AQI {aqi.aqi} • {aqiMeta.level.toUpperCase()}</span>
        </span>
      </div>

      <div className="advisory-body">
        <p>{advisory.text}</p>
      </div>

      <div className="advisory-meta-pills">
        <span className="meta-pill">
          <CheckCircle size={13} style={{ color: aqiMeta.color }} />
          <span>Engine: {advisory.isLLM ? `Groq AI LLM (${advisory.model || 'groq/compound-mini'})` : 'VayuCare Health Rules Engine'}</span>
        </span>
        <span className="meta-pill">
          <UserCheck size={13} />
          <span>Age: {profile?.ageGroup}</span>
        </span>
        <span className="meta-pill">
          <HeartPulse size={13} />
          <span>Condition: {profile?.healthCondition}</span>
        </span>
        <span className="meta-pill">
          <Briefcase size={13} />
          <span>Activity: {profile?.occupation}</span>
        </span>
      </div>
    </div>
  );
}

