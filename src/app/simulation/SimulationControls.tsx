'use client';

import { motion } from 'framer-motion';
import type { SimulationConfig, TrafficMode } from './types';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useSound } from './sounds';

interface Props {
    config: SimulationConfig;
    onConfigChange: (newConfig: Partial<SimulationConfig>) => void;
    onReset: () => void;
}

export default function SimulationControls({ config, onConfigChange, onReset }: Props) {
    const sound = useSound();

    const handlePlayPause = () => {
        if (config.isRunning) {
            sound.playStop();
        } else {
            sound.playStart();
        }
        onConfigChange({ isRunning: !config.isRunning });
    };

    const handleReset = () => {
        sound.playReset();
        onReset();
    };

    const handleTrafficIntensityChange = (value: number) => {
        sound.playSlide();
        onConfigChange({ trafficIntensity: value });
    };

    const handleAmbulanceFrequencyChange = (value: number) => {
        sound.playSlide();
        onConfigChange({ ambulanceFrequency: value });
    };

    const handleModeChange = (mode: TrafficMode) => {
        if (config.mode !== mode) {
            sound.playMode();
            onConfigChange({ mode });
        }
    };

    const handleSpeedChange = (speed: number) => {
        if (config.speed !== speed) {
            sound.playToggle();
            onConfigChange({ speed });
        }
    };

    return (
        <div className="space-y-4 text-slate-900">
            {/* Play/Pause/Reset Controls */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider mb-3 text-slate-700">Simulation Controls</h3>
                <div className="flex gap-2">
                    <button
                        onClick={handlePlayPause}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm ${config.isRunning
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                    >
                        {config.isRunning ? (
                            <>
                                <Pause className="w-4 h-4" /> Pause
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" /> Start Simulation
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleReset}
                        className="px-3.5 py-2.5 rounded-xl font-semibold bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 transition-colors flex items-center gap-1.5 text-xs shadow-sm"
                    >
                        <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </button>
                </div>
            </div>

            {/* Traffic Intensity */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-700">Traffic Density</h3>
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-600 font-medium">
                        <span>Low</span>
                        <span className="font-bold text-slate-900 font-mono">{config.trafficIntensity} vehicles/min</span>
                        <span>Heavy</span>
                    </div>
                    <input
                        type="range"
                        min="10"
                        max="60"
                        step="5"
                        value={config.trafficIntensity}
                        onChange={(e) => handleTrafficIntensityChange(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>

            {/* Ambulance Frequency */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-700">Ambulance Priority Rate</h3>
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-600 font-medium">
                        <span>None</span>
                        <span className="font-bold text-red-600 font-mono">{config.ambulanceFrequency}%</span>
                        <span>Frequent</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="40"
                        step="5"
                        value={config.ambulanceFrequency}
                        onChange={(e) => handleAmbulanceFrequencyChange(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>

            {/* AI Mode Selection */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-700">Control Mode</h3>
                <div className="space-y-2">
                    {(['fixed', 'adaptive', 'emergency'] as TrafficMode[]).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => handleModeChange(mode)}
                            className={`w-full px-3.5 py-2.5 rounded-xl text-left transition-colors text-xs font-semibold ${config.mode === mode
                                ? 'bg-slate-900 text-white shadow-sm'
                                : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                                }`}
                        >
                            <div className="font-bold">
                                {mode === 'fixed' && '⏱️ Fixed Signal Timing'}
                                {mode === 'adaptive' && '🎯 Adaptive AI Queue Weighting'}
                                {mode === 'emergency' && '🚨 Emergency Green Corridor'}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
