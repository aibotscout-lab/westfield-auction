import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone) return NextResponse.json({ error: 'Phone number required' }, { status: 400 });

    // Normalize to E.164
    const digits = phone.replace(/\D/g, '');
    const e164 = digits.startsWith('1') ? `+${digits}` : `+1${digits}`;

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store in Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase.from('otp_codes').insert({ phone: e164, code, expires_at: expiresAt });

    // Send via Twilio
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json({ error: 'SMS not configured' }, { status: 500 });
    }

    const twilio = (await import('twilio')).default;
    const client = twilio(accountSid, authToken);

    await client.messages.create({
      body: `Your Westfield Ward Auction code is: ${code}\n\nExpires in 10 minutes. Don't share this code.`,
      from: fromNumber,
      to: e164,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('OTP send error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send code' },
      { status: 500 }
    );
  }
}
