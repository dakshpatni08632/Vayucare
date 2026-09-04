import React from 'react';

export default function SkeletonLoader() {
  return (
    <div className="dashboard-grid">
      <div className="main-content-col skeleton-container">
        {/* Advisory Card Skeleton */}
        <div className="glass-card" style={{ padding: '24px', borderLeft: '6px solid var(--accent-cyan)' }}>
          <div className="skeleton-box" style={{ width: '40%', height: '24px', marginBottom: '14px' }} />
          <div className="skeleton-box" style={{ width: '100%', height: '16px', marginBottom: '8px' }} />
          <div className="skeleton-box" style={{ width: '85%', height: '16px', marginBottom: '8px' }} />
          <div className="skeleton-box" style={{ width: '60%', height: '16px', marginBottom: '18px' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="skeleton-box" style={{ width: '140px', height: '26px', borderRadius: '9999px' }} />
            <div className="skeleton-box" style={{ width: '120px', height: '26px', borderRadius: '9999px' }} />
          </div>
        </div>

        {/* AQI Gauge Card Skeleton */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div className="skeleton-box" style={{ width: '30%', height: '22px' }} />
            <div className="skeleton-box" style={{ width: '20%', height: '22px', borderRadius: '9999px' }} />
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div className="skeleton-box" style={{ width: '140px', height: '120px', borderRadius: '14px' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="skeleton-box" style={{ width: '90%', height: '16px' }} />
              <div className="skeleton-box" style={{ width: '70%', height: '16px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '10px' }}>
                <div className="skeleton-box" style={{ height: '45px' }} />
                <div className="skeleton-box" style={{ height: '45px' }} />
                <div className="skeleton-box" style={{ height: '45px' }} />
                <div className="skeleton-box" style={{ height: '45px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Row Skeleton */}
        <div className="metrics-row">
          <div className="glass-card metric-card" style={{ height: '130px' }}>
            <div className="skeleton-box" style={{ width: '50%', height: '18px' }} />
            <div className="skeleton-box" style={{ width: '40%', height: '36px', marginTop: '12px' }} />
          </div>
          <div className="glass-card metric-card" style={{ height: '130px' }}>
            <div className="skeleton-box" style={{ width: '50%', height: '18px' }} />
            <div className="skeleton-box" style={{ width: '40%', height: '36px', marginTop: '12px' }} />
          </div>
          <div className="glass-card metric-card" style={{ height: '130px' }}>
            <div className="skeleton-box" style={{ width: '50%', height: '18px' }} />
            <div className="skeleton-box" style={{ width: '40%', height: '36px', marginTop: '12px' }} />
          </div>
        </div>
      </div>

      {/* Sidebar Profile Skeleton */}
      <div className="sidebar-col">
        <div className="glass-card profile-card">
          <div className="skeleton-box" style={{ width: '60%', height: '24px', marginBottom: '16px' }} />
          <div className="skeleton-box" style={{ width: '100%', height: '45px', marginBottom: '16px' }} />
          <div className="skeleton-box" style={{ width: '100%', height: '45px', marginBottom: '16px' }} />
          <div className="skeleton-box" style={{ width: '100%', height: '45px' }} />
        </div>
      </div>
    </div>
  );
}
