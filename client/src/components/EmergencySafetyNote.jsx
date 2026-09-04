import React from 'react';
import { AlertOctagon } from 'lucide-react';

/**
 * Hardcoded static tip lookup keyed by Health Condition and Age Group
 */
const CONDITION_TIPS = {
  'Asthma': [
    'Keep rescue inhaler accessible at all times.',
    'Avoid outdoor exertion and heavy physical exercise.',
    'Consider an N95 mask if going outside is necessary.'
  ],
  'Heart condition': [
    'Avoid strenuous outdoor activity to prevent extra strain on the heart.',
    'Monitor for chest discomfort or unusual shortness of breath.',
    'Stay in temperature-controlled, air-filtered indoor environments.'
  ],
  'Pregnant': [
    'Minimize outdoor exposure during high pollution.',
    'Prioritize indoor air quality and stay well hydrated.',
    'Avoid prolonged standing or intense physical effort outdoors.'
  ],
  'Other respiratory issue': [
    'Keep prescribed breathing medications and inhaler nearby.',
    'Avoid active or passive exposure to outdoor pollutants, dust, and smoke.',
    'Wear a certified high-efficiency mask if stepping outside is necessary.'
  ],
  // Fallback for Child / Senior when healthCondition is 'None'
  'VulnerableAge': [
    'Limit prolonged outdoor exposure and strenuous play during peak pollution hours.',
    'Keep windows closed during peak pollution hours to protect indoor air quality.',
    'Take frequent rest breaks and stay well hydrated.'
  ]
};

export default function EmergencySafetyNote({ weather, aqi, profile }) {
  if (!weather || !aqi || !profile) return null;

  const aqiValue = Number(aqi.aqi) || 0;
  const temp = weather.temperature ?? 25;

  // 1. Environmental Risk Trigger: AQI in Unhealthy/Elevated band (AQI > 100) OR Extreme Temp (> 35°C or < 5°C)
  const isHighRiskEnv = aqiValue > 100 || temp > 35 || temp < 5;

  // 2. Vulnerable Profile Trigger: Condition != 'None' OR Child OR Senior
  const isVulnerableProfile = (profile.healthCondition && profile.healthCondition !== 'None') ||
                              profile.ageGroup === 'Child' ||
                              profile.ageGroup === 'Senior';

  // Do NOT render if both conditions are not met
  if (!isHighRiskEnv || !isVulnerableProfile) {
    return null;
  }

  // Determine appropriate tips list
  let selectedTips = CONDITION_TIPS[profile.healthCondition];
  if (!selectedTips || profile.healthCondition === 'None') {
    selectedTips = CONDITION_TIPS['VulnerableAge'];
  }

  const profileLabel = profile.healthCondition !== 'None'
    ? `${profile.ageGroup} • ${profile.healthCondition}`
    : `${profile.ageGroup} (Sensitive Age Group)`;

  return (
    <div
      className="glass-card emergency-safety-card fade-in-slide"
      style={{
        borderLeft: '6px solid #dc2626',
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderLeftWidth: '6px',
        padding: '22px 24px',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(220, 38, 38, 0.08)',
        borderRadius: '16px'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626' }}>
            <AlertOctagon size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#991b1b', margin: 0 }}>
              High-Risk Emergency Safety Note
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: 600 }}>
              Elevated Risk Alert (AQI {aqiValue} • {temp}°C)
            </span>
          </div>
        </div>

        <span
          style={{
            padding: '4px 10px',
            borderRadius: '9999px',
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fca5a5',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase'
          }}
        >
          High Risk Profile
        </span>
      </div>

      {/* Static Warning Line */}
      <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#7f1d1d', marginBottom: '10px' }}>
        This profile ({profileLabel}) is at elevated risk under current conditions.
      </p>

      {/* Static Concrete Tips List */}
      <ul style={{ paddingLeft: '20px', marginBottom: '14px', color: '#991b1b', fontSize: '0.9rem', lineHeight: '1.6' }}>
        {selectedTips.map((tip, idx) => (
          <li key={idx} style={{ marginBottom: '4px' }}>
            <strong>{tip}</strong>
          </li>
        ))}
      </ul>

      {/* Medical Action Closing Line */}
      <p style={{ fontSize: '0.85rem', color: '#b91c1c', fontStyle: 'italic', marginBottom: '12px', borderTop: '1px dashed #fca5a5', paddingTop: '10px' }}>
        If symptoms such as difficulty breathing, chest pain, or dizziness occur, seek medical attention or consult a doctor promptly.
      </p>

      {/* Medical Disclaimer Line */}
      <div style={{ fontSize: '0.72rem', color: '#7f1d1d', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
        ⚠️ Not a substitute for professional medical advice.
      </div>
    </div>
  );
}
