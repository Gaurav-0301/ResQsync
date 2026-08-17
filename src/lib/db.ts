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
    id: { type: String, required: true },
    type: { type: String, required: true },
    confidence: { type: Number, required: true },
    location: { type: String, default: 'Video Analysis Feed' },
    timestamp: { type: Number, default: Date.now },
    description: String,
    severity: String,
}, { timestamps: true });

const DashboardDataSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    activeNodes: { type: Number, default: 847 },
    hourlyDetections: { type: Number, default: 12456 },
    incidentsToday: { type: Number, default: 23 },
    bandwidthOptimization: { type: Number, default: 99.94 },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const HomePageDataSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    estimatedLivesLostToday: { type: Number, default: 415 },
    nagpurCorridors: [{
        location: String,
        normalTime: String,
        peakTime: String,
        targetTime: String
    }],
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const IncidentAlertModel = mongoose.models.IncidentAlert || mongoose.model('IncidentAlert', IncidentAlertSchema);
export const DashboardDataModel = mongoose.models.DashboardData || mongoose.model('DashboardData', DashboardDataSchema);
export const HomePageDataModel = mongoose.models.HomePageData || mongoose.model('HomePageData', HomePageDataSchema);
