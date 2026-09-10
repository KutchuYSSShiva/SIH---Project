const GEO = "https://geocoding-api.open-meteo.com/v1/search";
const cache = new Map();
const CACHE_TTL_MS = 60_000;

function backendBase() {
  return (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
}

export async function geocodeCity(city, { signal } = {}) {
  const query = String(city || '').trim();
  if (!query) throw new Error('Enter a village, town, district, or city.');
  const res = await fetch(`${backendBase()}/api/weather/by-city?city=${encodeURIComponent(query)}`, { signal });
  if (!res.ok) throw new Error(`Location/weather search failed (${res.status}).`);
  const data = await res.json();
  return data.location;
}

export async function getWeather({ latitude, longitude, timezone = 'auto' }, { signal } = {}) {
  const res = await fetch(`${backendBase()}/api/weather/forecast?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&days=7`, { signal });
  if (!res.ok) throw new Error(`Forecast fetch failed (${res.status}).`);
  const data = await res.json();
  return normalizeBackendForecast(data);
}

function normalizeBackendForecast(data) {
  const current = data.current || {};
  const hourly = data.hourly || [];
  const daily = data.daily || [];
  const times = hourly.map(x => x.time);
  const result = {
    timezone: data.timezone || 'auto',
    current: {
      time: current.time,
      temperature_2m: current.temperature,
      apparent_temperature: current.feels_like,
      relative_humidity_2m: current.humidity,
      is_day: current.is_day,
      precipitation: current.precipitation,
      rain: current.rain ?? current.precipitation,
      showers: current.showers ?? 0,
      snowfall: current.snowfall ?? 0,
      weather_code: current.weather_code,
      cloud_cover: current.cloud_cover,
      pressure_msl: current.pressure,
      surface_pressure: current.surface_pressure,
      wind_speed_10m: current.wind_speed,
      wind_direction_10m: current.wind_direction,
      wind_gusts_10m: current.wind_gusts,
      visibility: current.visibility != null ? current.visibility * 1000 : null,
      dew_point_2m: current.dew_point,
      condition_text: current.condition
    },
    hourly: {
      time: times,
      temperature_2m: hourly.map(x => x.temperature),
      apparent_temperature: hourly.map(x => x.feels_like),
      relative_humidity_2m: hourly.map(x => x.humidity),
      precipitation_probability: hourly.map(x => x.rain_probability),
      precipitation: hourly.map(x => x.precipitation),
      weather_code: hourly.map(x => x.weather_code),
      wind_speed_10m: hourly.map(x => x.wind_speed),
      wind_direction_10m: hourly.map(x => x.wind_direction),
      cloud_cover: hourly.map(x => x.cloud_cover),
      pressure_msl: hourly.map(x => x.pressure),
      visibility: hourly.map(x => x.visibility),
      uv_index: hourly.map(x => x.uv_index),
      is_day: hourly.map(x => x.is_day)
    },
    daily: {
      time: daily.map(x => x.date),
      weather_code: daily.map(x => x.weather_code),
      temperature_2m_max: daily.map(x => x.max_temperature),
      temperature_2m_min: daily.map(x => x.min_temperature),
      apparent_temperature_max: daily.map(x => x.apparent_max_temperature),
      apparent_temperature_min: daily.map(x => x.apparent_min_temperature),
      precipitation_probability_max: daily.map(x => x.rain_probability),
      precipitation_sum: daily.map(x => x.precipitation_sum),
      wind_speed_10m_max: daily.map(x => x.wind_speed_max),
      wind_gusts_10m_max: daily.map(x => x.wind_gusts_max),
      sunrise: daily.map(x => x.sunrise),
      sunset: daily.map(x => x.sunset),
      uv_index_max: daily.map(x => x.uv_index_max)
    }
  };
  return result;
}

export async function getWeatherByCity(city, options = {}) {
  const query = String(city || '').trim();
  if (!query) throw new Error('Enter a village, town, district, or city.');
  const key = query.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  const res = await fetch(`${backendBase()}/api/weather/by-city?city=${encodeURIComponent(query)}`, { signal: options.signal });
  if (!res.ok) {
    let detail = `Weather service failed (${res.status}).`;
    try { detail = (await res.json()).detail || detail; } catch (_) {}
    throw new Error(detail);
  }
  const data = await res.json();
  const value = normalizeBackendForecast(data);
  value.location = data.location;
  value.fetchedAt = data.fetchedAt || new Date().toISOString();
  value.source = data.source || 'Open-Meteo forecast';
  value.source_type = data.source_type || 'open_meteo';
  value.satellite = data.satellite;
  value.imd = data.imd;
  cache.set(key, { at: Date.now(), value });
  return value;
}

export function decodeWeatherCode(code, isDay = 1) {
  const map = {
    0: ['Clear sky', 'Sun'], 1: ['Mainly clear', isDay ? 'Sun' : 'Moon'], 2: ['Partly cloudy', 'CloudSun'], 3: ['Overcast', 'Cloud'],
    45: ['Fog', 'CloudFog'], 48: ['Rime fog', 'CloudFog'], 51: ['Light drizzle', 'CloudDrizzle'], 53: ['Drizzle', 'CloudDrizzle'], 55: ['Dense drizzle', 'CloudDrizzle'],
    56: ['Freezing drizzle', 'CloudSnow'], 57: ['Dense freezing drizzle', 'CloudSnow'], 61: ['Slight rain', 'CloudRain'], 63: ['Moderate rain', 'CloudRain'], 65: ['Heavy rain', 'CloudRain'],
    66: ['Light freezing rain', 'CloudSnow'], 67: ['Heavy freezing rain', 'CloudSnow'], 71: ['Slight snow', 'CloudSnow'], 73: ['Moderate snow', 'CloudSnow'], 75: ['Heavy snow', 'CloudSnow'],
    77: ['Snow grains', 'CloudSnow'], 80: ['Slight rain showers', 'CloudRainWind'], 81: ['Moderate rain showers', 'CloudRainWind'], 82: ['Violent rain showers', 'CloudRainWind'],
    85: ['Slight snow showers', 'CloudSnow'], 86: ['Heavy snow showers', 'CloudSnow'], 95: ['Thunderstorm', 'CloudLightning'], 96: ['Thunderstorm with hail', 'CloudLightning'], 99: ['Thunderstorm with heavy hail', 'CloudLightning']
  };
  const [label, icon] = map[Number(code)] || ['Unknown', 'Cloud'];
  return { label, icon };
}

export function currentWeatherSummary(payload) {
  const c = payload?.current || {};
  const decoded = decodeWeatherCode(c.weather_code, c.is_day);
  return {
    temperature: c.temperature_2m, feelsLike: c.apparent_temperature, humidity: c.relative_humidity_2m,
    wind: c.wind_speed_10m, gusts: c.wind_gusts_10m, direction: c.wind_direction_10m,
    precipitation: c.precipitation, rain: c.rain, showers: c.showers, cloudCover: c.cloud_cover,
    pressure: c.pressure_msl, visibility: c.visibility, dewPoint: c.dew_point_2m,
    condition: c.condition_text || decoded.label, isDay: c.is_day === 1, observedAt: c.time, units: payload?.current_units || {}
  };
}

export function clearWeatherCache() { cache.clear(); }
