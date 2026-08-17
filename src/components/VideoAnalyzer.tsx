'use client';

import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as tmImage from '@teachablemachine/image';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { Upload, Play, Pause, AlertTriangle, CheckCircle, X, Activity, Zap, Clock } from 'lucide-react';
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
    const [videoSrc, setVideoSrc] = useState<string | null>('/demo_video.mp4');
    const [predictions, setPredictions] = useState<{ className: string; probability: number }[]>([]);
    const [detectedObjects, setDetectedObjects] = useState<cocoSsd.DetectedObject[]>([]);
    const [isModelLoading, setIsModelLoading] = useState(true);
    const [modelError, setModelError] = useState<string | null>(null);
    const [showAccidentAlert, setShowAccidentAlert] = useState(false);
    const [alertDetails, setAlertDetails] = useState<{ confidence: number } | null>(null);
    const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [accidentDetected, setAccidentDetected] = useState(false);
    const lastNotificationTime = useRef<number>(0); // Track last notification time for cooldown
    const lastEmailSentTime = useRef<number>(0); // 5-minute email cooldown
    const EMAIL_COOLDOWN = 300000; // 5 minutes in ms
    const [emailCooldownRemaining, setEmailCooldownRemaining] = useState(0);
    const [incidentLogs, setIncidentLogs] = useState<Incident[]>([]);
    const [metrics, setMetrics] = useState<PerformanceMetrics>({
        fps: 0,
        latency: 0,
        totalFrames: 0,
        modelLoadTime: 0
    });

    // Email cooldown countdown timer
    useEffect(() => {
        const interval = setInterval(() => {
            const remaining = Math.max(0, EMAIL_COOLDOWN - (Date.now() - lastEmailSentTime.current));
            setEmailCooldownRemaining(remaining);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const { setHighConfidence, setCurrentDetection, setConfidenceLevel } = useDetection();

    const sendEmailAlert = async (confidence: number, force: boolean = false) => {
        // Check 5-minute cooldown (unless forced via test button)
        const timeSinceLastEmail = Date.now() - lastEmailSentTime.current;
        if (!force && timeSinceLastEmail < EMAIL_COOLDOWN) {
            console.log(`📧 Email skipped: ${Math.ceil((EMAIL_COOLDOWN - timeSinceLastEmail) / 1000)}s cooldown remaining`);
            return;
        }

        setEmailStatus('sending');
        try {
            const response = await fetch('http://localhost:8000/api/send-alert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'accident',
                    confidence: confidence,
                    location: 'Video Analysis Feed',
                    force: force
                })
            });
            if (response.ok) {
                setEmailStatus('success');
                lastEmailSentTime.current = Date.now();
                console.log('📧 Alert email sent successfully');
            } else {
                setEmailStatus('error');
                console.error(`Failed to send email: ${response.status}`);
            }
        } catch (error) {
            setEmailStatus('error');
            console.error('Failed to send alert email:', error);
        }
    };

    // Load both models
    useEffect(() => {
        const loadModels = async () => {
            const startTime = performance.now();
            try {
                // Load Teachable Machine model
                const modelURL = '/my_model/model.json';
                const metadataURL = '/my_model/metadata.json';
                const loadedModel = await tmImage.load(modelURL, metadataURL);
                setModel(loadedModel);

                // Load COCO-SSD model
                const cocoModel = await cocoSsd.load();
                setObjectDetectionModel(cocoModel);

                const loadTime = performance.now() - startTime;
                setMetrics(prev => ({ ...prev, modelLoadTime: loadTime }));
                setIsModelLoading(false);

                // Auto-start analysis when models load and video is ready
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

            // Auto-play the video after it loads
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

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Clear previous drawings
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw bounding boxes
        objects.forEach((obj) => {
            const [x, y, width, height] = obj.bbox;

            // Different colors for different object types
            let color = '#00ff00';
            if (obj.class === 'person') color = '#ff00ff';
            else if (obj.class === 'car' || obj.class === 'truck' || obj.class === 'bus') color = '#00ffff';

            // Draw box
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);

            // Draw label background
            ctx.fillStyle = color;
            const label = `${obj.class} ${Math.round(obj.score * 100)}%`;
            const textWidth = ctx.measureText(label).width;
            ctx.fillRect(x, y - 25, textWidth + 10, 25);

            // Draw label text
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(label, x + 5, y - 7);
        });
    };

    const predict = async () => {
        if (model && objectDetectionModel && videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
            const predictionStartTime = performance.now();

            // Run both models
            const [tmPrediction, cocoDetections] = await Promise.all([
                model.predict(videoRef.current),
                objectDetectionModel.detect(videoRef.current)
            ]);

            const predictionEndTime = performance.now();
            const latency = predictionEndTime - predictionStartTime;

            // Update predictions
            setPredictions(tmPrediction);
            setDetectedObjects(cocoDetections);

            // Draw bounding boxes
            drawBoundingBoxes(cocoDetections);

            // Calculate FPS
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

            // Check for accident detection — threshold raised to 80%
            const accidentPrediction = tmPrediction.find(p =>
                p.className.toLowerCase().includes('accident')
            );

            if (accidentPrediction && accidentPrediction.probability > 0.8) {
                const currentTime = Date.now();
                const timeSinceLastNotification = currentTime - lastNotificationTime.current;
                const ALERT_COOLDOWN = 4000; // 4 seconds between UI alerts

                if (!showAccidentAlert && timeSinceLastNotification > ALERT_COOLDOWN) {
                    setShowAccidentAlert(true);
                    setAlertDetails({ confidence: accidentPrediction.probability });
                    sendEmailAlert(accidentPrediction.probability); // subject to 5-min cooldown
                    lastNotificationTime.current = currentTime;

                    // ADD TO INCIDENT LOG with 5-minute cooldown check
                    const lastLog = incidentLogs.find(log => log.type === 'Accident');
                    const LOG_COOLDOWN = 300000; // 5 minutes

                    if (!lastLog || (currentTime - lastLog.timestamp) > LOG_COOLDOWN) {
                        const newIncident: Incident = {
                            id: Math.random().toString(36).substr(2, 9),
                            type: 'Accident',
                            confidence: accidentPrediction.probability,
                            timestamp: currentTime,
                            location: 'Video Analysis Feed'
                        };
                        setIncidentLogs(prev => [newIncident, ...prev].slice(0, 50));
                    }
                }

                setAccidentDetected(true);
                setHighConfidence(true);
                setCurrentDetection('Accident');
                setConfidenceLevel(accidentPrediction.probability);
            } else {
                setAccidentDetected(false);
                const topPrediction = tmPrediction.reduce((prev, current) =>
                    (prev.probability > current.probability) ? prev : current
                );
                if (topPrediction.probability > 0.7) {
                    setHighConfidence(true);
                    setCurrentDetection(topPrediction.className);
                    setConfidenceLevel(topPrediction.probability);
                } else {
                    setHighConfidence(false);
                }
            }

            // Control processing rate (throttle to ~15-20 FPS)
            const PROCESSING_INTERVAL = 50; // ms between frames
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
    }, [isPlaying, model, objectDetectionModel]);

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

    return (
        <>
            <div className="rounded-2xl p-6 bg-slate-50 border border-slate-200 shadow-sm text-slate-900">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Video Player with Canvas Overlay - Left Side (2 columns) */}
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
                                    {/* Canvas overlay for bounding boxes */}
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
                                        const isAccident = pred.className.toLowerCase().includes('accident');
                                        const isHighConf = pred.probability > 0.8;

                                        return (
                                            <div key={idx}>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="capitalize font-medium text-slate-800">{pred.className}</span>
                                                    <span className={`font-mono font-bold ${isAccident && isHighConf ? 'text-red-600' : 'text-slate-700'}`}>
                                                        {(pred.probability * 100).toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-300 ${isAccident && isHighConf
                                                            ? 'bg-red-600'
                                                            : pred.probability > 0.7
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

                        {/* ACCIDENT ALERT */}
                        <AnimatePresence>
                            {showAccidentAlert && alertDetails && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                                                <span className="text-red-700 font-bold text-xs uppercase tracking-wider">Accident Flagged</span>
                                            </div>
                                            <button
                                                onClick={() => setShowAccidentAlert(false)}
                                                className="text-slate-400 hover:text-slate-700 p-1"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="font-mono text-xl font-bold text-red-700">
                                                {(alertDetails.confidence * 100).toFixed(1)}%
                                            </span>
                                            <span className="text-slate-600 text-xs">detection probability</span>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setShowAccidentAlert(false)}
                                                className="flex-1 py-1.5 px-3 bg-white text-slate-800 rounded-lg text-xs font-semibold border border-slate-300 shadow-sm"
                                            >
                                                Dismiss
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Test Email Button + Cooldown Status */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setShowAccidentAlert(true);
                                    setAlertDetails({ confidence: 0.94 });
                                    sendEmailAlert(0.94, true);
                                }}
                                className="flex-1 py-2 px-3 bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-slate-800 transition-colors"
                            >
                                📧 Dispatch Alert Notification
                            </button>
                        </div>

                        {/* Email Status */}
                        {emailStatus !== 'idle' && (
                            <div className={`text-xs font-semibold px-3 py-1.5 rounded-lg text-center ${emailStatus === 'sending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                emailStatus === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                    'bg-red-100 text-red-800 border border-red-200'
                                }`}>
                                {emailStatus === 'sending' ? '⏳ Dispatching alert...' :
                                    emailStatus === 'success' ? '✅ Alert sent successfully' :
                                        '❌ Dispatch failed'}
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
                    <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-slate-800" />
                        <h3 className="text-lg font-bold text-slate-900">Incident Activity Stream</h3>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                            {incidentLogs.length > 0 ? (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">Timestamp</th>
                                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">Type</th>
                                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">Confidence</th>
                                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">Location</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {incidentLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 text-xs font-mono text-slate-600">
                                                    {new Date(log.timestamp).toLocaleTimeString()}
                                                </td>
                                                <td className="px-4 py-3 text-xs font-bold text-red-600">
                                                    {log.type}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs font-bold text-slate-900">
                                                    {(log.confidence * 100).toFixed(1)}%
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-600">
                                                    {log.location}
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
        </>
    );
}
