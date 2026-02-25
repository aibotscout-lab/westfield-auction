-- Migration 002: Feature Enhancements
-- Run this in your Supabase SQL Editor after 001

-- Items: add estimated value, bid increment, auction wave, donor contact
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS estimated_value integer,
  ADD COLUMN IF NOT EXISTS bid_increment integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS auction_wave integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS donor_phone text,
  ADD COLUMN IF NOT EXISTS donor_email text;

-- Bidders: add anonymous flag
ALTER TABLE public.bidders
  ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false;

-- Auction settings: add wave 2 end time, disclaimer, QR url
ALTER TABLE public.auction_settings
  ADD COLUMN IF NOT EXISTS end_time_wave2 timestamp with time zone,
  ADD COLUMN IF NOT EXISTS disclaimer_text text DEFAULT 'All sales are final. Payment is due at the end of the auction. By bidding, you agree to complete payment if you win.',
  ADD COLUMN IF NOT EXISTS qr_code_url text;

-- Enable realtime on bids table too
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;

-- Index for wave queries
CREATE INDEX IF NOT EXISTS idx_items_wave ON public.items(auction_wave);

-- OTP codes table for phone-based login
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON public.otp_codes(phone);
CREATE POLICY "Allow all otp operations" ON public.otp_codes FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
