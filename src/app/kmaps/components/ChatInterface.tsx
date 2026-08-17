import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, MapPin, Navigation, ToggleLeft, ToggleRight } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FilterState } from '../hooks/useIncidentData';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_AI_KEY || '');

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

interface ChatInterfaceProps {
    onRouteUpdate: (routeData: any) => void;
    filters?: FilterState;
}

export default function ChatInterface({ onRouteUpdate, filters }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Hello! I am your ResQsync Nagpur Traffic Assistant.',
            timestamp: Date.now()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // Track pending route context for confirmation/follow-up
    const [pendingRoute, setPendingRoute] = useState<any>(null);
    const [isManualMode, setIsManualMode] = useState(false);

    // Manual Mode State
    const [manualSource, setManualSource] = useState('');
    const [manualDest, setManualDest] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleManualSubmit = () => {
        if (!manualDest.trim()) return;

        const routeData = {
            type: 'route_request',
            source: manualSource || 'Sitabuldi, Nagpur',
            destination: manualDest,
            preferences: filters?.types ?
                Object.entries(filters.types)
                    .filter(([_, isActive]) => isActive)
                    .map(([type]) => type)
                : []
        };

        onRouteUpdate(routeData);
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: `ResQsync is calculating an emergency green corridor in Nagpur to ${manualDest}...`,
            timestamp: Date.now()
        }]);
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_KEY;
        if (!apiKey) {
            // Auto-switch to manual mode if API key is missing
            setIsManualMode(true);
            const errorMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: "⚠️ AI Offline. Switched to ResQsync Nagpur Manual Route Mode.",
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMessage]);
            return;
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            // Prepare context about active filters
            const activeFilters = filters?.types ?
                Object.entries(filters.types)
                    .filter(([_, isActive]) => isActive)
                    .map(([type]) => type)
                : [];

            let promptContext = "";
            if (pendingRoute) {
                promptContext = `
                    PREVIOUS CONTEXT: You suggested a route in Nagpur from ${pendingRoute.source} to ${pendingRoute.destination}.
                    Active hazards in Nagpur: ${activeFilters.join(', ')}.
                    User replied: "${input}".
                    
                    If CONFIRMED:
                    Return JSON:
                    {
                        "type": "route_request",
                        "source": "${pendingRoute.source}",
                        "destination": "${pendingRoute.destination}",
                        "preferences": ${JSON.stringify([...(pendingRoute.preferences || []), ...activeFilters])},
                        "response_text": "ResQsync green corridor active for Nagpur route avoiding ${activeFilters.join(', ')}..."
                    }
                    
                    If DECLINED:
                    Return JSON:
                    {
                        "type": "route_request",
                        "source": "${pendingRoute.source}",
                        "destination": "${pendingRoute.destination}",
                        "preferences": ["fastest"],
                        "response_text": "Showing standard fastest route across Nagpur."
                    }

                    If UNRELATED:
                    Treat as general query about ResQsync traffic intelligence in Nagpur.
                `;
            } else {
                promptContext = `
                    User Request: "${input}"
                    Active Map Filters (Nagpur): ${JSON.stringify(activeFilters)}
                    
                    If the user asks for a route in Nagpur (or general routing):
                    1. Extract source and destination in Nagpur (e.g. Sitabuldi, Medical Square GMCH, Wardha Road, Ajni, Central Avenue, Dharampeth).
                    2. If active hazard filters exist and user didn't explicitly say "avoid X":
                       Return JSON:
                       {
                           "type": "confirmation_request",
                           "source": "extracted source",
                           "destination": "extracted destination",
                           "preferences": [], 
                           "response_text": "I see active hazard alerts in Nagpur for ${activeFilters.join(', ')}. Would you like ResQsync to route around these bottlenecks?"
                       }
                    3. Otherwise return JSON for route_request.
                `;
            }

            const prompt = `
                You are ResQsync AI — India's premier Nagpur-centric emergency traffic intelligence and green corridor routing assistant.
                You have deep domain knowledge of Nagpur's road network, emergency hospital routes (GMCH Medical Square, Kingsway, Alexis), traffic bottlenecks (Ajni railway underpass, Wardha Road, Sitabuldi), and real-time signal override protocol.
                
                ${promptContext}
                
                Standard Output Format (JSON ONLY):
                {
                    "type": "route_request" | "confirmation_request" | "chat",
                    "source": "string",
                    "destination": "string",
                    "preferences": ["string"],
                    "response_text": "string"
                }
            `;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            console.log("ResQsync AI Raw:", responseText);

            let parsed;
            try {
                const clean = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                parsed = JSON.parse(clean.substring(clean.indexOf('{'), clean.lastIndexOf('}') + 1));
            } catch (e) {
                parsed = { type: 'chat', response_text: responseText };
            }

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: parsed.response_text,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, aiMessage]);

            if (parsed.type === 'confirmation_request') {
                setPendingRoute({
                    source: parsed.source,
                    destination: parsed.destination,
                    preferences: []
                });
            } else if (parsed.type === 'route_request') {
                onRouteUpdate(parsed);
                setPendingRoute(null);
            } else {
                setPendingRoute(null);
            }

        } catch (error: any) {
            console.error("ResQsync AI Error:", error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "Switched to ResQsync Nagpur Manual Mode due to API connectivity.",
                timestamp: Date.now()
            }]);
            setIsManualMode(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white shadow-lg relative text-slate-900 border border-slate-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold shadow-sm">
                        {isManualMode ? <MapPin className="w-5 h-5 text-red-500" /> : <Bot className="w-5 h-5 text-emerald-400" />}
                    </div>
                    <div>
                        <h2 className="font-extrabold text-base text-slate-900 tracking-tight">
                            ResQsync <span className="text-red-600 font-bold">Nagpur AI</span>
                        </h2>
                        <p className="text-xs text-slate-500 font-semibold">
                            {isManualMode ? 'Nagpur Route Finder' : 'Emergency Corridor Assistant'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsManualMode(!isManualMode)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 transition-all flex items-center gap-2 text-xs font-semibold text-slate-700 shadow-sm"
                >
                    {isManualMode ? <ToggleRight className="w-4 h-4 text-red-600" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                    <span>{isManualMode ? 'Manual' : 'AI Mode'}</span>
                </button>
            </div>

            {/* Content Area */}
            {isManualMode ? (
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs text-slate-600 uppercase tracking-wider font-bold">Source (Nagpur)</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={manualSource}
                                    onChange={(e) => setManualSource(e.target.value)}
                                    placeholder="Source (e.g. Sitabuldi, Nagpur)"
                                    className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:border-slate-800 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-center">
                            <div className="h-4 w-0.5 bg-slate-300" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-slate-600 uppercase tracking-wider font-bold">Destination (Nagpur)</label>
                            <div className="relative">
                                <Navigation className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={manualDest}
                                    onChange={(e) => setManualDest(e.target.value)}
                                    placeholder="Destination (e.g. Medical Square GMCH, Nagpur)"
                                    className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:border-slate-800 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleManualSubmit}
                        disabled={!manualDest}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Calculate ResQsync Corridor
                    </button>

                    <div className="text-center">
                        <p className="text-[11px] text-slate-500 font-medium">
                            Applies ResQsync Nagpur green corridor priority to selected route.
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] p-3.5 rounded-xl shadow-sm ${msg.role === 'user'
                                        ? 'bg-slate-900 text-white rounded-tr-none'
                                        : 'bg-slate-50 border border-slate-200 text-slate-900 rounded-tl-none'
                                        }`}
                                >
                                    <p className="text-sm leading-relaxed font-medium">{msg.content}</p>
                                    <span className="text-[10px] opacity-60 mt-1 block font-mono">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl rounded-tl-none flex gap-1 shadow-sm">
                                    <span className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-slate-200 bg-slate-50">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask ResQsync Nagpur Traffic AI (e.g., Route to GMCH)..."
                                className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 transition-all shadow-sm"
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
