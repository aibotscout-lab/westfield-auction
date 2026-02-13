'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingDown, X, Crown, AlertTriangle } from 'lucide-react';
import { ItemWithBidder } from '@/lib/database.types';

interface MyBidsProps {
  items: ItemWithBidder[];
  bidderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onItemClick: (item: ItemWithBidder) => void;
}

export default function MyBids({ items, bidderId, isOpen, onClose, onItemClick }: MyBidsProps) {
  if (!bidderId) return null;

  // Find items where user has bid (is current leader)
  const winningItems = items.filter(item => item.current_bidder_id === bidderId);
  
  // In a real app, you'd track all bids - for now just show winning items
  // TODO: Add bid history tracking to show outbid items

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="font-heading text-xl font-bold text-gray-800">My Bids</h2>
                    <p className="text-sm text-gray-500">{winningItems.length} items winning</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {winningItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16"
                >
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingDown className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-gray-600 mb-2">
                    No bids yet
                  </h3>
                  <p className="text-gray-400">
                    Start bidding to see your items here!
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {winningItems.map((item, index) => (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        onItemClick(item);
                        onClose();
                      }}
                      className="w-full text-left bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Crown className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                              Winning
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-800 truncate">
                            {item.title}
                          </h4>
                          {item.category && (
                            <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-heading text-xl font-bold text-emerald-600">
                            ${item.current_bid}
                          </p>
                          <p className="text-xs text-gray-400">Your bid</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Outbid warning placeholder */}
              {winningItems.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Stay alert!</p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        Keep an eye on your bids — someone might outbid you before the auction ends.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer stats */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Total if you win all:</span>
                <span className="font-heading font-bold text-gray-800">
                  ${winningItems.reduce((sum, item) => sum + item.current_bid, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
