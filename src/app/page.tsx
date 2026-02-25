'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Loader2, Trophy, LayoutGrid, List } from 'lucide-react';
import Header from '@/components/Header';
import ItemCard from '@/components/ItemCard';
import RegistrationForm from '@/components/RegistrationForm';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import MyBids from '@/components/MyBids';
import AuctionEndedBanner from '@/components/AuctionEndedBanner';
import DisclaimerModal from '@/components/DisclaimerModal';
import ConnectionStatus from '@/components/ConnectionStatus';
import ItemDetailModal from '@/components/ItemDetailModal';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ItemWithBidder, AuctionSettings } from '@/lib/database.types';
import { ThemeProvider } from '@/lib/ThemeContext';
import { AuctionProvider, useAuction } from '@/lib/AuctionContext';

// Demo data for development
const DEMO_ITEMS: ItemWithBidder[] = [
  {
    id: '1',
    title: 'Homemade Apple Pie (Weekly for 1 Month)',
    description: 'Fresh homemade apple pie delivered to your door every week for a month. Made with love!',
    image_url: null,
    starting_bid: 25,
    current_bid: 45,
    current_bidder_id: null,
    donor_phone: null,
    donor_email: null,
    donor_name: 'Sister Johnson',
    estimated_value: 60,
    bid_increment: 5,
    auction_wave: 1,
    category: 'Food',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Family Photo Session',
    description: 'Professional 1-hour family photo session with 10 edited digital photos included.',
    image_url: null,
    starting_bid: 75,
    current_bid: 120,
    current_bidder_id: null,
    donor_phone: null,
    donor_email: null,
    donor_name: 'Brother Williams Photography',
    estimated_value: null,
    bid_increment: 1,
    auction_wave: 1,
    category: 'Services',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Handmade Quilt',
    description: 'Beautiful queen-size handmade quilt in traditional pattern. Heirloom quality.',
    image_url: null,
    starting_bid: 150,
    current_bid: 225,
    current_bidder_id: null,
    donor_phone: null,
    donor_email: null,
    donor_name: 'Sister Martinez',
    estimated_value: null,
    bid_increment: 1,
    auction_wave: 1,
    category: 'Handmade',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Lawn Care Package',
    description: 'Complete lawn care for one month: mowing, edging, and cleanup. Youth group fundraiser!',
    image_url: null,
    starting_bid: 50,
    current_bid: 85,
    current_bidder_id: null,
    donor_phone: null,
    donor_email: null,
    donor_name: 'Youth Group',
    estimated_value: null,
    bid_increment: 1,
    auction_wave: 1,
    category: 'Services',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'Date Night Basket',
    description: 'Restaurant gift card ($100), movie tickets, chocolates, and babysitting for one evening!',
    image_url: null,
    starting_bid: 75,
    current_bid: 140,
    current_bidder_id: null,
    donor_phone: null,
    donor_email: null,
    donor_name: 'Relief Society',
    estimated_value: null,
    bid_increment: 1,
    auction_wave: 1,
    category: 'Gift Basket',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    title: 'Piano Lessons (4 Sessions)',
    description: 'Four 30-minute piano lessons for beginner or intermediate students.',
    image_url: null,
    starting_bid: 60,
    current_bid: 60,
    current_bidder_id: null,
    donor_phone: null,
    donor_email: null,
    donor_name: 'Brother Anderson',
    estimated_value: null,
    bid_increment: 1,
    auction_wave: 1,
    category: 'Lessons',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '7',
    title: 'Gourmet Dinner for 8',
    description: 'Full 4-course gourmet dinner prepared and served in your home for 8 guests.',
    image_url: null,
    starting_bid: 200,
    current_bid: 275,
    current_bidder_id: null,
    donor_phone: null,
    donor_email: null,
    donor_name: 'Chef Brother Taylor',
    estimated_value: null,
    bid_increment: 1,
    auction_wave: 1,
    category: 'Food',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '8',
    title: 'Oil Change Package (3x)',
    description: 'Three complete oil changes at Brother Mike\'s Auto Shop. Includes filter and top-off.',
    image_url: null,
    starting_bid: 80,
    current_bid: 95,
    current_bidder_id: null,
    donor_phone: null,
    donor_email: null,
    donor_name: 'Brother Mike\'s Auto',
    estimated_value: null,
    bid_increment: 1,
    auction_wave: 1,
    category: 'Services',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function AuctionApp() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [bidderId, setBidderId] = useState<string | null>(null);
  const [bidderName, setBidderName] = useState<string>('');
  const [items, setItems] = useState<ItemWithBidder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [auctionSettings, setAuctionSettings] = useState<AuctionSettings | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [showMyBids, setShowMyBids] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDetailItem, setSelectedDetailItem] = useState<ItemWithBidder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBidItem, setSelectedBidItem] = useState<ItemWithBidder | null>(null);
  const [outbidCount, setOutbidCount] = useState(0);

  // Check for existing registration
  useEffect(() => {
    const savedBidderId = localStorage.getItem('bidder_id');
    const savedBidderName = localStorage.getItem('bidder_name');
    if (savedBidderId) {
      setBidderId(savedBidderId);
      setBidderName(savedBidderName || '');
      setIsRegistered(true);
    }
  }, []);

  // Fetch items
  const fetchItems = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setItems(DEMO_ITEMS);
      setIsDemo(true);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          current_bidder:bidders!items_current_bidder_id_fkey(*)
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('Error fetching items:', err);
      setItems(DEMO_ITEMS);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch auction settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!isSupabaseConfigured()) {
        setAuctionSettings({
          id: 'demo',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          end_time_wave2: null,
          is_active: true,
          title: 'Westfield 1st Ward Silent Auction',
          description: null,
          disclaimer_text: null,
          qr_code_url: null,
        });
        return;
      }

      try {
        const { data, error } = await supabase
          .from('auction_settings')
          .select('*')
          .single();

        if (error) throw error;
        setAuctionSettings(data);
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };

    fetchSettings();
    fetchItems();
  }, [fetchItems]);

  // Real-time subscription for bid updates
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const channel = supabase
      .channel('items-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'items' },
        () => {
          fetchItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchItems]);

  // Check for outbid status
  useEffect(() => {
    if (!bidderId || !isSupabaseConfigured()) return;
    const checkOutbid = async () => {
      const { data } = await supabase
        .from('items')
        .select('id')
        .neq('current_bidder_id', bidderId);
      // Count items where I placed a bid but am no longer winning
      const { data: myBids } = await supabase
        .from('bids')
        .select('item_id')
        .eq('bidder_id', bidderId);
      if (!myBids || !data) return;
      const myItemIds = new Set(myBids.map((b: { item_id: string }) => b.item_id));
      const outbidItems = items.filter(
        (i) => myItemIds.has(i.id) && i.current_bidder_id !== bidderId
      );
      setOutbidCount(outbidItems.length);
    };
    checkOutbid();
  }, [items, bidderId]);

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(items.map((item) => item.category).filter(Boolean)));

  // Count winning items
  const winningCount = items.filter(item => item.current_bidder_id === bidderId).length;

  const handleRegistrationComplete = (id: string) => {
    setBidderId(id);
    setBidderName(localStorage.getItem('bidder_name') || '');
    setIsRegistered(true);
  };

  // March 25, 2026 - bidding window 6:30 PM to 8:30 PM MST (2 hours)
  const defaultStartTime = new Date('2026-03-25T18:30:00-07:00');
  const defaultEndTime = new Date('2026-03-25T20:30:00-07:00');
  
  const startTime = auctionSettings 
    ? new Date(auctionSettings.start_time) 
    : defaultStartTime;
  const endTime = auctionSettings 
    ? new Date(auctionSettings.end_time) 
    : defaultEndTime;

  // Wave 2 end time
  const endTimeWave2 = auctionSettings?.end_time_wave2
    ? new Date(auctionSettings.end_time_wave2)
    : null;

  // Group filtered items by wave
  const wave1Items = filteredItems.filter((i) => (i.auction_wave ?? 1) === 1);
  const wave2Items = filteredItems.filter((i) => i.auction_wave === 2);
  const hasWaves = endTimeWave2 !== null || items.some((i) => i.auction_wave === 2);

  return (
    <AuctionProvider customStartTime={startTime} customEndTime={endTime}>
      <DisclaimerModal disclaimerText={auctionSettings?.disclaimer_text} />
      <ConnectionStatus />
      <main className="min-h-screen">
        <Header 
          endTime={endTime} 
          isActive={auctionSettings?.is_active ?? true} 
        />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Auction Ended Banner */}
        <AuctionEndedBanner />

        {/* Demo banner */}
        {isDemo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-4 mb-6 text-center"
          >
            <p className="text-gray-700 text-sm">
              🎭 <strong>Demo Mode:</strong> Showing sample data. Connect Supabase for real bidding.
            </p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {!isRegistered ? (
            <motion.div
              key="registration"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <RegistrationForm onComplete={handleRegistrationComplete} />
            </motion.div>
          ) : (
            <motion.div
              key="auction"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Welcome bar */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-4 mb-6 flex items-center justify-between"
              >
                <div>
                  <p className="text-gray-600">
                    Welcome back, <span className="font-semibold text-gray-800">{bidderName || 'Bidder'}</span>! 👋
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMyBids(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 rounded-xl font-semibold shadow-lg shadow-orange-500/30"
                >
                  <Trophy className="w-4 h-4" />
                  My Bids
                  {winningCount > 0 && (
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                      {winningCount}
                    </span>
                  )}
                </motion.button>
              </motion.div>

              {/* Search and filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* Search */}
                <div className="flex items-center gap-2 flex-1 bg-white/90 rounded-xl border-2 border-gray-200 px-4 focus-within:border-indigo-400 transition-colors">
                  <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search items..."
                    className="flex-1 py-3.5 bg-transparent outline-none text-gray-700 placeholder-gray-400"
                  />
                </div>

                {/* Category filter */}
                <div className="flex items-center gap-2 bg-white/90 rounded-xl border-2 border-gray-200 px-4 min-w-[180px] focus-within:border-indigo-400 transition-colors">
                  <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value || null)}
                    className="flex-1 py-3.5 bg-transparent outline-none appearance-none text-gray-700 cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category!}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* View toggle */}
                <div className="flex bg-white/90 rounded-xl p-1 shadow-sm">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
                  >
                    <LayoutGrid className={`w-5 h-5 ${viewMode === 'grid' ? 'text-gray-800' : 'text-gray-400'}`} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
                  >
                    <List className={`w-5 h-5 ${viewMode === 'list' ? 'text-gray-800' : 'text-gray-400'}`} />
                  </button>
                </div>
              </div>

              {/* Outbid notification banner */}
              {outbidCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <span className="text-xl">😬</span>
                    </div>
                    <div>
                      <p className="font-semibold text-amber-800">You&apos;ve been outbid!</p>
                      <p className="text-sm text-amber-600">
                        {outbidCount} item{outbidCount > 1 ? 's' : ''} where you&apos;re no longer winning
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMyBids(true)}
                    className="px-4 py-2 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors"
                  >
                    View Bids
                  </button>
                </motion.div>
              )}

              {/* Items grid */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="glass rounded-xl text-center py-20">
                  <p className="text-gray-500">No items found</p>
                </div>
              ) : hasWaves ? (
                /* Wave-grouped view */
                <div className="space-y-8">
                  {wave1Items.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <h2 className="font-heading text-xl font-bold text-white">Wave 1</h2>
                        <span className="text-sm text-white/60">
                          Closes {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                        {wave1Items.map((item, index) => (
                          <ItemCard
                            key={item.id}
                            item={item}
                            index={index}
                            onBidPlaced={fetchItems}
                            bidderId={bidderId || undefined}
                            onShowDetail={() => { setSelectedDetailItem(item); setShowDetailModal(true); }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {wave2Items.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <h2 className="font-heading text-xl font-bold text-white">Wave 2</h2>
                        <span className="text-sm text-white/60">
                          Closes {endTimeWave2?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'later'}
                        </span>
                      </div>
                      <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                        {wave2Items.map((item, index) => (
                          <ItemCard
                            key={item.id}
                            item={item}
                            index={index}
                            onBidPlaced={fetchItems}
                            bidderId={bidderId || undefined}
                            onShowDetail={() => { setSelectedDetailItem(item); setShowDetailModal(true); }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                  {filteredItems.map((item, index) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      index={index}
                      onBidPlaced={fetchItems}
                      bidderId={bidderId || undefined}
                      onShowDetail={() => { setSelectedDetailItem(item); setShowDetailModal(true); }}
                    />
                  ))}
                </div>
              )}

              {/* Item count */}
              <p className="text-center text-white/80 text-sm mt-8">
                Showing {filteredItems.length} of {items.length} items
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6">
        <p className="text-center text-sm text-white/60">
          Westfield 1st Ward Silent Auction • Made with ❤️
        </p>
      </footer>

      {/* Theme switcher */}
      <ThemeSwitcher />

      {/* My Bids panel */}
      <MyBids
        items={items}
        bidderId={bidderId}
        isOpen={showMyBids}
        onClose={() => setShowMyBids(false)}
        onItemClick={(item) => { setSelectedDetailItem(item); setShowDetailModal(true); setShowMyBids(false); }}
      />

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedDetailItem}
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedDetailItem(null); }}
        onBid={(item) => { setSelectedBidItem(item); setShowDetailModal(false); }}
        currentBidderId={bidderId}
      />
      </main>
    </AuctionProvider>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <AuctionApp />
    </ThemeProvider>
  );
}
