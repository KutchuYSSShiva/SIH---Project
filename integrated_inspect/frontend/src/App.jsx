import React, { useState } from 'react';
import Navbar from './components/Navbar';
import LandingHero from './components/LandingHero';
import ChatInterface from './components/ChatInterface';
import DashboardMap from './components/DashboardMap';
import ForecastScreen from './components/ForecastScreen';
import AlertCenter from './components/AlertCenter';
import AdvisoryEngine from './components/AdvisoryEngine';
import ClimateSatellite from './components/ClimateSatellite';
import VoiceInterface from './components/VoiceInterface';
import DemoTourModal from './components/DemoTourModal';
import LocationGate, { locationLabel } from './components/LocationGate';
import { Sparkles, Home, MessageSquare, Map, ShieldAlert, MoreHorizontal } from 'lucide-react';
import { detectLanguage } from './utils/language';

function locationFromQuery(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const match = text.match(/\b(?:in|at|for|near|around)\s+([A-Za-z][A-Za-z .'-]{1,50}?)(?=\s+(?:today|tomorrow|tonight|now|this week|next week)|[?.!,]|$)/i);
  if (match?.[1]) return match[1].trim();
  return text.length < 60 && !/\s/.test(text) ? text : '';
}

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');
  const [currentLang, setCurrentLang] = useState('en');
  const [passedQuery, setPassedQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(() => {
    try { return localStorage.getItem('weathergpt_selected_location') || ''; } catch (_) { return ''; }
  });
  const [locationDetails, setLocationDetails] = useState(() => {
    try { return JSON.parse(localStorage.getItem('weathergpt_location_details') || 'null'); } catch (_) { return null; }
  });
  const [showLocationGate, setShowLocationGate] = useState(() => {
    try { return !localStorage.getItem('weathergpt_location_prompt_seen'); } catch (_) { return true; }
  });

  const handleLocation = (details) => {
    const label = locationLabel(details) || details.name || 'Current location';
    setLocationDetails(details);
    setSelectedLocation(label);
    try {
      localStorage.setItem('weathergpt_location_details', JSON.stringify(details));
      localStorage.setItem('weathergpt_selected_location', label);
      localStorage.setItem('weathergpt_location_prompt_seen', '1');
    } catch (_) {}
    setShowLocationGate(false);
  };
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const handleSetQuery = (query) => {
    setPassedQuery(query);
    const location = locationFromQuery(query) || query;
    setSelectedLocation(location);
    try { localStorage.setItem('weathergpt_selected_location', location); } catch (_) {}
    const detected = detectLanguage(query, currentLang);
    if (detected !== currentLang) setCurrentLang(detected);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 via-blue-200 to-white text-slate-800 flex flex-col selection:bg-blue-500 selection:text-white font-sans antialiased relative">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentLang={currentLang}
        setCurrentLang={setCurrentLang}
      />
      {locationDetails && <div className="relative z-30 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-blue-200 bg-white/90 px-4 py-2 text-[11px] text-slate-700 backdrop-blur"><span className="font-black text-blue-800">Your location: {locationDetails.address || `${locationDetails.name}, ${locationDetails.admin1 || locationDetails.country}`}</span><span>Lat {Number(locationDetails.latitude).toFixed(5)}°</span><span>Lon {Number(locationDetails.longitude).toFixed(5)}°</span>{locationDetails.postcode && <span>PIN {locationDetails.postcode}</span>}<button onClick={() => setShowLocationGate(true)} className="font-bold text-blue-700 underline">Change</button></div>}

      {/* Main Tab Content */}
      <main className="flex-1 flex flex-col relative">
        {activeTab === 'landing' && (
          <LandingHero
            setActiveTab={setActiveTab}
            setQuery={handleSetQuery}
            currentLang={currentLang}
            setCurrentLang={setCurrentLang}
          />
        )}

        {activeTab === 'chat' && (
          <ChatInterface
            initialQuery={passedQuery}
            selectedLocation={selectedLocation}
            locationDetails={locationDetails}
            onLocationChange={handleLocation}
            currentLang={currentLang}
            setCurrentLang={setCurrentLang}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardMap currentLang={currentLang} initialQuery={selectedLocation} />
        )}

        {activeTab === 'forecast' && (
          <ForecastScreen currentLang={currentLang} initialQuery={selectedLocation} />
        )}

        {activeTab === 'alerts' && (
          <AlertCenter setActiveTab={setActiveTab} setQuery={handleSetQuery} currentLang={currentLang} initialQuery={selectedLocation} />
        )}

        {activeTab === 'advisory' && (
          <AdvisoryEngine setActiveTab={setActiveTab} setQuery={handleSetQuery} currentLang={currentLang} initialQuery={selectedLocation} />
        )}

        {activeTab === 'climate' && (
          <ClimateSatellite currentLang={currentLang} initialQuery={selectedLocation} />
        )}

        {activeTab === 'voice' && (
          <VoiceInterface
            currentLang={currentLang}
            setCurrentLang={setCurrentLang}
            setActiveTab={setActiveTab}
            setQuery={handleSetQuery}
            selectedLocation={selectedLocation}
            locationDetails={locationDetails}
            onLocationChange={handleLocation}
          />
        )}
      </main>

      {/* Persistent Jury Demo Floating Badge */}
      <div className="fixed bottom-20 md:bottom-6 right-6 z-40">
        <button
          onClick={() => setIsDemoModalOpen(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-extrabold text-xs px-4 py-3 rounded-2xl shadow-2xl shadow-orange-500/30 border border-amber-300/40 transform hover:scale-105 transition-all"
        >
          <Sparkles className="w-4 h-4 text-slate-950 animate-bounce" />
          <span>SIH JURY DEMO WALKTHROUGH</span>
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-blue-300/30 px-4 py-2 flex items-center justify-around bg-white/90 backdrop-blur-xl shadow-lg shadow-blue-200/50">
        <button
          onClick={() => setActiveTab('landing')}
          className={`flex flex-col items-center p-1.5 rounded-lg text-[10px] ${
            activeTab === 'landing' ? 'text-blue-700 font-bold' : 'text-slate-500'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center p-1.5 rounded-lg text-[10px] ${
            activeTab === 'chat' ? 'text-blue-700 font-bold' : 'text-slate-500'
          }`}
        >
          <MessageSquare className="w-5 h-5 mb-0.5" />
          <span>Ask AI</span>
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center p-1.5 rounded-lg text-[10px] ${
            activeTab === 'dashboard' ? 'text-blue-700 font-bold' : 'text-slate-500'
          }`}
        >
          <Map className="w-5 h-5 mb-0.5" />
          <span>Map</span>
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex flex-col items-center p-1.5 rounded-lg text-[10px] ${
            activeTab === 'alerts' ? 'text-blue-700 font-bold' : 'text-slate-500'
          }`}
        >
          <ShieldAlert className="w-5 h-5 mb-0.5" />
          <span>Alerts</span>
        </button>
        <button
          onClick={() => setActiveTab('advisory')}
          className={`flex flex-col items-center p-1.5 rounded-lg text-[10px] ${
            activeTab === 'advisory' ? 'text-blue-700 font-bold' : 'text-slate-500'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span>Advisories</span>
        </button>
      </div>

      {/* Guided SIH Demo Tour Modal */}
      <DemoTourModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        setActiveTab={setActiveTab}
        setQuery={handleSetQuery}
      />
      {showLocationGate && <LocationGate onLocation={handleLocation} onDismiss={() => { try { localStorage.setItem('weathergpt_location_prompt_seen', '1'); } catch (_) {} setShowLocationGate(false); }} />}
    </div>
  );
}
