import React from 'react';
import { UserCheck, HeartPulse, Briefcase, Calendar } from 'lucide-react';

export default function HealthProfile({ profile, onChangeProfile }) {
  const handleChange = (field, value) => {
    const updated = { ...profile, [field]: value };
    onChangeProfile(updated);
  };

  return (
    <div className="glass-card profile-card">
      <h3 className="section-heading">
        <UserCheck size={18} className="text-cyan" />
        <span>Your Health Profile</span>
      </h3>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Tailor advisories to your specific age, health background, and daily activities.
      </p>

      {/* Age Group */}
      <div className="form-group">
        <label className="form-label">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} /> Age Group
          </span>
        </label>
        <select
          className="form-select"
          value={profile.ageGroup}
          onChange={(e) => handleChange('ageGroup', e.target.value)}
        >
          <option value="Adult">Adult (18-64 yrs)</option>
          <option value="Child">Child (0-17 yrs)</option>
          <option value="Senior">Senior (65+ yrs)</option>
        </select>
      </div>

      {/* Health Condition */}
      <div className="form-group">
        <label className="form-label">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <HeartPulse size={14} /> Health Condition
          </span>
        </label>
        <select
          className="form-select"
          value={profile.healthCondition}
          onChange={(e) => handleChange('healthCondition', e.target.value)}
        >
          <option value="None">None (General Population)</option>
          <option value="Asthma">Asthma / Breathing Sensitivity</option>
          <option value="Heart condition">Heart / Cardiovascular Condition</option>
          <option value="Pregnant">Pregnant</option>
          <option value="Other respiratory issue">Other Respiratory Condition</option>
        </select>
      </div>

      {/* Occupation / Activity Level */}
      <div className="form-group">
        <label className="form-label">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Briefcase size={14} /> Daily Activity Level
          </span>
        </label>
        <select
          className="form-select"
          value={profile.occupation}
          onChange={(e) => handleChange('occupation', e.target.value)}
        >
          <option value="Indoor desk work">Indoor Desk Work</option>
          <option value="Outdoor worker">Outdoor Worker (Extended Exposure)</option>
          <option value="Athlete / frequent outdoor exercise">Athlete / Outdoor Exercise</option>
        </select>
      </div>
    </div>
  );
}
