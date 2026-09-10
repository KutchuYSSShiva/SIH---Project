import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Radio, Globe, ArrowRight } from 'lucide-react';
import { sound } from '../utils/sound';
import { getLiveChatResponse } from '../utils/aiService';

const SPEECH_LOCALES = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN', ta: 'ta-IN', kn: 'kn-IN', ml: 'ml-IN', bn: 'bn-IN', gu: 'gu-IN', pa: 'pa-IN', ur: 'ur-IN' };
const FRIENDLY_NAMES = {
  en: { male: 'Uncle', female: 'Aunt' },
  hi: { male: 'अंकल', female: 'आंटी' },
  te: { male: 'అంకుల్', female: 'ఆంటీ' },
  ta: { male: 'அங்கிள்', female: 'ஆண்ட்டி' },
  kn: { male: 'ಅಂಕಲ್', female: 'ಆಂಟಿ' },
  ml: { male: 'അങ്കിൾ', female: 'ആന്റി' },
  bn: { male: 'আঙ্কেল', female: 'আন্টি' },
  gu: { male: 'અંકલ', female: 'આન્ટી' },
  pa: { male: 'ਅੰਕਲ', female: 'ਆਂਟੀ' },
  ur: { male: 'انکل', female: 'آنٹی' }
};

function addressUser(text, language, voiceGender) {
  const name = FRIENDLY_NAMES[language]?.[voiceGender];
  return name ? `${name}, ${text}` : text;
}

export default function VoiceInterface({ currentLang, setCurrentLang, setActiveTab, setQuery, selectedLocation, locationDetails, onLocationChange }) {
  const [voiceState, setVoiceState] = useState('IDLE'); // IDLE, LISTENING, UNDERSTANDING, SPEAKING
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isListeningActive, setIsListeningActive] = useState(false);
  const [voiceGender, setVoiceGender] = useState(() => {
    try { return localStorage.getItem('weathergpt_voice_gender') || 'neutral'; } catch (_) { return 'neutral'; }
  });

  // Real Speech Synthesis (TTS)
  const speakText = (text, langCode) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = SPEECH_LOCALES[langCode] || SPEECH_LOCALES.en;
      const voices = window.speechSynthesis.getVoices?.() || [];
      const matching = voices.filter((voice) => voice.lang?.toLowerCase().startsWith(utterance.lang.slice(0, 2).toLowerCase()));
      const genderPattern = voiceGender === 'female' ? /female|woman|zira|heera|susan|google हिन्दी/i : voiceGender === 'male' ? /male|man|david|ravi|google india/i : null;
      const preferred = genderPattern ? matching.find((voice) => genderPattern.test(voice.name)) : null;
      if (preferred) utterance.voice = preferred;

      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Real Web Speech Recognition (STT)
  const handleStartVoice = () => {
    sound.playClick();
    if (voiceState !== 'IDLE') {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setVoiceState('IDLE');
      setIsListeningActive(false);
      return;
    }

    // Check for SpeechRecognition API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      if (currentLang === 'hi') recognition.lang = 'hi-IN';
      else if (currentLang === 'te') recognition.lang = 'te-IN';
      else if (currentLang === 'ta') recognition.lang = 'ta-IN';
      else recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setVoiceState('LISTENING');
        setIsListeningActive(true);
        setTranscript('Listening for voice query...');
      };

      recognition.onresult = async (event) => {
        const spokenText = event.results[0][0].transcript;
        setTranscript(spokenText);
        setVoiceState('UNDERSTANDING');
        sound.playRadarSonar();

        // Get AI response via live aiService
        try {
          const detectedLanguage = /[\u0C00-\u0C7F]/.test(spokenText) ? 'te' : /[\u0B80-\u0BFF]/.test(spokenText) ? 'ta' : /[\u0900-\u097F]/.test(spokenText) ? 'hi' : currentLang;
          setCurrentLang(detectedLanguage);
          const aiRes = await getLiveChatResponse([], spokenText, {
            language: detectedLanguage,
            locationName: selectedLocation || null,
            latitude: locationDetails?.latitude ?? null,
            longitude: locationDetails?.longitude ?? null,
          });
          if (aiRes?.location?.name && onLocationChange) {
            onLocationChange({
              name: aiRes.location.name,
              latitude: aiRes.location.latitude,
              longitude: aiRes.location.longitude,
              address: aiRes.location.name
            });
          }
          const friendlyText = addressUser(aiRes.text, detectedLanguage, voiceGender);
          setResponse(friendlyText);
          setVoiceState('SPEAKING');
          sound.playAiChime();
          speakText(friendlyText, detectedLanguage);

          setTimeout(() => {
            setVoiceState('IDLE');
            setIsListeningActive(false);
          }, 7000);
        } catch (err) {
          setResponse("Error generating voice response. Please try again.");
          setVoiceState('IDLE');
          setIsListeningActive(false);
        }
      };

      recognition.onerror = () => {
        // Fallback demo speech if microphone permission is not allowed
        fallbackDemoSpeech();
      };

      recognition.onend = () => {
        if (voiceState === 'LISTENING') {
          // If ended without result
          setTimeout(() => {
            if (voiceState === 'LISTENING') fallbackDemoSpeech();
          }, 1000);
        }
      };

      try {
        recognition.start();
      } catch (e) {
        fallbackDemoSpeech();
      }
    } else {
      // Fallback for browsers without SpeechRecognition
      fallbackDemoSpeech();
    }
  };

  const fallbackDemoSpeech = () => {
    const demo = { user: selectedLocation ? `What is the current weather in ${selectedLocation}?` : 'What is the current weather here?' };
    setVoiceState('LISTENING');
    setTimeout(() => {
      sound.playRadarSonar();
      setTranscript(demo.user);
      setVoiceState('UNDERSTANDING');

      setTimeout(async () => {
        sound.playAiChime();
        const aiRes = await getLiveChatResponse([], demo.user, {
          language: currentLang,
          locationName: selectedLocation || null,
          latitude: locationDetails?.latitude ?? null,
          longitude: locationDetails?.longitude ?? null,
        });
        if (aiRes?.location?.name && onLocationChange) {
          onLocationChange({
            name: aiRes.location.name,
            latitude: aiRes.location.latitude,
            longitude: aiRes.location.longitude,
            address: aiRes.location.name
          });
        }
        const friendlyText = addressUser(aiRes.text, currentLang, voiceGender);
        setResponse(friendlyText);
        setVoiceState('SPEAKING');
        speakText(friendlyText, currentLang);

        setTimeout(() => {
          setVoiceState('IDLE');
        }, 6000);
      }, 1500);
    }, 1800);
  };

  return (
    <div className="w-full min-h-[calc(100vh-73px)] p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center relative overflow-hidden bg-[#05070B] animate-in fade-in duration-300">

      {/* Atmospheric Glow Backing */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={`w-[500px] h-[500px] rounded-full blur-[140px] transition-all duration-1000 ${
          voiceState === 'LISTENING' ? 'bg-cyan-500/25' :
          voiceState === 'UNDERSTANDING' ? 'bg-blue-600/25' :
          voiceState === 'SPEAKING' ? 'bg-emerald-500/25' :
          'bg-cyan-950/20'
        }`} />
      </div>

      <div className="relative z-10 max-w-xl w-full flex flex-col items-center text-center space-y-8">

        {/* Top Eyebrow & Status */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>VOICE INTELLIGENCE ENGINE • {voiceState}</span>
        </div>

        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Conversational Voice AI
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto">
            Interact naturally in Indian regional languages with live speech-to-text recognition and text-to-speech audio playback.
          </p>
          {locationDetails && <p className="mt-2 text-[11px] text-cyan-400">Using {locationDetails.address || `${locationDetails.name}, ${locationDetails.admin1 || locationDetails.country}`} · {Number(locationDetails.latitude).toFixed(4)}°, {Number(locationDetails.longitude).toFixed(4)}°</p>}
        </div>

        {/* Large Circular Microphone Interactive Element */}
        <div className="relative my-4 flex items-center justify-center">
          {/* Animated Wave Rings */}
          {(voiceState === 'LISTENING' || voiceState === 'SPEAKING') && (
            <>
              <div className="absolute w-48 h-48 rounded-full border border-cyan-500/40 animate-ping opacity-75" />
              <div className="absolute w-60 h-60 rounded-full border border-cyan-400/20 animate-pulse" />
            </>
          )}

          <button
            onClick={handleStartVoice}
            onMouseEnter={() => sound.playHover()}
            className={`w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-500 relative z-20 cursor-pointer ${
              voiceState === 'LISTENING'
                ? 'bg-red-500 text-white shadow-red-500/50 scale-110'
                : voiceState === 'UNDERSTANDING'
                ? 'bg-blue-600 text-white shadow-blue-500/50 scale-105 animate-pulse'
                : voiceState === 'SPEAKING'
                ? 'bg-emerald-500 text-white shadow-emerald-500/50 scale-110'
                : 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white hover:scale-105 shadow-cyan-500/30'
            }`}
          >
            {voiceState === 'SPEAKING' ? (
              <Volume2 className="w-10 h-10 animate-bounce" />
            ) : voiceState === 'LISTENING' ? (
              <Mic className="w-10 h-10 animate-pulse" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
            <span className="text-[10px] font-bold font-mono uppercase mt-1 tracking-wider">
              {voiceState === 'IDLE' ? 'TAP TO SPEAK' : voiceState}
            </span>
          </button>
        </div>

        {/* Waveform Visualization Bars */}
        <div className="h-8 flex items-center justify-center gap-1">
          {[12, 24, 38, 18, 48, 28, 40, 15, 30, 44, 20, 36, 16].map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-300 ${
                voiceState !== 'IDLE' ? 'bg-cyan-400' : 'bg-slate-800'
              }`}
              style={{
                height: voiceState !== 'IDLE' ? `${(h * Math.random() + 8).toFixed(0)}px` : '6px'
              }}
            />
          ))}
        </div>

        {/* Conversation Box */}
        {(transcript || response) && (
          <div className="w-full glass-panel p-6 rounded-3xl border border-white/10 space-y-4 text-left shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-300">
            {transcript && (
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">You Said:</span>
                <p className="text-base font-semibold text-white">"{transcript}"</p>
              </div>
            )}

            {response && (
              <div className="space-y-1 border-t border-white/5 pt-3">
                <span className="text-[10px] text-cyan-400 uppercase font-mono tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> WeatherGPT Voice Audio Response:
                </span>
                <p className="text-sm text-cyan-200 leading-relaxed font-medium">"{response}"</p>
              </div>
            )}
          </div>
        )}

        {/* Language Selection Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <span className="text-xs text-slate-400 mr-2 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" /> Language:
          </span>
          {[
            { code: 'en', label: 'English' },
            { code: 'te', label: 'తెలుగు' },
            { code: 'hi', label: 'हिन्दी' },
            { code: 'ta', label: 'தமிழ்' },
            { code: 'kn', label: 'ಕನ್ನಡ' },
            { code: 'ml', label: 'മലയാളം' },
            { code: 'bn', label: 'বাংলা' },
            { code: 'gu', label: 'ગુજરાતી' },
            { code: 'pa', label: 'ਪੰਜਾਬੀ' },
            { code: 'ur', label: 'اردو' }
          ].map((l) => (
            <button
              key={l.code}
              onClick={() => {
                sound.playClick();
                setCurrentLang(l.code);
              }}
              onMouseEnter={() => sound.playHover()}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                currentLang === l.code
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
          <span>Friendly address:</span>
          {[['neutral', 'Neutral'], ['male', 'Uncle'], ['female', 'Aunt']].map(([value, label]) => (
            <button
              key={value}
              onClick={() => {
                sound.playClick();
                setVoiceGender(value);
                try { localStorage.setItem('weathergpt_voice_gender', value); } catch (_) {}
              }}
              className={`rounded-xl border px-3 py-1.5 transition-all ${voiceGender === value ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-300' : 'border-white/5 bg-white/5 text-slate-400 hover:text-white'}`}
              aria-pressed={voiceGender === value}
            >
              {label}
            </button>
          ))}
          <span className="basis-full text-center text-[10px] text-slate-500">Choose Uncle or Aunt when your selected speech voice has that style; browsers do not reliably expose voice gender.</span>
        </div>

      </div>

    </div>
  );
}
