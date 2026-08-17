'use client';

import { motion } from 'framer-motion';
import type { AIDecision, Direction } from './types';
import { useEffect, useState } from 'react';

interface Props {
    decision: AIDecision | null;
}

export default function AIDecisionFlow({ decision }: Props) {
    const [decisionHistory, setDecisionHistory] = useState<AIDecision[]>([]);

    useEffect(() => {
        if (decision) {
            setDecisionHistory((prev) => [decision, ...prev].slice(0, 5));
        }
    }, [decision]);

    const getActiveDirection = (d: AIDecision): Direction | undefined => {
        return d.activeDirection || d.selectedDirection;
    };

    const getReasoning = (d: AIDecision): string => {
        return d.reasoning || d.reason || 'Optimal queue clearing';
    };

    const getGreenDuration = (d: AIDecision): number => {
        return d.suggestedGreenDuration || d.signalDuration || 15;
    };

    return (
        <div className="space-y-4 text-slate-900">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold mb-3 text-slate-900">AI Decision Logic</h3>

                {decision ? (
                    <div className="space-y-3">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                            <div>
                                <div className="text-xs text-slate-500 font-semibold uppercase">Active Direction Signal</div>
                                <div className="text-xl font-bold capitalize text-slate-900">{getActiveDirection(decision)}</div>
                            </div>
                            <div className="text-xs font-mono font-bold px-3 py-1 bg-slate-900 text-white rounded-lg">
                                {getGreenDuration(decision)}s Green
                            </div>
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                            <span className="font-bold text-slate-700">Reasoning: </span>
                            <span className="text-slate-600">{getReasoning(decision)}</span>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 text-center text-slate-400 text-xs">
                        Start simulation to observe real-time AI decision flow.
                    </div>
                )}
            </div>
        </div>
    );
}
