'use client';

import { useState, useEffect } from 'react';
import type { Direction } from './types';

interface SignalSwitchEntry {
    id: number;
    timestamp: Date;
    from: Direction;
    to: Direction;
    reason: string;
}

interface Props {
    latestSwitch?: {
        from: Direction;
        to: Direction;
        reason: string;
    };
}

export default function SignalSwitchLog({ latestSwitch }: Props) {
    const [entries, setEntries] = useState<SignalSwitchEntry[]>([]);
    const [entryId, setEntryId] = useState(0);

    useEffect(() => {
        if (latestSwitch) {
            const newEntry: SignalSwitchEntry = {
                id: entryId,
                timestamp: new Date(),
                from: latestSwitch.from,
                to: latestSwitch.to,
                reason: latestSwitch.reason,
            };
            setEntryId(prev => prev + 1);
            setEntries(prev => [newEntry, ...prev.slice(0, 9)]);
        }
    }, [latestSwitch]);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm text-slate-900 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Signal Switch Stream</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                    {entries.length} Events
                </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 max-h-[420px] custom-scrollbar">
                {entries.length > 0 ? (
                    entries.map((entry) => (
                        <div
                            key={entry.id}
                            className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1"
                        >
                            <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
                                <span>{formatTime(entry.timestamp)}</span>
                                <span className="font-bold text-slate-800 uppercase">{entry.from} ➔ {entry.to}</span>
                            </div>
                            <p className="text-slate-700 font-medium">{entry.reason}</p>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-slate-400 text-xs">
                        Signal switch telemetry will log here in real-time.
                    </div>
                )}
            </div>
        </div>
    );
}
