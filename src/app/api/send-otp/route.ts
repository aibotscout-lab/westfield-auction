import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone) return NextResponse.json({ error: 'Phone number required' }, { status: 400 });

    const digits = phone.replace(/\D/g, '');
    const e164 = digits.startsWith('1') ? `+${digits}` : `+1${digits}`;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const verifySid = process.env.TWILIO_VERIFY_SID;

    if (!accountSid || !authToken || !verifySid) {
      return NextResponse.json({ error: 'SMS not configured' }, { status: 500 });
    }

    // Use Twilio Verify API (bypasses A2P 10DLC requirements)
    const res = await fetch(
      `https://verify.twilio.com/v2/Services/${verifySid}/Verifications`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        },
        body: new URLSearchParams({ To: e164, Channel: 'sms' }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error('Twilio Verify error:', data);
      return NextResponse.json(
        { error: data.message || 'Failed to send code' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('OTP send error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send code' },
      { status: 500 }
    );
  }
}
