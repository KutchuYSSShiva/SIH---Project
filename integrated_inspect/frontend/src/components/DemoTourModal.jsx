import React, { useState } from 'react';
import { Sparkles, Play, CheckCircle2, ChevronRight, X, Compass, AlertTriangle, ArrowRight } from 'lucide-react';

export default function DemoTourModal({ isOpen, onClose, setActiveTab, setQuery }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "1. Immersive 3D Earth & Satellite Landing",
      desc: "Open WeatherGPT home. Showcase realistic photorealistic 3D Earth, centered on India, with real-time revolving satellite pass & live telemetry.",
      action: () => setActiveTab('landing'),
      tabLabel: "View Landing"
    },
    {
      title: "2. Natural Language AI Weather Query",
      desc: "Ask: 'Will it rain in Visakhapatnam tomorrow?' WeatherGPT parses precipitation curves, structured confidence metrics, and next steps.",
      action: () => {
        setQuery("Will it rain heavily in Visakhapatnam tomorrow?");
        setActiveTab('chat');
      },
      tabLabel: "Run AI Query"
    },
    {
      title: "3. Agricultural & Farmer Advisory",
      desc: "Switch to Farmer mode: Get crop-tuned recommendations for pesticide spraying, irrigation delays, and soil moisture drainage.",
      action: () => setActiveTab('advisory'),
      tabLabel: "Open Advisories"
    },
    {
      title: "4. Multilingual & Regional Voice AI",
      desc: "Experience zero-latency voice interaction in Telugu/Hindi: 'రేపు వర్షం పడుతుందా?' with automatic synthesis.",
      action: () => setActiveTab('voice'),
      tabLabel: "Try Voice AI"
    },
    {
      title: "5. India Weather Map & Multi-Layer Radar",
      desc: "Interactive state and district intelligence across Rain Radar, Wind Flow, AQI, and Thermal layers.",
      action: () => setActiveTab('dashboard'),
      tabLabel: "Explore Map"
    },
    {
      title: "6. Extreme Weather & Cyclone Alerts",
      desc: "Real-time Bay of Bengal cyclone track monitoring, heavy rainfall warnings, and flood risk mitigation.",
      action: () => setActiveTab('alerts'),
      tabLabel: "View Alerts"
    },
    {
      title: "7. Multidecadal Climate Anomaly Trends",
      desc: "Explore 1950-2026 warming patterns (+1.24°C) and monsoon deviation analytics.",
      action: () => setActiveTab('climate'),
      tabLabel: "View Climate"
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      steps[next].action();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      steps[prev].action();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-2xl p-6 sm:p-8 rounded-3xl border border-cyan-500/30 bg-slate-950 shadow-2xl relative">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-2.5 mb-2">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">SIH 2026 Jury Presentation Mode</h3>
            <p className="text-xs text-slate-400">Guided 3-minute demonstration workflow for evaluators</p>
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center gap-1.5 my-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? 'w-8 bg-cyan-400'
                  : i < currentStep
                  ? 'w-4 bg-cyan-800'
                  : 'w-4 bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Active Step Content */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/5 space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-cyan-400 uppercase font-bold">
              STEP {currentStep + 1} OF {steps.length}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">EST: 30 SEC</span>
          </div>

          <h4 className="text-lg font-bold text-white">{steps[currentStep].title}</h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {steps[currentStep].desc}
          </p>

          <div className="pt-2">
            <button
              onClick={() => {
                steps[currentStep].action();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md"
            >
              Take Me There ({steps[currentStep].tabLabel})
            </button>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium"
            >
              Exit Tour
            </button>
            <button
              onClick={handleNext}
              disabled={currentStep === steps.length - 1}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-30"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
