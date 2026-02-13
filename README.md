# Westfield 1st Ward Silent Auction

A beautiful, mobile-friendly silent auction app for church events.

## Features

- ✨ Smooth animations and modern UI
- 📱 Mobile-first responsive design
- ⚡ Real-time bid updates
- ⏱️ Countdown timer
- 🔍 Search and filter items
- 🎉 Confetti celebration on successful bids
- 👤 Simple registration (name, email, phone)

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase (Free)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to SQL Editor and run the contents of `supabase-schema.sql`
4. Go to Settings → API and copy your URL and anon key

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Adding Items

You can add items directly in Supabase:

1. Go to your Supabase project → Table Editor → items
2. Click "Insert row"
3. Fill in: title, description, starting_bid, donor_name, category
4. Optional: Add image_url (any public image URL)

### Bulk Import

To import many items, use the Supabase CSV import:

1. Create a CSV with columns: title, description, starting_bid, donor_name, category, image_url
2. Go to Table Editor → items → Import data

## Configuring the Auction

Edit the auction settings in Supabase:

1. Go to Table Editor → auction_settings
2. Update start_time and end_time
3. Set is_active to true when ready

## Deployment

### Deploy to Vercel (Free)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
5. Deploy!

Your auction will be live at `your-project.vercel.app`

## Admin Features (Coming Soon)

- [ ] Admin dashboard to manage items
- [ ] Export winners list
- [ ] Close auction button
- [ ] Outbid notifications (email/SMS)

## Tech Stack

- **Next.js 14** - React framework
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Supabase** - Database + real-time
- **Lucide Icons** - Icons

## License

MIT - Feel free to use for your church or organization!
