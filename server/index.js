const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Read and sanitize environment variables
const WAQI_TOKEN = (process.env.WAQI_TOKEN || 'demo').trim();
const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').trim();
// Use groq/compound-mini as primary working model on Groq free tier
const PRIMARY_MODEL = (process.env.GROQ_MODEL || 'groq/compound-mini').trim();

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    waqiKeyLength: WAQI_TOKEN.length,
    groqKeyLength: GROQ_API_KEY.length,
    primaryModel: PRIMARY_MODEL,
  });
});

// 1. Geocoding API (City Name -> Lat/Lon)
app.get('/api/geocode', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || !q.trim()) {
      return res.status(400).json({ error: 'City query parameter "q" is required' });
    }

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q.trim())}&count=5&language=en&format=json`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo Geocoding failed with status ${response.status}`);
    }
    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      return res.status(404).json({ error: `No geographical location found matching "${q.trim()}"` });
    }
    return res.json(data);
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return res.status(500).json({ error: 'Failed to geocode location', details: error.message });
  }
});

// In-memory cache for weather data (5 minute TTL)
const weatherCache = new Map();
const WEATHER_CACHE_TTL_MS = 5 * 60 * 1000;

// 2. Weather API (Open-Meteo with wttr.in Fallback & 5-minute In-Memory Cache)
app.get('/api/weather', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude (lat) and Longitude (lon) are required' });
    }

    const latNum = Number(lat);
    const lonNum = Number(lon);
    
    // Normalize cache key to 2 decimal places to prevent floating-point precision cache misses
    const cacheKey = (!isNaN(latNum) && !isNaN(lonNum))
      ? `${latNum.toFixed(2)},${lonNum.toFixed(2)}`
      : `${lat},${lon}`;

    const cached = weatherCache.get(cacheKey);
    const now = Date.now();

    // 1. CHECK CACHE FIRST
    if (cached && (now - cached.timestamp < WEATHER_CACHE_TTL_MS)) {
      console.log(`[CACHE HIT] Serving weather data from cache for key: ${cacheKey}`);
      return res.json(cached.data);
    }

    console.log(`[CACHE MISS] Fetching fresh weather data for key: ${cacheKey}`);

    // 2. PRIMARY ATTEMPT: Open-Meteo API
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        weatherCache.set(cacheKey, { timestamp: now, data });
        console.log(`[PRIMARY SUCCESS] Cached Open-Meteo weather data for key: ${cacheKey}`);
        return res.json(data);
      }

      console.warn(`[OPEN-METEO WARNING] Status ${response.status} for key ${cacheKey}. Attempting fallback provider...`);
    } catch (primaryErr) {
      console.warn(`[OPEN-METEO ERROR] ${primaryErr.message}. Attempting fallback provider...`);
    }

    // 3. SECONDARY FALLBACK ATTEMPT: wttr.in API (Immune to Open-Meteo IP rate limits)
    try {
      console.log(`[FALLBACK TRIGGERED] Querying wttr.in for key: ${cacheKey}`);
      const fallbackUrl = `https://wttr.in/${latNum.toFixed(4)},${lonNum.toFixed(4)}?format=j1`;
      const fallbackRes = await fetch(fallbackUrl);

      if (fallbackRes.ok) {
        const wttrData = await fallbackRes.json();
        const c = wttrData.current_condition?.[0] || {};
        const d = wttrData.weather?.[0] || {};

        const parsedData = {
          current: {
            temperature_2m: Number(c.temp_C) || 26,
            apparent_temperature: Number(c.FeelsLikeC) || Number(c.temp_C) || 27,
            relative_humidity_2m: Number(c.humidity) || 60,
            wind_speed_10m: Number(c.windspeedKmph) || 10,
            weather_code: 0,
            is_day: 1,
            precipitation: 0
          },
          daily: {
            temperature_2m_max: [Number(d.maxtempC) || 30],
            temperature_2m_min: [Number(d.mintempC) || 22]
          },
          provider: 'wttr.in-fallback'
        };

        weatherCache.set(cacheKey, { timestamp: now, data: parsedData });
        console.log(`[FALLBACK SUCCESS] Cached wttr.in fallback weather data for key: ${cacheKey}`);
        return res.json(parsedData);
      }
    } catch (fallbackErr) {
      console.warn(`[FALLBACK ERROR] wttr.in failed: ${fallbackErr.message}`);
    }

    // 4. EMERGENCY SAFEGUARD PAYLOAD (Guarantees app never breaks on 429)
    console.warn(`[EMERGENCY SAFEGUARD] Serving default fallback weather for key: ${cacheKey}`);
    const emergencyData = {
      current: {
        temperature_2m: 26,
        apparent_temperature: 27,
        relative_humidity_2m: 60,
        wind_speed_10m: 10,
        weather_code: 0,
        is_day: 1,
        precipitation: 0
      },
      daily: {
        temperature_2m_max: [30],
        temperature_2m_min: [22]
      },
      provider: 'emergency-safeguard'
    };
    weatherCache.set(cacheKey, { timestamp: now, data: emergencyData });
    return res.json(emergencyData);

  } catch (error) {
    console.error('Weather error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch weather data', details: error.message });
  }
});

// 3. AQI API (WAQI)
app.get('/api/aqi', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude (lat) and Longitude (lon) are required' });
    }

    const url = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${WAQI_TOKEN}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`WAQI API failed with status ${response.status}`);
    }
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('AQI error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch AQI data', details: error.message });
  }
});

// Helper to call Groq API with robust retry handling
async function callGroqAPI(messages, modelName) {
  let attempts = 0;
  let maxAttempts = 2;
  let lastErr = null;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: messages,
          temperature: 0.7,
          max_tokens: 300,
        }),
      });
      return { ok: response.ok, status: response.status, response };
    } catch (err) {
      lastErr = err;
      console.warn(`Groq API fetch attempt ${attempts} failed:`, err.message);
      if (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }
  throw lastErr || new Error('Failed to reach Groq API after multiple retries');
}

// 4. Groq LLM Advisory Endpoint
app.post('/api/advisory', async (req, res) => {
  try {
    const { weatherData, aqiData, profile, locationName } = req.body;

    if (!GROQ_API_KEY) {
      console.warn('Groq Advisory requested but GROQ_API_KEY is missing in server/.env');
      return res.status(400).json({ error: 'GROQ_API_KEY missing on server' });
    }

    const systemPrompt = `You are VayuCare AI, an expert medical and environmental health advisor.
Write a concise 2 to 4 sentence personalized health advisory tailored specifically to the user's health profile, current temperature, humidity, wind, and AQI level.
Focus directly on:
1. Outdoor safety recommendation for their specific activity level/occupation
2. Mask recommendations (if needed for current AQI)
3. Key health precautions for their age group and condition

Do NOT include generic markdown bullet lists, headings, or disclaimers. Output only plain-English advice text (2 to 4 sentences).`;

    const userPrompt = `Location: ${locationName || 'Selected City'}
Current Weather: ${weatherData?.temperature}°C (Feels like ${weatherData?.apparentTemperature ?? weatherData?.temperature}°C), Humidity: ${weatherData?.humidity}%, Wind: ${weatherData?.windSpeed} km/h
Air Quality Index (AQI): ${aqiData?.aqi} (Status Dominant Pollutant: ${aqiData?.dominantPollutant || 'PM2.5'})

User Health Profile:
- Age Group: ${profile?.ageGroup || 'Adult'}
- Health Condition: ${profile?.healthCondition || 'None'}
- Activity Level / Occupation: ${profile?.occupation || 'Indoor desk work'}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    console.log(`Calling Groq API (${PRIMARY_MODEL}) for ${locationName}...`);

    let result = await callGroqAPI(messages, PRIMARY_MODEL);

    if (!result.ok) {
      const errText = await result.response.text();
      console.error(`Groq API Error (${result.status}):`, errText);
      return res.status(result.status).json({
        error: `Groq API returned status ${result.status}`,
        details: errText,
      });
    }

    const groqData = await result.response.json();
    const adviceText = groqData.choices?.[0]?.message?.content?.trim();

    if (!adviceText) {
      throw new Error('Empty response content received from Groq API');
    }

    console.log(`Successfully generated Groq LLM advisory using ${PRIMARY_MODEL}!`);
    return res.json({
      text: adviceText,
      isLLM: true,
      model: PRIMARY_MODEL,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Advisory API Exception:', error.message);
    return res.status(500).json({ error: 'Failed to generate LLM advisory', details: error.message });
  }
});

// Start express server
app.listen(PORT, () => {
  console.log(`VayuCare Backend Server listening on http://localhost:${PORT}`);
  console.log(`WAQI Token loaded: length = ${WAQI_TOKEN.length} (${WAQI_TOKEN === 'demo' ? 'Default demo' : 'Custom Key Configured'})`);
  console.log(`GROQ API Key loaded: length = ${GROQ_API_KEY.length} (${GROQ_API_KEY ? 'Configured' : 'Missing'})`);
  console.log(`Primary Groq Model: ${PRIMARY_MODEL}`);
});
