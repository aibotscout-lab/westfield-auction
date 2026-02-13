'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Check, AlertCircle, Sparkles, Zap } from 'lucide-react';
import { ItemWithBidder } from '@/lib/database.types';
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

  const minBid = item.current_bid + 1;

  useEffect(() => {
    if (isOpen) {
      setBidAmount(minBid.toString());
      setError('');
      setSuccess(false);
    }
  }, [isOpen, minBid]);

  const quickBids = [
    { label: `+$1`, amount: item.current_bid + 1, color: 'from-indigo-500 to-indigo-600' },
    { label: `+$5`, amount: item.current_bid + 5, color: 'from-purple-500 to-purple-600' },
    { label: `+$10`, amount: item.current_bid + 10, color: 'from-pink-500 to-pink-600' },
    { label: `+$25`, amount: item.current_bid + 25, color: 'from-orange-500 to-orange-600' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const amount = parseInt(bidAmount);
    
    if (isNaN(amount) || amount < minBid) {
      setError(`Bid must be at least $${minBid}`);
      return;
    }

    setIsSubmitting(true);

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

      const { error: updateError } = await supabase
        .from('items')
        .update({
          current_bid: amount,
          current_bidder_id: bidderId,
        })
        .eq('id', item.id);

      if (updateError) throw updateError;

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
            <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

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
                <span className="font-heading text-2xl font-bold gradient-text">
                  ${item.current_bid}
                </span>
                {item.current_bidder && (
                  <span className="text-gray-400 text-sm">
                    by {item.current_bidder.name.split(' ')[0]}
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 pt-2">
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
                    className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30"
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
                    Bid placed at <span className="font-bold gradient-text text-xl">${bidAmount}</span>
                  </motion.p>
                </motion.div>
              ) : (
                <>
                  {/* Quick bid buttons */}
                  <div className="grid grid-cols-4 gap-2 mb-5">
                    {quickBids.map((qb, index) => (
                      <motion.button
                        key={qb.amount}
                        type="button"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setBidAmount(qb.amount.toString())}
                        className={`
                          py-3 px-2 rounded-xl text-sm font-bold transition-all shadow-md
                          ${bidAmount === qb.amount.toString()
                            ? `bg-gradient-to-br ${qb.color} text-white shadow-lg scale-105`
                            : 'bg-white text-gray-700 hover:shadow-lg border border-gray-100'
                          }
                        `}
                      >
                        {qb.label}
                      </motion.button>
                    ))}
                  </div>

                  {/* Custom amount input */}
                  <div className="relative mb-4">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
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
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary w-full flex items-center justify-center gap-3 text-lg py-4"
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
                        <Zap className="w-5 h-5" />
                        Place Bid
                        <TrendingUp className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </>
              )}
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
