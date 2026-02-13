-- Westfield 1st Ward Silent Auction - Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Bidders table
create table public.bidders (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text not null unique,
  phone text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Items table
create table public.items (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  image_url text,
  starting_bid integer not null default 1,
  current_bid integer not null default 1,
  current_bidder_id uuid references public.bidders(id),
  donor_name text,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bids table (history of all bids)
create table public.bids (
  id uuid default uuid_generate_v4() primary key,
  item_id uuid references public.items(id) not null,
  bidder_id uuid references public.bidders(id) not null,
  amount integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Auction settings table
create table public.auction_settings (
  id uuid default uuid_generate_v4() primary key,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  is_active boolean default true,
  title text not null default 'Silent Auction',
  description text
);

-- Enable Row Level Security
alter table public.bidders enable row level security;
alter table public.items enable row level security;
alter table public.bids enable row level security;
alter table public.auction_settings enable row level security;

-- RLS Policies (allow all for simplicity - this is a trusted church app)
create policy "Allow all operations on bidders" on public.bidders for all using (true) with check (true);
create policy "Allow all operations on items" on public.items for all using (true) with check (true);
create policy "Allow all operations on bids" on public.bids for all using (true) with check (true);
create policy "Allow all operations on auction_settings" on public.auction_settings for all using (true) with check (true);

-- Enable realtime for items table (for live bid updates)
alter publication supabase_realtime add table public.items;

-- Create index for faster queries
create index idx_items_category on public.items(category);
create index idx_bids_item_id on public.bids(item_id);
create index idx_bids_bidder_id on public.bids(bidder_id);

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for items updated_at
create trigger on_items_update
  before update on public.items
  for each row
  execute function public.handle_updated_at();

-- Insert default auction settings
insert into public.auction_settings (start_time, end_time, is_active, title, description)
values (
  now(),
  now() + interval '3 hours',
  true,
  'Westfield 1st Ward Silent Auction',
  'Thank you for supporting our community!'
);
