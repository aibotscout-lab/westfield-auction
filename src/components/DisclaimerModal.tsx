'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Check } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';

interface DisclaimerModalProps {
  disclaimerText?: string | null;
}

export default function DisclaimerModal({ disclaimerText }: DisclaimerModalProps) {
  const [show, setShow] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const accepted = localStorage.getItem('disclaimer_accepted');
    if (!accepted) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('disclaimer_accepted', 'true');
    setShow(false);
  };

  const defaultText =
    'All sales are final. Payment is due at the end of the auction. By bidding, you agree to complete payment if you win.';

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4 bg-white rounded-3xl shadow-2xl z-[101] overflow-hidden"
          >
            {/* Gradient bar */}
            <div
              className="h-2"
              style={{
                background: `linear-gradient(90deg, ${theme.gradientStart} 0%, ${theme.gradientMid} 50%, ${theme.gradientEnd} 100%)`,
              }}
            />

            <div className="p-8">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{
                  background: `linear-gradient(135deg, ${theme.gradientStart}20 0%, ${theme.gradientEnd}20 100%)`,
                }}
              >
                <Shield className="w-8 h-8" style={{ color: theme.primary }} />
              </div>

              <h2 className="font-heading text-2xl font-bold text-gray-800 text-center mb-2">
                Auction Terms
              </h2>
              <p className="text-gray-500 text-center text-sm mb-6">
                Please read and accept before participating
              </p>

              <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-sm text-gray-700 leading-relaxed space-y-2">
                {(disclaimerText || defaultText).split('. ').filter(Boolean).map((sentence, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                      style={{ background: theme.primary }}
                    />
                    <span>{sentence.endsWith('.') ? sentence : sentence + '.'}</span>
                  </div>
                ))}
              </div>

              <motion.button
                onClick={handleAccept}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-3 py-4 text-white font-semibold rounded-2xl text-lg"
                style={{
                  background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)`,
                  boxShadow: `0 4px 20px ${theme.primary}50`,
                }}
              >
                <Check className="w-5 h-5" />
                I Agree — Let&apos;s Bid!
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
