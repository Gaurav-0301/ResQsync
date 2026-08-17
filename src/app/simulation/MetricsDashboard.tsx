'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { SimulationMetrics } from './types';

interface Props {
    metrics: SimulationMetrics;
}

export default function MetricsDashboard({ metrics }: Props) {
    const getTrend = (value: number, baseline: number) => {
        if (value > baseline * 1.1) return 'up';
        if (value < baseline * 0.9) return 'down';
        return 'stable';
    };

    const metricCards = [
        {
            label: 'Avg Wait Time',
            value: metrics.averageWaitTime.toFixed(1),
            unit: 's',
            trend: getTrend(metrics.averageWaitTime, 10),
            improving: metrics.averageWaitTime < 8,
        },
        {
            label: 'Throughput',
            value: metrics.throughput.toFixed(1),
            unit: '/min',
            trend: getTrend(metrics.throughput, 10),
            improving: metrics.throughput > 12,
        },
        {
            label: 'Signal Efficiency',
            value: Math.min(100, metrics.signalEfficiency).toFixed(0),
            unit: '%',
            trend: getTrend(metrics.signalEfficiency, 50),
            improving: metrics.signalEfficiency > 80,
        },
        {
            label: 'Vehicles Processed',
            value: metrics.totalVehiclesProcessed.toString(),
            unit: '',
            trend: 'up',
            improving: true,
        },
    ];

    return (
        <div className="space-y-3 text-slate-900">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-700">Live Telemetry Metrics</h3>
                <div className="grid grid-cols-2 gap-3">
                    {metricCards.map((metric) => (
                        <div key={metric.label} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                            <div className="text-[11px] text-slate-500 font-semibold mb-1">{metric.label}</div>
                            <div className="text-xl font-bold text-slate-900 font-mono">
                                {metric.value} <span className="text-xs text-slate-500 font-normal">{metric.unit}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {metrics.ambulancesProcessed > 0 && (
                <div className="bg-red-50 rounded-2xl p-5 border border-red-200 shadow-sm">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-red-700 mb-2">Emergency Response Cleared</h4>
                    <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-700 font-medium">Response Time:</span>
                        <span className="font-mono text-lg font-bold text-red-700">{metrics.ambulanceResponseTime.toFixed(1)}s</span>
                    </div>
                </div>
            )}
        </div>
    );
}
