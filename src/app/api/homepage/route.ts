import { NextResponse } from 'next/server';
import { connectToDatabase, HomePageDataModel } from '@/lib/db';

export async function GET() {
    try {
        const db = await connectToDatabase();

        if (!db) {
            return NextResponse.json({
                source: 'fallback_local',
                estimatedLivesLostToday: 415,
                nagpurCorridors: [
                    { location: 'Medical Square → GMCH', normalTime: '3 Minutes (800m)', peakTime: '22 - 35 Minutes', targetTime: '1.5 Minutes' },
                    { location: 'Wardha Road → Ajni Junction', normalTime: '5 Minutes (2.4km)', peakTime: '28 - 45 Minutes', targetTime: '3.0 Minutes' },
                    { location: 'Central Avenue → Itwari', normalTime: '4 Minutes (1.5km)', peakTime: '25 - 40 Minutes', targetTime: '2.0 Minutes' }
                ]
            });
        }

        let homeData = await HomePageDataModel.findOne({ key: 'main_homepage' });
        if (!homeData) {
            homeData = await HomePageDataModel.create({
                key: 'main_homepage',
                estimatedLivesLostToday: 415,
                nagpurCorridors: [
                    { location: 'Medical Square → GMCH', normalTime: '3 Minutes (800m)', peakTime: '22 - 35 Minutes', targetTime: '1.5 Minutes' },
                    { location: 'Wardha Road → Ajni Junction', normalTime: '5 Minutes (2.4km)', peakTime: '28 - 45 Minutes', targetTime: '3.0 Minutes' },
                    { location: 'Central Avenue → Itwari', normalTime: '4 Minutes (1.5km)', peakTime: '25 - 40 Minutes', targetTime: '2.0 Minutes' }
                ]
            });
        }

        return NextResponse.json({
            source: 'mongodb',
            estimatedLivesLostToday: homeData.estimatedLivesLostToday,
            nagpurCorridors: homeData.nagpurCorridors
        });
    } catch (error: any) {
        console.error('Error fetching homepage data:', error);
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

        const updated = await HomePageDataModel.findOneAndUpdate(
            { key: 'main_homepage' },
            { $set: { ...body, updatedAt: new Date() } },
            { upsert: true, new: true }
        );

        return NextResponse.json({ status: 'success', data: updated });
    } catch (error: any) {
        console.error('Error updating homepage data:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
