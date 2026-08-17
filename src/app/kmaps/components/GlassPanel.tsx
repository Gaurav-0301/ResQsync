import { ReactNode } from 'react';

interface GlassPanelProps {
    children: ReactNode;
    className?: string;
    title?: string;
    noPadding?: boolean;
}

export default function GlassPanel({ children, className = '', title, noPadding = false }: GlassPanelProps) {
    return (
        <div className={`glass-card rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 ${className}`}>
            {title && (
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50">
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{title}</h3>
                </div>
            )}
            <div className={noPadding ? '' : 'p-4'}>
                {children}
            </div>
        </div>
    );
}
