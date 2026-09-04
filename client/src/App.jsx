import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CitySearch from './components/CitySearch';
import WeatherAqiDashboard from './components/WeatherAqiDashboard';
import HealthProfile from './components/HealthProfile';
import AdvisoryCard from './components/AdvisoryCard';
import EmergencySafetyNote from './components/EmergencySafetyNote';
import HistoryTrend from './components/HistoryTrend';
import SkeletonLoader from './components/SkeletonLoader';
import { geocodeCity, fetchWeatherData, fetchAQIData } from './services/api';
import { generateAdvisory } from './utils/advisoryGenerator';
import { AlertCircle, MapPinOff } from 'lucide-react';

const LOCAL_PROFILE_KEY = 'vayucare_profile';
const LOCAL_HISTORY_KEY = 'vayucare_history';

export default function App() {
  // 1. Health Profile State with localStorage persistence
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_PROFILE_KEY);
      return saved ? JSON.parse(saved) : { ageGroup: 'Adult', healthCondition: 'None', occupation: 'Indoor desk work' };
    } catch {
      return { ageGroup: 'Adult', healthCondition: 'None', occupation: 'Indoor desk work' };
    }
  });

  // 2. Active Location, Weather, AQI & Advisory state
  const [activeLocation, setActiveLocation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [aqiData, setAqiData] = useState(null);
  const [advisory, setAdvisory] = useState(null);

  // 3. UI Status states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 4. Alert History Store per city (localStorage)
  const [historyStore, setHistoryStore] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_HISTORY_KEY);
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const store = {};
        parsed.forEach(item => {
          const k = (item.city || item.cityName || 'general').toLowerCase().trim();
          if (!store[k]) store[k] = [];
          store[k].push(item);
        });
        return store;
      }
      return parsed;
    } catch {
      return {};
    }
  });

  // Save profile changes to localStorage
  const handleProfileChange = (updatedProfile) => {
    setProfile(updatedProfile);
    try {
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updatedProfile));
    } catch (e) {
      console.error('Failed to save profile:', e);
    }
  };

  // Main data fetch function for a selected location
  const handleSelectCity = async (location, directError) => {
    if (!location) {
      // Clear stale data immediately on geocoding / search failure!
      setActiveLocation(null);
      setWeatherData(null);
      setAqiData(null);
      setAdvisory(null);
      if (directError) setErrorMsg(directError);
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setActiveLocation(location);

    try {
      let lat = location.lat;
      let lon = location.lon;
      let locName = location.name;

      // If lat/lon not provided directly, geocode name
      if (!lat || !lon) {
        const geoResults = await geocodeCity(location.shortName || location.name);
        lat = geoResults[0].latitude;
        lon = geoResults[0].longitude;
        locName = `${geoResults[0].name}${geoResults[0].country ? ', ' + geoResults[0].country : ''}`;
      }

      // Fetch Weather and AQI concurrently
      const [weatherRes, aqiRes] = await Promise.all([
        fetchWeatherData(lat, lon),
        fetchAQIData(lat, lon)
      ]);

      setWeatherData(weatherRes);
      setAqiData(aqiRes);

      // Generate Personalized Advisory
      const advisoryResult = await generateAdvisory(weatherRes, aqiRes, profile, locName);
      setAdvisory(advisoryResult);

      // Save snapshot to history with deduplication logic
      saveToHistory({
        city: location.shortName || locName,
        cityName: locName,
        aqi: aqiRes.aqi,
        temperature: weatherRes.temperature,
        timestamp: new Date().toISOString(),
        advisoryText: advisoryResult.text
      });

    } catch (err) {
      console.error('Fetch error:', err);
      setErrorMsg(err.message || 'Failed to fetch environmental data for this city.');
      // CLEAR ALL STALE DATA ON ERROR
      setWeatherData(null);
      setAqiData(null);
      setAdvisory(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-generate advisory if profile changes while location is loaded
  useEffect(() => {
    if (weatherData && aqiData) {
      generateAdvisory(weatherData, aqiData, profile, activeLocation?.name).then(setAdvisory);
    }
  }, [profile]);

  // Load default city (Delhi) on initial render
  useEffect(() => {
    handleSelectCity({
      name: 'Delhi, India',
      shortName: 'Delhi',
      lat: 28.6139,
      lon: 77.2090
    });
  }, []);

  // Save per-city history snapshot function (max 7 DISTINCT per city, 15-min deduplication)
  const saveToHistory = (newEntry) => {
    const cityKey = (newEntry.city || newEntry.cityName || 'general').toLowerCase().trim();

    setHistoryStore((prevStore) => {
      const existingList = prevStore[cityKey] || [];
      const newTime = new Date(newEntry.timestamp).getTime();
      const DEDUP_WINDOW_MS = 15 * 60 * 1000; // 15 minute deduplication window

      let updatedCityList;
      if (existingList.length > 0) {
        const lastEntry = existingList[0];
        const lastTime = new Date(lastEntry.timestamp).getTime();
        const timeDiff = Math.abs(newTime - lastTime);

        // If within 15 minutes or exact same minute, update/overwrite latest entry in-place
        if (timeDiff < DEDUP_WINDOW_MS || Math.abs(Number(lastEntry.aqi) - Number(newEntry.aqi)) === 0) {
          updatedCityList = [newEntry, ...existingList.slice(1)];
        } else {
          updatedCityList = [newEntry, ...existingList];
        }
      } else {
        updatedCityList = [newEntry];
      }

      // Cap at last 7 distinct entries per city
      updatedCityList = updatedCityList.slice(0, 7);

      const updatedStore = {
        ...prevStore,
        [cityKey]: updatedCityList
      };

      try {
        localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(updatedStore));
      } catch (e) {
        console.error('History save error:', e);
      }
      return updatedStore;
    });
  };

  /**
   * DEV DEMO AID FOR HACKATHON JUDGING
   * Seeds 6 realistic, varying AQI trend snapshots across past hours for demo visualization
   */
  const handleSeedDemoData = (targetCityName) => {
    const cityName = targetCityName || activeLocation?.name || 'Delhi, India';
    const shortName = activeLocation?.shortName || cityName.split(',')[0].trim();
    const cityKey = shortName.toLowerCase().trim();

    const now = Date.now();
    const HOUR_MS = 3600 * 1000;

    // Realistic varying AQI & temperature trend sequence (e.g. 32 -> 48 -> 85 -> 142 -> 95 -> 41)
    const mockTrend = [
      { aqi: 41, temp: 27.5, hoursAgo: 0, text: 'Clean air conditions. Outdoor activity safe for all profiles.' },
      { aqi: 95, temp: 29.4, hoursAgo: 4, text: 'Moderate air quality. Sensitive individuals reduce prolonged exertion.' },
      { aqi: 142, temp: 31.0, hoursAgo: 8, text: 'Unhealthy for sensitive groups. N95 mask advised during peak afternoon.' },
      { aqi: 85, temp: 28.2, hoursAgo: 12, text: 'Moderate AQI levels. General population unaffected.' },
      { aqi: 48, temp: 25.5, hoursAgo: 16, text: 'Good air quality index. Clear weather conditions.' },
      { aqi: 32, temp: 24.1, hoursAgo: 20, text: 'Excellent early morning air quality.' },
    ];

    const seededList = mockTrend.map(item => ({
      city: shortName,
      cityName: cityName,
      aqi: item.aqi,
      temperature: item.temp,
      timestamp: new Date(now - item.hoursAgo * HOUR_MS).toISOString(),
      advisoryText: item.text,
      isDemoSeed: true
    }));

    setHistoryStore(prev => {
      const updated = { ...prev, [cityKey]: seededList };
      try {
        localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Seed save error:', e);
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistoryStore({});
    localStorage.removeItem(LOCAL_HISTORY_KEY);
  };

  return (
    <div className="app-container">
      {/* App Header */}
      <Header />

      {/* City Search Bar */}
      <CitySearch onSelectCity={handleSelectCity} isLoading={isLoading} />

      {/* Main Global Error Banner */}
      {errorMsg && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Dashboard Layout */}
      {isLoading ? (
        <SkeletonLoader />
      ) : weatherData && aqiData ? (
        <main className="dashboard-grid">
          {/* Main Left Column: Advisory & Weather/AQI metrics */}
          <div className="main-content-col">
            {/* High-Risk Emergency Safety Note (Appears ABOVE AI Advisory when triggered) */}
            <EmergencySafetyNote
              weather={weatherData}
              aqi={aqiData}
              profile={profile}
            />

            {/* Prominent Health Advisory Card */}
            {advisory && (
              <AdvisoryCard
                advisory={advisory}
                aqi={aqiData}
                profile={profile}
              />
            )}

            {/* Weather & AQI Dashboard Grid */}
            <WeatherAqiDashboard
              weather={weatherData}
              aqi={aqiData}
              locationName={activeLocation?.name || 'Selected City'}
            />
          </div>

          {/* Right Column: Health Profile Settings */}
          <div className="sidebar-col">
            <HealthProfile
              profile={profile}
              onChangeProfile={handleProfileChange}
            />
          </div>
        </main>
      ) : (
        /* Empty / Cleared State when Search Fails */
        <main className="dashboard-grid">
          <div className="main-content-col">
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <MapPinOff size={40} style={{ color: 'var(--accent-cyan)', marginBottom: '12px' }} />
              <h3>No Active Location Data</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Please enter a valid city name above or click "Near Me" to load live weather and AQI metrics.
              </p>
            </div>
          </div>
          <div className="sidebar-col">
            <HealthProfile
              profile={profile}
              onChangeProfile={handleProfileChange}
            />
          </div>
        </main>
      )}

      {/* Alert History & Trend View */}
      <HistoryTrend
        historyStore={historyStore}
        activeCity={activeLocation?.shortName || activeLocation?.name}
        onClearHistory={handleClearHistory}
        onSeedDemoData={handleSeedDemoData}
        onSelectHistoryCity={(cityName) => handleSelectCity({ name: cityName, shortName: cityName })}
      />

      {/* App Footer */}
      <footer className="app-footer">
        <p>VayuCare Health Advisory • Built with Open-Meteo & WAQI Real-time APIs</p>
      </footer>
    </div>
  );
}
