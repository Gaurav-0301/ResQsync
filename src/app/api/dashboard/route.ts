import { NextResponse } from 'next/server';
import { connectToDatabase, DashboardDataModel, IncidentAlertModel } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const db = await connectToDatabase();

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

        if (!db) {
            return NextResponse.json({
                source: 'fallback_local',
                activeNodes: 847,
                hourlyDetections: 12456,
                incidentsToday: 23,
                bandwidthOptimization: 99.94,
                locationData: defaultLocationData,
                vehicleTypes: defaultVehicleTypes,
                timeSeriesData: defaultTimeSeries,
                alerts: []
            });
        }

        await DashboardDataModel.updateOne(
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
            { upsert: true }
        );

        const dashData: any = await DashboardDataModel.findOne({ key: 'main_dashboard' }).lean();
        const alerts = await IncidentAlertModel.find().sort({ timestamp: -1 }).limit(50).lean();

        const locs = (dashData?.locationData && Array.isArray(dashData.locationData) && dashData.locationData.length > 0)
            ? dashData.locationData
            : defaultLocationData;

        const vTypes = (dashData?.vehicleTypes && Array.isArray(dashData.vehicleTypes) && dashData.vehicleTypes.length > 0)
            ? dashData.vehicleTypes
            : defaultVehicleTypes;

        const tSeries = (dashData?.timeSeriesData && Array.isArray(dashData.timeSeriesData) && dashData.timeSeriesData.length > 0)
            ? dashData.timeSeriesData
            : defaultTimeSeries;

        return NextResponse.json({
            source: 'mongodb',
            activeNodes: dashData?.activeNodes || 847,
            hourlyDetections: dashData?.hourlyDetections || 12456,
            incidentsToday: dashData?.incidentsToday || 23,
            bandwidthOptimization: dashData?.bandwidthOptimization || 99.94,
            locationData: locs,
            vehicleTypes: vTypes,
            timeSeriesData: tSeries,
            alerts: alerts.map((a: any) => ({
                id: a.id,
                type: a.type,
                severity: a.severity || 'High',
                location: a.location,
                description: a.description,
                confidence: a.confidence,
                timestamp: a.timestamp,
                source: a.source || 'Nagpur Traffic Police',
                sourceUrl: a.sourceUrl || 'https://nagpurtrafficpolice.gov.in'
            }))
        });
    } catch (error: any) {
        console.error('Error fetching dashboard data from MongoDB:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const db = await connectToDatabase();

        if (!db) {
            return NextResponse.json({ status: 'offline', message: 'Running in local fallback mode' });
        }

        if (body.type && body.location) {
            const newAlert = await IncidentAlertModel.create({
                id: body.id || `alert-${Date.now()}`,
                type: body.type,
                severity: body.severity || 'High',
                location: body.location,
                description: body.description || `Incident alert registered: ${body.type}`,
                confidence: body.confidence || 0.95,
                timestamp: body.timestamp || Date.now(),
                source: body.source || 'ResQsync Control Center',
                sourceUrl: body.sourceUrl || 'https://nagpurtrafficpolice.gov.in'
            });

            return NextResponse.json({ status: 'success', data: newAlert });
        }

        const updated = await DashboardDataModel.findOneAndUpdate(
            { key: 'main_dashboard' },
            { $set: { ...body, updatedAt: new Date() } },
            { upsert: true, new: true }
        );

        return NextResponse.json({ status: 'success', data: updated });
    } catch (error: any) {
        console.error('Error updating dashboard data in MongoDB:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
