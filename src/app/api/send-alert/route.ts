import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { connectToDatabase, IncidentAlertModel } from '@/lib/db';

const CONTROLLER_EMAIL = process.env.CONTROLLER_EMAIL || 'harshvardhanpadul73@gmail.com';
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'dineshkuttan78@gmail.com';
const SENDER_PASSWORD = process.env.SENDER_PASSWORD || 'tebc irmm pbjv bxzp';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type = 'accident', confidence = 0.95, location = 'Video Analysis Feed', force = false } = body;

        const timestamp = new Date().toLocaleString();
        const confidencePct = (confidence * 100).toFixed(1);
        const incidentTypeUpper = type.toUpperCase();

        // Exact location alert message as requested
        const alertMessageText = `We have detected ${type.toLowerCase()} at this location: ${location}.`;

        console.log(`📧 Dispatching alert to Controller (${CONTROLLER_EMAIL}): ${alertMessageText}`);

        // Try persisting incident to MongoDB
        try {
            const db = await connectToDatabase();
            if (db) {
                await IncidentAlertModel.create({
                    id: Math.random().toString(36).substring(2, 11),
                    type: type,
                    confidence: confidence,
                    location: location,
                    timestamp: Date.now(),
                    description: alertMessageText,
                    severity: type.toLowerCase() === 'accident' ? 'Critical' : type.toLowerCase() === 'ambulance' ? 'High' : 'Medium'
                });
                console.log('✅ Incident recorded in MongoDB');
            }
        } catch (dbErr) {
            console.warn('⚠️ Could not save incident to MongoDB:', dbErr);
        }

        // Send Email via Nodemailer (Gmail SMTP)
        let emailSent = false;
        if (SENDER_EMAIL && SENDER_PASSWORD) {
            try {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: SENDER_EMAIL,
                        pass: SENDER_PASSWORD.replace(/\s+/g, '')
                    }
                });

                const mailOptions = {
                    from: `"ResQsync Emergency System" <${SENDER_EMAIL}>`,
                    to: CONTROLLER_EMAIL,
                    subject: `🚨 RESQSYNC ALERT: ${incidentTypeUpper} DETECTED AT ${location.toUpperCase()}`,
                    text: `ALERT NOTIFICATION FOR CONTROLLER ROOM:\n\n${alertMessageText}\n\nIncident Details:\n- Type: ${type}\n- Confidence: ${confidencePct}%\n- Location: ${location}\n- Time: ${timestamp}\n\nPlease take appropriate action immediately.`,
                    html: `
                    <!DOCTYPE html>
                    <html>
                    <body style="font-family: Arial, sans-serif; background-color: #0f172a; color: #ffffff; padding: 24px;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; padding: 24px; border: 1px solid #334155;">
                            <h1 style="color: #ef4444; margin-top: 0;">🚨 ResQsync Emergency Alert</h1>
                            <div style="background-color: #334155; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                                <h2 style="color: #38bdf8; margin: 0 0 8px 0;">${alertMessageText}</h2>
                            </div>
                            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                                <tr>
                                    <td style="padding: 8px 0; color: #94a3b8;">Incident Type:</td>
                                    <td style="padding: 8px 0; font-weight: bold; color: #f8fafc;">${type.toUpperCase()}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #94a3b8;">Confidence Level:</td>
                                    <td style="padding: 8px 0; font-weight: bold; color: #38bdf8;">${confidencePct}%</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #94a3b8;">Location:</td>
                                    <td style="padding: 8px 0; font-weight: bold; color: #f8fafc;">${location}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #94a3b8;">Detected At:</td>
                                    <td style="padding: 8px 0; font-weight: bold; color: #f8fafc;">${timestamp}</td>
                                </tr>
                            </table>
                            <div style="text-align: center; margin-top: 24px;">
                                <a href="http://localhost:3000/dashboard" style="background-color: #ef4444; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                                    View Live Control Dashboard
                                </a>
                            </div>
                            <p style="color: #64748b; font-size: 12px; margin-top: 24px; text-align: center;">
                                ResQsync Automated Controller Dispatch System • Sent to ${CONTROLLER_EMAIL}
                            </p>
                        </div>
                    </body>
                    </html>
                    `
                };

                await transporter.sendMail(mailOptions);
                emailSent = true;
                console.log(`✅ Email sent successfully to controller (${CONTROLLER_EMAIL})`);
            } catch (smtpError: any) {
                console.error('❌ SMTP Dispatch Error:', smtpError.message);
            }
        }

        return NextResponse.json({
            status: 'success',
            message: `Alert processed for ${type}.`,
            recipient: CONTROLLER_EMAIL,
            alertMessage: alertMessageText,
            emailSent
        });
    } catch (error: any) {
        console.error('Error in send-alert route:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
