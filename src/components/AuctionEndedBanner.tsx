'use client';

import { motion } from 'framer-motion';
import { Trophy, PartyPopper, Clock, Eye } from 'lucide-react';
import { useAuction } from '@/lib/AuctionContext';
import { useTheme } from '@/lib/ThemeContext';

export default function AuctionEndedBanner() {
  const { biddingStatus, timeUntilStart } = useAuction();
  const { theme } = useTheme();

  if (biddingStatus === 'active') return null;

  if (biddingStatus === 'not-started') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div 
          className="rounded-2xl p-6 text-center text-white shadow-xl"
          style={{
            background: `linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)`,
            boxShadow: `0 10px 40px rgba(245, 158, 11, 0.4)`
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Eye className="w-8 h-8" />
            <h2 className="font-heading text-2xl font-bold">Preview Mode</h2>
            <Clock className="w-8 h-8" />
          </div>
          <p className="text-white/90">
            Browse the auction items below. Bidding will open soon!
          </p>
          <div className="flex items-center justify-center gap-2 mt-3 bg-white/20 rounded-xl py-2 px-4 inline-flex">
            <Clock className="w-4 h-4" />
            <span className="font-semibold">
              Bidding opens in {timeUntilStart.hours > 0 && `${timeUntilStart.hours}h `}
              {timeUntilStart.minutes}m {timeUntilStart.seconds}s
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Ended state
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div 
        className="rounded-2xl p-6 text-center text-white shadow-xl"
        style={{
          background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)`,
          boxShadow: `0 10px 40px ${theme.primary}40`
        }}
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <PartyPopper className="w-8 h-8" />
          <h2 className="font-heading text-2xl font-bold">Auction Has Ended!</h2>
          <Trophy className="w-8 h-8" />
        </div>
        <p className="text-white/90">
          Thank you for participating! Winners will be contacted soon.
        </p>
        <div className="flex items-center justify-center gap-2 mt-3 text-white/70 text-sm">
          <Clock className="w-4 h-4" />
          <span>Bidding is now closed</span>
        </div>
      </div>
    </motion.div>
  );
}
