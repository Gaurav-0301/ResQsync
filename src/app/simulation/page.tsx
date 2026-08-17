'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

import TrafficSimulation3D from './TrafficSimulation3D';
import SimulationControls from './SimulationControls';
import MetricsDashboard from './MetricsDashboard';
import AIDecisionFlow from './AIDecisionFlow';
import SignalSwitchLog from './SignalSwitchLog';
import TrafficScenarios from './TrafficScenarios';
import ComparisonCharts from './ComparisonCharts';
import { useSound } from './sounds';
import type { SimulationConfig, SimulationMetrics, AIDecision, Direction } from './types';
import Link from 'next/link';

export default function SimulationPage() {
    const sound = useSound();
    const [config, setConfig] = useState<SimulationConfig>({
        trafficIntensity: 25,
        ambulanceFrequency: 15,
        mode: 'adaptive',
        speed: 1,
        isRunning: false,
    });

    const [metrics, setMetrics] = useState<SimulationMetrics>({
        averageWaitTime: 0,
        totalVehiclesProcessed: 0,
        throughput: 0,
        signalEfficiency: 0,
        ambulanceResponseTime: 0,
        ambulancesProcessed: 0,
        timeSaved: 0,
    });

    const [currentDecision, setCurrentDecision] = useState<AIDecision | null>(null);
    const [currentScenario, setCurrentScenario] = useState<string | undefined>();
    const [latestSignalSwitch, setLatestSignalSwitch] = useState<{
        from: Direction;
        to: Direction;
        reason: string;
    } | undefined>();

    const handleConfigChange = useCallback((newConfig: Partial<SimulationConfig>) => {
        setConfig((prev) => ({ ...prev, ...newConfig }));
    }, []);

    const handleScenarioSelect = useCallback((scenarioConfig: {
        trafficIntensity: number;
        ambulanceFrequency: number;
        mode: 'fixed' | 'adaptive' | 'emergency'
    }) => {
        setConfig(prev => ({
            ...prev,
            ...scenarioConfig,
        }));
    }, []);

    const handleReset = useCallback(() => {
        setConfig({
            trafficIntensity: 25,
            ambulanceFrequency: 15,
            mode: 'adaptive',
            speed: 1,
            isRunning: false,
        });
        setMetrics({
            averageWaitTime: 0,
            totalVehiclesProcessed: 0,
            throughput: 0,
            signalEfficiency: 0,
            ambulanceResponseTime: 0,
            ambulancesProcessed: 0,
            timeSaved: 0,
        });
        setCurrentDecision(null);
        setLatestSignalSwitch(undefined);
        window.location.reload();
    }, []);

    const handleMetricsUpdate = useCallback((newMetrics: SimulationMetrics) => {
        setTimeout(() => {
            setMetrics(newMetrics);
        }, 0);
    }, []);

    const handleDecisionUpdate = useCallback((decision: AIDecision) => {
        setTimeout(() => {
            setCurrentDecision(decision);
        }, 0);
    }, []);

    const handleSignalSwitch = useCallback((from: Direction, to: Direction, reason: string) => {
        setTimeout(() => {
            setLatestSignalSwitch({ from, to, reason });
        }, 0);
    }, []);

    return (
        <main className="min-h-screen pt-24 px-4 md:px-8 pb-12 bg-[#f8fafc] text-slate-900">
            <motion.div
                className="container mx-auto max-w-[1800px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* Header */}
                <div className="mb-8 border-b border-slate-200 pb-6">
                    <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-2">
                        3D Traffic AI Simulation
                    </h1>
                    <p className="text-slate-600 text-base max-w-3xl font-medium">
                        Real-time 3D physics-based traffic simulation demonstrating automated signal clearance and green corridors.
                    </p>
                </div>

                {/* Main Simulation Area - 3 Column Layout */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
                    {/* Left Column - Controls & Scenarios */}
                    <div className="xl:col-span-3 space-y-4">
                        <TrafficScenarios
                            onSelectScenario={handleScenarioSelect}
                            currentScenario={currentScenario}
                        />
                        <SimulationControls
                            config={config}
                            onConfigChange={handleConfigChange}
                            onReset={handleReset}
                        />
                        <MetricsDashboard metrics={metrics} />
                    </div>

                    {/* Center Column - 3D Simulation */}
                    <div className="xl:col-span-6">
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-slate-900">Interactive 3D Viewport</h2>
                                <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                                    <span>Drag: Rotate</span>
                                    <span>•</span>
                                    <span>Scroll: Zoom</span>
                                </div>
                            </div>
                            <TrafficSimulation3D
                                config={config}
                                onMetricsUpdate={handleMetricsUpdate}
                                onDecisionUpdate={handleDecisionUpdate}
                                onSignalSwitch={handleSignalSwitch}
                            />
                            <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Vehicle Legend</div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-medium text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-3 bg-blue-600 rounded"></div>
                                        <span>Regular Car</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-3 bg-white rounded border-2 border-red-600"></div>
                                        <span>Ambulance</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-3 bg-amber-500 rounded"></div>
                                        <span>Heavy Truck</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                        <span>Green Signal</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Signal Switch Log */}
                    <div className="xl:col-span-3">
                        <SignalSwitchLog latestSwitch={latestSignalSwitch} />
                    </div>
                </div>

                {/* AI Decision Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <AIDecisionFlow decision={currentDecision} />
                    <div>
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
                            <h3 className="text-lg font-bold mb-4 text-slate-900">How ResQsync AI Controls Signals</h3>
                            <div className="space-y-3">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="font-bold text-slate-900 text-sm mb-1">1. Queue Length Detection</div>
                                    <div className="text-xs text-slate-600">
                                        Edge camera counts waiting vehicles on each approach and calculates dynamic signal weights.
                                    </div>
                                </div>
                                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                                    <div className="font-bold text-red-800 text-sm mb-1">2. Emergency Green Corridor Override</div>
                                    <div className="text-xs text-slate-700">
                                        Upon detecting an emergency vehicle, the signal switches immediately to clear the route.
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="font-bold text-slate-900 text-sm mb-1">3. Dynamic Timing Adjustment</div>
                                    <div className="text-xs text-slate-600">
                                        Green light duration dynamically adapts based on real-time vehicle clear-rates.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold mb-3 text-slate-900">3D Physics Engine</h3>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                                    <div>
                                        <div className="font-bold text-slate-900">React Three Fiber</div>
                                        <div className="text-slate-500">WebGL accelerated Three.js renderer</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                                    <div>
                                        <div className="font-bold text-slate-900">Low-Poly 3D Assets</div>
                                        <div className="text-slate-500">60 FPS performance optimization</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Comparison Charts Section */}
                <ComparisonCharts />

                {/* Call to Action */}
                <div className="mt-12 bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm">
                    <h3 className="text-2xl font-bold mb-2 text-slate-900">Ready to Deploy City-Wide?</h3>
                    <p className="text-slate-600 mb-6 text-sm max-w-2xl mx-auto font-medium">
                        ResQsync edge nodes operate independently at each intersection while syncing across the corridor.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link
                            href="/dashboard"
                            className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-sm hover:bg-slate-800 transition-colors text-sm"
                        >
                            View Live Dashboard →
                        </Link>
                    </div>
                </div>
            </motion.div>

        </main>
    );
}
