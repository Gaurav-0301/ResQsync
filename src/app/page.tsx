'use client';

import AnimatedCounter from '@/components/AnimatedCounter';
import ProjectKStory from '@/components/ProjectKStory';
import Roadmap from '@/components/Roadmap';
import { AlertTriangle, Brain, Zap, Shield, Activity, ArrowRight, Clock, MapPin, Building2, CheckCircle2, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [cityCount, setCityCount] = useState(10);
  const [typedText, setTypedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const fullTitle = 'ResQsync';

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < fullTitle.length) {
        setTypedText(fullTitle.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
        setIsTypingComplete(true);
      }
    }, 150);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen pt-20 relative bg-[#f8fafc] text-slate-900">
      <div>
        {/* HERO SECTION */}
        <section className="relative min-h-[90vh] flex items-center justify-center p-6 md:p-16 overflow-hidden">
          <div className="relative z-10 w-full max-w-5xl flex flex-col items-center text-center">

            {/* Title */}
            <div className="mb-6">
              <h1 className="text-5xl md:text-8xl font-black tracking-tight text-slate-900">
                {typedText.slice(0, 4)}<span className="text-red-600">{typedText.slice(4)}</span>
                {!isTypingComplete && (
                  <span
                    className="inline-block w-[3px] h-[0.8em] ml-1 align-baseline border-r-4 border-red-600"
                    style={{ animation: 'blink-caret 0.75s step-end infinite' }}
                  />
                )}
              </h1>
              <p className="text-sm md:text-base text-slate-600 mt-2 tracking-widest uppercase font-semibold">
                Hybrid Edge-Cloud Traffic Intelligence System
              </p>
            </div>



            {/* Live Statistics Card */}
            <div className="border border-slate-200 bg-white rounded-xl p-6 mb-10 max-w-md w-full shadow-sm text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                <span className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Estimated Lives Lost Today (National)</span>
              </div>
              <div className="text-4xl font-extrabold text-slate-900 my-1">
                <AnimatedCounter end={Math.floor((new Date().getHours() * 60 + new Date().getMinutes()) * 415 / 1440)} duration={2} />
              </div>
              <div className="text-xs text-slate-500 font-medium">Average 1 road casualty every 3.8 minutes</div>
            </div>

            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mb-10">
              <div className="border border-slate-200 bg-white p-5 rounded-xl text-left shadow-sm">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Response Time</div>
                <div className="text-2xl font-bold text-slate-900 mb-1">&lt; 2 Seconds</div>
                <div className="text-xs text-slate-600">Incident detection latency on edge nodes</div>
              </div>
              <div className="border border-slate-200 bg-white p-5 rounded-xl text-left shadow-sm">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Signal Automation</div>
                <div className="text-2xl font-bold text-slate-900 mb-1">500 Meters</div>
                <div className="text-xs text-slate-600">Pre-cleared green corridor radius</div>
              </div>
              <div className="border border-slate-200 bg-white p-5 rounded-xl text-left shadow-sm">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Network Failover</div>
                <div className="text-2xl font-bold text-slate-900 mb-1">90% Efficiency</div>
                <div className="text-xs text-slate-600">Maintained during total cloud outages</div>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/demo" className="px-6 py-3.5 rounded-lg bg-slate-900 text-white font-semibold text-sm flex items-center justify-center gap-2">
                Launch Live Detection Demo <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/dashboard" className="px-6 py-3.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold text-sm flex items-center justify-center gap-2">
                View Control Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* REAL NAGPUR INCIDENT DATA SECTION */}
        <section className="py-16 px-6 md:px-16 border-t border-slate-200 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-red-600" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-600">Field Analysis & Local Data</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              Case Analysis: Emergency Transit Obstructions in Nagpur
            </h2>
            <p className="text-slate-600 text-base mb-10 max-w-3xl">
              Documented incidents from Nagpur reveal that emergency response failure is rarely caused by hospital distance, but by traffic gridlocks at key arterial junctions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {/* Nagpur Incident Card 1 */}
              <div className="border border-slate-200 bg-slate-50 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold font-mono px-2.5 py-1 bg-red-100 text-red-800 rounded border border-red-200">
                    NAGPUR CENTRAL
                  </span>
                  <span className="text-xs text-slate-500 font-medium">GMCH Access Route</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Medical Square Junction Gridlock
                </h3>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  Medical Square connects six major arterial avenues directly adjacent to Government Medical College & Hospital (GMCH). Peak-hour congestion regularly traps emergency ambulances for up to 25–40 minutes across a 1.2 km stretch, causing critical delays for trauma patients during the golden hour.
                </p>
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-700 font-medium">
                  <strong>Documented Case:</strong> Critical medical emergencies navigating Medical Square experience an average speed drop to under 4 km/h due to uncoordinated 30-second fixed signal cycles.
                </div>
              </div>

              {/* Nagpur Incident Card 2 */}
              <div className="border border-slate-200 bg-slate-50 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold font-mono px-2.5 py-1 bg-red-100 text-red-800 rounded border border-red-200">
                    AJNI CORRIDOR
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Infrastructure Choking</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Ajni Underpass & Railway Diversion Delays
                </h3>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  During road work and underpass construction near Ajni Railway Station, sudden traffic diversions forced high-volume traffic into narrow bypasses. Emergency ambulances carrying acute care patients were trapped without physical room for preceding traffic to yield.
                </p>
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-700 font-medium">
                  <strong>Documented Fatalities:</strong> Reports in Nagpur highlight cases where patients passed away during transit or upon arrival due to delayed emergency response caused by severe traffic congestion.
                </div>
              </div>
            </div>

            {/* Detailed Data Table for Nagpur Corridors */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="p-4 bg-slate-100 border-b border-slate-200 font-bold text-sm text-slate-900">
                Critical Emergency Corridors — Nagpur Traffic Metrics
              </div>
              <div className="divide-y divide-slate-100">
                <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <div className="text-slate-500 font-semibold uppercase">Location</div>
                    <div className="font-bold text-slate-900 mt-1">Medical Square → GMCH</div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-semibold uppercase">Normal Transit Time</div>
                    <div className="font-bold text-slate-900 mt-1">3 Minutes (800m)</div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-semibold uppercase">Peak Congestion Time</div>
                    <div className="font-bold text-red-600 mt-1">22 - 35 Minutes</div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-semibold uppercase">ResQsync Green Corridor Target</div>
                    <div className="font-bold text-emerald-600 mt-1">1.5 Minutes</div>
                  </div>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs bg-slate-50/50">
                  <div>
                    <div className="text-slate-500 font-semibold uppercase">Location</div>
                    <div className="font-bold text-slate-900 mt-1">Wardha Road → Ajni Junction</div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-semibold uppercase">Normal Transit Time</div>
                    <div className="font-bold text-slate-900 mt-1">5 Minutes (2.4km)</div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-semibold uppercase">Peak Congestion Time</div>
                    <div className="font-bold text-red-600 mt-1">28 - 45 Minutes</div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-semibold uppercase">ResQsync Green Corridor Target</div>
                    <div className="font-bold text-emerald-600 mt-1">3.0 Minutes</div>
                  </div>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <div className="text-slate-500 font-semibold uppercase">Location</div>
                    <div className="font-bold text-slate-900 mt-1">Central Avenue → Itwari</div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-semibold uppercase">Normal Transit Time</div>
                    <div className="font-bold text-slate-900 mt-1">4 Minutes (1.5km)</div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-semibold uppercase">Peak Congestion Time</div>
                    <div className="font-bold text-red-600 mt-1">25 - 40 Minutes</div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-semibold uppercase">ResQsync Green Corridor Target</div>
                    <div className="font-bold text-emerald-600 mt-1">2.0 Minutes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SYSTEM ARCHITECTURE & CORE CAPABILITIES */}
        <section className="py-16 px-6 md:px-16 border-t border-slate-200">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
              System Capabilities & Engineering Architecture
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-slate-200 bg-white p-6 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-4">
                  <Zap className="w-5 h-5 text-slate-800" />
                </div>
                <h3 className="font-bold text-base text-slate-900 mb-2">Sub-Second Incident Detection</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Edge computer vision models running on local micro-nodes analyze video frames directly at the intersection, detecting crashes and lane obstructions in under 500ms.
                </p>
              </div>

              <div className="border border-slate-200 bg-white p-6 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-4">
                  <Activity className="w-5 h-5 text-slate-800" />
                </div>
                <h3 className="font-bold text-base text-slate-900 mb-2">Dynamic Green Corridors</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Automatically clears traffic signals 500 meters in advance along an approaching ambulance route, flushing queued vehicles before emergency arrival.
                </p>
              </div>

              <div className="border border-slate-200 bg-white p-6 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-4">
                  <Shield className="w-5 h-5 text-slate-800" />
                </div>
                <h3 className="font-bold text-base text-slate-900 mb-2">Autonomous Edge Resilience</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Intersections maintain local signal optimization even if internet connectivity drops, ensuring system availability under all emergency conditions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SYSTEM STORY */}
        <ProjectKStory />

        {/* IMPLEMENTATION ROADMAP */}
        <Roadmap />

      </div>
    </main>
  );
}
