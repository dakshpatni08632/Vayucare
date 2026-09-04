/**
 * Indian National AQI (CPCB) Breakpoint Sub-index Calculations
 * Official CPCB Standards (Central Pollution Control Board, India)
 */

function calcSubIndex(c, breakpoints) {
  if (c === undefined || c === null || isNaN(c)) return 0;
  for (const b of breakpoints) {
    if (c >= b.cLow && c <= b.cHigh) {
      return Math.round(b.iLow + ((b.iHigh - b.iLow) / (b.cHigh - b.cLow)) * (c - b.cLow));
    }
  }
  // Above max breakpoint
  const last = breakpoints[breakpoints.length - 1];
  if (c > last.cHigh) {
    return Math.min(500, Math.round(last.iHigh + ((500 - last.iHigh) / (500 - last.cHigh)) * (c - last.cHigh)));
  }
  return 0;
}

// CPCB Breakpoints for PM2.5 (µg/m³)
const PM25_BREAKPOINTS = [
  { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
  { cLow: 31, cHigh: 60, iLow: 51, iHigh: 100 },
  { cLow: 61, cHigh: 90, iLow: 101, iHigh: 200 },
  { cLow: 91, cHigh: 120, iLow: 201, iHigh: 300 },
  { cLow: 121, cHigh: 250, iLow: 301, iHigh: 400 },
  { cLow: 251, cHigh: 500, iLow: 401, iHigh: 500 },
];

// CPCB Breakpoints for PM10 (µg/m³)
const PM10_BREAKPOINTS = [
  { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
  { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100 },
  { cLow: 101, cHigh: 250, iLow: 101, iHigh: 200 },
  { cLow: 251, cHigh: 350, iLow: 201, iHigh: 300 },
  { cLow: 351, cHigh: 430, iLow: 301, iHigh: 400 },
  { cLow: 431, cHigh: 500, iLow: 401, iHigh: 500 },
];

// CPCB Breakpoints for NO2 (µg/m³)
const NO2_BREAKPOINTS = [
  { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },
  { cLow: 41, cHigh: 80, iLow: 51, iHigh: 100 },
  { cLow: 81, cHigh: 180, iLow: 101, iHigh: 200 },
  { cLow: 181, cHigh: 280, iLow: 201, iHigh: 300 },
  { cLow: 281, cHigh: 400, iLow: 301, iHigh: 400 },
  { cLow: 401, cHigh: 500, iLow: 401, iHigh: 500 },
];

// CPCB Breakpoints for SO2 (µg/m³)
const SO2_BREAKPOINTS = [
  { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },
  { cLow: 41, cHigh: 80, iLow: 51, iHigh: 100 },
  { cLow: 81, cHigh: 380, iLow: 101, iHigh: 200 },
  { cLow: 381, cHigh: 800, iLow: 201, iHigh: 300 },
  { cLow: 801, cHigh: 1600, iLow: 301, iHigh: 400 },
  { cLow: 1601, cHigh: 2000, iLow: 401, iHigh: 500 },
];

// CPCB Breakpoints for O3 (µg/m³)
const O3_BREAKPOINTS = [
  { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
  { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100 },
  { cLow: 101, cHigh: 168, iLow: 101, iHigh: 200 },
  { cLow: 169, cHigh: 208, iLow: 201, iHigh: 300 },
  { cLow: 209, cHigh: 748, iLow: 301, iHigh: 400 },
  { cLow: 749, cHigh: 1000, iLow: 401, iHigh: 500 },
];

/**
 * Calculates Indian CPCB National AQI from raw pollutant concentrations (iaqi)
 */
export function calculateIndianCPCB_AQI(iaqi = {}) {
  const pm25 = iaqi.pm25?.v;
  const pm10 = iaqi.pm10?.v;
  const no2 = iaqi.no2?.v;
  const so2 = iaqi.so2?.v;
  const o3 = iaqi.o3?.v;

  const subIndices = {
    pm25: calcSubIndex(pm25, PM25_BREAKPOINTS),
    pm10: calcSubIndex(pm10, PM10_BREAKPOINTS),
    no2: calcSubIndex(no2, NO2_BREAKPOINTS),
    so2: calcSubIndex(so2, SO2_BREAKPOINTS),
    o3: calcSubIndex(o3, O3_BREAKPOINTS),
  };

  // Find dominant pollutant sub-index for Indian CPCB AQI
  let maxAQI = 0;
  let dominant = 'pm25';

  Object.entries(subIndices).forEach(([pollutant, val]) => {
    if (val > maxAQI) {
      maxAQI = val;
      dominant = pollutant;
    }
  });

  return {
    cpcbAQI: maxAQI,
    dominantPollutant: dominant,
    subIndices
  };
}

/**
 * Returns Indian National CPCB AQI Severity Metadata
 */
export function getAQIMetadata(aqi) {
  const val = Number(aqi);

  if (isNaN(val) || val === null) {
    return {
      level: 'unknown',
      label: 'Unknown',
      color: '#94a3b8',
      bgColor: 'rgba(148, 163, 184, 0.1)',
      description: 'Data unavailable',
      severityIndex: 0
    };
  }

  if (val <= 50) {
    return {
      level: 'good',
      label: 'Good Air Quality (CPCB)',
      color: 'var(--aqi-good)',
      bgColor: 'var(--aqi-good-bg)',
      description: 'Minimal impact. Air quality is clean and satisfactory.',
      severityIndex: 1
    };
  } else if (val <= 100) {
    return {
      level: 'satisfactory',
      label: 'Satisfactory (CPCB)',
      color: '#0d9488',
      bgColor: 'rgba(13, 148, 136, 0.1)',
      description: 'Minor breathing discomfort to sensitive people.',
      severityIndex: 2
    };
  } else if (val <= 200) {
    return {
      level: 'moderate',
      label: 'Moderate (CPCB)',
      color: 'var(--aqi-moderate)',
      bgColor: 'var(--aqi-moderate-bg)',
      description: 'Breathing discomfort to people with lungs, asthma, and heart diseases.',
      severityIndex: 3
    };
  } else if (val <= 300) {
    return {
      level: 'poor',
      label: 'Poor (CPCB)',
      color: 'var(--aqi-sensitive)',
      bgColor: 'var(--aqi-sensitive-bg)',
      description: 'Breathing discomfort to most people on prolonged exposure.',
      severityIndex: 4
    };
  } else if (val <= 400) {
    return {
      level: 'very-poor',
      label: 'Very Poor (CPCB)',
      color: 'var(--aqi-unhealthy)',
      bgColor: 'var(--aqi-unhealthy-bg)',
      description: 'Respiratory illness on prolonged exposure. Affects healthy people too.',
      severityIndex: 5
    };
  } else {
    return {
      level: 'severe',
      label: 'Severe / Hazardous (CPCB)',
      color: 'var(--aqi-hazardous)',
      bgColor: 'var(--aqi-hazardous-bg)',
      description: 'Affects healthy people and seriously impacts those with existing diseases.',
      severityIndex: 6
    };
  }
}

/**
 * Maps WMO Weather codes from Open-Meteo to human-readable text and icon types
 */
export function getWeatherCodeMeta(code) {
  const c = Number(code);
  switch (c) {
    case 0: return { text: 'Clear Sky', icon: 'sun' };
    case 1:
    case 2:
    case 3: return { text: 'Partly Cloudy', icon: 'cloud-sun' };
    case 45:
    case 48: return { text: 'Foggy / Hazy', icon: 'fog' };
    case 51:
    case 53:
    case 55: return { text: 'Light Drizzle', icon: 'drizzle' };
    case 61:
    case 63:
    case 65: return { text: 'Rainy', icon: 'rain' };
    case 71:
    case 73:
    case 75: return { text: 'Snowy', icon: 'snow' };
    case 80:
    case 81:
    case 82: return { text: 'Rain Showers', icon: 'showers' };
    case 95:
    case 96:
    case 99: return { text: 'Thunderstorm', icon: 'thunderstorm' };
    default: return { text: 'Fair Weather', icon: 'cloud' };
  }
}
