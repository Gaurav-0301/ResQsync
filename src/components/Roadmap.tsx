'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import { Rocket, Zap, Globe, Building, Activity, Target, CheckCircle, Cpu, X, ArrowRight } from 'lucide-react';

type Phase = {
    id: number;
    title: string;
    timeframe: string;
    status: 'completed' | 'current' | 'upcoming';
    icon: any;
    objectives: string[];
    metrics: string;
};

const phases: Phase[] = [
    {
        id: 1,
        title: "Proof of Concept",
        timeframe: "Q1 2026",
        status: "completed",
        icon: Zap,
        objectives: ["85%+ vehicle detection", "Single intersection proto", "10,000+ labeled images"],
        metrics: "Validation Complete"
    },
    {
        id: 2,
        title: "MVP Development",
        timeframe: "Q2-Q3 2026",
        status: "current",
        icon: Rocket,
        objectives: ["Multi-intersection mgmt", "Emergency corridors", "Cloud dashboard"],
        metrics: "In Progress (75%)"
    },
    {
        id: 3,
        title: "Pilot Deployment",
        timeframe: "Q3-Q4 2026",
        status: "upcoming",
        icon: Building,
        objectives: ["50-100 cameras", "2-3 Tier 2 cities", "Citizen mobile app"],
        metrics: "Target: 2 Cities"
    },
    {
        id: 4,
        title: "Scaling & AV Integration",
        timeframe: "2027 H1",
        status: "upcoming",
        icon: Activity,
        objectives: ["500+ intersections/city", "V2X protocol", "Predictive forecasting"],
        metrics: "Target: 5 Cities"
    },
    {
        id: 5,
        title: "Market Leadership",
        timeframe: "2027 H2+",
        status: "upcoming",
        icon: Globe,
        objectives: ["National presence", "SE Asia expansion", "Digital twin simulation"],
        metrics: "Target: 50+ Cities"
    }
];

const tracks = [
    { name: "Development", status: ["AI/ML Models", "Edge Hardware", "Platform V1", "V2X Integration", "Global API"] },
    { name: "Business", status: ["Seed Funding", "Govt Tenders", "Series A", "Strategic Partnerships", "IPO Readiness"] },
    { name: "Deployment", status: ["Lab Testing", "Nagpur Pilot", "Indore/Surat", "Metro Expansion", "International"] }
];

export default function Roadmap() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedPhase, setSelectedPhase] = useState<number | null>(null);

    return (
        <section ref={containerRef} className="py-20 relative bg-slate-50 border-t border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-block mb-3 px-3.5 py-1 rounded-full border border-slate-300 bg-white">
                        <span className="text-slate-700 text-xs font-mono tracking-wider font-semibold">SYSTEM ROADMAP</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold text-slate-900">
                        Implementation Roadmap
                    </h2>
                </div>

                {/* Phase Cards Timeline */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-16">
                    {phases.map((phase) => (
                        <div
                            key={phase.id}
                            onClick={() => setSelectedPhase(phase.id)}
                            className="bg-white rounded-xl border border-slate-200 p-6 cursor-pointer shadow-sm"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                                    PHASE 0{phase.id}
                                </span>
                                <div className={`w-2.5 h-2.5 rounded-full ${phase.status === 'completed' ? 'bg-blue-600' : phase.status === 'current' ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                            </div>

                            <div className="mb-4">
                                <phase.icon className="w-6 h-6 text-slate-800 mb-2" />
                                <h3 className="text-base font-bold text-slate-900 leading-tight mb-0.5">{phase.title}</h3>
                                <p className="text-xs text-slate-500 font-mono">{phase.timeframe}</p>
                            </div>

                            <ul className="space-y-1.5 mb-4">
                                {phase.objectives.slice(0, 3).map((obj: string, i: number) => (
                                    <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                                        <span className="mt-1 w-1 h-1 bg-slate-400 rounded-full shrink-0" />
                                        {obj}
                                    </li>
                                ))}
                            </ul>

                            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                                <span className={`text-xs font-semibold ${phase.status === 'completed' ? 'text-blue-700' : phase.status === 'current' ? 'text-emerald-700' : 'text-slate-600'}`}>
                                    {phase.metrics}
                                </span>
                                <ArrowRight className="w-4 h-4 text-slate-400" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Parallel Tracks Panel */}
                <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2.5 text-slate-900">
                        <Cpu className="w-5 h-5 text-slate-800" /> Parallel Execution Tracks
                    </h3>
                    <div className="space-y-6">
                        {tracks.map((track) => (
                            <div key={track.name} className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
                                <span className="font-mono text-xs text-slate-700 font-bold">{track.name}</span>
                                <div className="grid grid-cols-5 gap-2">
                                    {track.status.map((step, j) => (
                                        <div key={step} className={`p-2 rounded border text-xs text-center font-medium ${j < 2 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : j === 2 ? 'bg-blue-50 border-blue-200 text-blue-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                            {step}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Expanded Card Modal */}
                <AnimatePresence>
                    {selectedPhase && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setSelectedPhase(null)} />
                            <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl z-10 text-slate-900">
                                <button onClick={() => setSelectedPhase(null)} className="absolute top-4 right-4 p-1.5 bg-slate-100 rounded-full hover:bg-slate-200">
                                    <X className="w-4 h-4 text-slate-700" />
                                </button>
                                {(() => {
                                    const p = phases.find(x => x.id === selectedPhase)!;
                                    return (
                                        <div>
                                            <div className="inline-block px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 text-xs font-mono font-bold mb-4">
                                                PHASE 0{p.id} — {p.status.toUpperCase()}
                                            </div>
                                            <h3 className="text-2xl font-bold mb-1">{p.title}</h3>
                                            <p className="text-sm text-slate-500 font-mono mb-6">{p.timeframe}</p>
                                            <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                                <Target className="w-4 h-4 text-slate-800" /> Objectives
                                            </h4>
                                            <ul className="space-y-2 mb-6">
                                                {p.objectives.map((obj, idx) => (
                                                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-700 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                                                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                                        {obj}
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                                <span className="text-xs text-slate-500 font-semibold">Target Benchmark</span>
                                                <span className="text-lg font-bold">{p.metrics}</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
