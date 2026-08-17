'use client';

export default function GlobalBackground() {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#f8fafc]">
            {/* Subtle subtle grid overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `
                        linear-gradient(#0f172a 1px, transparent 1px),
                        linear-gradient(90deg, #0f172a 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                }}
            />
        </div>
    );
}
