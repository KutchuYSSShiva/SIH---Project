import React, { useState } from 'react';
import {
  Activity, Sprout, Car, GraduationCap, Users, Anchor,
  Plane, Flame, Sparkles, CheckCircle2, AlertCircle, ArrowRight
} from 'lucide-react';
import { sound } from '../utils/sound';
import { translations } from '../utils/translations';

export default function AdvisoryEngine({ currentLang, setActiveTab, setQuery }) {
  const t = translations[currentLang] || translations.en;
  const [activeProfile, setActiveProfile] = useState('FARMER');
  const [selectedCrop, setSelectedCrop] = useState('Rice / Paddy');

  const profiles = [
    { id: 'FARMER', label: 'Farmer / Agri', icon: Sprout },
    { id: 'TRAVELER', label: 'Traveler / Commuter', icon: Car },
    { id: 'STUDENT', label: 'Student / Citizen', icon: GraduationCap },
    { id: 'FISHERMAN', label: 'Fisherman / Coastal', icon: Anchor },
    { id: 'AVIATION', label: 'Aviation & Transit', icon: Plane },
  ];

  const profileContent = {
    FARMER: {
      headline: "Rainfall probability is high over the next 48 hours (78% in coastal belt).",
      advice: [
        "Avoid pesticide and chemical spraying before anticipated rainfall to prevent runoff.",
        "Ensure field drainage channels in paddy/cotton farms are clear to avert waterlogging.",
        "Delay irrigation cycles where topsoil moisture is already saturated (>85%).",
        "Monitor wind gust forecasts (>25 km/h) before fertilizer broadcasting."
      ],
      metrics: {
        soilTemp: "24.5°C",
        soilMoisture: "82% (High)",
        evapotranspiration: "3.8 mm/day",
        solarRadiation: "18.4 MJ/m²"
      }
    },
    TRAVELER: {
      headline: "Rain is likely between 3:00 PM and 7:00 PM with peak intensity at 5:00 PM.",
      advice: [
        "Plan highway travel or departures before 2:00 PM to avoid waterlogged corridors.",
        "Expect slower road transit speeds on NH-16 / urban bypasses during heavy showers.",
        "Carry waterproof protection and ensure vehicle wiper systems are operational.",
        "Avoid low-lying subways and flooded underpasses."
      ],
      metrics: {
        roadVisibility: "6.0 km (Moderate)",
        trafficImpact: "High (Evening)",
        precipitationWindow: "15:00 - 19:30",
        windSpeed: "18 km/h"
      }
    },
    STUDENT: {
      headline: "Moderate showers expected around school & college closing hours (4 PM - 6 PM).",
      advice: [
        "Carry umbrellas or rain gear for afternoon and evening commutes.",
        "No severe or dangerous weather alerts currently affecting educational institutions.",
        "Outdoor sports activities recommended to be shifted before 2:30 PM."
      ],
      metrics: {
        comfortIndex: "Warm & Humid",
        uvIndex: "5 (Moderate)",
        closingHourRain: "68% chance",
        airQuality: "Good (AQI 54)"
      }
    },
    FISHERMAN: {
      headline: "Rough sea conditions with wave heights 2.5–3.2m along Andhra & Odisha coasts.",
      advice: [
        "Small fishing crafts advised not to venture into deep sea beyond 30 nautical miles.",
        "Squally wind speeds reaching 45–55 km/h likely over central Bay of Bengal.",
        "Anchor and moor coastal trawlers securely by 16:00 IST."
      ],
      metrics: {
        waveHeight: "2.8 - 3.4 m",
        seaSurfaceTemp: "29.2°C",
        surfaceWind: "28 knots",
        currentSpeed: "1.4 knots"
      }
    },
    AVIATION: {
      headline: "Low cloud base and reduced visibility during convective showers.",
      advice: [
        "Anticipate runway approach holds between 16:00–18:30 IST.",
        "Moderate crosswind component on RWY 28 (gusts up to 26 knots).",
        "Convective cloud tops extending up to FL360 over eastern coastal airspace."
      ],
      metrics: {
        ceiling: "1800 ft AGL",
        crosswind: "14 kts / 26 kt gust",
        runwayCondition: "Wet / Damp",
        turbulence: "Light-Moderate"
      }
    }
  };

  const currentData = profileContent[activeProfile];

  return (
    <div className="w-full min-h-[calc(100vh-73px)] p-4 sm:p-6 lg:p-8 flex flex-col space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300">

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          {t.advisoryTitle}
          <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-800 border border-blue-300 rounded-full font-mono font-bold">
            {t.sectorIntel}
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-700 mt-1 font-medium">
          {t.advisorySubtitle}
        </p>
      </div>

      {/* Profile Selector Tabs */}
      <div className="flex flex-wrap gap-2 bg-white/80 p-1.5 rounded-2xl border border-blue-200 shadow-sm">
        {profiles.map((p) => {
          const Icon = p.icon;
          const isActive = activeProfile === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                sound.playClick();
                setActiveProfile(p.id);
              }}
              onMouseEnter={() => sound.playHover()}
              className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-blue-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-600'}`} />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Advisory Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Recommendations */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-3xl border border-blue-200 bg-white/90 shadow-xl flex flex-col space-y-6">

          {/* AI Headline Banner */}
          <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 flex items-start space-x-3.5">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-blue-800 font-mono uppercase tracking-wider font-bold block">
                {t.primaryNotice}
              </span>
              <p className="text-sm font-bold text-slate-900 mt-0.5 leading-snug">
                "{currentData.headline}"
              </p>
            </div>
          </div>

          {/* Actionable Recommendations Checklist */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              {t.actionableRec}
            </span>
            <div className="space-y-2.5">
              {currentData.advice.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3 p-3.5 rounded-xl bg-blue-50/60 border border-blue-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-800 font-medium leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Crop Selector if in Farmer mode */}
          {activeProfile === 'FARMER' && (
            <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-3">
              <span className="text-xs font-bold text-blue-900 block">
                {t.cropTuning}
              </span>
              <div className="flex flex-wrap gap-2">
                {['Rice / Paddy', 'Cotton', 'Wheat', 'Sugarcane', 'Groundnut', 'Chilli', 'Maize'].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      sound.playClick();
                      setSelectedCrop(c);
                    }}
                    onMouseEnter={() => sound.playHover()}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedCrop === c
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 hover:text-slate-900 border border-blue-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-700 font-medium">
                Active tuning: Optimal drainage and harvest timing models for <strong className="text-slate-900 font-bold">{selectedCrop}</strong> in coastal soils.
              </p>
            </div>
          )}

          {/* Query WeatherGPT Action */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => {
                sound.playClick();
                setQuery(`What is the weather advisory for ${activeProfile.toLowerCase()} in Andhra Pradesh?`);
                setActiveTab('chat');
              }}
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-2 transition-all shadow-lg shadow-blue-500/25 cursor-pointer"
            >
              <span>{t.askFollowUp}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Key Biophysical & Operational Metrics */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-3xl border border-blue-200 bg-white/90 shadow-xl flex flex-col space-y-4">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            {t.envParams}
          </span>

          <div className="space-y-3">
            {Object.entries(currentData.metrics).map(([key, val]) => (
              <div key={key} className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex flex-col justify-between">
                <span className="text-[11px] text-slate-600 capitalize font-semibold">
                  {key.replace(/([A-Z])/g, ' $1')}
                </span>
                <span className="text-base font-black text-blue-700 font-mono mt-1">{val}</span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 mt-auto">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>Model Confidence: 88%</span>
            </div>
            <p className="text-[10px] text-slate-600 font-medium">
              Correlated across IMD numerical models and regional automated weather stations (AWS).
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
