import { fetchAdvisoryFromBackend } from '../services/api';

/**
 * VayuCare AI Advisory Generator Service
 */

/**
 * Main Advisory Dispatcher
 */
export async function generateAdvisory(weatherData, aqiData, profile, locationName) {
  try {
    // Attempt Groq LLM API call via Express Backend
    const backendResult = await fetchAdvisoryFromBackend(weatherData, aqiData, profile, locationName);
    if (backendResult && backendResult.text) {
      return {
        text: backendResult.text,
        isLLM: true,
        model: backendResult.model || 'llama-3.1-8b-instant',
        timestamp: new Date().toISOString()
      };
    }
  } catch (err) {
    console.warn("Groq LLM API call failed or unconfigured, switching to rule-based safety net fallback:", err.message);
  }

  // Fallback rule-based generator
  const fallbackText = generateFallbackAdvisory(weatherData, aqiData, profile);
  return {
    text: fallbackText,
    isLLM: false,
    model: 'Rule-Based Fallback Engine',
    timestamp: new Date().toISOString()
  };
}

/**
 * Rule-Based Fallback Advisory Generator
 */
export function generateFallbackAdvisory(weatherData, aqiData, profile) {
  const aqi = Number(aqiData?.aqi) || 0;
  const temp = weatherData?.temperature ?? 25;
  const condition = profile?.healthCondition || 'None';
  const age = profile?.ageGroup || 'Adult';
  const occupation = profile?.occupation || 'Indoor desk work';

  let advice = [];
  let maskAdvice = "";
  let outdoorAdvice = "";

  const isSensitive = condition !== 'None' || age === 'Child' || age === 'Senior';
  const isOutdoorWorkerOrAthlete = occupation.includes('Outdoor') || occupation.includes('Athlete');

  // AQI Based Assessment
  if (aqi <= 50) {
    outdoorAdvice = `Air quality is excellent (AQI ${aqi}). It is a safe and great time for outdoor activities for all age groups.`;
    maskAdvice = `No protective mask is required under current conditions.`;
  } else if (aqi <= 100) {
    if (isSensitive) {
      outdoorAdvice = `AQI is moderate (${aqi}). As an individual with ${condition !== 'None' ? condition : 'sensitive health'}, consider reducing prolonged heavy exertion outdoors.`;
      maskAdvice = `Consider carrying a light mask if you notice irritation.`;
    } else {
      outdoorAdvice = `Air quality is moderate (AQI ${aqi}). Outdoor activities are safe for most individuals.`;
      maskAdvice = `No mask required for general outdoor activities.`;
    }
  } else if (aqi <= 150) {
    if (isSensitive || isOutdoorWorkerOrAthlete) {
      outdoorAdvice = `Unhealthy air quality for sensitive groups (AQI ${aqi}). Limit extended outdoor cardio or strenuous physical work.`;
      maskAdvice = `Wearing an N95 mask is strongly recommended while outdoors.`;
    } else {
      outdoorAdvice = `Air quality is elevated (AQI ${aqi}). Avoid long hours of heavy outdoor exercise during peak hours.`;
      maskAdvice = `Consider wearing a well-fitting mask in high-traffic zones.`;
    }
  } else if (aqi <= 200) {
    outdoorAdvice = `AQI is ${aqi} (Unhealthy). Everyone should restrict outdoor exposure. ${isOutdoorWorkerOrAthlete ? 'Take frequent indoor rest breaks.' : 'Keep windows closed and stay indoors when possible.'}`;
    maskAdvice = `An N95 or KN95 mask is essential if you must step outside.`;
  } else {
    outdoorAdvice = `CRITICAL ALERT: AQI is ${aqi} (Hazardous/Very Unhealthy). Serious health risks exist. Avoid all unnecessary outdoor activity immediately.`;
    maskAdvice = `High-efficiency N95 mask and air purification indoors are strongly advised.`;
  }

  // Weather Condition Add-on
  let weatherNote = "";
  if (temp > 35) {
    weatherNote = ` Stay well hydrated as high temperatures (${temp}°C) increase respiratory strain.`;
  } else if (temp < 10) {
    weatherNote = ` Dress in warm layers as cold air can worsen respiratory symptoms.`;
  }

  advice.push(outdoorAdvice);
  advice.push(maskAdvice);
  if (weatherNote) advice.push(weatherNote);

  return advice.join(" ");
}
