import React, { useState } from 'react';
import { Globe, Mic, MapPin, CloudRain, Sparkles, Activity, ShieldAlert, Cpu, BarChart3, Menu, X, Volume2, VolumeX } from 'lucide-react';
import { sound } from '../utils/sound';
import { translations } from '../utils/translations';

export default function Navbar({ activeTab, setActiveTab, currentLang, setCurrentLang, isMuted, setIsMuted }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[currentLang] || translations.en;

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'te', label: 'తెలుగు' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'kn', label: 'ಕನ್ನಡ' },
    { code: 'bn', label: 'বাংলা' }
  ];

  const navItems = [
    { id: 'landing', label: t.navHome || 'Home', icon: Sparkles },
    { id: 'chat', label: t.navAi || 'WeatherGPT AI', icon: Cpu },
    { id: 'dashboard', label: t.navMap || 'India Map', icon: MapPin },
    { id: 'forecast', label: t.navForecast || 'Forecasts', icon: CloudRain },
    { id: 'alerts', label: t.navAlerts || 'Alert Center', icon: ShieldAlert },
    { id: 'advisory', label: t.navAdvisory || 'Advisories', icon: Activity },
    { id: 'climate', label: t.navClimate || 'Climate & Satellite', icon: BarChart3 },
    { id: 'voice', label: t.navVoice || 'Voice AI', icon: Mic },
  ];

  const handleNavClick = (id) => {
    sound.playClick();
    setActiveTab(id);
  };

  const toggleSound = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    sound.muted = nextMute;
    if (!nextMute) {
      sound.playClick();
    }
  };

  return (
    <header className="relative z-50 glass-panel border-b border-blue-300/80 px-4 lg:px-8 py-3 flex items-center justify-between transition-colors duration-300 bg-white/90 backdrop-blur-md shadow-md">
      {/* Logo & Status */}
      <div
        className="flex items-center space-x-4 cursor-pointer group"
        onClick={() => handleNavClick('landing')}
        onMouseEnter={() => sound.playHover()}
      >
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
            <CloudRain className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
              Weather<span className="text-blue-700">GPT</span> <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 font-bold">SIH '26</span>
            </span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span className="text-[11px] text-slate-700 tracking-wide uppercase font-bold">Meteorological Intelligence Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden xl:flex items-center space-x-1 bg-blue-50/80 p-1.5 rounded-2xl border border-blue-200 backdrop-blur-md shadow-sm">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              onMouseEnter={() => sound.playHover()}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-800 hover:text-slate-950 hover:bg-blue-100/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-600'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Controls: Audio Toggle, Language, CTA & Mobile Menu */}
      <div className="flex items-center space-x-3">
        {/* Sound FX Toggle Button */}
        <button
          onClick={toggleSound}
          title={isMuted ? "Enable Sound FX" : "Mute Sound FX"}
          className={`p-2.5 rounded-xl border transition-all ${
            !isMuted
              ? 'bg-blue-100 border-blue-300 text-blue-800 shadow-sm'
              : 'bg-white border-blue-200 text-slate-400 hover:text-slate-600'
          }`}
        >
          {!isMuted ? <Volume2 className="w-4 h-4 text-blue-700 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Language Selector */}
        <div className="relative group">
          <select
            value={currentLang}
            onChange={(e) => {
              sound.playClick();
              setCurrentLang(e.target.value);
            }}
            className="appearance-none bg-white text-xs text-slate-900 font-bold border border-blue-300 rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-blue-600 cursor-pointer shadow-sm"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-white text-slate-900 font-bold">
                {lang.label}
              </option>
            ))}
          </select>
          <Globe className="w-3.5 h-3.5 text-blue-700 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <button
          onClick={() => handleNavClick('chat')}
          className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200"
        >
          <Sparkles className="w-4 h-4" />
          <span>{t.navAi || 'Ask AI'}</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setMobileMenuOpen(!mobileMenuOpen);
          }}
          className="xl:hidden p-2 rounded-xl bg-white border border-blue-300 text-slate-900 hover:text-slate-950 shadow-sm"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 glass-panel border-b border-blue-300 p-4 xl:hidden flex flex-col space-y-2 shadow-2xl animate-in slide-in-from-top-2 duration-200 bg-white/95 backdrop-blur-xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  handleNavClick(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold ${
                  isActive
                    ? 'bg-blue-700 text-white shadow-md'
                    : 'text-slate-800 hover:bg-blue-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-blue-700'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
