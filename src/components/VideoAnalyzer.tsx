'use client';

import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as tmImage from '@teachablemachine/image';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { Upload, Play, Pause, AlertTriangle, CheckCircle, X, Activity, ShieldCheck, Sliders, Bell, BellOff, Clock } from 'lucide-react';
import { useDetection } from '@/context/DetectionContext';
import { motion, AnimatePresence } from 'framer-motion';

interface PerformanceMetrics {
    fps: number;
    latency: number;
    totalFrames: number;
    modelLoadTime: number;
}

interface Incident {
    id: string;
    type: string;
    confidence: number;
    timestamp: number;
    location: string;
    message?: string;
    triggeredBy?: 'auto' | 'manual';
}

export default function VideoAnalyzer() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);
    const lastFrameTime = useRef<number>(0);
    const frameCount = useRef<number>(0);

    const [model, setModel] = useState<tmImage.CustomMobileNet | null>(null);
    const [objectDetectionModel, setObjectDetectionModel] = useState<cocoSsd.ObjectDetection | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [predictions, setPredictions] = useState<{ className: string; probability: number }[]>([]);
    const [detectedObjects, setDetectedObjects] = useState<cocoSsd.DetectedObject[]>([]);
    const [isModelLoading, setIsModelLoading] = useState(true);
    const [modelError, setModelError] = useState<string | null>(null);
    
    // Alert Dispatch Toggle: Send Alert ON / OFF
    const [sendAlertsEnabled, setSendAlertsEnabled] = useState<boolean>(true); // Default ON
    const [requireVehicleFilter, setRequireVehicleFilter] = useState<boolean>(true); // Require vehicle detection for ambulance
    const [minConfidence, setMinConfidence] = useState<number>(0.85); // Default 85% confidence threshold
    const [filterWarning, setFilterWarning] = useState<string | null>(null);

    // Alert state
    const [activeAlert, setActiveAlert] = useState<{ type: string; confidence: number; message: string; isManual?: boolean } | null>(null);
    const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [emailStatusMsg, setEmailStatusMsg] = useState<string>('');
    
    const lastNotificationTime = useRef<number>(0); // Cooldown between UI alerts
    const lastEmailSentTime = useRef<number>(0); // 5-minute email cooldown per type
    const EMAIL_COOLDOWN = 300000; // 5 minutes in ms
    const [incidentLogs, setIncidentLogs] = useState<Incident[]>([]);
    const [metrics, setMetrics] = useState<PerformanceMetrics>({
        fps: 0,
        latency: 0,
        totalFrames: 0,
        modelLoadTime: 0
    });

    const { setHighConfidence, setCurrentDetection, setConfidenceLevel } = useDetection();

    // Load initial session state from LocalStorage
    useEffect(() => {
        try {
            const savedSession = localStorage.getItem('resqsync_demo_session');
            if (savedSession) {
                const parsed = JSON.parse(savedSession);
                if (Array.isArray(parsed.incidentLogs)) {
                    setIncidentLogs(parsed.incidentLogs);
                }
            }
        } catch (e) {
            console.warn('Could not restore demo session from localStorage:', e);
        }
    }, []);

    // Save incident logs to LocalStorage
    useEffect(() => {
        try {
            localStorage.setItem('resqsync_demo_session', JSON.stringify({
                incidentLogs,
                lastUpdated: Date.now()
            }));
        } catch (e) {
            console.warn('Could not save demo session to localStorage:', e);
        }
    }, [incidentLogs]);

    const sendEmailAlert = async (type: string, confidence: number, force: boolean = false) => {
        const timeSinceLastEmail = Date.now() - lastEmailSentTime.current;
        if (!force && timeSinceLastEmail < EMAIL_COOLDOWN) {
            console.log(`📧 Email skipped: ${Math.ceil((EMAIL_COOLDOWN - timeSinceLastEmail) / 1000)}s cooldown remaining`);
            return;
        }

        setEmailStatus('sending');
        const locationStr = 'Medical Square Corridor, Nagpur';
        try {
            const response = await fetch('/api/send-alert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: type,
                    confidence: confidence,
                    location: locationStr,
                    force: force
                })
            });

            const data = await response.json();

            if (response.ok) {
                setEmailStatus('success');
                setEmailStatusMsg(`Alert sent to harshvardhanpadul73@gmail.com for ${type}`);
                lastEmailSentTime.current = Date.now();
                console.log('📧 Alert email sent successfully:', data);
            } else {
                setEmailStatus('error');
                setEmailStatusMsg('Failed to send email alert');
            }
        } catch (error) {
            try {
                await fetch('http://localhost:8000/api/send-alert', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: type,
                        confidence: confidence,
                        location: locationStr,
                        force: force
                    })
                });
                setEmailStatus('success');
                setEmailStatusMsg(`Alert sent to harshvardhanpadul73@gmail.com for ${type}`);
            } catch (fallbackErr) {
                setEmailStatus('error');
                setEmailStatusMsg('Alert recorded locally');
            }
        }
    };

    // Load both models
    useEffect(() => {
        const loadModels = async () => {
            const startTime = performance.now();
            try {
                const modelURL = '/my_model/model.json';
                const metadataURL = '/my_model/metadata.json';
                const loadedModel = await tmImage.load(modelURL, metadataURL);
                setModel(loadedModel);

                const cocoModel = await cocoSsd.load();
                setObjectDetectionModel(cocoModel);

                const loadTime = performance.now() - startTime;
                setMetrics(prev => ({ ...prev, modelLoadTime: loadTime }));
                setIsModelLoading(false);

                if (videoSrc && videoRef.current) {
                    setTimeout(() => {
                        if (videoRef.current && !videoRef.current.paused) {
                            setIsPlaying(true);
                        }
                    }, 500);
                }
            } catch (error) {
                console.error("Failed to load models:", error);
                setModelError("Failed to load ML models. Please check console for details.");
                setIsModelLoading(false);
            }
        };

        loadModels();
    }, [videoSrc]);

    const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setVideoSrc(url);
            setIsPlaying(true);

            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.play().catch(err => console.log('Autoplay prevented:', err));
                }
            }, 100);
        }
    };

    const drawBoundingBoxes = (objects: cocoSsd.DetectedObject[]) => {
        const canvas = canvasRef.current;
        const video = videoRef.current;

        if (!canvas || !video) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        objects.forEach((obj) => {
            const [x, y, width, height] = obj.bbox;

            let color = '#00ff00';
            if (obj.class === 'person') color = '#ff00ff';
            else if (obj.class === 'car' || obj.class === 'truck' || obj.class === 'bus') color = '#00ffff';

            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);

            ctx.fillStyle = color;
            const label = `${obj.class} ${Math.round(obj.score * 100)}%`;
            const textWidth = ctx.measureText(label).width;
            ctx.fillRect(x, y - 25, textWidth + 10, 25);

            ctx.fillStyle = '#000000';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(label, x + 5, y - 7);
        });
    };

    const predict = async () => {
        if (model && objectDetectionModel && videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
            const predictionStartTime = performance.now();

            const [tmPrediction, cocoDetections] = await Promise.all([
                model.predict(videoRef.current),
                objectDetectionModel.detect(videoRef.current)
            ]);

            const predictionEndTime = performance.now();
            const latency = predictionEndTime - predictionStartTime;

            setPredictions(tmPrediction);
            setDetectedObjects(cocoDetections);

            drawBoundingBoxes(cocoDetections);

            frameCount.current++;
            const currentTime = performance.now();
            if (currentTime - lastFrameTime.current >= 1000) {
                const fps = frameCount.current;
                setMetrics(prev => ({
                    ...prev,
                    fps,
                    latency,
                    totalFrames: prev.totalFrames + frameCount.current
                }));
                frameCount.current = 0;
                lastFrameTime.current = currentTime;
            }

            // Find top class prediction
            const topPrediction = tmPrediction.reduce((prev, current) =>
                (prev.probability > current.probability) ? prev : current
            );

            const classNameLower = topPrediction.className.toLowerCase();
            let detectedType: string | null = null;

            // Check if COCO-SSD detected any vehicle in the frame
            const hasVehicle = cocoDetections.some(obj => ['car', 'truck', 'bus'].includes(obj.class));

            if (classNameLower.includes('ambulance') && topPrediction.probability >= minConfidence) {
                if (requireVehicleFilter && !hasVehicle) {
                    // Mute false positive when no physical vehicle is in the frame (e.g. food stall, poster, person)
                    setFilterWarning('🛡️ False Ambulance alert muted (No vehicle detected in frame)');
                    setTimeout(() => setFilterWarning(null), 3000);
                } else {
                    detectedType = 'Ambulance';
                }
            } else if (classNameLower.includes('pothole') && topPrediction.probability >= minConfidence) {
                detectedType = 'Pothole';
            } else if (classNameLower.includes('accident') && topPrediction.probability >= minConfidence) {
                detectedType = 'Accident';
            }

            if (detectedType) {
                setHighConfidence(true);
                setCurrentDetection(detectedType);
                setConfidenceLevel(topPrediction.probability);

                // ONLY trigger automatic alert popup and email if sendAlertsEnabled is TRUE
                if (sendAlertsEnabled) {
                    const now = Date.now();
                    const timeSinceLastNotification = now - lastNotificationTime.current;
                    const ALERT_COOLDOWN = 5000;

                    const locationStr = 'Medical Square Corridor, Nagpur';
                    const exactMessage = `We have detected ${detectedType.toLowerCase()} at this location: ${locationStr}`;

                    if (!activeAlert && timeSinceLastNotification > ALERT_COOLDOWN) {
                        setActiveAlert({
                            type: detectedType,
                            confidence: topPrediction.probability,
                            message: exactMessage,
                            isManual: false
                        });
                        sendEmailAlert(detectedType, topPrediction.probability);
                        lastNotificationTime.current = now;

                        const newIncident: Incident = {
                            id: Math.random().toString(36).substring(2, 11),
                            type: detectedType,
                            confidence: topPrediction.probability,
                            timestamp: now,
                            location: locationStr,
                            message: exactMessage,
                            triggeredBy: 'auto'
                        };
                        setIncidentLogs(prev => [newIncident, ...prev].slice(0, 50));
                    }
                }
            } else {
                setHighConfidence(false);
                setCurrentDetection(topPrediction.className);
                setConfidenceLevel(topPrediction.probability);
            }

            const PROCESSING_INTERVAL = 50;
            setTimeout(() => {
                requestRef.current = requestAnimationFrame(predict);
            }, PROCESSING_INTERVAL);
        }
    };

    useEffect(() => {
        if (isPlaying && model && objectDetectionModel) {
            lastFrameTime.current = performance.now();
            requestRef.current = requestAnimationFrame(predict);
        } else if (requestRef.current !== null) {
            cancelAnimationFrame(requestRef.current);
        }
        return () => {
            if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, model, objectDetectionModel, sendAlertsEnabled, requireVehicleFilter, minConfidence]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const triggerManualTestAlert = (type: string) => {
        const locationStr = 'Medical Square Corridor, Nagpur';
        const msg = `[Manual Alert] We have detected ${type.toLowerCase()} at this location: ${locationStr}`;
        const confidence = 0.98;

        setActiveAlert({
            type,
            confidence,
            message: msg,
            isManual: true
        });

        sendEmailAlert(type, confidence, true);

        const newIncident: Incident = {
            id: Math.random().toString(36).substring(2, 11),
            type,
            confidence,
            timestamp: Date.now(),
            location: locationStr,
            message: msg,
            triggeredBy: 'manual'
        };
        setIncidentLogs(prev => [newIncident, ...prev].slice(0, 50));
    };

    return (
        <div className="rounded-2xl p-6 bg-slate-50 border border-slate-200 shadow-sm text-slate-900">
            {/* Top Control Bar: Single Alert Sending Toggle Button */}
            <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    
                    {/* Left: Main Toggle Button for Sending Alert */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSendAlertsEnabled(!sendAlertsEnabled)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2.5 border ${
                                sendAlertsEnabled
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300'
                            }`}
                        >
                            {sendAlertsEnabled ? (
                                <>
                                    <Bell className="w-4 h-4 animate-bounce text-white" />
                                    <span>Send Alert: ENABLED</span>
                                </>
                            ) : (
                                <>
                                    <BellOff className="w-4 h-4 text-slate-500" />
                                    <span>Send Alert: DISABLED</span>
                                </>
                            )}
                        </button>

                        <div className="text-xs">
                            <span className="font-bold block text-slate-800">Automatic Alert Sending</span>
                            <span className="text-[11px] text-slate-500">
                                {sendAlertsEnabled ? 'Auto email & popup alerts active' : 'Alerts muted (Telemetry only)'}
                            </span>
                        </div>
                    </div>

                    {/* Right Side Controls: Vehicle Filter & Confidence Threshold */}
                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                        {/* Vehicle Verification Filter */}
                        <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 transition-colors">
                            <input
                                type="checkbox"
                                checked={requireVehicleFilter}
                                onChange={(e) => setRequireVehicleFilter(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                            />
                            <div className="text-xs">
                                <span className="font-bold text-slate-800 flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Vehicle Filter
                                </span>
                                <span className="text-[10px] text-slate-500 block">Ignore poster/stall noise</span>
                            </div>
                        </label>

                        {/* Confidence Threshold Slider */}
                        <div className="w-36">
                            <div className="flex justify-between text-xs font-bold mb-1 text-slate-700">
                                <span className="flex items-center gap-1">
                                    <Sliders className="w-3.5 h-3.5 text-slate-600" /> Threshold
                                </span>
                                <span className="font-mono text-blue-600">{(minConfidence * 100).toFixed(0)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0.60"
                                max="0.95"
                                step="0.05"
                                value={minConfidence}
                                onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>
                    </div>
                </div>

                {/* Status Notice Banner */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">
                        Current Status:{' '}
                        {sendAlertsEnabled ? (
                            <strong className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                🔔 Alert Dispatch ON — System automatically sends alerts when incident detected (&gt;= {(minConfidence * 100).toFixed(0)}%)
                            </strong>
                        ) : (
                            <strong className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                🔕 Alert Dispatch OFF — AI runs on screen, but automatic alerts/emails are muted
                            </strong>
                        )}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Video Player Overlay - Left Side (2 columns) */}
                <div className="lg:col-span-2">
                    <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center shadow-sm">
                        {videoSrc ? (
                            <>
                                <video
                                    ref={videoRef}
                                    src={videoSrc}
                                    className="w-full h-full object-contain"
                                    loop
                                    muted
                                    playsInline
                                    autoPlay
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                />
                                <canvas
                                    ref={canvasRef}
                                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                                />
                            </>
                        ) : (
                            <div className="text-center p-8 text-white">
                                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Upload className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Upload Demo Video</h3>
                                <p className="text-slate-300 mb-6 text-sm">Upload a traffic video to analyze with ML models</p>
                                <label className="bg-slate-100 hover:bg-white text-slate-900 font-bold py-2 px-6 rounded-lg cursor-pointer transition-colors text-sm">
                                    Select Video
                                    <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                                </label>
                            </div>
                        )}

                        {/* False positive filter notification overlay */}
                        {filterWarning && (
                            <div className="absolute top-4 left-4 right-4 bg-slate-900/90 text-amber-300 px-3 py-2 rounded-lg text-xs font-semibold backdrop-blur-sm border border-amber-500/30 shadow-lg animate-pulse">
                                {filterWarning}
                            </div>
                        )}

                        {/* Overlay Controls */}
                        {videoSrc && (
                            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                <button
                                    onClick={togglePlay}
                                    className="bg-slate-900/80 hover:bg-slate-900 text-white p-3 rounded-full backdrop-blur-sm transition-colors"
                                >
                                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                </button>
                                <label className="bg-slate-900/80 hover:bg-slate-900 text-white px-4 py-2 rounded-lg backdrop-blur-sm cursor-pointer text-xs font-semibold transition-colors">
                                    Change Video
                                    <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                {/* Analysis Panel - Right Side (1 column) */}
                <div className="space-y-6">
                    {/* Performance Metrics */}
                    <div className="rounded-xl p-4 bg-white border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 text-slate-700">
                            <Activity className="w-4 h-4 text-slate-800" />
                            Performance Telemetry
                        </h3>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Inference Rate (FPS):</span>
                                <span className="font-mono font-bold text-slate-900">{metrics.fps}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Latency:</span>
                                <span className="font-mono font-bold text-slate-900">{metrics.latency.toFixed(1)}ms</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Processed Frames:</span>
                                <span className="font-mono font-bold text-slate-900">{metrics.totalFrames}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Model Init Time:</span>
                                <span className="font-mono font-bold text-slate-900">{(metrics.modelLoadTime / 1000).toFixed(2)}s</span>
                            </div>
                        </div>
                    </div>

                    {/* Classification Results */}
                    <div className="rounded-xl p-4 bg-white border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Live AI Classification</h3>
                            {isModelLoading ? (
                                <span className="text-amber-600 text-xs font-semibold animate-pulse">Loading Model...</span>
                            ) : modelError ? (
                                <span className="text-red-600 text-xs flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Error
                                </span>
                            ) : (
                                <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                                    <CheckCircle className="w-3.5 h-3.5" /> Active
                                </span>
                            )}
                        </div>

                        {/* Progress Bars */}
                        <div className="space-y-3">
                            {predictions.length > 0 ? (
                                predictions.map((pred, idx) => {
                                    const clsLower = pred.className.toLowerCase();
                                    const isCritical = clsLower.includes('accident') || clsLower.includes('ambulance') || clsLower.includes('pothole');
                                    const isHighConf = pred.probability >= minConfidence;

                                    const isAmbulanceNoVehicle = clsLower.includes('ambulance') && requireVehicleFilter && !detectedObjects.some(obj => ['car', 'truck', 'bus'].includes(obj.class));

                                    return (
                                        <div key={idx}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="capitalize font-medium text-slate-800 flex items-center gap-1.5">
                                                    {pred.className}
                                                    {isAmbulanceNoVehicle && pred.probability > 0.5 && (
                                                        <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                                                            Filtered (No Vehicle)
                                                        </span>
                                                    )}
                                                </span>
                                                <span className={`font-mono font-bold ${isCritical && isHighConf && !isAmbulanceNoVehicle ? 'text-red-600' : 'text-slate-700'}`}>
                                                    {(pred.probability * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-300 ${isCritical && isHighConf
                                                        ? 'bg-red-600'
                                                        : pred.probability > 0.6
                                                            ? 'bg-emerald-600'
                                                            : 'bg-amber-500'
                                                        }`}
                                                    style={{ width: `${pred.probability * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-slate-500 text-xs text-center py-3">
                                    {videoSrc ? (isPlaying ? "Analyzing video stream..." : "Play video to begin inference") : "Upload video"}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* DYNAMIC INCIDENT ALERT MODAL */}
                    <AnimatePresence>
                        {activeAlert && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className={`rounded-xl border p-4 ${
                                    activeAlert.type === 'Ambulance' ? 'bg-blue-50 border-blue-200 text-blue-900' :
                                    activeAlert.type === 'Pothole' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                                    'bg-red-50 border-red-200 text-red-900'
                                }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2.5 h-2.5 rounded-full animate-ping ${
                                                activeAlert.type === 'Ambulance' ? 'bg-blue-600' :
                                                activeAlert.type === 'Pothole' ? 'bg-amber-600' :
                                                'bg-red-600'
                                            }`} />
                                            <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                                                {activeAlert.type} Detected
                                                {activeAlert.isManual && (
                                                    <span className="bg-amber-200 text-amber-900 text-[9px] px-1.5 py-0.5 rounded font-mono">MANUAL</span>
                                                )}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setActiveAlert(null)}
                                            className="text-slate-400 hover:text-slate-700 p-1"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <p className="text-xs font-semibold mb-2">
                                        {activeAlert.message}
                                    </p>

                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="font-mono text-xl font-bold">
                                            {(activeAlert.confidence * 100).toFixed(1)}%
                                        </span>
                                        <span className="text-xs opacity-75">confidence level</span>
                                    </div>

                                    <div className="text-[11px] font-mono bg-white/70 p-2 rounded border border-slate-200 mb-3">
                                        📧 Alert dispatched to Controller Room:<br />
                                        <strong className="text-slate-900">harshvardhanpadul73@gmail.com</strong>
                                    </div>

                                    <button
                                        onClick={() => setActiveAlert(null)}
                                        className="w-full py-1.5 px-3 bg-white text-slate-800 rounded-lg text-xs font-semibold border border-slate-300 shadow-sm hover:bg-slate-50 transition-colors"
                                    >
                                        Acknowledge & Dismiss
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Manual Trigger Buttons for Testing */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Instant Test Dispatch</div>
                            <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded">Manual Trigger</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => triggerManualTestAlert('Ambulance')}
                                className="py-2 px-2 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                            >
                                🚑 Ambulance
                            </button>
                            <button
                                onClick={() => triggerManualTestAlert('Pothole')}
                                className="py-2 px-2 bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-amber-700 transition-colors flex items-center justify-center gap-1"
                            >
                                ⚠️ Pothole
                            </button>
                            <button
                                onClick={() => triggerManualTestAlert('Accident')}
                                className="py-2 px-2 bg-red-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
                            >
                                🚨 Accident
                            </button>
                        </div>
                    </div>

                    {/* Email Status Notice */}
                    {emailStatus !== 'idle' && (
                        <div className={`text-xs font-semibold px-3 py-2 rounded-lg text-center ${
                            emailStatus === 'sending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            emailStatus === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                            {emailStatus === 'sending' ? '⏳ Dispatching notification to controller...' : emailStatusMsg}
                        </div>
                    )}

                    {modelError && (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                            <p className="text-red-700 text-xs">{modelError}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* INCIDENT LOGS SECTION */}
            <div className="mt-8">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-800" />
                        <h3 className="text-lg font-bold text-slate-900">Incident Activity Stream</h3>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">Session logs stored in LocalStorage</span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                        {incidentLogs.length > 0 ? (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">Timestamp</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">Trigger</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">Type</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">Confidence</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">Alert Message</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {incidentLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-xs font-mono text-slate-600">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </td>
                                            <td className="px-4 py-3 text-xs font-bold">
                                                <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-mono font-bold ${
                                                    log.triggeredBy === 'manual' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {log.triggeredBy || 'auto'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs font-bold">
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                                    log.type === 'Ambulance' ? 'bg-blue-100 text-blue-800' :
                                                    log.type === 'Pothole' ? 'bg-amber-100 text-amber-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {log.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs font-bold text-slate-900">
                                                {(log.confidence * 100).toFixed(1)}%
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-700">
                                                {log.message || `We have detected ${log.type.toLowerCase()} at this location: ${log.location}`}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-8 text-center text-slate-500">
                                <p className="text-xs font-medium">No critical incidents detected in current stream</p>
                                <p className="text-[11px] text-slate-400 mt-1">Live telemetry logs appear automatically when flagged</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
