import { NextResponse } from 'next/server';
import { connectToDatabase, DashboardDataModel, IncidentAlertModel } from '@/lib/db';

export async function GET() {
    try {
        const db = await connectToDatabase();

        if (!db) {
            // Offline fallback
            return NextResponse.json({
                source: 'fallback_local',
                activeNodes: 847,
                hourlyDetections: 12456,
                incidentsToday: 23,
                bandwidthOptimization: 99.94,
                alerts: []
            });
        }

        let dashData = await DashboardDataModel.findOne({ key: 'main_dashboard' });
        if (!dashData) {
            dashData = await DashboardDataModel.create({
                key: 'main_dashboard',
                activeNodes: 847,
                hourlyDetections: 12456,
                incidentsToday: 23,
                bandwidthOptimization: 99.94
            });
        }

        const recentAlerts = await IncidentAlertModel.find().sort({ timestamp: -1 }).limit(20);

        return NextResponse.json({
            source: 'mongodb',
            activeNodes: dashData.activeNodes,
            hourlyDetections: dashData.hourlyDetections,
            incidentsToday: dashData.incidentsToday,
            bandwidthOptimization: dashData.bandwidthOptimization,
            alerts: recentAlerts
        });
    } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
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

        const updated = await DashboardDataModel.findOneAndUpdate(
            { key: 'main_dashboard' },
            { $set: { ...body, updatedAt: new Date() } },
            { upsert: true, new: true }
        );

        return NextResponse.json({ status: 'success', data: updated });
    } catch (error: any) {
        console.error('Error updating dashboard data:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
