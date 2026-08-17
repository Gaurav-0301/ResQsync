'use client';

import { useSound } from './sounds';

interface Scenario {
    id: string;
    name: string;
    emoji: string;
    description: string;
    config: {
        trafficIntensity: number;
        ambulanceFrequency: number;
        mode: 'fixed' | 'adaptive' | 'emergency';
    };
}

const scenarios: Scenario[] = [
    {
        id: 'rush-hour',
        name: 'Peak Hour Gridlock',
        emoji: '🚗',
        description: 'Heavy arterial traffic from all directions',
        config: {
            trafficIntensity: 50,
            ambulanceFrequency: 5,
            mode: 'adaptive',
        },
    },
    {
        id: 'emergency',
        name: 'Emergency Dispatch',
        emoji: '🚑',
        description: 'Frequent high-priority ambulances',
        config: {
            trafficIntensity: 25,
            ambulanceFrequency: 40,
            mode: 'emergency',
        },
    },
    {
        id: 'night',
        name: 'Off-Peak Mode',
        emoji: '🌃',
        description: 'Light flow with demand-driven signals',
        config: {
            trafficIntensity: 10,
            ambulanceFrequency: 5,
            mode: 'adaptive',
        },
    },
];

interface Props {
    onSelectScenario: (config: Scenario['config']) => void;
    currentScenario?: string;
}

export default function TrafficScenarios({ onSelectScenario }: Props) {
    const sound = useSound();

    const handleSelect = (scenario: Scenario) => {
        sound.playClick();
        onSelectScenario(scenario.config);
    };

    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm text-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-700">Preset Traffic Scenarios</h3>
            <div className="space-y-2">
                {scenarios.map((scenario) => (
                    <button
                        key={scenario.id}
                        onClick={() => handleSelect(scenario)}
                        className="w-full text-left p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <span>{scenario.emoji}</span>
                            <span className="font-bold text-xs text-slate-900">{scenario.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{scenario.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
}
