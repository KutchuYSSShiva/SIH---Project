import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Wind, CloudRain, Zap, Radio, Bell, Share2, Compass, Waves } from 'lucide-react';
import { sound } from '../utils/sound';
import { translations } from '../utils/translations';

export default function AlertCenter({ currentLang, setActiveTab, setQuery }) {
  const t = translations[currentLang] || translations.en;
  const [activeFilter, setActiveFilter] = useState('ALL');

  const alerts = [
    {
      id: 1,
      title: "HEAVY RAINFALL WARNING",
      severity: "HIGH",
      severityBadge: "bg-red-500/10 text-red-700 border-red-300",
      region: "Coastal Andhra Pradesh",
      areas: "Visakhapatnam, Kakinada, East Godavari",
      expected: "64–110 mm rainfall",
      valid: "18:00–23:00 IST",
      confidence: "82%",
      advisory: "Localized flooding is possible in low-lying areas. Avoid unnecessary travel and monitor official alerts."
    },
    {
      id: 2,
      title: "THUNDERSTORM & LIGHTNING ADVISORY",
      severity: "MODERATE",
      severityBadge: "bg-amber-500/10 text-amber-700 border-amber-300",
      region: "Gangetic West Bengal",
      areas: "Kolkata, Howrah, South 24 Parganas",
      expected: "Gusty winds 40–50 km/h with active lightning",
      valid: "15:00–20:00 IST",
      confidence: "78%",
      advisory: "Stay indoors during lightning activity. Unplug sensitive electrical appliances."
    },
    {
      id: 3,
      title: "HEATWAVE WATCH",
      severity: "ADVISORY",
      severityBadge: "bg-yellow-500/10 text-yellow-800 border-yellow-300",
      region: "Northwest Rajasthan",
      areas: "Bikaner, Jaisalmer, Barmer",
      expected: "Max temp reaching 42–44°C",
      valid: "12:00–16:30 IST",
      confidence: "89%",
      advisory: "Maintain hydration and avoid prolonged sun exposure during peak afternoon hours."
    }
  ];

  const filteredAlerts = activeFilter === 'ALL'
    ? alerts
    : alerts.filter(a => a.severity === activeFilter);

  return (
    <div className="w-full min-h-[calc(100vh-73px)] p-4 sm:p-6 lg:p-8 flex flex-col space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300">

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            {t.alertsTitle}
            <span className="text-xs px-2.5 py-1 bg-red-500/10 text-red-700 border border-red-300 rounded-full font-mono flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span> {t.activeRiskFeed}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-700 mt-1 font-medium">
            {t.alertsSubtitle}
          </p>
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-white/80 p-1.5 rounded-2xl border border-blue-200 shadow-sm">
          {['ALL', 'HIGH', 'MODERATE', 'ADVISORY'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                sound.playAlertBeep();
                setActiveFilter(lvl);
              }}
              onMouseEnter={() => sound.playHover()}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === lvl
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-blue-50'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Top Cyclone & Disaster Response Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-blue-200 bg-white/85 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-start space-x-4">
          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-200 flex-shrink-0">
            <Compass className="w-8 h-8 text-blue-600 animate-spin" style={{ animationDuration: '20s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300 font-bold">
                {t.bobWatch}
              </span>
              <span className="text-xs text-slate-600 font-medium">{t.cycloneModel}</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              {t.bobSystem}
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 max-w-2xl mt-1 leading-relaxed font-medium">
              "Current trajectory indicates potential movement toward the northern Bay of Bengal. Forecast uncertainty remains moderate. Max sustained winds 55 km/h."
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex flex-col bg-blue-50/80 px-4 py-2 rounded-xl border border-blue-200 text-center">
            <span className="text-[10px] text-slate-600 font-bold uppercase">{t.centralPressure}</span>
            <span className="text-sm font-mono font-black text-slate-900">996 hPa</span>
          </div>
          <div className="flex flex-col bg-blue-50/80 px-4 py-2 rounded-xl border border-blue-200 text-center">
            <span className="text-[10px] text-slate-600 font-bold uppercase">{t.movementSpeed}</span>
            <span className="text-sm font-mono font-black text-blue-700">14 km/h NW</span>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              setQuery("Any cyclone warning near Andhra Pradesh?");
              setActiveTab('chat');
            }}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            {t.askTracker}
          </button>
        </div>
      </div>

      {/* Main Alert List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className="glass-panel p-6 rounded-3xl border border-blue-200 bg-white/90 flex flex-col justify-between space-y-4 shadow-xl hover:shadow-2xl transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[11px] font-bold px-3 py-1 rounded-xl border font-mono ${alert.severityBadge}`}>
                  {alert.severity} {t.severity}
                </span>
                <span className="text-[11px] font-mono text-slate-600 font-semibold">{alert.valid}</span>
              </div>

              <h2 className="text-lg font-black text-slate-900 leading-snug">{alert.title}</h2>
              <div className="text-xs text-blue-700 font-bold mt-1">{alert.region}</div>
              <div className="text-[11px] text-slate-600 mt-1 font-medium">Impact: {alert.areas}</div>
            </div>

            <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">{t.expectedCond}:</span>
                <span className="text-slate-900 font-bold">{alert.expected}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">{t.modelConf}:</span>
                <span className="text-blue-700 font-mono font-bold">{alert.confidence}</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl">
              <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block mb-1">
                {t.aiAdvisoryRec}
              </span>
              <p className="text-xs text-amber-900 leading-relaxed font-medium">
                "{alert.advisory}"
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-blue-100">
              <button
                onClick={() => {
                  sound.playClick();
                  setQuery(`Tell me more about ${alert.title} in ${alert.region}`);
                  setActiveTab('chat');
                }}
                className="flex-1 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold transition-all border border-blue-200 cursor-pointer"
              >
                Ask WeatherGPT
              </button>
              <button
                onClick={() => sound.playClick()}
                className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-slate-700 hover:text-slate-900 transition-all border border-blue-200 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => sound.playAlertBeep()}
                className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-slate-700 hover:text-slate-900 transition-all border border-blue-200 cursor-pointer"
              >
                <Bell className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
