'use client';

import { motion } from 'framer-motion';
import { Gavel, Sparkles, CheckCircle, Clock } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import { useAuction } from '@/lib/AuctionContext';
import CountdownTimer from './CountdownTimer';

interface HeaderProps {
  endTime: Date;
  isActive: boolean;
}

export default function Header({ endTime, isActive }: HeaderProps) {
  const { theme } = useTheme();
  const { biddingStatus, timeUntilStart } = useAuction();

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05, rotate: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientMid} 50%, ${theme.gradientEnd} 100%)`
                }}
              >
                <Gavel className="w-7 h-7 text-white" />
              </div>
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-5 h-5 text-yellow-400 drop-shadow-lg" />
              </motion.div>
            </motion.div>
            <div>
              <h1 
                className="font-heading text-xl font-bold"
                style={{
                  background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientMid} 50%, ${theme.gradientEnd} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Westfield 1st Ward
              </h1>
              <p className="text-sm text-gray-600 font-medium">Silent Auction {theme.emoji}</p>
            </div>
          </div>

          {/* Countdown */}
          {isActive && (
            biddingStatus === 'ended' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-2xl shadow-lg"
              >
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Auction Ended</span>
              </motion.div>
            ) : biddingStatus === 'not-started' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 rounded-2xl shadow-lg"
              >
                <Clock className="w-5 h-5" />
                <div className="flex flex-col">
                  <span className="text-xs opacity-90">Bidding opens in</span>
                  <span className="font-bold">
                    {timeUntilStart.hours > 0 && `${timeUntilStart.hours}h `}
                    {timeUntilStart.minutes}m {timeUntilStart.seconds}s
                  </span>
                </div>
              </motion.div>
            ) : (
              <CountdownTimer endTime={endTime} />
            )
          )}
        </div>
      </div>
    </motion.header>
  );
}
