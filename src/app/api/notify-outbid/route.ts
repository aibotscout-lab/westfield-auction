import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { bidderPhone, bidderName, itemTitle, newBid, auctionUrl } = await req.json();

    if (!bidderPhone || !itemTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json({ error: 'SMS not configured' }, { status: 500 });
    }

    const digits = bidderPhone.replace(/\D/g, '');
    const e164 = digits.startsWith('1') ? `+${digits}` : `+1${digits}`;

    const twilio = (await import('twilio')).default;
    const client = twilio(accountSid, authToken);

    const message = [
      `Hey ${bidderName ? bidderName.split(' ')[0] : 'there'}! 😬`,
      `You've been outbid on "${itemTitle}".`,
      `New high bid: $${newBid}`,
      auctionUrl ? `Bid back: ${auctionUrl}` : '',
    ].filter(Boolean).join('\n');

    await client.messages.create({
      body: message,
      from: fromNumber,
      to: e164,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Outbid notify error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send notification' },
      { status: 500 }
    );
  }
}
