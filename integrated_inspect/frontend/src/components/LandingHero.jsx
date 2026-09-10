import React, { useState } from 'react';
import CloudBackground from './CloudBackground';
import { Sparkles, ArrowRight, Search, Globe, Languages } from 'lucide-react';
import { sound } from '../utils/sound';
import { translations } from '../utils/translations';

export default function LandingHero({ setActiveTab, setQuery, currentLang, setCurrentLang }) {
  const [inputText, setInputText] = useState('');

  const t = translations[currentLang] || translations.en;

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    { code: 'te', label: 'తెలుగు (Telugu)' },
    { code: 'ta', label: 'தமிழ் (Tamil)' },
    { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
    { code: 'bn', label: 'বাংলা (Bengali)' }
  ];

  const handleAsk = (e) => {
    e.preventDefault();
    sound.playClick();
    if (inputText.trim()) {
      setQuery(inputText);
    }
    setActiveTab('chat');
  };

  const handleSuggestionClick = (s) => {
    sound.playClick();
    setInputText(s);
    setQuery(s);
    setActiveTab('chat');
  };

  const suggestions = [
    t.q1 || "Will it rain tomorrow in Visakhapatnam?",
    t.q2 || "Any cyclone warning near Andhra Pradesh?",
    t.q3 || "Should farmers expect rainfall this week?",
    t.q4 || "What is today's weather in Hyderabad?",
    t.q5 || "Show climate trends for India."
  ];

  return (
    <div className="relative min-h-[calc(100vh-73px)] w-full flex items-center justify-center overflow-hidden">
      {/* 3D Richer Sky Blue Background with Pure White Drifting Clouds */}
      <div className="absolute inset-0 z-0">
        <CloudBackground />
      </div>

      {/* Hero Content Center */}
      <div className="relative z-10 max-w-4xl px-6 py-12 flex flex-col items-center text-center">

        {/* Home Page Preferred Language Selector Card */}
        <div className="mb-6 flex items-center space-x-2 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border-2 border-blue-300 shadow-2xl">
          <Languages className="w-5 h-5 text-blue-700" />
          <span className="text-xs font-bold text-slate-900">Select Website Language:</span>
          <select
            value={currentLang}
            onChange={(e) => {
              sound.playClick();
              setCurrentLang(e.target.value);
            }}
            className="bg-blue-50 text-xs font-black text-blue-900 border border-blue-400 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-sm"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-white text-slate-900 font-bold">
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Eyebrow */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-blue-300 text-blue-900 text-xs font-bold mb-6 shadow-md backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-blue-700" />
          <span>{t.sihTag}</span>
        </div>

        {/* Main Title - GPT with darker blue color */}
        <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-slate-900 mb-4 leading-none drop-shadow-sm">
          Weather<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-900 to-blue-700">GPT</span>
        </h1>

        <p className="text-2xl sm:text-3xl font-black text-slate-900 mb-6 drop-shadow-sm">
          {t.heroTitle}
        </p>

        <p className="text-slate-900 text-base sm:text-lg leading-relaxed mb-8 max-w-2xl font-bold bg-white/60 p-4 rounded-2xl backdrop-blur-sm border border-white/80 shadow-md">
          {t.heroDesc}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('chat');
            }}
            onMouseEnter={() => sound.playHover()}
            className="flex items-center space-x-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-blue-600/30 transition-all transform hover:-translate-y-1 cursor-pointer"
          >
            <Sparkles className="w-5 h-5" />
            <span>{t.askAi}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('dashboard');
            }}
            onMouseEnter={() => sound.playHover()}
            className="flex items-center space-x-2 bg-white/95 hover:bg-white text-slate-900 font-bold px-8 py-4 rounded-2xl border border-blue-300 shadow-lg transition-all cursor-pointer backdrop-blur-sm"
          >
            <span>{t.exploreWeather}</span>
          </button>
        </div>

        {/* Conversational Input Bar */}
        <form onSubmit={handleAsk} className="w-full max-w-2xl relative mb-8">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t.placeholder}
            className="w-full bg-white/95 text-slate-900 placeholder-slate-500 px-6 py-5 pl-14 rounded-2xl border-2 border-blue-300 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20 shadow-2xl transition-all text-lg font-bold"
          />
          <Search className="w-6 h-6 text-blue-700 absolute left-5 top-1/2 -translate-y-1/2" />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-700 hover:bg-blue-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors cursor-pointer shadow-md"
          >
            Ask AI
          </button>
        </form>

        {/* Suggested Questions */}
        <div className="w-full">
          <div className="text-xs text-slate-950 font-extrabold uppercase tracking-widest mb-3 bg-white/70 inline-block px-3 py-1 rounded-lg backdrop-blur-sm shadow-sm">{t.suggested}</div>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(s)}
                onMouseEnter={() => sound.playHover()}
                className="text-xs bg-white/95 hover:bg-white text-slate-900 hover:text-blue-800 px-4 py-2.5 rounded-xl border border-blue-300 shadow-sm transition-all font-bold cursor-pointer"
              >
                "{s}"
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
