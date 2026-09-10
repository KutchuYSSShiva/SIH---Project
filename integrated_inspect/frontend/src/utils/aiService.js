import { getWeatherByCity, currentWeatherSummary } from './weatherService';
import { detectLanguage, languageNames } from './language';

export function getApiConfig() {
  return {
    openaiKey: localStorage.getItem('weathergpt_openai_key') || '', geminiKey: localStorage.getItem('weathergpt_gemini_key') || '',
    weatherApiKey: localStorage.getItem('weathergpt_weather_key') || '', preferredProvider: localStorage.getItem('weathergpt_provider') || 'instant',
    ollamaModel: localStorage.getItem('weathergpt_ollama_model') || 'phi4-mini', ollamaEndpoint: localStorage.getItem('weathergpt_ollama_endpoint') || 'http://localhost:11434'
  };
}
export function saveApiConfig(config) {
  Object.entries({ openaiKey: 'weathergpt_openai_key', geminiKey: 'weathergpt_gemini_key', weatherApiKey: 'weathergpt_weather_key', preferredProvider: 'weathergpt_provider', ollamaModel: 'weathergpt_ollama_model', ollamaEndpoint: 'weathergpt_ollama_endpoint' }).forEach(([key, storage]) => { if (config[key] !== undefined) localStorage.setItem(storage, config[key]); });
}

export async function fetchLiveWeather(city, options = {}) {
  const payload = await getWeatherByCity(city, options);
  const s = currentWeatherSummary(payload);
  return { ...s, city: payload.location.name, country: payload.location.country, location: payload.location, source: payload.source, fetchedAt: payload.fetchedAt };
}

const fallbackText = {
  hi: (w) => `${w.city} के लिए लाइव मौसम: ${w.condition}, तापमान ${w.temperature}°C (महसूस ${w.feelsLike}°C), नमी ${w.humidity}% और हवा ${w.wind} km/h है। आधिकारिक चेतावनियों के लिए IMD देखें।`,
  te: (w) => `${w.city} తాజా వాతావరణం: ${w.condition}, ఉష్ణోగ్రత ${w.temperature}°C (అనుభూతి ${w.feelsLike}°C), తేమ ${w.humidity}% మరియు గాలి ${w.wind} km/h. అధికారిక హెచ్చరికల కోసం IMD ను చూడండి.`,
  ta: (w) => `${w.city} நேரடி வானிலை: ${w.condition}, வெப்பநிலை ${w.temperature}°C (உணர்வு ${w.feelsLike}°C), ஈரப்பதம் ${w.humidity}% மற்றும் காற்று ${w.wind} km/h. அதிகாரப்பூர்வ எச்சரிக்கைகளுக்கு IMD-ஐ பார்க்கவும்.`,
  kn: (w) => `${w.city} ನೇರ ಹವಾಮಾನ: ${w.condition}, ತಾಪಮಾನ ${w.temperature}°C (ಅನುಭವ ${w.feelsLike}°C), ಆರ್ದ್ರತೆ ${w.humidity}% ಮತ್ತು ಗಾಳಿ ${w.wind} km/h. ಅಧಿಕೃತ ಎಚ್ಚರಿಕೆಗಳಿಗಾಗಿ IMD ಪರಿಶೀಲಿಸಿ.`,
  bn: (w) => `${w.city}-এর লাইভ আবহাওয়া: ${w.condition}, তাপমাত্রা ${w.temperature}°C (অনুভূত ${w.feelsLike}°C), আর্দ্রতা ${w.humidity}% এবং বাতাস ${w.wind} km/h। সরকারি সতর্কতার জন্য IMD দেখুন।`,
  gu: (w) => `${w.city} માટે જીવંત હવામાન: ${w.condition}, તાપમાન ${w.temperature}°C (અનુભવ ${w.feelsLike}°C), ભેજ ${w.humidity}% અને પવન ${w.wind} km/h. સત્તાવાર ચેતવણીઓ માટે IMD જુઓ.`,
  ml: (w) => `${w.city}യിലെ തത്സമയ കാലാവസ്ഥ: ${w.condition}, താപനില ${w.temperature}°C (അനുഭവം ${w.feelsLike}°C), ഈർപ്പം ${w.humidity}% കൂടാതെ കാറ്റ് ${w.wind} km/h. ഔദ്യോഗിക മുന്നറിയിപ്പുകൾക്ക് IMD കാണുക.`,
  pa: (w) => `${w.city} ਦਾ ਲਾਈਵ ਮੌਸਮ: ${w.condition}, ਤਾਪਮਾਨ ${w.temperature}°C (ਮਹਿਸੂਸ ${w.feelsLike}°C), ਨਮੀ ${w.humidity}% ਅਤੇ ਹਵਾ ${w.wind} km/h। ਸਰਕਾਰੀ ਚੇਤਾਵਨੀਆਂ ਲਈ IMD ਵੇਖੋ।`,
  ur: (w) => `${w.city} کا براہ راست موسم: ${w.condition}، درجہ حرارت ${w.temperature}°C (محسوس ${w.feelsLike}°C)، نمی ${w.humidity}% اور ہوا ${w.wind} km/h ہے۔ سرکاری انتباہات کے لیے IMD دیکھیں۔`
};
function buildInstantResponse(weather, query, requestedLanguage) {
  const rainy = /rain|storm|cyclone|showers/i.test(query);
  const farming = /farmer|agri|crop|irrigat/i.test(query);
  const englishText = rainy
    ? `Live conditions for ${weather.city}: ${weather.condition}, ${weather.temperature}°C (feels like ${weather.feelsLike}°C), ${weather.humidity}% humidity and ${weather.wind} km/h wind. Precipitation is ${weather.precipitation} mm at the latest model update; monitor official warnings before travel or field work.`
    : farming
      ? `Live conditions for ${weather.city}: ${weather.temperature}°C, ${weather.humidity}% humidity, ${weather.wind} km/h wind and ${weather.condition}. Use the observed values and the forecast precipitation probability to plan irrigation; verify district advisories for crop-specific decisions.`
      : `Live conditions for ${weather.city}: ${weather.condition}, ${weather.temperature}°C (feels like ${weather.feelsLike}°C), ${weather.humidity}% humidity, ${weather.wind} km/h wind and ${weather.cloudCover}% cloud cover.`;
  const text = fallbackText[requestedLanguage]?.(weather) || englishText;
  return { text, metrics: { temp: `${weather.temperature}°C`, rain: `${weather.precipitation} mm`, humidity: `${weather.humidity}%`, wind: `${weather.wind} km/h`, risk: rainy ? 'MONITOR' : 'NORMAL', confidence: 'LIVE DATA' }, advisory: requestedLanguage === 'en' ? 'Source: live weather provider. For official warnings, consult IMD.' : `Source: live weather provider. ${languageNames[requestedLanguage] || 'User language'} response.`, source: weather.source };
}

let activeSessionId = null;

function backendBase() {
  return (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
}

export async function createConversation() {
  const res = await fetch(`${backendBase()}/api/chat/session`, { method: 'POST' });
  if (!res.ok) throw new Error('Unable to create conversation.');
  const data = await res.json();
  activeSessionId = data.session_id;
  return data;
}

export async function pauseConversation(sessionId = activeSessionId) {
  if (!sessionId) return null;
  const res = await fetch(`${backendBase()}/api/chat/session/${sessionId}/pause`, { method: 'POST' });
  if (!res.ok) throw new Error('Unable to pause conversation.');
  return res.json();
}

export async function resumeConversation(sessionId = activeSessionId) {
  if (!sessionId) return null;
  const res = await fetch(`${backendBase()}/api/chat/session/${sessionId}/resume`, { method: 'POST' });
  if (!res.ok) throw new Error('Unable to resume conversation.');
  return res.json();
}

export async function newConversation(sessionId = activeSessionId) {
  if (!sessionId) return createConversation();
  const res = await fetch(`${backendBase()}/api/chat/session/${sessionId}/new`, { method: 'POST' });
  if (!res.ok) throw new Error('Unable to start a new conversation.');
  const data = await res.json();
  activeSessionId = data.session_id;
  return data;
}

export function getConversationSessionId() {
  return activeSessionId;
}

export async function getLiveChatResponse(messagesHistory, userQuery, options = {}) {
  const requestedLanguage = detectLanguage(userQuery, options.language || 'en');
  if (!activeSessionId) await createConversation();

  const conversation = (messagesHistory || [])
    .filter(m => m.sender === 'user' || m.sender === 'ai')
    .map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text || '' }));

  const res = await fetch(`${backendBase()}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: options.signal,
    body: JSON.stringify({
      message: userQuery,
      conversation,
      language: requestedLanguage,
      session_id: activeSessionId,
      latitude: options.latitude ?? null,
      longitude: options.longitude ?? null,
      location_name: options.locationName ?? null
    })
  });
  if (!res.ok) {
    let detail = `Chat service failed (${res.status}).`;
    try { detail = (await res.json()).detail || detail; } catch (_) {}
    throw new Error(detail);
  }
  const data = await res.json();
  return {
    ...data,
    language: data.language || requestedLanguage,
    source: data.source || 'WeatherGPT backend'
  };
}
