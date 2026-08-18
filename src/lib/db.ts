import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resqsync';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 3000, // Quick timeout for graceful fallback
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
            console.log('✅ Connected to MongoDB successfully.');
            return mongooseInstance;
        }).catch((err) => {
            console.warn('⚠️ MongoDB connection failed (running in offline fallback mode):', err.message);
            cached.promise = null;
            return null;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        return null;
    }

    return cached.conn;
}

// Schemas for MongoDB collections

const IncidentAlertSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    confidence: { type: Number, required: true },
    location: { type: String, default: 'Video Analysis Feed' },
    timestamp: { type: Number, default: Date.now },
    description: String,
    severity: String,
    source: { type: String, default: 'Nagpur Traffic Police' },
    sourceUrl: { type: String, default: 'https://nagpurtrafficpolice.gov.in' }
}, { timestamps: true, strict: false });

const DashboardDataSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    activeNodes: { type: Number, default: 847 },
    hourlyDetections: { type: Number, default: 12456 },
    incidentsToday: { type: Number, default: 23 },
    bandwidthOptimization: { type: Number, default: 99.94 },
    locationData: [mongoose.Schema.Types.Mixed],
    vehicleTypes: [mongoose.Schema.Types.Mixed],
    timeSeriesData: [mongoose.Schema.Types.Mixed],
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true, strict: false });

const HomePageDataSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    estimatedLivesLostToday: { type: Number, default: 415 },
    nagpurCorridors: [mongoose.Schema.Types.Mixed],
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true, strict: false });

if (mongoose.models.IncidentAlert) delete mongoose.models.IncidentAlert;
if (mongoose.models.DashboardData) delete mongoose.models.DashboardData;
if (mongoose.models.HomePageData) delete mongoose.models.HomePageData;

export const IncidentAlertModel = mongoose.model('IncidentAlert', IncidentAlertSchema);
export const DashboardDataModel = mongoose.model('DashboardData', DashboardDataSchema);
export const HomePageDataModel = mongoose.model('HomePageData', HomePageDataSchema);

export async function seedControlCenterData() {
    try {
        const now = Date.now();

        const defaultLocationData = [
            { zone: 'Medical Square GMCH', accidents: 45, vehicles: 15234, source: 'Nagpur Traffic Police Report', sourceUrl: 'https://nagpurtrafficpolice.gov.in' },
            { zone: 'Ajni Junction Corridor', accidents: 32, vehicles: 12456, source: 'Nagpur Municipal Corp Mobility Cell', sourceUrl: 'https://nmc.gov.in' },
            { zone: 'Sitabuldi Square', accidents: 28, vehicles: 9876, source: 'Nagpur Urban Development Portal', sourceUrl: 'https://morth.nic.in' },
            { zone: 'Wardha Road Arterial', accidents: 19, vehicles: 11234, source: 'Maharashtra Highway Police Dept', sourceUrl: 'https://mahasecurity.maharashtra.gov.in' },
            { zone: 'Central Avenue Itwari', accidents: 38, vehicles: 14567, source: 'Nagpur Smart City Control Room', sourceUrl: 'https://nagpur.gov.in' }
        ];

        const defaultVehicleTypes = [
            { name: 'Cars', value: 4562, color: '#0f172a' },
            { name: 'Bikes', value: 3211, color: '#475569' },
            { name: 'Trucks', value: 1234, color: '#2563eb' },
            { name: 'Buses', value: 567, color: '#0284c7' },
            { name: 'Pedestrians', value: 2345, color: '#16a34a' }
        ];

        const defaultTimeSeries = Array.from({ length: 24 }, (_, i) => ({
            time: `${i.toString().padStart(2, '0')}:00`,
            detections: 450 + (i % 6) * 120,
            accidents: (i % 5 === 0) ? 2 : 0,
            trafficDensity: 30 + (i * 3) % 65,
            responseTime: 45 + (i * 2) % 30
        }));

        // 1. Force update/upsert main_dashboard document in MongoDB with complete arrays & data
        await DashboardDataModel.findOneAndUpdate(
            { key: 'main_dashboard' },
            {
                $set: {
                    key: 'main_dashboard',
                    activeNodes: 847,
                    hourlyDetections: 12456,
                    incidentsToday: 23,
                    bandwidthOptimization: 99.94,
                    locationData: defaultLocationData,
                    vehicleTypes: defaultVehicleTypes,
                    timeSeriesData: defaultTimeSeries,
                    updatedAt: new Date()
                }
            },
            { upsert: true, new: true }
        );

        // 2. Seed initial IncidentAlert documents if collection is empty
        const alertCount = await IncidentAlertModel.countDocuments();
        if (alertCount === 0) {
            const initialAlerts = [
                {
                    id: 'alert-101',
                    type: 'Accident',
                    severity: 'Critical',
                    location: 'Medical Square GMCH, Nagpur',
                    description: 'Multi-vehicle collision flagged on edge node #12. Green corridor requested for GMCH trauma unit.',
                    confidence: 0.96,
                    timestamp: now - 3 * 60 * 1000,
                    source: 'Nagpur Traffic Control Room',
                    sourceUrl: 'https://nagpurtrafficpolice.gov.in'
                },
                {
                    id: 'alert-102',
                    type: 'Green Corridor',
                    severity: 'High',
                    location: 'Wardha Road → Ajni Junction, Nagpur',
                    description: 'Emergency ambulance green corridor priority override active across 500m signal radius.',
                    confidence: 0.98,
                    timestamp: now - 12 * 60 * 1000,
                    source: 'ResQsync Edge Controller Node #4',
                    sourceUrl: 'https://nmc.gov.in'
                },
                {
                    id: 'alert-103',
                    type: 'Congestion',
                    severity: 'High',
                    location: 'Ajni Railway Underpass, Nagpur',
                    description: 'Severe traffic bottleneck detected at Ajni railway underpass bypass during peak hour transit.',
                    confidence: 0.92,
                    timestamp: now - 25 * 60 * 1000,
                    source: 'NMC Mobility Monitoring Cell',
                    sourceUrl: 'https://nmc.gov.in'
                },
                {
                    id: 'alert-104',
                    type: 'Hazard',
                    severity: 'Medium',
                    location: 'Sitabuldi Interchange, Nagpur',
                    description: 'Road defect and stationary vehicle obstructing outer lane adjacent to Metro corridor.',
                    confidence: 0.89,
                    timestamp: now - 45 * 60 * 1000,
                    source: 'Nagpur Smart City Surveillance',
                    sourceUrl: 'https://nagpur.gov.in'
                },
                {
                    id: 'alert-105',
                    type: 'Accident',
                    severity: 'Critical',
                    location: 'Central Avenue → Itwari, Nagpur',
                    description: 'Two-wheeler and commercial vehicle collision logged. Signal pre-clearing initiated.',
                    confidence: 0.94,
                    timestamp: now - 65 * 60 * 1000,
                    source: 'Ministry of Road Transport & Highways (MoRTH)',
                    sourceUrl: 'https://morth.nic.in'
                }
            ];

            await IncidentAlertModel.insertMany(initialAlerts);
        }
    } catch (err: any) {
        console.warn('Error during MongoDB control center seeding:', err.message);
    }
}
