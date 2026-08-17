'use client';

import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import VideoAnalyzer from '@/components/VideoAnalyzer';

const incidents = [
    { time: "00:00:45", type: "Accident", confidence: "94.6%", desc: "2-vehicle collision detected", frame: 1350 },
    { time: "00:01:32", type: "Emergency", confidence: "98.1%", desc: "Ambulance signal priority activated", frame: 2760 },
    { time: "00:02:13", type: "Defect", confidence: "91.2%", desc: "Road defect / Pothole detected", frame: 3990 },
];

export default function DemoPage() {
    return (
        <main className="min-h-screen pt-24 px-4 md:px-12 pb-12 bg-[#f8fafc] text-slate-900">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                <div className="container mx-auto max-w-7xl">
                    {/* Header */}
                    <div className="mb-10 text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-3 text-slate-900 tracking-tight">
                            Live Video Detection & Incident Analysis
                        </h1>
                        <p className="text-slate-600 text-base max-w-2xl mx-auto font-medium">
                            Real-time computer vision inference running on edge video feeds
                        </p>
                    </div>

                    {/* Main Content Card - Video Upload Analysis */}
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 mb-12">
                        <div className="p-6 md:p-8 bg-white min-h-[550px]">
                            <VideoAnalyzer />
                        </div>
                    </div>

                    {/* Incident Detection Log */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                <Activity className="w-5 h-5 text-slate-800" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Incident Detection Log</h2>
                                <p className="text-xs text-slate-500 font-medium">Recorded incident telemetry from current video feed</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-600">Timestamp</th>
                                        <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-600">Event Type</th>
                                        <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-600">Confidence</th>
                                        <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-600">Description</th>
                                        <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-600">Frame #</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {incidents.map((incident, index) => (
                                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-3.5 px-4 text-xs font-mono text-slate-700">{incident.time}</td>
                                            <td className="py-3.5 px-4 text-xs font-bold">
                                                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${incident.type === 'Accident' ? 'bg-red-100 text-red-800 border border-red-200' :
                                                    incident.type === 'Emergency' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                                        'bg-slate-100 text-slate-800 border border-slate-200'
                                                    }`}>
                                                    {incident.type}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-xs font-bold text-emerald-600 font-mono">{incident.confidence}</td>
                                            <td className="py-3.5 px-4 text-xs text-slate-700 font-medium">{incident.desc}</td>
                                            <td className="py-3.5 px-4 text-xs font-mono text-slate-500">{incident.frame}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </motion.div>
        </main>
    );
}
