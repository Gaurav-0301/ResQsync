'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, AlertTriangle, TrendingUp, Clock,
    Shield, Zap, Users, MapPin, Download, Filter, Bell,
    Circle, CheckCircle, XCircle, RefreshCw, Database, Wifi, Target
} from 'lucide-react';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer
} from 'recharts';
import { useDetection } from '@/context/DetectionContext';
import AnimatedCounter from '@/components/AnimatedCounter';
import * as XLSX from 'xlsx';

// Demo data generators
const generateDemoData = () => {
    const now = Date.now();
    const timeSeriesData = Array.from({ length: 24 }, (_, i) => ({
        time: `${i.toString().padStart(2, '0')}:00`,
        detections: Math.floor(Math.random() * 100 + 50),
        accidents: Math.floor(Math.random() * 5),
        trafficDensity: Math.floor(Math.random() * 80 + 20),
        responseTime: Math.floor(Math.random() * 120 + 60)
    }));

    const locationData = [
        { zone: 'Medical Square', accidents: 45, vehicles: 15234 },
        { zone: 'Ajni Junction', accidents: 32, vehicles: 12456 },
        { zone: 'Sitabuldi', accidents: 28, vehicles: 9876 },
        { zone: 'Wardha Road', accidents: 19, vehicles: 11234 },
        { zone: 'Central Avenue', accidents: 38, vehicles: 14567 }
    ];

    const vehicleTypes = [
        { name: 'Cars', value: 4562, color: '#0f172a' },
        { name: 'Bikes', value: 3211, color: '#475569' },
        { name: 'Trucks', value: 1234, color: '#2563eb' },
        { name: 'Buses', value: 567, color: '#0284c7' },
        { name: 'Pedestrians', value: 2345, color: '#16a34a' }
    ];

    const performanceMetrics = [
        { subject: 'Detection Accuracy', A: 98, fullMark: 100 },
        { subject: 'Response Time', A: 92, fullMark: 100 },
        { subject: 'Network Uptime', A: 99.9, fullMark: 100 },
        { subject: 'Alert Precision', A: 95, fullMark: 100 },
        { subject: 'Coverage', A: 88, fullMark: 100 }
    ];

    const alerts = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        timestamp: now - i * 5 * 60 * 1000,
        type: i % 3 === 0 ? 'Accident' : i % 2 === 0 ? 'Hazard' : 'Traffic',
        severity: ['Critical', 'High', 'Medium', 'Low'][Math.floor(Math.random() * 4)],
        location: ['Medical Square GMCH', 'Ajni Corridor', 'Sitabuldi Junction', 'Wardha Road'][i % 4],
        description: [
            'Multi-vehicle collision flagged on edge camera',
            'Pothole / Road defect causing bottleneck',
            'Heavy traffic queue detected on approach',
            'Ambulance green corridor priority active',
            'Emergency vehicle detected on approach'
        ][i % 5],
        confidence: 0.75 + Math.random() * 0.24
    }));

    return { timeSeriesData, locationData, vehicleTypes, performanceMetrics, alerts };
};

export default function DashboardPage() {
    const { isHighConfidence, currentDetection, confidenceLevel } = useDetection();
    const [mounted, setMounted] = useState(false);
    const [dbSource, setDbSource] = useState<'mongodb' | 'fallback_local'>('fallback_local');
    const [dbAlerts, setDbAlerts] = useState<any[]>([]);

    useEffect(() => {
        setMounted(true);
        fetch('/api/dashboard')
            .then(res => res.json())
            .then(data => {
                if (data.source) {
                    setDbSource(data.source);
                }
                if (Array.isArray(data.alerts) && data.alerts.length > 0) {
                    setDbAlerts(data.alerts);
                }
            })
            .catch(err => console.warn('Could not fetch MongoDB dashboard data:', err));
    }, []);

    const demoData = useMemo(() => generateDemoData(), []);
    const { timeSeriesData, locationData, vehicleTypes, performanceMetrics, alerts: fallbackAlerts } = demoData;
    const alerts = dbAlerts.length > 0 ? dbAlerts : fallbackAlerts;

    const exportToCSV = () => {
        const csvData = alerts.map(alert => ({
            Timestamp: new Date(alert.timestamp).toISOString(),
            Type: alert.type,
            Severity: alert.severity || 'Critical',
            Location: alert.location,
            Description: alert.description || `Incident detected: ${alert.type}`,
            Confidence: `${((alert.confidence || 0.95) * 100).toFixed(2)}%`
        }));

        const ws = XLSX.utils.json_to_sheet(csvData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Alerts');
        XLSX.writeFile(wb, `resqsync_alerts_${Date.now()}.csv`);
    };

    return (
        <main className="min-h-screen pt-24 px-4 md:px-8 pb-12 bg-[#f8fafc] text-slate-900">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                                ResQsync Control Center
                            </h1>
                            <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${
                                dbSource === 'mongodb' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}>
                                {dbSource === 'mongodb' ? '🍃 MongoDB Connected' : '💾 Hybrid Storage (Local & DB Sync)'}
                            </span>
                        </div>
                        <p className="text-slate-600 text-sm font-medium mt-1">Real-time traffic intelligence and emergency response dashboard</p>
                    </div>
                    <button
                        onClick={exportToCSV}
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-sm"
                    >
                        <Download className="w-4 h-4" /> Export Report (CSV)
                    </button>
                </div>

                {/* Real-time Alert Banner */}
                {isHighConfidence && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-600 text-white rounded-lg flex items-center justify-center font-bold">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-red-700">REAL-TIME ALERT: {currentDetection}</h3>
                                <p className="text-xs text-slate-600">Confidence: {(confidenceLevel * 100).toFixed(1)}% | Dynamic green corridor override active</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top Row: 4 Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Nodes</span>
                            <Wifi className="w-4 h-4 text-slate-700" />
                        </div>
                        <div className="text-2xl font-bold text-slate-900">847 <span className="text-xs text-slate-400 font-normal">/ 850</span></div>
                        <div className="text-xs text-emerald-600 font-semibold mt-1">99.6% network uptime</div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Hourly Detections</span>
                            <Activity className="w-4 h-4 text-slate-700" />
                        </div>
                        <div className="text-2xl font-bold text-slate-900">12,456</div>
                        <div className="text-xs text-emerald-600 font-semibold mt-1">+12.3% baseline efficiency</div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Incidents Today</span>
                            <AlertTriangle className="w-4 h-4 text-slate-700" />
                        </div>
                        <div className="text-2xl font-bold text-slate-900">23</div>
                        <div className="text-xs text-emerald-600 font-semibold mt-1">-32% emergency response time</div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Bandwidth Optimization</span>
                            <Zap className="w-4 h-4 text-slate-700" />
                        </div>
                        <div className="text-2xl font-bold text-slate-900">99.94%</div>
                        <div className="text-xs text-emerald-600 font-semibold mt-1">Metadata-only transmission</div>
                    </div>
                </div>

                {/* Charts Row 1: Time Series & Vehicle Types */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-base font-bold text-slate-900 mb-4">Traffic & Incident Density (24h Trend)</h3>
                        <div className="h-72">
                            {mounted && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={timeSeriesData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                                        <YAxis stroke="#64748b" fontSize={11} />
                                        <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                                        <Area type="monotone" dataKey="trafficDensity" stroke="#0f172a" fill="#f1f5f9" name="Traffic Density %" />
                                        <Area type="monotone" dataKey="detections" stroke="#2563eb" fill="#eff6ff" name="Detections" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-base font-bold text-slate-900 mb-4">Vehicle Distribution</h3>
                        <div className="h-72 flex items-center justify-center">
                            {mounted && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={vehicleTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85}>
                                            {vehicleTypes.map((entry, index) => (
                                                <Cell key={index} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* Charts Row 2: Location Analysis & Incident Table */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-base font-bold text-slate-900 mb-4">Nagpur Zone Incident Load</h3>
                        <div className="h-64">
                            {mounted && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={locationData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="zone" stroke="#64748b" fontSize={10} />
                                        <YAxis stroke="#64748b" fontSize={11} />
                                        <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                                        <Bar dataKey="accidents" fill="#2563eb" radius={[6, 6, 0, 0]} name="Incidents" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-base font-bold text-slate-900 mb-4">Live Alert Stream</h3>
                        <div className="overflow-x-auto max-h-64 custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-bold">
                                        <th className="py-2.5 px-3">Time</th>
                                        <th className="py-2.5 px-3">Type</th>
                                        <th className="py-2.5 px-3">Location</th>
                                        <th className="py-2.5 px-3">Description</th>
                                        <th className="py-2.5 px-3">Confidence</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {alerts.slice(0, 8).map((alert) => (
                                        <tr key={alert.id} className="hover:bg-slate-50">
                                            <td className="py-2.5 px-3 font-mono text-slate-500">{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td className="py-2.5 px-3 font-bold">
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${alert.type === 'Accident' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'}`}>
                                                    {alert.type}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 font-medium text-slate-900">{alert.location}</td>
                                            <td className="py-2.5 px-3 text-slate-600">{alert.description}</td>
                                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{(alert.confidence * 100).toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
}
