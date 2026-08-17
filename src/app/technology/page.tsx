'use client';

import { Brain, Zap, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TechnologyPage() {
    const aiModels = [
        {
            name: "Accident Detection",
            architecture: "YOLO v11",
            accuracy: "94.6%",
            latency: "<200ms",
            classes: "5 accident types",
        },
        {
            name: "Vehicle Classification",
            architecture: "YOLO v11 Multi-class",
            accuracy: "96%",
            latency: "<180ms",
            classes: "Car, Bike, Truck, Bus, Auto, Pedestrian",
        },
        {
            name: "Infrastructure Defect",
            architecture: "Custom CNN",
            accuracy: "91% precision, 87% recall",
            latency: "<150ms",
            classes: "Pothole, Crack, Waterlogging",
        },
        {
            name: "Emergency Vehicle",
            architecture: "Audio-Visual Fusion",
            accuracy: "98% siren detection",
            latency: "<100ms",
            classes: "Police, Ambulance, Fire",
        },
    ];

    const competitors = [
        { feature: "Detection Speed", pureCloud: "5-15 min", pureEdge: "<500ms", navigation: "N/A", resQsync: "<2 sec" },
        { feature: "Cloud Failure Uptime", pureCloud: "0% uptime", pureEdge: "100%", navigation: "0%", resQsync: "85-90%" },
        { feature: "Cost/City/Year", pureCloud: "₹2-5 cr", pureEdge: "₹50 cr", navigation: "₹50L", resQsync: "₹15-27L" },
        { feature: "Network Optimization", pureCloud: "Yes", pureEdge: "No", navigation: "Partial", resQsync: "Yes" },
        { feature: "Privacy / Local Data", pureCloud: "Poor", pureEdge: "Good", navigation: "Poor", resQsync: "Excellent" },
    ];

    return (
        <main className="min-h-screen pt-24 px-6 md:px-12 pb-12 bg-[#f8fafc] text-slate-900">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                <div className="container mx-auto max-w-6xl">
                    <div className="mb-12 border-b border-slate-200 pb-6">
                        <h1 className="text-4xl font-bold mb-2 text-slate-900 tracking-tight">System Architecture & AI Specifications</h1>
                        <p className="text-slate-600 text-base font-medium">Technical documentation for ResQsync hybrid edge-cloud architecture</p>
                    </div>

                    {/* 3-Tier Architecture */}
                    <section className="mb-14">
                        <h2 className="text-2xl font-bold mb-6 text-slate-900">3-Tier Hybrid Architecture</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Tier 1: Edge */}
                            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                <div className="inline-block bg-slate-100 text-slate-800 text-[11px] font-mono font-bold px-2.5 py-1 rounded border border-slate-200 mb-4">TIER 1</div>
                                <Zap className="w-8 h-8 text-slate-900 mb-3" />
                                <h3 className="text-lg font-bold mb-2 text-slate-900">Edge Processing</h3>
                                <ul className="space-y-1.5 text-xs text-slate-600">
                                    <li>• Real-time AI inference</li>
                                    <li>• Autonomous signal override</li>
                                    <li>• Local caching (72h storage)</li>
                                    <li>• 85-90% offline efficiency</li>
                                    <li>• <span className="text-emerald-700 font-bold">&lt;2s</span> detection latency</li>
                                </ul>
                            </div>

                            {/* Tier 2: Cloud */}
                            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                <div className="inline-block bg-slate-100 text-slate-800 text-[11px] font-mono font-bold px-2.5 py-1 rounded border border-slate-200 mb-4">TIER 2</div>
                                <Brain className="w-8 h-8 text-slate-900 mb-3" />
                                <h3 className="text-lg font-bold mb-2 text-slate-900">Cloud Intelligence</h3>
                                <ul className="space-y-1.5 text-xs text-slate-600">
                                    <li>• Multi-intersection optimization</li>
                                    <li>• Continuous model training</li>
                                    <li>• Historical analytics</li>
                                    <li>• Traffic pattern recognition</li>
                                    <li>• OTA model deployment</li>
                                </ul>
                            </div>

                            {/* Tier 3: Override */}
                            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                <div className="inline-block bg-slate-100 text-slate-800 text-[11px] font-mono font-bold px-2.5 py-1 rounded border border-slate-200 mb-4">TIER 3</div>
                                <Shield className="w-8 h-8 text-slate-900 mb-3" />
                                <h3 className="text-lg font-bold mb-2 text-slate-900">Dynamic Override</h3>
                                <ul className="space-y-1.5 text-xs text-slate-600">
                                    <li>• Corridor green wave sync</li>
                                    <li>• Emergency vehicle routing</li>
                                    <li>• Graceful degradation</li>
                                    <li>• System failover protection</li>
                                    <li>• <span className="text-slate-900 font-bold">99.94%</span> network uptime</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* AI Models */}
                    <section className="mb-14">
                        <h2 className="text-2xl font-bold mb-6 text-slate-900">AI Model Specifications</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {aiModels.map((model, index) => (
                                <div key={index} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                    <h3 className="text-lg font-bold mb-3 text-slate-900">{model.name}</h3>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between border-b border-slate-100 pb-1.5">
                                            <span className="text-slate-500">Architecture</span>
                                            <span className="font-semibold text-slate-900">{model.architecture}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-100 pb-1.5">
                                            <span className="text-slate-500">Accuracy</span>
                                            <span className="font-bold text-emerald-700">{model.accuracy}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-100 pb-1.5">
                                            <span className="text-slate-500">Latency</span>
                                            <span className="font-bold text-slate-900">{model.latency}</span>
                                        </div>
                                        <div className="pt-1">
                                            <span className="text-slate-500 font-medium">Classes: </span>
                                            <span className="text-slate-800 font-semibold">{model.classes}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Competitive Comparison */}
                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-slate-900">Architecture Comparison</h2>
                        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase">
                                        <th className="py-3 px-4">Feature</th>
                                        <th className="py-3 px-4">Pure Cloud</th>
                                        <th className="py-3 px-4">Pure Edge</th>
                                        <th className="py-3 px-4">Navigation Apps</th>
                                        <th className="py-3 px-4 bg-slate-100 font-extrabold text-slate-900">ResQsync</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {competitors.map((row, index) => (
                                        <tr key={index} className="hover:bg-slate-50">
                                            <td className="py-3 px-4 font-bold text-slate-900">{row.feature}</td>
                                            <td className="py-3 px-4 text-slate-600">{row.pureCloud}</td>
                                            <td className="py-3 px-4 text-slate-600">{row.pureEdge}</td>
                                            <td className="py-3 px-4 text-slate-600">{row.navigation}</td>
                                            <td className="py-3 px-4 font-bold text-emerald-700 bg-slate-50">{row.resQsync}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </motion.div>
        </main>
    );
}
