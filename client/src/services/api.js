import { calculateIndianCPCB_AQI } from '../utils/aqiUtils';

/**
 * VayuCare Frontend API Service Layer
 */

// Geocode city name to lat/lon via Express backend proxy
export async function geocodeCity(cityName) {
  const response = await fetch(`/api/geocode?q=${encodeURIComponent(cityName)}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Geocoding failed (${response.status})`);
  }
  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`No locations found for "${cityName}". Please try another city.`);
  }
  return data.results;
}

// Fetch live weather data via Express backend proxy
export async function fetchWeatherData(lat, lon) {
  const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Weather fetch failed (${response.status})`);
  }
  const raw = await response.json();
  
  const current = raw.current || {};
  return {
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    windSpeed: current.wind_speed_10m,
    weatherCode: current.weather_code,
    isDay: current.is_day === 1,
    precipitation: current.precipitation,
    dailyMax: raw.daily?.temperature_2m_max?.[0],
    dailyMin: raw.daily?.temperature_2m_min?.[0],
  };
}

// Fetch AQI data via Express backend proxy (WAQI)
export async function fetchAQIData(lat, lon) {
  const response = await fetch(`/api/aqi?lat=${lat}&lon=${lon}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `AQI fetch failed (${response.status})`);
  }
  const result = await response.json();
  
  if (result.status !== 'ok' || !result.data) {
    throw new Error(result.data || 'AQI data unavailable for this location.');
  }

  const data = result.data;
  const iaqi = data.iaqi || {};

  // Calculate Indian National CPCB AQI from raw pollutant concentrations
  const cpcbResult = calculateIndianCPCB_AQI(iaqi);

  return {
    aqi: cpcbResult.cpcbAQI > 0 ? cpcbResult.cpcbAQI : data.aqi, // Indian CPCB AQI
    usAqi: data.aqi, // Raw US EPA AQI
    dominantPollutant: cpcbResult.dominantPollutant || data.dominentpol || 'pm25',
    stationName: data.city?.name || 'Local Monitoring Station',
    attributions: data.attributions || [],
    iaqi: iaqi,
    observationTime: data.time?.s || data.time?.iso || new Date().toLocaleString(),
    rawFeed: data
  };
}

// Post request to backend Groq LLM advisory generator
export async function fetchAdvisoryFromBackend(weatherData, aqiData, profile, locationName) {
  const response = await fetch('/api/advisory', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      weatherData,
      aqiData,
      profile,
      locationName,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    console.error('Groq Backend Advisory API Error:', response.status, errData);
    throw new Error(errData.error || errData.details || `Backend advisory failed with status ${response.status}`);
  }

  return await response.json();
}
