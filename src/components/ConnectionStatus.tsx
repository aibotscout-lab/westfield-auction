'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Briefly show the "back online" state then hide
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {/* Small dot indicator (always visible) */}
      <div className="flex items-center gap-1.5">
        <div
          className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-red-400'}`}
          style={isOnline ? { boxShadow: '0 0 6px rgba(52,211,153,0.8)' } : {}}
        />
        <span className="text-xs text-gray-400 hidden sm:inline">
          {isOnline ? 'Live' : 'Offline'}
        </span>
      </div>

      {/* Offline/back-online banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className={`fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white ${
              isOnline ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4" />
                Back online — bids are live again
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                You&apos;re offline — bids may not be current
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
