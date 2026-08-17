'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Clock, Zap, Navigation, Shield, Heart } from 'lucide-react';

interface StorySection {
    title: string;
    content: string;
    icon: React.ReactNode;
}

const storySections: StorySection[] = [
    {
        title: "The Crisis: Emergency Delays in India & Nagpur",
        content: "Every single day in India, emergency vehicles fight severe urban congestion. Critical patients—such as those traversing Nagpur's Medical Square or the congested Ajni Railway corridor—face devastating delays due to uncoordinated 30-second traffic signals. ResQsync was engineered to directly eliminate this life-critical gap by converting existing traffic cameras into real-time emergency intelligence nodes.",
        icon: <Clock className="w-8 h-8 text-slate-800" />,
    },
    {
        title: "Edge Intelligence at Every Intersection",
        content: "With ResQsync, every major intersection becomes a life-saving node. Our edge AI identifies traffic build-ups, lane blockages, and collisions in under half a second without depending on cloud availability. Immediate alerts empower first responders without unnecessary lag.",
        icon: <Zap className="w-8 h-8 text-slate-800" />,
    },
    {
        title: "Automated Emergency Corridors",
        content: "Ambulances require clear passage, not manual signal clearing. When ResQsync detects an approaching emergency vehicle, nearby intersections automatically synchronize to form a dynamic green corridor. Signals turn green 500 meters ahead, ensuring unobstructed transit during the golden hour.",
        icon: <Navigation className="w-8 h-8 text-slate-800" />,
    },
    {
        title: "Resilient Hybrid Architecture",
        content: "Our edge-cloud architecture provides full operational reliability. The local edge node handles instant signal override and crash detection in <500ms. The cloud manages city-wide traffic coordination. Even during complete network outages, each intersection maintains 90% operational efficiency.",
        icon: <Shield className="w-8 h-8 text-slate-800" />,
    },
    {
        title: "Infrastructure That Acts Automatically",
        content: "ResQsync transforms passive traffic cameras into proactive infrastructure. By automatically flagging accidents, hazards, and unblocking emergency routes, the system ensures every second works toward saving lives.",
        icon: <Heart className="w-8 h-8 text-slate-800" />,
    }
];

function StoryCard({ section, index }: { section: StorySection; index: number }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.3 });
    const isEven = index % 2 === 0;

    return (
        <div
            ref={ref}
            className="mb-12"
        >
            <div className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-6 items-center`}>
                <div className="flex-shrink-0 w-20 h-20 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center">
                    {section.icon}
                </div>

                <div className="border border-slate-200 bg-white rounded-xl p-6 flex-1 shadow-sm">
                    <h3 className="text-xl font-bold mb-2 text-slate-900">
                        {section.title}
                    </h3>
                    <p className="text-slate-600 text-base leading-relaxed">
                        {section.content}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function ProjectKStory() {
    return (
        <div className="w-full max-w-5xl mx-auto py-12 px-6">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-3 text-slate-900">System Architecture & Capabilities</h2>
                <p className="text-slate-600 text-lg">
                    Real-time incident response and dynamic signal prioritization designed for critical urban corridors.
                </p>
            </div>

            {storySections.map((section, index) => (
                <StoryCard key={index} section={section} index={index} />
            ))}
        </div>
    );
}
