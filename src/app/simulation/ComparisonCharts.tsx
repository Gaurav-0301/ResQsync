'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const WAIT_TIME_DATA = [
    { mode: 'Fixed Timer', avgWaitTime: 12.5, throughput: 8.2 },
    { mode: 'AI Adaptive', avgWaitTime: 7.3, throughput: 14.6 },
    { mode: 'Emergency Priority', avgWaitTime: 8.1, throughput: 13.2 },
];

const EMERGENCY_RESPONSE_DATA = [
    { mode: 'Fixed Timer', responseTime: 18.3 },
    { mode: 'AI Adaptive', responseTime: 12.1 },
    { mode: 'Emergency Priority', responseTime: 4.8 },
];

const ComparisonCharts = React.memo(function ComparisonCharts() {
    return (
        <div className="space-y-6 text-slate-900 mt-8">
            <div className="border-b border-slate-200 pb-3">
                <h2 className="text-2xl font-bold mb-1 text-slate-900">Performance Comparison Benchmark</h2>
                <p className="text-slate-600 text-xs font-medium">
                    Comparative throughput and response metrics between traditional fixed-timer controllers and ResQsync AI
                </p>
            </div>

            {/* Wait Time & Throughput Comparison */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold mb-4 text-slate-900">Traffic Flow & Queue Latency Metrics</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={WAIT_TIME_DATA}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="mode" stroke="#64748b" style={{ fontSize: '11px' }} />
                            <YAxis stroke="#64748b" style={{ fontSize: '11px' }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Bar dataKey="avgWaitTime" fill="#0f172a" name="Avg Wait Time (s)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="throughput" fill="#2563eb" name="Throughput (vehicles/min)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Emergency Response Comparison */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold mb-4 text-slate-900">Emergency Response Latency</h3>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={EMERGENCY_RESPONSE_DATA} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis type="number" stroke="#64748b" style={{ fontSize: '11px' }} />
                            <YAxis dataKey="mode" type="category" stroke="#64748b" style={{ fontSize: '11px' }} width={120} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                }}
                            />
                            <Bar dataKey="responseTime" fill="#dc2626" name="Response Time (s)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
});

export default ComparisonCharts;
