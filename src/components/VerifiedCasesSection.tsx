'use client';

import { useState, useEffect } from 'react';
import { MapPin, ExternalLink, ShieldAlert, AlertCircle, CheckCircle2, Building2 } from 'lucide-react';
import { VerifiedCase, CongestionPoint, VerifiedCasesCache } from '@/lib/incidentCasesService';

export default function VerifiedCasesSection() {
  const [data, setData] = useState<VerifiedCasesCache | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/verified-cases')
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Could not fetch verified cases:', err);
        setLoading(false);
      });
  }, []);

  const cases = data?.cases || [];
  const congestionPoints = data?.congestionPoints || [];

  return (
    <section className="py-16 px-6 md:px-16 border-t border-slate-200 bg-white">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-red-600" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-600">
            Field Analysis & Verified Ground Truth
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
          Emergency Transit Obstructions & Infrastructure Risk Points
        </h2>
        <p className="text-slate-600 text-base mb-10 max-w-3xl">
          Verified evidence from traffic studies, municipality data, and press coverage. Every claim presented is tied to a live, fetchable source link.
        </p>

        {/* SECTION A: INDIVIDUALLY DOCUMENTED CASUALTY CASES */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide text-xs">
              Documented Casualty Case Studies (Traffic & Signal Delay Fatalities)
            </h3>
          </div>

          {cases.length === 0 ? (
            <div className="border border-amber-200 bg-amber-50/70 p-6 rounded-xl text-slate-800 text-sm leading-relaxed flex items-start gap-3 shadow-sm">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-amber-900 block mb-1">
                  Zero Individually Documented Casualty Cases Found (2023–2026)
                </strong>
                <p className="text-slate-700 text-xs leading-relaxed">
                  No individually documented casualty cases found for this period — this itself reflects how rarely emergency transit delay deaths are specifically attributed or isolated in press coverage.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cases.map((c) => (
                <div key={c.id} className="border border-red-200 bg-red-50/30 p-6 rounded-xl flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-red-100 text-red-800 rounded border border-red-200 uppercase">
                        {c.location}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">{c.date}</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mb-2 leading-snug">{c.headline}</h4>
                    <div className="text-xs text-slate-600 font-medium mb-4">
                      Source: <span className="font-semibold text-slate-800">{c.source}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-red-100 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> URL Verified Live
                    </span>
                    <a
                      href={c.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:text-red-900 hover:underline transition-colors"
                    >
                      View Source Document <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION B: VERIFIED CONGESTION RISK POINTS (INFRASTRUCTURE RISK DATA) */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-slate-700" />
            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide text-xs">
              Verified Congestion Risk Points (Infrastructure Bottleneck Data)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {congestionPoints.map((cp) => (
              <div key={cp.id} className="border border-slate-200 bg-slate-50 p-6 rounded-xl flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-slate-200 text-slate-800 rounded border border-slate-300 uppercase">
                      CONGESTION RISK POINT
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">Nagpur Infrastructure</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-2">{cp.junctionName}</h4>
                  <p className="text-sm text-slate-600 mb-3 leading-relaxed">{cp.details}</p>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-700 mb-4">
                    <strong>Corridors Affected:</strong> {cp.connectingRoads}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Report: <span className="font-semibold text-slate-700">{cp.source}</span>
                  </span>
                  <a
                    href={cp.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 hover:text-red-600 hover:underline transition-colors"
                  >
                    Source URL <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
