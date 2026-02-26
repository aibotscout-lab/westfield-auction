import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json();
    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and code required' }, { status: 400 });
    }

    const digits = phone.replace(/\D/g, '');
    const e164 = digits.startsWith('1') ? `+${digits}` : `+1${digits}`;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const verifySid = process.env.TWILIO_VERIFY_SID;

    if (!accountSid || !authToken || !verifySid) {
      return NextResponse.json({ error: 'SMS not configured' }, { status: 500 });
    }

    // Check code with Twilio Verify API
    const res = await fetch(
      `https://verify.twilio.com/v2/Services/${verifySid}/VerificationCheck`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        },
        body: new URLSearchParams({ To: e164, Code: code }),
      }
    );

    const data = await res.json();

    if (!res.ok || data.status !== 'approved') {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    // Code verified — check if bidder already exists
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: existingBidder } = await supabase
      .from('bidders')
      .select('id, name')
      .eq('phone', e164)
      .single();

    return NextResponse.json({
      success: true,
      verified: true,
      existingBidder: existingBidder ?? null,
    });
  } catch (err) {
    console.error('OTP verify error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Verification failed' },
      { status: 500 }
    );
  }
}
