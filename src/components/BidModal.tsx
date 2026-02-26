'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Check, AlertCircle, Sparkles, Zap, Lock, ArrowLeft, AlertTriangle } from 'lucide-react';
import { ItemWithBidder } from '@/lib/database.types';
import { useTheme } from '@/lib/ThemeContext';
import { useAuction } from '@/lib/AuctionContext';
import { supabase } from '@/lib/supabase';
import Confetti from './Confetti';

interface BidModalProps {
  item: ItemWithBidder;
  isOpen: boolean;
  onClose: () => void;
  onBidPlaced: () => void;
}

export default function BidModal({ item, isOpen, onClose, onBidPlaced }: BidModalProps) {
  const [bidAmount, setBidAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { theme } = useTheme();
  const { canBid, biddingStatus } = useAuction();

  const increment = item.bid_increment ?? 1;
  const minBid = item.current_bid + increment;
  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('bidder_id') : null;
  const isAlreadyWinning = !!(currentUserId && item.current_bidder_id === currentUserId);

  useEffect(() => {
    if (isOpen) {
      setBidAmount(minBid.toString());
      setError('');
      setSuccess(false);
      setShowConfirmation(false);
    }
  }, [isOpen, minBid]);

  const quickBids = [
    { label: `+$${increment}`, amount: item.current_bid + increment },
    { label: `+$${increment * 2}`, amount: item.current_bid + increment * 2 },
    { label: `+$${increment * 5}`, amount: item.current_bid + increment * 5 },
    { label: `+$${increment * 10}`, amount: item.current_bid + increment * 10 },
  ];

  // First step: validate and show confirmation
  const handleShowConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check if bidding is allowed
    if (!canBid) {
      if (biddingStatus === 'ended') {
        setError('Sorry, the auction has ended. No more bids can be placed.');
      } else {
        setError('Bidding has not started yet. Please wait for the auction to begin.');
      }
      return;
    }
    
    const amount = parseInt(bidAmount);
    
    if (isNaN(amount) || amount < minBid) {
      setError(`Bid must be at least $${minBid} (increment: $${increment})`);
      return;
    }
    if ((amount - item.current_bid) % increment !== 0) {
      setError(`Bids must go up in increments of $${increment}`);
      return;
    }

    // Show confirmation screen
    setShowConfirmation(true);
  };

  // Second step: actually submit the bid
  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    setError('');

    // Check if bidding is allowed
    if (!canBid) {
      if (biddingStatus === 'ended') {
        setError('Sorry, the auction has ended. No more bids can be placed.');
      } else {
        setError('Bidding has not started yet. Please wait for the auction to begin.');
      }
      return;
    }
    
    const amount = parseInt(bidAmount);
    
    if (isNaN(amount) || amount < minBid) {
      setError(`Bid must be at least $${minBid}`);
      return;
    }

    setIsSubmitting(true);
    // Notify previous leader they've been outbid (stored in localStorage for polling)
    localStorage.setItem('last_bid_timestamp', new Date().toISOString());

    try {
      const bidderId = localStorage.getItem('bidder_id');
      
      if (!bidderId) {
        setError('Please register first');
        setIsSubmitting(false);
        return;
      }

      const { error: bidError } = await supabase
        .from('bids')
        .insert({
          item_id: item.id,
          bidder_id: bidderId,
          amount: amount,
        });

      if (bidError) throw bidError;

      // Get previous leader's phone + notification preference before updating item
      let previousLeaderPhone: string | null = null;
      let previousLeaderName: string | null = null;
      let previousLeaderWantsNotify = false;
      if (item.current_bidder_id && item.current_bidder_id !== bidderId) {
        const { data: prevBidder } = await supabase
          .from('bidders')
          .select('phone, name, notify_outbid')
          .eq('id', item.current_bidder_id)
          .single();
        previousLeaderPhone = prevBidder?.phone ?? null;
        previousLeaderName = prevBidder?.name ?? null;
        previousLeaderWantsNotify = prevBidder?.notify_outbid ?? false;
      }

      const { error: updateError } = await supabase
        .from('items')
        .update({
          current_bid: amount,
          current_bidder_id: bidderId,
        })
        .eq('id', item.id);

      if (updateError) throw updateError;

      // Notify previous leader they've been outbid (only if they opted in)
      if (previousLeaderPhone && previousLeaderWantsNotify) {
        fetch('/api/notify-outbid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bidderPhone: previousLeaderPhone,
            bidderName: previousLeaderName,
            itemTitle: item.title,
            newBid: amount,
            auctionUrl: window.location.origin,
          }),
        }).catch(() => {}); // Fire and forget — don't block UI
      }

      setSuccess(true);
      setShowConfetti(true);
      onBidPlaced();
      
      setTimeout(() => {
        setShowConfetti(false);
        onClose();
      }, 2500);

    } catch (err) {
      console.error('Bid error:', err);
      setError('Failed to place bid. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
                       w-full max-w-md mx-4 glass rounded-3xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Confetti */}
            {showConfetti && <Confetti />}

            {/* Gradient header bar */}
            <div 
              className="h-2"
              style={{ 
                background: `linear-gradient(90deg, ${theme.gradientStart} 0%, ${theme.gradientMid} 50%, ${theme.gradientEnd} 100%)`
              }}
            />

            {/* Header */}
            <div className="relative p-6 pb-4">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
              
              <h2 className="font-heading text-xl font-bold text-gray-800 pr-10 line-clamp-2">
                {item.title}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-gray-500">Current bid:</span>
                <span 
                  className="font-heading text-2xl font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  ${item.current_bid}
                </span>
                {item.current_bidder && (
                  <span className="text-gray-400 text-sm">
                    by {item.current_bidder.name.split(' ')[0]}
                  </span>
                )}
              </div>

              {/* Already winning warning */}
              {isAlreadyWinning && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5"
                >
                  <span className="text-xl">🏆</span>
                  <div>
                    <p className="text-amber-800 font-semibold text-sm">You&apos;re already winning this!</p>
                    <p className="text-amber-600 text-xs">Bidding again will raise your own price. Are you sure?</p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Content */}
            <div className="p-6 pt-2">
              {success ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: "spring" }}
                    className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                    style={{ 
                      background: 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)',
                      boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    <Check className="w-12 h-12 text-white" strokeWidth={3} />
                  </motion.div>
                  <motion.h3 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="font-heading text-2xl font-bold text-gray-800 mb-2"
                  >
                    You&apos;re Winning! 🎉
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-gray-600"
                  >
                    Bid placed at{' '}
                    <span 
                      className="font-bold text-xl"
                      style={{ color: theme.primary }}
                    >
                      ${bidAmount}
                    </span>
                  </motion.p>
                </motion.div>
              ) : showConfirmation ? (
                // Confirmation step
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="py-4"
                >
                  <div className="text-center mb-6">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ 
                        background: `linear-gradient(135deg, ${theme.gradientStart}20 0%, ${theme.gradientEnd}20 100%)`,
                      }}
                    >
                      <AlertTriangle className="w-8 h-8" style={{ color: theme.primary }} />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-gray-800 mb-2">
                      Confirm Your Bid
                    </h3>
                    <p className="text-gray-600">
                      You are about to bid{' '}
                      <span 
                        className="font-bold text-2xl"
                        style={{ color: theme.primary }}
                      >
                        ${bidAmount}
                      </span>
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      on &quot;{item.title}&quot;
                    </p>
                  </div>

                  {/* Error message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-red-500 text-sm mb-4 p-4 bg-red-50 rounded-xl border border-red-100"
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  <div className="flex gap-3">
                    <motion.button
                      type="button"
                      onClick={() => setShowConfirmation(false)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 flex items-center justify-center gap-2 py-4 text-gray-600 font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Go Back
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 flex items-center justify-center gap-2 py-4 text-white font-semibold rounded-xl transition-all"
                      style={{ 
                        background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)`,
                        boxShadow: `0 4px 20px ${theme.primary}50`
                      }}
                    >
                      {isSubmitting ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles className="w-6 h-6" />
                        </motion.div>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          Confirm Bid
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                // Bid entry step
                <form onSubmit={handleShowConfirmation}>
                  {/* Quick bid buttons */}
                  <div className="grid grid-cols-4 gap-2 mb-5">
                    {quickBids.map((qb, index) => {
                      const isSelected = bidAmount === qb.amount.toString();
                      return (
                        <motion.button
                          key={qb.amount}
                          type="button"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setBidAmount(qb.amount.toString())}
                          className="py-3 px-2 rounded-xl text-sm font-bold transition-all shadow-md"
                          style={{
                            background: isSelected 
                              ? `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)`
                              : 'white',
                            color: isSelected ? 'white' : '#374151',
                            boxShadow: isSelected ? `0 4px 15px ${theme.primary}40` : undefined,
                            border: isSelected ? 'none' : '1px solid #F3F4F6',
                          }}
                        >
                          {qb.label}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Custom amount input */}
                  <div className="relative mb-4">
                    <div 
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ 
                        background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)`
                      }}
                    >
                      <span className="text-white font-bold text-lg">$</span>
                    </div>
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      min={minBid}
                      className="input pl-[4.5rem] text-3xl font-heading font-bold text-center py-4"
                      placeholder={minBid.toString()}
                    />
                  </div>

                  <p className="text-sm text-gray-400 text-center mb-4">
                    Minimum bid: <span className="font-semibold text-gray-600">${minBid}</span>
                    {increment > 1 && (
                      <span className="ml-2 text-xs text-gray-400">(${increment} increments)</span>
                    )}
                  </p>

                  {/* Error message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-red-500 text-sm mb-4 p-4 bg-red-50 rounded-xl border border-red-100"
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  {/* Submit button */}
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-3 text-lg py-4 text-white font-semibold rounded-xl transition-all"
                    style={{ 
                      background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)`,
                      boxShadow: `0 4px 20px ${theme.primary}50`
                    }}
                  >
                    <Zap className="w-5 h-5" />
                    Place Bid
                    <TrendingUp className="w-5 h-5" />
                  </motion.button>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
