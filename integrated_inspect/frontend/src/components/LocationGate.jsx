import React, { useEffect, useState } from 'react';
import { Crosshair, MapPin, Search, ShieldCheck, X } from 'lucide-react';

function apiBase() {
  return (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
}

export default function LocationGate({ onLocation, onDismiss }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [details, setDetails] = useState(null);

  const accept = (value) => {
    if (!value) return;
    setDetails(value);
    onLocation(value);
  };

  const useDeviceLocation = () => {
    if (!navigator.geolocation) {
      setError('Location services are not supported by this browser. Search for your city instead.');
      return;
    }
    setStatus('locating');
    setError('');
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const response = await fetch(`${apiBase()}/api/weather/reverse?latitude=${coords.latitude}&longitude=${coords.longitude}`);
        if (!response.ok) throw new Error('Unable to resolve the detected coordinates.');
        accept(await response.json());
        setStatus('ready');
      } catch (err) {
        accept({ name: 'Current location', latitude: coords.latitude, longitude: coords.longitude, country: 'India', address: 'Detected by your device' });
        setStatus('ready');
        setError('Coordinates detected, but the address lookup was unavailable.');
      }
    }, (err) => {
      setStatus('idle');
      setError(err.code === 1 ? 'Location permission was denied. You can search for a location below.' : 'We could not read your location. Please search below.');
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 });
  };

  const search = async (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    setStatus('searching');
    setError('');
    try {
      const response = await fetch(`${apiBase()}/api/weather/by-city?city=${encodeURIComponent(query.trim())}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Location not found.');
      accept({ ...data.location, address: [data.location.name, data.location.admin2, data.location.admin1, data.location.country].filter(Boolean).join(', ') });
      setStatus('ready');
    } catch (err) {
      setStatus('idle');
      setError(err.message || 'Location search failed.');
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('weathergpt_location_details');
    if (stored) {
      try { accept(JSON.parse(stored)); } catch (_) {}
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-labelledby="location-title" className="w-full max-w-lg rounded-3xl border border-blue-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div><div className="mb-2 inline-flex rounded-xl bg-blue-100 p-2 text-blue-700"><MapPin className="h-5 w-5" /></div><h2 id="location-title" className="text-2xl font-black text-slate-900">Choose your location</h2><p className="mt-1 text-sm text-slate-600">Turn on location for local weather, satellite context, alerts, and voice answers—or search manually.</p></div>
          <button onClick={onDismiss} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close location prompt"><X className="h-5 w-5" /></button>
        </div>
        <button onClick={useDeviceLocation} disabled={status === 'locating'} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 py-3 font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"><Crosshair className="h-5 w-5" />{status === 'locating' ? 'Detecting your location…' : 'Turn on location'}</button>
        <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-slate-400"><span className="h-px flex-1 bg-slate-200" />or select manually<span className="h-px flex-1 bg-slate-200" /></div>
        <form onSubmit={search} className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="City, town, village, or district" className="w-full rounded-xl border border-slate-200 px-9 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></div><button disabled={status === 'searching'} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{status === 'searching' ? '…' : 'Use'}</button></form>
        {details && <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><div className="flex items-center gap-2 font-black"><ShieldCheck className="h-4 w-4" />Selected location</div><div className="mt-2 font-bold">{details.address || details.name}</div><div className="mt-1 text-xs">Latitude {Number(details.latitude).toFixed(5)}° · Longitude {Number(details.longitude).toFixed(5)}°{details.timezone ? ` · ${details.timezone}` : ''}</div></div>}
        {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <p className="mt-5 text-[11px] leading-relaxed text-slate-500">Your browser asks for permission. WeatherGPT uses the coordinates only to resolve local weather and location details; it does not store device location on the server.</p>
      </section>
    </div>
  );
}

export function locationLabel(details) {
  return details?.name || details?.address?.split(',')[0] || '';
}
