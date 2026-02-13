'use client';

import { motion } from 'framer-motion';
import { Gavel, Sparkles } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import CountdownTimer from './CountdownTimer';

interface HeaderProps {
  endTime: Date;
  isActive: boolean;
}

export default function Header({ endTime, isActive }: HeaderProps) {
  const { theme } = useTheme();

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
            <CountdownTimer endTime={endTime} />
          )}
        </div>
      </div>
    </motion.header>
  );
}
