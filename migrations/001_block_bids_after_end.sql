-- Migration: Block bids after auction ends
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/zvugcieeqfvvfetabuch/sql

-- Function to check if auction has ended
create or replace function public.is_auction_active()
returns boolean as $$
declare
  auction_end timestamp with time zone;
begin
  select end_time into auction_end from public.auction_settings limit 1;
  return now() < auction_end;
end;
$$ language plpgsql security definer;

-- Function to block bids after auction ends
create or replace function public.check_auction_before_bid()
returns trigger as $$
begin
  if not public.is_auction_active() then
    raise exception 'Auction has ended. No more bids can be placed.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if it exists
drop trigger if exists check_auction_before_bid_trigger on public.bids;

-- Create trigger to check before each bid insert
create trigger check_auction_before_bid_trigger
  before insert on public.bids
  for each row
  execute function public.check_auction_before_bid();

-- Update RLS policy for bids to also check auction status
drop policy if exists "Allow all operations on bids" on public.bids;

-- Allow read always, but only insert when auction is active
create policy "Allow read on bids" 
  on public.bids for select 
  using (true);

create policy "Allow insert on bids when auction active" 
  on public.bids for insert 
  with check (public.is_auction_active());

create policy "Allow update on bids" 
  on public.bids for update 
  using (true) 
  with check (true);

create policy "Allow delete on bids" 
  on public.bids for delete 
  using (true);

-- Verify auction end time is set correctly (March 25, 2026 at 8:30 PM MST = March 26, 2026 03:30 UTC)
update public.auction_settings 
set end_time = '2026-03-26T03:30:00+00:00'::timestamp with time zone
where true;

-- Show confirmation
select 'Bid blocking enabled. Auction ends at: ' || end_time as status from public.auction_settings;
