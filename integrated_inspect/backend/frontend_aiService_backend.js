const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const SATELLITE = {
  provider: "MOSDAC / SAC / ISRO",
  liveUrl: "https://mosdac.gov.in/live/",
  label: "Official MOSDAC / Space Applications Centre, ISRO view",
};

export const IMD = {
  apiUrl: "https://api.imd.gov.in/",
  warningsUrl: "https://mausam.imd.gov.in/",
};

export function getApiConfig() {
  return { openaiKey:"", geminiKey:"", weatherApiKey:"", preferredProvider:"backend", ollamaModel:"", ollamaEndpoint:"" };
}
export function saveApiConfig() { console.log("AI provider configuration is handled by the backend."); }

async function jsonFetch(url, options={}) {
  const r = await fetch(url, options);
  if (!r.ok) throw new Error(`${options.method || "GET"} ${url} failed (${r.status}): ${await r.text()}`);
  return r.json();
}

export async function fetchLiveWeather(city="Visakhapatnam") {
  const data = await jsonFetch(`${BACKEND_URL}/api/weather/by-city?city=${encodeURIComponent(city)}`);
  const c = data.current;
  return {
    source:data.source, temp:`${Math.round(c.temperature)}°C`, humidity:`${Math.round(c.humidity)}%`,
    wind:`${Math.round(c.wind_speed)} km/h`, condition:c.condition, pressure:`${Math.round(c.pressure)} hPa`,
    clouds:`${Math.round(c.cloud_cover)}%`, visibility:`${c.visibility ?? "-"} km`,
    city:data.location.name, country:data.location.country, hourly:data.hourly, daily:data.daily,
  };
}

export async function getLiveChatResponse(messagesHistory=[], userQuery, options={}) {
  const conversation = messagesHistory.filter(m=>m && m.text!=null).map(m=>({role:m.sender==="user"?"user":"assistant",content:m.text}));
  const payload = { message:userQuery, conversation, language:options.language || "en" };
  if(options.latitude!=null && options.longitude!=null){ payload.latitude=options.latitude; payload.longitude=options.longitude; }
  if(options.location_name) payload.location_name=options.location_name;
  if(options.session_id) payload.session_id=options.session_id;
  return jsonFetch(`${BACKEND_URL}/api/chat`, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
}

export async function createConversation(){ return jsonFetch(`${BACKEND_URL}/api/chat/session`,{method:"POST"}); }
export async function pauseConversation(sessionId){ return jsonFetch(`${BACKEND_URL}/api/chat/session/${sessionId}/pause`,{method:"POST"}); }
export async function resumeConversation(sessionId){ return jsonFetch(`${BACKEND_URL}/api/chat/session/${sessionId}/resume`,{method:"POST"}); }
export async function newConversation(sessionId){ return jsonFetch(`${BACKEND_URL}/api/chat/session/${sessionId}/new`,{method:"POST"}); }

export async function fetchCurrentWeather(latitude,longitude){
  return jsonFetch(`${BACKEND_URL}/api/weather/current?latitude=${latitude}&longitude=${longitude}`);
}
export async function fetchWeatherForecast(latitude,longitude,days=7){
  return jsonFetch(`${BACKEND_URL}/api/weather/forecast?latitude=${latitude}&longitude=${longitude}&days=${days}`);
}
export async function fetchDataSources(){ return jsonFetch(`${BACKEND_URL}/api/weather/sources`); }
