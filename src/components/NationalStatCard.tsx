'use client';

import { useState, useEffect } from 'react';
import AnimatedCounter from '@/components/AnimatedCounter';

interface NationalStatsData {
  annualFatalities: number;
  reportYear: number;
  sourceUrl: string;
  fetchedAt: string;
  dailyAverage: number;
}

const DEFAULT_DAILY_AVERAGE = 168491 / 365;

export default function NationalStatCard() {
  const [stats, setStats] = useState<NationalStatsData | null>(null);
  const [displayedCount, setDisplayedCount] = useState<number>(() => {
    const now = new Date();
    const secondsElapsed = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    return Math.round((DEFAULT_DAILY_AVERAGE * secondsElapsed) / 86400);
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/national-stats');
        if (!res.ok) throw new Error('Failed to fetch national stats');
        const data: NationalStatsData = await res.json();
        setStats(data);

        const now = new Date();
        const secondsElapsed = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        const count = Math.round((data.dailyAverage * secondsElapsed) / 86400);
        setDisplayedCount(count);
      } catch (err) {
        console.warn('Using default national stats fallback:', err);
      }
    };

    fetchStats();

    const interval = setInterval(() => {
      const dailyAvg = stats ? stats.dailyAverage : DEFAULT_DAILY_AVERAGE;
      const now = new Date();
      const secondsElapsed = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const count = Math.round((dailyAvg * secondsElapsed) / 86400);
      setDisplayedCount(count);
    }, 30000);

    return () => clearInterval(interval);
  }, [stats?.dailyAverage]);

  const dailyAvg = stats ? stats.dailyAverage : DEFAULT_DAILY_AVERAGE;
  const minutesPerCasualty = (1440 / dailyAvg).toFixed(1);
  const reportYear = stats?.reportYear || 2022;
  const sourceUrl = stats?.sourceUrl || 'https://morth.nic.in';

  return (
    <div className="border border-slate-200 bg-white rounded-xl p-6 mb-10 max-w-md w-full shadow-sm text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
        <span className="text-slate-600 text-xs font-semibold uppercase tracking-wider">
          Estimated Lives Lost Today (National)
        </span>
      </div>
      <div className="text-4xl font-extrabold text-slate-900 my-1">
        <AnimatedCounter end={displayedCount} duration={1.5} />
      </div>
      <div className="text-xs text-slate-500 font-medium">
        Average 1 road casualty every {minutesPerCasualty} minutes
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100">
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-slate-400 hover:text-slate-600 hover:underline transition-colors block font-medium"
        >
          Statistical daily average, MoRTH Road Accidents in India {reportYear}
        </a>
      </div>
    </div>
  );
}
