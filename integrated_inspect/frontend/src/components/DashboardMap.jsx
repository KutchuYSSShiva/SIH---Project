import React, { useEffect, useState } from 'react';
import {
  CloudRain, Wind, Droplets, Thermometer, Eye, Gauge,
  Sun, Sunset, ShieldAlert, Sparkles, MapPin, ChevronRight, Layers
} from 'lucide-react';
import { sound } from '../utils/sound';
import { translations } from '../utils/translations';
import { getWeatherByCity, currentWeatherSummary } from '../utils/weatherService';

const stateData = {
  "Andhra Pradesh": {
    temp: "31°C",
    feelsLike: "34°C",
    humidity: "81%",
    wind: "17 km/h",
    rainChance: "72%",
    alertLevel: "Moderate",
    alertColor: "text-amber-700",
    summary: "Coastal Andhra Pradesh may experience moderate rainfall during evening hours. Localised intense showers are possible around coastal districts.",
    districts: ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Kakinada", "Nellore"],
    selectedDistrict: "Visakhapatnam"
  },
  "Maharashtra": {
    temp: "28°C",
    feelsLike: "30°C",
    humidity: "75%",
    wind: "14 km/h",
    rainChance: "45%",
    alertLevel: "Low",
    alertColor: "text-emerald-700",
    summary: "Scattered clouds across Mumbai and Pune. Light passing showers expected along the Konkan belt.",
    districts: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
    selectedDistrict: "Mumbai"
  },
  "Delhi NCR": {
    temp: "34°C",
    feelsLike: "38°C",
    humidity: "58%",
    wind: "12 km/h",
    rainChance: "15%",
    alertLevel: "Advisory",
    alertColor: "text-amber-800",
    summary: "Dry conditions with moderate heat index during noon. AQI levels slightly elevated.",
    districts: ["New Delhi", "Noida", "Gurugram", "Faridabad"],
    selectedDistrict: "New Delhi"
  },
  "Karnataka": {
    temp: "26°C",
    feelsLike: "27°C",
    humidity: "68%",
    wind: "19 km/h",
    rainChance: "35%",
    alertLevel: "Low",
    alertColor: "text-emerald-700",
    summary: "Pleasant weather in Bengaluru and South Interior Karnataka with evening breezy conditions.",
    districts: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi"],
    selectedDistrict: "Bengaluru"
  },
  "Tamil Nadu": {
    temp: "32°C",
    feelsLike: "36°C",
    humidity: "78%",
    wind: "16 km/h",
    rainChance: "25%",
    alertLevel: "Low",
    alertColor: "text-emerald-700",
    summary: "Warm and humid along the Coromandel coast with isolated showers in the southern districts.",
    districts: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
    selectedDistrict: "Chennai"
  },
  "West Bengal": {
    temp: "30°C",
    feelsLike: "35°C",
    humidity: "84%",
    wind: "22 km/h",
    rainChance: "65%",
    alertLevel: "Moderate",
    alertColor: "text-amber-700",
    summary: "Thundercloud formation over Gangetic West Bengal. Gusty winds likely in coastal areas.",
    districts: ["Kolkata", "Howrah", "Siliguri", "Durgapur", "Asansol"],
    selectedDistrict: "Kolkata"
  }
};

export default function DashboardMap({ currentLang, initialQuery }) {
  const t = translations[currentLang] || translations.en;
  const [selectedState, setSelectedState] = useState("Andhra Pradesh");
  const [activeLayer, setActiveLayer] = useState("RAIN");
  const [activeDistrict, setActiveDistrict] = useState("Visakhapatnam");
  const [livePayload, setLivePayload] = useState(null);
  const [liveError, setLiveError] = useState('');

  useEffect(() => {
    const q = initialQuery || 'Visakhapatnam';
    let cancelled = false;
    getWeatherByCity(q).then((payload) => {
      if (!cancelled) { setLivePayload(payload); setLiveError(''); }
    }).catch((e) => { if (!cancelled) setLiveError(e.message || 'Live weather unavailable'); });
    return () => { cancelled = true; };
  }, [initialQuery]);

  const layers = [
    { id: "RAIN", label: t.rainRadar },
    { id: "TEMP", label: t.temperature },
    { id: "WIND", label: t.windStream },
    { id: "CLOUDS", label: t.cloudCover },
    { id: "WARNINGS", label: t.warnings },
    { id: "AIR", label: t.airQuality }
  ];

  const baseState = stateData[selectedState] || stateData["Andhra Pradesh"];
  const live = livePayload ? currentWeatherSummary(livePayload) : null;
  const liveRisk = live ? (Number(livePayload?.current?.weather_code) >= 95 || Number(live.gusts || 0) >= 60 || Number(livePayload?.hourly?.precipitation_probability?.[0] || 0) >= 80 ? 'High' : Number(live.gusts || 0) >= 40 || Number(livePayload?.hourly?.precipitation_probability?.[0] || 0) >= 50 ? 'Moderate' : 'Low') : null;
  const currentState = live ? {
    ...baseState,
    temp: `${Math.round(live.temperature)}°C`,
    feelsLike: `${Math.round(live.feelsLike)}°C`,
    humidity: `${Math.round(live.humidity)}%`,
    wind: `${Math.round(live.wind)} km/h`,
    rainChance: `${Math.round(livePayload?.hourly?.precipitation_probability?.[0] ?? 0)}%`,
    alertLevel: liveRisk,
    alertColor: liveRisk === 'High' ? 'text-rose-700' : liveRisk === 'Moderate' ? 'text-amber-700' : 'text-emerald-700',
    summary: `${live.condition}. Current temperature ${Math.round(live.temperature)}°C, humidity ${Math.round(live.humidity)}%, wind ${Math.round(live.wind)} km/h.`
  } : baseState;

  const handleStateClick = (stName) => {
    sound.playClick();
    setSelectedState(stName);
    setActiveDistrict(stateData[stName].districts[0]);
  };

  const handleLayerClick = (lId) => {
    sound.playRadarSonar();
    setActiveLayer(lId);
  };

  const handleDistrictClick = (dst) => {
    sound.playClick();
    setActiveDistrict(dst);
  };

  return (
    <div className="w-full min-h-[calc(100vh-73px)] p-4 sm:p-6 lg:p-8 flex flex-col space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">

      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            {t.mapTitle}
            <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-800 border border-blue-300 rounded-full font-mono font-bold">
              LIVE TELEMETRY
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-700 mt-1 font-medium">
            {t.mapSubtitle}
          </p>
        </div>
      </div>

      {/* Top Overview Strip - Compact Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <div className="glass-panel p-3 rounded-2xl flex flex-col justify-between border-blue-200 bg-white/90 shadow-sm">
          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3 h-3 text-blue-600" /> {t.focusRegion}
          </span>
          <span className="text-sm font-black text-slate-900 mt-1 truncate">{selectedState}</span>
          <span className="text-[10px] text-blue-700 font-mono font-semibold">{livePayload ? `${Number(livePayload.location.latitude).toFixed(4)}° N, ${Number(livePayload.location.longitude).toFixed(4)}° E` : "Waiting for live location"}</span>
        </div>

        <div className="glass-panel p-3 rounded-2xl flex flex-col justify-between border-blue-200 bg-white/90 shadow-sm">
          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-rose-600" /> {t.tempFeels}
          </span>
          <span className="text-base font-black text-slate-900 mt-1">{currentState.temp}</span>
          <span className="text-[10px] text-slate-600 font-medium">Feels {currentState.feelsLike}</span>
        </div>

        <div className="glass-panel p-3 rounded-2xl flex flex-col justify-between border-blue-200 bg-white/90 shadow-sm">
          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider flex items-center gap-1">
            <CloudRain className="w-3 h-3 text-blue-600" /> {t.rainChance}
          </span>
          <span className="text-base font-black text-blue-700 mt-1">{currentState.rainChance}</span>
          <span className="text-[10px] text-slate-600 font-medium">{livePayload ? "Current-hour model probability" : "Waiting for live forecast"}</span>
        </div>

        <div className="glass-panel p-3 rounded-2xl flex flex-col justify-between border-blue-200 bg-white/90 shadow-sm">
          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider flex items-center gap-1">
            <Droplets className="w-3 h-3 text-sky-600" /> {t.humidity}
          </span>
          <span className="text-base font-black text-slate-900 mt-1">{currentState.humidity}</span>
          <span className="text-[10px] text-slate-600 font-medium">Dew Point 24°C</span>
        </div>

        <div className="glass-panel p-3 rounded-2xl flex flex-col justify-between border-blue-200 bg-white/90 shadow-sm">
          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider flex items-center gap-1">
            <Wind className="w-3 h-3 text-teal-600" /> {t.windFlow}
          </span>
          <span className="text-base font-black text-slate-900 mt-1">{currentState.wind}</span>
          <span className="text-[10px] text-slate-600 font-medium">ESE Gusts 26 km/h</span>
        </div>

        <div className="glass-panel p-3 rounded-2xl flex flex-col justify-between border-blue-200 bg-white/90 shadow-sm">
          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider flex items-center gap-1">
            <Gauge className="w-3 h-3 text-indigo-600" /> {t.pressure}
          </span>
          <span className="text-base font-black text-slate-900 mt-1">1008 hPa</span>
          <span className="text-[10px] text-slate-600 font-medium">Falling -1.2 hPa</span>
        </div>

        <div className="glass-panel p-3 rounded-2xl flex flex-col justify-between border-blue-200 bg-white/90 shadow-sm">
          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider flex items-center gap-1">
            <Eye className="w-3 h-3 text-emerald-600" /> {t.visibility}
          </span>
          <span className="text-base font-black text-emerald-700 mt-1">{live ? `${Number(live.visibility || 0).toFixed(1)} km` : "—"}</span>
          <span className="text-[10px] text-slate-700 font-bold">AQI not supplied by forecast source</span>
        </div>

        <div className="glass-panel p-3 rounded-2xl flex flex-col justify-between border-blue-200 bg-white/90 shadow-sm">
          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider flex items-center gap-1">
            <Sun className="w-3 h-3 text-amber-600" /> {t.sunCycle}
          </span>
          <span className="text-xs font-black text-slate-900 mt-1">{livePayload?.daily?.sunrise?.[0] ? new Date(livePayload.daily.sunrise[0]).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}) : "—"}</span>
          <span className="text-[10px] text-slate-600 font-medium">Sunset {livePayload?.daily?.sunset?.[0] ? new Date(livePayload.daily.sunset[0]).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}) : "—"}</span>
        </div>
      </div>

      {/* Main Map & State Intelligence Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">

        {/* Map Area */}
        <div className="lg:col-span-8 glass-panel p-5 rounded-3xl border border-blue-200 bg-white/90 shadow-xl flex flex-col relative overflow-hidden min-h-[480px]">

          {/* Map Layer Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 z-10">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>{t.activeLayer}:</span>
            </div>

            <div className="flex flex-wrap gap-1.5 bg-blue-50/80 p-1 rounded-xl border border-blue-200">
              {layers.map((l) => (
                <button
                  key={l.id}
                  onClick={() => handleLayerClick(l.id)}
                  onMouseEnter={() => sound.playHover()}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeLayer === l.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-blue-100/60'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Map Visual / India Interactive Representation */}
          <div className="flex-1 w-full relative flex items-center justify-center bg-sky-50/80 rounded-2xl border border-blue-200 p-4 overflow-hidden shadow-inner">

            <div className="absolute top-3 left-3 right-3 z-20 rounded-xl bg-white/90 border border-blue-200 px-3 py-2 text-[11px] text-slate-600 shadow-sm">
              {livePayload ? `Live telemetry for ${livePayload.location.name}. Regional tiles remain reference regions; do not interpret them as point observations.` : (liveError || 'Loading live telemetry…')}
            </div>
            {/* Regional reference grid */}
            <div className="relative z-10 w-full max-w-lg grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.keys(stateData).map((stName) => {
                const isSelected = selectedState === stName;
                const stateInfo = stateData[stName];
                return (
                  <div
                    key={stName}
                    onClick={() => handleStateClick(stName)}
                    onMouseEnter={() => sound.playHover()}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all duration-300 shadow-sm ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105'
                        : 'bg-white/90 border-blue-200 hover:border-blue-400 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-900'}`}>{stName}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold ${isSelected ? 'bg-blue-700 text-white' : `${stateInfo.alertColor} bg-blue-50`}`}>
                        {stateInfo.alertLevel}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between mt-3 text-xs">
                      <span className={`text-lg font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>{stateInfo.temp}</span>
                      <span className={`flex items-center gap-1 font-medium ${isSelected ? 'text-blue-100' : 'text-slate-600'}`}>
                        <CloudRain className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-blue-600'}`} /> {stateInfo.rainChance}
                      </span>
                    </div>

                    <div className={`mt-2 text-[10px] flex items-center justify-between border-t pt-2 font-semibold ${isSelected ? 'border-blue-500 text-blue-100' : 'border-blue-100 text-slate-600'}`}>
                      <span>Wind {stateInfo.wind}</span>
                      <span className={`flex items-center gap-0.5 ${isSelected ? 'text-white font-bold' : 'text-blue-700'}`}>Details <ChevronRight className="w-2.5 h-2.5" /></span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Layer Legend Indicator */}
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-blue-200 text-[11px] text-slate-800 flex items-center gap-3 shadow-md">
              <span className="font-bold text-blue-700 uppercase tracking-wider">{activeLayer} LAYER</span>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] text-slate-600 font-semibold">Low</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="text-[10px] text-slate-600 font-semibold">Mod</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                <span className="text-[10px] text-slate-600 font-semibold">High</span>
              </div>
            </div>
          </div>
        </div>

        {/* State Intelligence Side Panel */}
        <div className="lg:col-span-4 glass-panel p-5 rounded-3xl border border-blue-200 bg-white/90 shadow-xl flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-blue-100">
            <div>
              <span className="text-[10px] font-mono text-blue-800 uppercase tracking-wider font-bold">{t.regionalIntel}</span>
              <h2 className="text-xl font-black text-slate-900">{selectedState}</h2>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900">{currentState.temp}</span>
              <div className="text-[10px] text-slate-600 font-medium">Feels {currentState.feelsLike}</div>
            </div>
          </div>

          {/* AI Weather Summary Box */}
          <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-200 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.aiSynthesis}</span>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed font-medium">
              "{currentState.summary}"
            </p>
          </div>

          {/* District Selection Tabs */}
          <div>
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 block">
              {t.districtFocus}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {currentState.districts.map((dst) => (
                <button
                  key={dst}
                  onClick={() => handleDistrictClick(dst)}
                  onMouseEnter={() => sound.playHover()}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeDistrict === dst
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-blue-50 text-slate-700 hover:text-slate-900 border border-blue-200'
                  }`}
                >
                  {dst}
                </button>
              ))}
            </div>
          </div>

          {/* Selected District Quick Metrics */}
          <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">District:</span>
              <span className="text-slate-900 font-bold">{activeDistrict}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Precipitation Probability:</span>
              <span className="text-blue-700 font-mono font-bold">{currentState.rainChance}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Risk Assessment:</span>
              <span className={`font-bold ${currentState.alertColor}`}>{currentState.alertLevel} Risk</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Atmospheric Humidity:</span>
              <span className="text-slate-900 font-mono font-bold">{currentState.humidity}</span>
            </div>
          </div>

          {/* Action Trigger */}
          <button
            onClick={() => sound.playClick()}
            className="w-full mt-auto py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
          >
            {t.queryFor} {activeDistrict}
          </button>
        </div>

      </div>
    </div>
  );
}
