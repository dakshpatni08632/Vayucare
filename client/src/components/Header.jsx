import React, { useState } from 'react';
import { Wind, ShieldCheck, HelpCircle, X, Sparkles, Activity, AlertCircle } from 'lucide-react';

export default function Header() {
  const [showModal, setShowModal] = useState(false);

  return (
    <header className="app-header">
      <div className="brand-wrapper">
        <div className="brand-icon">
          <Wind size={26} />
        </div>
        <div>
          <h1 className="brand-title">VayuCare</h1>
          <p className="brand-tagline">Personalized Weather & Air Quality Health Advisory</p>
        </div>
      </div>

      <div className="header-badge-group">
        <button
          className="info-btn"
          onClick={() => setShowModal(true)}
          title="Learn how VayuCare AI advisory works"
        >
          <HelpCircle size={15} />
          <span>How It Works</span>
        </button>

        <div className="header-badge">
          <ShieldCheck size={14} />
          <span>Live Environmental Feed</span>
        </div>
      </div>

      {/* How It Works Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="glass-card modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} className="text-cyan" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>How VayuCare AI Works</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p>
                <strong>1. Live Environmental Data:</strong> Real-time temperature, humidity, and wind metrics are fetched from Open-Meteo API. Air quality data is retrieved from World Air Quality Index (WAQI) stations.
              </p>
              <p>
                <strong>2. Indian National AQI (CPCB):</strong> Raw pollutant concentrations (PM2.5, PM10, NO2, SO2, CO, O3) are processed through the official Central Pollution Control Board (CPCB) breakpoint formula to provide India-relevant AQI severity bands.
              </p>
              <p>
                <strong>3. Groq LLM Advisory:</strong> Your age group, pre-existing health condition, and daily activity level are combined with live weather and AQI into a prompt evaluated by Groq AI LLM models.
              </p>
              <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', fontSize: '0.82rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                <strong style={{ color: 'var(--accent-cyan)' }}>⚠️ Medical Disclaimer:</strong> VayuCare provides AI-assisted environmental health advisories for awareness and decision support. It is not a substitute for professional medical diagnosis or emergency healthcare.
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '20px', padding: '10px' }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
