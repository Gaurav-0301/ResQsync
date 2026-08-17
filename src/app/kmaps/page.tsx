'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, MessageSquare, Radio, Filter as FilterIcon } from 'lucide-react';
import MapView from './components/MapView';
import FilterPanel from './components/FilterPanel';
import ChatInterface from './components/ChatInterface';
import IncidentFeed from './components/IncidentFeed';
import IntelligencePanel from './components/IntelligencePanel';
import { useIncidentData, Incident } from './hooks/useIncidentData';

export default function KMapsPage() {
    const { incidents, allIncidents, filters, setFilters } = useIncidentData();
    const [focusedLocation, setFocusedLocation] = useState<[number, number] | null>(null);
    const [routeRequest, setRouteRequest] = useState<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [mobileTab, setMobileTab] = useState<'map' | 'chat' | 'feed'>('map');
    const [showMobileFilter, setShowMobileFilter] = useState(false);

    // Initial Loading Sequence
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    const handleIncidentClick = (incident: Incident) => {
        setFocusedLocation(incident.location);
        // Switch to map view on mobile when an incident is clicked
        setMobileTab('map');
    };

    const handleRouteUpdate = (routeData: any) => {
        console.log("📍 Route Update Received in Page:", routeData);
        setRouteRequest(routeData);
        setMobileTab('map');
    };

    return (
        <main className="h-screen w-full bg-[#f8fafc] overflow-hidden relative font-sans text-slate-900">

            {/* 1. Loading Overlay */}
            <AnimatePresence>
                {!isLoaded && (
                    <motion.div
                        className="absolute inset-0 z-50 flex items-center justify-center bg-[#f8fafc]"
                        exit={{ opacity: 0, transition: { duration: 0.8 } }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="text-center"
                        >
                            <div className="w-12 h-12 border-t-2 border-slate-800 rounded-full animate-spin mx-auto mb-4" />
                            <h1 className="text-xl font-bold tracking-widest uppercase text-slate-900">
                                Initializing Nagpur City Intelligence
                            </h1>
                            <p className="text-xs text-slate-500 mt-2 font-mono">
                                Connecting to sensor network...
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. Main Content */}
            <motion.div
                className="w-full h-full relative flex flex-col"
                initial={{ opacity: 0 }}
                animate={{ opacity: isLoaded ? 1 : 0 }}
                transition={{ duration: 0.8 }}
            >
                {/* Background Map — Always visible */}
                <div className="absolute inset-0 z-0">
                    <MapView
                        incidents={incidents}
                        focusedLocation={focusedLocation}
                        routeRequest={routeRequest}
                    />
                </div>

                {/* Header & Controls Overlay */}
                <div className="relative z-10 pointer-events-none p-3 pt-20 md:p-6 md:pt-24 flex flex-col justify-between h-full">

                    {/* Top Bar: Status + Mobile View Toggle */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
                        <div className="bg-white/95 backdrop-blur border border-slate-200 px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-sm text-slate-900">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-bold tracking-wider">LIVE MONITORING</span>
                        </div>

                        {/* Mobile View Toggle (Visible only on mobile screens) */}
                        <div className="flex md:hidden bg-white/95 backdrop-blur border border-slate-200 p-1 rounded-full shadow-sm text-xs font-bold gap-1">
                            <button
                                onClick={() => setMobileTab('map')}
                                className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${mobileTab === 'map' ? 'bg-slate-900 text-white' : 'text-slate-700'}`}
                            >
                                <Map className="w-3.5 h-3.5" /> Map
                            </button>
                            <button
                                onClick={() => setMobileTab('chat')}
                                className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${mobileTab === 'chat' ? 'bg-slate-900 text-white' : 'text-slate-700'}`}
                            >
                                <MessageSquare className="w-3.5 h-3.5" /> AI Chat
                            </button>
                            <button
                                onClick={() => setMobileTab('feed')}
                                className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${mobileTab === 'feed' ? 'bg-slate-900 text-white' : 'text-slate-700'}`}
                            >
                                <Radio className="w-3.5 h-3.5" /> Feed
                            </button>
                        </div>
                    </div>

                    {/* Desktop Layout (md:flex) */}
                    <div className="hidden md:flex flex-row gap-6 h-full mt-4 overflow-hidden pointer-events-none">
                        {/* LEFT: Filters & AI Chat */}
                        <div className="w-80 shrink-0 pointer-events-auto flex flex-col gap-4 max-h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar">
                            <FilterPanel filters={filters} setFilters={setFilters} />
                            <div className="h-96 rounded-2xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                                <ChatInterface
                                    onRouteUpdate={handleRouteUpdate}
                                    filters={filters}
                                />
                            </div>
                        </div>

                        <div className="flex-1" />

                        {/* RIGHT: Intelligence Panel & Incident Feed */}
                        <div className="w-96 shrink-0 pointer-events-auto flex flex-col gap-4 max-h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar">
                            <IntelligencePanel incidents={allIncidents} />
                            <IncidentFeed incidents={incidents} onIncidentClick={handleIncidentClick} />
                        </div>
                    </div>

                    {/* Mobile View Layout (md:hidden) */}
                    <div className="md:hidden flex-1 relative pointer-events-none mt-2">
                        {mobileTab === 'map' && (
                            <div className="absolute top-2 left-2 pointer-events-auto">
                                <button
                                    onClick={() => setShowMobileFilter(!showMobileFilter)}
                                    className="bg-white/95 backdrop-blur border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm text-xs font-bold flex items-center gap-1.5 text-slate-800"
                                >
                                    <FilterIcon className="w-3.5 h-3.5" /> Filter Map
                                </button>
                                {showMobileFilter && (
                                    <div className="mt-2 w-72 max-h-[50vh] overflow-y-auto shadow-lg rounded-2xl">
                                        <FilterPanel filters={filters} setFilters={setFilters} />
                                    </div>
                                )}
                            </div>
                        )}

                        {mobileTab === 'chat' && (
                            <div className="w-full h-full pointer-events-auto pt-2 pb-14">
                                <div className="h-full rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-white">
                                    <ChatInterface
                                        onRouteUpdate={handleRouteUpdate}
                                        filters={filters}
                                    />
                                </div>
                            </div>
                        )}

                        {mobileTab === 'feed' && (
                            <div className="w-full h-full pointer-events-auto pt-2 pb-14 overflow-y-auto space-y-4">
                                <FilterPanel filters={filters} setFilters={setFilters} />
                                <IncidentFeed incidents={incidents} onIncidentClick={handleIncidentClick} />
                            </div>
                        )}
                    </div>

                    {/* Footer Notice */}
                    <div className="mt-2 text-center pointer-events-auto hidden md:block">
                        <p className="text-[10px] text-slate-500 tracking-wide uppercase font-semibold">
                            All visualizations generated from live ML detections in Nagpur. No synthetic data displayed.
                        </p>
                    </div>

                </div>
            </motion.div>
        </main>
    );
}
