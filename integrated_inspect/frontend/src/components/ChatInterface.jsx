import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Wind, Droplets, ThermometerSun, ShieldAlert, CornerDownLeft, Sparkles, AlertTriangle, Activity, Settings, Key, HelpCircle, Volume2, VolumeX, Pause, Play, Plus } from 'lucide-react';
import { sound } from '../utils/sound';
import { getLiveChatResponse, getApiConfig, saveApiConfig, createConversation, pauseConversation, resumeConversation, newConversation } from '../utils/aiService';
import { detectLanguage } from '../utils/language';

const greetings = {
  en: "Hello. I am WeatherGPT, your AI for India's atmosphere. Ask me about forecasts, severe weather, or agricultural advisories.",
  hi: 'नमस्ते। मैं WeatherGPT हूँ। मौसम, गंभीर मौसम और कृषि सलाह के बारे में पूछें।',
  te: 'నమస్కారం. నేను WeatherGPT. వాతావరణం, తీవ్రమైన వాతావరణం లేదా వ్యవసాయ సూచనల గురించి అడగండి.',
  ta: 'வணக்கம். நான் WeatherGPT. வானிலை, கடுமையான வானிலை அல்லது விவசாய ஆலோசனைகள் பற்றி கேளுங்கள்.',
  kn: 'ನಮಸ್ಕಾರ. ನಾನು WeatherGPT. ಹವಾಮಾನ, ತೀವ್ರ ಹವಾಮಾನ ಅಥವಾ ಕೃಷಿ ಸಲಹೆಗಳ ಬಗ್ಗೆ ಕೇಳಿ.',
  bn: 'নমস্কার। আমি WeatherGPT। আবহাওয়া, গুরুতর আবহাওয়া বা কৃষি পরামর্শ সম্পর্কে জিজ্ঞাসা করুন।',
  gu: 'નમસ્તે. હું WeatherGPT છું. હવામાન, ગંભીર હવામાન અથવા કૃષિ સલાહ વિશે પૂછો.',
  ml: 'നമസ്കാരം. ഞാൻ WeatherGPT ആണ്. കാലാവസ്ഥ, കഠിനമായ കാലാവസ്ഥ, അല്ലെങ്കിൽ കാർഷിക ഉപദേശങ്ങൾ ചോദിക്കൂ.',
  pa: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ। ਮੈਂ WeatherGPT ਹਾਂ। ਮੌਸਮ, ਗੰਭੀਰ ਮੌਸਮ ਜਾਂ ਖੇਤੀਬਾੜੀ ਸਲਾਹ ਬਾਰੇ ਪੁੱਛੋ.',
  ur: 'سلام۔ میں WeatherGPT ہوں۔ موسم، شدید موسم یا زرعی مشورے کے بارے میں پوچھیں۔'
};

export default function ChatInterface({ initialQuery, selectedLocation, locationDetails, onLocationChange, currentLang = 'en', setCurrentLang }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      type: 'greeting',
      text: greetings[currentLang] || greetings.en
    }
  ]);
  const [inputValue, setInputValue] = useState(initialQuery || '');
  const [isTyping, setIsTyping] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const abortRef = useRef(null);

  // Real TTS (Text-to-Speech) Toggle
  const [isMuted, setIsMuted] = useState(false);

  // Settings Configuration Panel
  const [showSettings, setShowSettings] = useState(false);
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [weatherKey, setWeatherKey] = useState('');
  const [provider, setProvider] = useState('ollama');
  const [ollamaModel, setOllamaModel] = useState('phi4-mini');
  const [ollamaEndpoint, setOllamaEndpoint] = useState('http://localhost:11434');

  useEffect(() => {
    // Load stored config
    const config = getApiConfig();
    setOpenaiKey(config.openaiKey);
    setGeminiKey(config.geminiKey);
    setWeatherKey(config.weatherApiKey);
    setProvider(config.preferredProvider || 'ollama');
    setOllamaModel(config.ollamaModel || 'phi4-mini');
    setOllamaEndpoint(config.ollamaEndpoint || 'http://localhost:11434');

    createConversation().catch(() => {});
    if (initialQuery) {
      handleSend(initialQuery);
    }
    return () => abortRef.current?.abort();
  }, [initialQuery]);

  const handleSaveSettings = () => {
    saveApiConfig({
      openaiKey,
      geminiKey,
      weatherApiKey: weatherKey,
      preferredProvider: provider,
      ollamaModel,
      ollamaEndpoint
    });
    sound.playClick();
    setShowSettings(false);
  };

  // Browser Text-To-Speech (TTS) engine
  const speakText = (text, language = currentLang) => {
    if (isMuted) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : language === 'ta' ? 'ta-IN' : language === 'kn' ? 'kn-IN' : language === 'bn' ? 'bn-IN' : language === 'gu' ? 'gu-IN' : language === 'ml' ? 'ml-IN' : language === 'pa' ? 'pa-IN' : language === 'ur' ? 'ur-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSend = async (textToAdd) => {
    if (isPaused) return;
    const text = typeof textToAdd === 'string' ? textToAdd : inputValue;
    if (!text.trim()) return;
    const detectedLanguage = detectLanguage(text, currentLang);
    if (detectedLanguage !== currentLang) {
      setCurrentLang?.(detectedLanguage);
      setMessages(prev => prev.length === 1 && prev[0].type === 'greeting' ? [{ ...prev[0], text: greetings[detectedLanguage] || greetings.en }] : prev);
    }

    sound.playClick();

    // Add user message
    const newMsg = {
      id: Date.now(),
      sender: 'user',
      text: text
    };

    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const aiResponse = await getLiveChatResponse(messages, text, {
        language: detectedLanguage,
        locationName: selectedLocation || (initialQuery && !/[?.!,]/.test(initialQuery) ? initialQuery : null),
        latitude: locationDetails?.latitude ?? null,
        longitude: locationDetails?.longitude ?? null,
        signal: abortRef.current.signal
      });
      sound.playAiChime();

      if (aiResponse?.location?.name && onLocationChange) {
        onLocationChange({
          name: aiResponse.location.name,
          latitude: aiResponse.location.latitude,
          longitude: aiResponse.location.longitude,
          address: aiResponse.location.name
        });
      }

      const newAiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        type: 'weather_insight',
        text: aiResponse.text,
        metrics: aiResponse.metrics,
        advisory: aiResponse.advisory
      };

      setMessages(prev => [...prev, newAiMsg]);
      speakText(aiResponse.text, detectedLanguage);
    } catch (err) {
      console.error(err);
      sound.playAlertBeep();
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        type: 'standard',
        text: (greetings[detectedLanguage] || greetings.en) + " Please try again after checking the network connection."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-73px)] flex flex-col items-center justify-start overflow-hidden bg-gradient-to-b from-sky-300/40 via-blue-100/30 to-white/20">
      {/* Animated cloud blobs in background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-[5%] w-64 h-24 bg-white/80 rounded-full blur-2xl animate-pulse-slow" />
        <div className="absolute top-24 right-[10%] w-80 h-28 bg-white/70 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-40 left-[20%] w-56 h-20 bg-sky-100/60 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative z-10 w-full max-w-4xl h-full flex flex-col py-6 px-4 sm:px-6">

        {/* Chat Header Area */}
        <div className="flex items-center justify-between mb-4 px-4 py-3 glass-panel rounded-2xl border border-blue-300/40 shadow-md shadow-blue-200/30">
          <div className="flex items-center space-x-3">
             <div className="p-2 rounded-xl bg-sky-500/15 border border-sky-400/30">
               <Cpu className="w-5 h-5 text-sky-600 animate-pulse" />
             </div>
             <div>
               <h2 className="text-slate-800 font-semibold flex items-center gap-2">WeatherGPT Intelligence
                 <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                </span>
               </h2>
               <p className="text-[11px] text-sky-700 font-mono tracking-wider">EOS-05 SATELLITE DEPLOYMENT • STT/TTS CHATBOT</p>
             </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Audio/TTS Mute Switch */}
            <button
              onClick={() => {
                sound.playClick();
                setIsMuted(!isMuted);
                if (!isMuted && typeof window !== 'undefined') window.speechSynthesis.cancel();
              }}
              className="p-2 bg-sky-100 hover:bg-sky-200 rounded-xl text-sky-700 hover:text-sky-900 transition-colors cursor-pointer border border-sky-300/50"
              title={isMuted ? "Unmute Voice Responses" : "Mute Voice Responses"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-sky-600 animate-bounce" />}
            </button>

            <button
              onClick={async () => {
                sound.playClick();
                try {
                  if (isPaused) {
                    await resumeConversation();
                    setIsPaused(false);
                  } else {
                    abortRef.current?.abort();
                    await pauseConversation();
                    setIsPaused(true);
                    setIsTyping(false);
                  }
                } catch (e) { console.error(e); }
              }}
              className="p-2 bg-sky-100 hover:bg-sky-200 rounded-xl text-sky-700 border border-sky-300/50"
              title={isPaused ? "Resume conversation" : "Pause conversation"}
              aria-label={isPaused ? "Resume conversation" : "Pause conversation"}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            <button
              onClick={async () => {
                sound.playClick();
                abortRef.current?.abort();
                try { await newConversation(); } catch (e) { console.error(e); }
                setMessages([{ id: Date.now(), sender: 'ai', type: 'greeting', text: greetings[currentLang] || greetings.en }]);
                setInputValue('');
                setIsTyping(false);
                setIsPaused(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white border border-blue-500 text-xs font-bold"
              title="Start a new conversation"
            >
              <Plus className="w-3.5 h-3.5" /> New
            </button>

            {/* API Config Trigger */}
            <button
              onClick={() => { sound.playClick(); setShowSettings(!showSettings); }}
              className="p-2 bg-sky-100 hover:bg-sky-200 rounded-xl text-sky-700 hover:text-sky-900 transition-colors cursor-pointer border border-sky-300/50"
              title="API & LLM Configuration"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings Configurations Dropdown */}
        {showSettings && (
          <div className="mb-4 p-5 bg-white/95 backdrop-blur-lg rounded-2xl border border-blue-300/50 shadow-xl animate-in slide-in-from-top duration-300 z-30">
            <h3 className="text-slate-800 font-semibold text-sm mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-sky-500" /> Configure Real-time LLM & EOS Satellite Data
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-600 font-semibold block mb-1">Preferred AI Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full bg-sky-50 border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-sky-500"
                >
                  <option value="ollama">Local LLM (Ollama)</option>
                  <option value="auto">Auto-Detect Routing</option>
                  <option value="openai">OpenAI GPT-4o-Mini</option>
                  <option value="gemini">Google Gemini 1.5</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-600 font-semibold block mb-1">Local Ollama Model Name</label>
                <input
                  type="text"
                  placeholder="e.g. phi4-mini, llama3, mistral"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  className="w-full bg-sky-50 border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 font-semibold block mb-1">Local Ollama Endpoint URL</label>
                <input
                  type="text"
                  placeholder="http://localhost:11434"
                  value={ollamaEndpoint}
                  onChange={(e) => setOllamaEndpoint(e.target.value)}
                  className="w-full bg-sky-50 border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 font-semibold block mb-1">OpenAI API Key (ChatGPT-4o)</label>
                <input
                  type="password"
                  placeholder="sk-..."
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="w-full bg-sky-50 border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 font-semibold block mb-1">Google Gemini API Key</label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full bg-sky-50 border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 font-semibold block mb-1">OpenWeatherMap API Key (EOS-05)</label>
                <input
                  type="password"
                  placeholder="Enter API key"
                  value={weatherKey}
                  onChange={(e) => setWeatherKey(e.target.value)}
                  className="w-full bg-sky-50 border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowSettings(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-400 hover:to-blue-500 text-xs font-bold cursor-pointer shadow-md"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}

        {/* Messages Layout */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>

              {/* AI Message */}
              {msg.sender === 'ai' && (
                <div className="flex-1 max-w-3xl flex items-start space-x-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 border border-sky-300 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col space-y-3 w-full">

                    {/* Text content */}
                    {msg.type === 'greeting' ? (
                       <div className="text-slate-700 text-lg sm:text-xl font-medium leading-relaxed">
                        {msg.text}
                      </div>
                    ) : (
                      <div className="bg-white/85 backdrop-blur-md p-5 rounded-2xl rounded-tl-sm border border-sky-200 border-l-4 border-l-sky-500 text-slate-700 text-[15px] leading-relaxed shadow-md">
                        <div className="text-[10px] uppercase text-sky-600 font-bold tracking-wider mb-2 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5" /> AI INSIGHT
                        </div>
                        {msg.text}

                        {/* Metrics Grid if available */}
                        {msg.metrics && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-sky-100">
                            <div className="flex flex-col bg-sky-50 p-2.5 rounded-xl border border-sky-200">
                              <span className="text-[10px] text-slate-500 flex items-center gap-1 mb-1"><ThermometerSun className="w-3 h-3 text-orange-500"/>Temp</span>
                              <span className="text-slate-800 font-semibold tracking-tight">{msg.metrics.temp}</span>
                            </div>
                            <div className="flex flex-col bg-sky-50 p-2.5 rounded-xl border border-sky-200">
                              <span className="text-[10px] text-slate-500 flex items-center gap-1 mb-1"><Wind className="w-3 h-3 text-blue-500"/>Wind</span>
                              <span className="text-slate-800 font-semibold tracking-tight">{msg.metrics.wind}</span>
                            </div>
                            <div className="flex flex-col bg-sky-50 p-2.5 rounded-xl border border-sky-200">
                              <span className="text-[10px] text-slate-500 flex items-center gap-1 mb-1"><Droplets className="w-3 h-3 text-sky-500"/>Humidity</span>
                              <span className="text-slate-800 font-semibold tracking-tight">{msg.metrics.humidity}</span>
                            </div>
                            <div className="flex flex-col bg-blue-50 p-2.5 rounded-xl border border-blue-200">
                              <span className="text-[10px] text-slate-500 flex items-center gap-1 mb-1">☁️ Clouds</span>
                              <span className="text-slate-800 font-semibold tracking-tight">{msg.metrics.rain}%</span>
                            </div>
                            <div className="flex flex-col bg-sky-50 p-2.5 rounded-xl border border-sky-200">
                              <span className="text-[10px] text-slate-500 flex items-center gap-1 mb-1"><ShieldAlert className="w-3 h-3 text-amber-500"/>Risk Level</span>
                              <span className={`font-bold tracking-tight text-xs mt-0.5 ${msg.metrics.risk === 'MODERATE' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {msg.metrics.risk}
                              </span>
                            </div>
                            <div className="flex flex-col bg-sky-50 p-2.5 rounded-xl border border-sky-200 text-right relative overflow-hidden group hover:bg-sky-100 transition-colors cursor-pointer">
                              <span className="text-[10px] text-sky-600 mb-1 z-10">Confidence</span>
                              <span className="text-sky-700 font-mono font-bold z-10 text-sm mt-0.5">{msg.metrics.confidence}</span>
                              <div className="absolute bottom-0 left-0 h-0.5 bg-sky-500" style={{width: msg.metrics.confidence}} />
                            </div>
                          </div>
                        )}

                        {/* Advisory Section */}
                        {msg.advisory && (
                          <div className="mt-4 bg-amber-50 border border-amber-300/60 rounded-xl p-4">
                            <div className="text-[10px] uppercase text-amber-600 font-bold tracking-wider mb-1.5 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5" /> AGRO-SATELLITE ADVISORY
                            </div>
                            <div className="text-amber-800 text-sm">{msg.advisory}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* User Message */}
              {msg.sender === 'user' && (
                <div className="max-w-[85%] sm:max-w-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-lg shadow-sky-300/40 font-medium text-[15px] animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {msg.text}
                </div>
              )}

            </div>
          ))}

          {isTyping && (
             <div className="flex items-center space-x-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 border border-sky-300 flex items-center justify-center shadow-md">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white/85 backdrop-blur-md px-4 py-3 rounded-2xl rounded-tl-sm flex space-x-1.5 border border-sky-200 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
             </div>
          )}
        </div>

        {/* Input Area */}
        <div className="mt-4 pt-4 pb-2">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(inputValue); }}
            className="relative bg-white/90 backdrop-blur-md rounded-2xl border border-sky-300/60 overflow-hidden shadow-lg shadow-sky-200/40 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-400/30 transition-all"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isPaused ? "Conversation paused — start/resume to continue" : "Ask about weather, alerts, or agricultural forecasts..."}
              className="w-full bg-transparent text-slate-800 px-5 py-4 pr-16 focus:outline-none placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isPaused || isTyping}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition-all shadow-lg cursor-pointer"
            >
              <CornerDownLeft className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center mt-2.5 text-[10px] text-sky-700 flex justify-center items-center gap-1.5">
            <span>{isPaused ? 'Conversation paused. Start a new conversation or resume when ready.' : 'WeatherGPT backend synchronized with live forecast telemetry and safety retrieval.'}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
