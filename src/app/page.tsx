'use client';

import AnimatedCounter from '@/components/AnimatedCounter';
import ProjectKStory from '@/components/ProjectKStory';
import Roadmap from '@/components/Roadmap';
import NationalStatCard from '@/components/NationalStatCard';
import VerifiedCasesSection from '@/components/VerifiedCasesSection';
import { AlertTriangle, Brain, Zap, Shield, Activity, ArrowRight, Clock, MapPin, Building2, CheckCircle2, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [cityCount, setCityCount] = useState(10);
  const [typedText, setTypedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [homeData, setHomeData] = useState<any>(null);
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

    // Fetch live Homepage data from MongoDB
    fetch('/api/homepage')
      .then(res => res.json())
      .then(data => {
        setHomeData(data);
      })
      .catch(err => console.warn('Could not fetch MongoDB homepage data:', err));

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
            <NationalStatCard />


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

        {/* VERIFIED GROUND TRUTH INCIDENT & CONGESTION SECTION */}
        <VerifiedCasesSection />


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
