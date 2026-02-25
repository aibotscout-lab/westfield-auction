'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, User, Phone, Mail, Clock, TrendingUp, Gift, DollarSign } from 'lucide-react';
import { ItemWithBidder, Bid, Bidder } from '@/lib/database.types';
import { useTheme } from '@/lib/ThemeContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface ItemDetailModalProps {
  item: ItemWithBidder | null;
  isOpen: boolean;
  onClose: () => void;
  onBid: (item: ItemWithBidder) => void;
  currentBidderId?: string | null;
}

interface BidHistory {
  id: string;
  amount: number;
  created_at: string;
  bidder_name: string;
  is_anonymous: boolean;
}

export default function ItemDetailModal({
  item,
  isOpen,
  onClose,
  onBid,
  currentBidderId,
}: ItemDetailModalProps) {
  const [bidHistory, setBidHistory] = useState<BidHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    if (isOpen && item && isSupabaseConfigured()) {
      fetchBidHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, item?.id]);

  const fetchBidHistory = async () => {
    if (!item) return;
    setLoadingHistory(true);
    try {
      const { data: bids } = await supabase
        .from('bids')
        .select('id, amount, created_at, bidder_id')
        .eq('item_id', item.id)
        .order('created_at', { ascending: false })
        .limit(8);

      if (!bids) return;

      // Get bidder names
      const bidderIds = [...new Set(bids.map((b: { bidder_id: string }) => b.bidder_id))];
      const { data: bidders } = await supabase
        .from('bidders')
        .select('id, name, is_anonymous')
        .in('id', bidderIds);

      const bidderMap = new Map<string, { name: string; is_anonymous: boolean }>(
        (bidders as Pick<Bidder, 'id' | 'name' | 'is_anonymous'>[])?.map((b) => [
          b.id,
          { name: b.name, is_anonymous: b.is_anonymous },
        ]) ?? []
      );

      const history: BidHistory[] = bids.map((bid: { id: string; amount: number; created_at: string; bidder_id: string }) => {
        const bidder = bidderMap.get(bid.bidder_id);
        const isMe = bid.bidder_id === currentBidderId;
        return {
          id: bid.id,
          amount: bid.amount,
          created_at: bid.created_at,
          bidder_name: isMe ? 'You' : bidder?.is_anonymous ? 'Anonymous' : bidder?.name ?? 'Bidder',
          is_anonymous: bidder?.is_anonymous ?? false,
        };
      });

      setBidHistory(history);
    } catch (err) {
      console.error('Error fetching bid history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!item) return null;

  const showEstimatedValue =
    item.estimated_value != null && item.current_bid < item.estimated_value;
  const nextMinBid = item.current_bid + (item.bid_increment ?? 1);
  const closeTime = item.auction_wave === 2 ? 'Wave 2' : 'Wave 1';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:bottom-auto
                       w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-50 overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Gradient bar */}
            <div
              className="h-1.5 flex-shrink-0"
              style={{
                background: `linear-gradient(90deg, ${theme.gradientStart} 0%, ${theme.gradientMid} 50%, ${theme.gradientEnd} 100%)`,
              }}
            />

            {/* Handle (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-4 pb-3 flex-shrink-0">
              <div className="flex-1 pr-8">
                <h2 className="font-heading text-xl font-bold text-gray-800 leading-tight">
                  {item.title}
                </h2>
                {item.category && (
                  <span
                    className="inline-flex items-center gap-1 mt-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${theme.primary}18`, color: theme.primary }}
                  >
                    <Tag className="w-3 h-3" />
                    {item.category}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-6 pb-4 space-y-5">
              {/* Price + wave info */}
              <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
                    Current Bid
                  </p>
                  <p
                    className="font-heading text-3xl font-bold"
                    style={{ color: theme.primary }}
                  >
                    ${item.current_bid.toLocaleString()}
                  </p>
                  {showEstimatedValue && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Est. Value: ${item.estimated_value!.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
                    Next Min. Bid
                  </p>
                  <p className="font-heading text-xl font-bold text-gray-700">
                    ${nextMinBid.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <Clock className="w-3 h-3 inline mr-0.5" />
                    {closeTime}
                  </p>
                </div>
              </div>

              {/* Description */}
              {item.description && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Description
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-sm">{item.description}</p>
                </div>
              )}

              {/* Donor info */}
              {(item.donor_name || item.donor_phone || item.donor_email) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Gift className="w-4 h-4" />
                    Donated By
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                    {item.donor_name && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <User className="w-4 h-4 text-gray-400" />
                        {item.donor_name}
                      </div>
                    )}
                    {item.donor_phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a href={`tel:${item.donor_phone}`} className="underline">
                          {item.donor_phone}
                        </a>
                      </div>
                    )}
                    {item.donor_email && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a href={`mailto:${item.donor_email}`} className="underline">
                          {item.donor_email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bid history */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  Bid History
                </h3>
                {loadingHistory ? (
                  <div className="flex justify-center py-4">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : bidHistory.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-3">No bids yet — be the first!</p>
                ) : (
                  <div className="space-y-2">
                    {bidHistory.map((bid, idx) => (
                      <div
                        key={bid.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl text-sm ${
                          idx === 0 ? 'bg-emerald-50 border border-emerald-100' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <DollarSign className={`w-4 h-4 ${idx === 0 ? 'text-emerald-500' : 'text-gray-400'}`} />
                          <span className={`font-semibold ${idx === 0 ? 'text-emerald-700' : 'text-gray-700'}`}>
                            {bid.bidder_name}
                          </span>
                          {idx === 0 && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">
                              Leading
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`font-bold ${idx === 0 ? 'text-emerald-700' : 'text-gray-700'}`}>
                            ${bid.amount.toLocaleString()}
                          </span>
                          <p className="text-xs text-gray-400">
                            {new Date(bid.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sticky bid button */}
            <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <motion.button
                onClick={() => {
                  onClose();
                  onBid(item);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 text-white font-semibold rounded-2xl text-lg flex items-center justify-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)`,
                  boxShadow: `0 4px 20px ${theme.primary}50`,
                }}
              >
                <TrendingUp className="w-5 h-5" />
                Place Bid — Min ${nextMinBid.toLocaleString()}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
