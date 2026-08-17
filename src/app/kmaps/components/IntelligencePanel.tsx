import { Incident } from '../hooks/useIncidentData';
import GlassPanel from './GlassPanel';

interface IntelligencePanelProps {
    incidents: Incident[];
}

export default function IntelligencePanel({ incidents }: IntelligencePanelProps) {
    const total = incidents.length;
    const critical = incidents.filter(i => i.severity === 'CRITICAL').length;
    const warning = incidents.filter(i => i.severity === 'WARNING').length;

    return (
        <GlassPanel className="w-full pointer-events-auto">
            <div className="flex items-center justify-between text-slate-900">
                <div>
                    <h2 className="text-lg font-bold">Nagpur Intelligence</h2>
                    <p className="text-xs text-slate-500">Live ML Detections</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-indigo-600">{total}</div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Active Events</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-red-500/10 border border-red-500/20 p-2 rounded-lg text-center">
                    <span className="block text-red-600 font-bold text-lg">{critical}</span>
                    <span className="text-[10px] text-red-600 uppercase font-semibold">Critical</span>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg text-center">
                    <span className="block text-amber-600 font-bold text-lg">{warning}</span>
                    <span className="text-[10px] text-amber-600 uppercase font-semibold">Warnings</span>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 text-[10px] text-slate-400 text-center font-mono">
                SYSTEM OPERATIONAL • V2.4.0
            </div>
        </GlassPanel>
    );
}
