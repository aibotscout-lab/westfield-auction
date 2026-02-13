'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Tag, User, TrendingUp, Crown, Sparkles } from 'lucide-react';
import { ItemWithBidder } from '@/lib/database.types';
import { useTheme } from '@/lib/ThemeContext';
import BidModal from './BidModal';

interface ItemCardProps {
  item: ItemWithBidder;
  index: number;
  onBidPlaced: () => void;
  bidderId?: string;
}

export default function ItemCard({ item, index, onBidPlaced, bidderId }: ItemCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { theme } = useTheme();

  const isLeading = bidderId && item.current_bidder_id === bidderId;
  const hasImage = item.image_url && item.image_url.length > 0;
  const gradientClass = theme.cardGradients[index % theme.cardGradients.length];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, delay: index * 0.08, type: "spring" }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="card relative cursor-pointer group"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Gradient top border on hover */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientClass} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
        
        {/* Image */}
        <div className={`relative h-48 bg-gradient-to-br ${gradientClass} overflow-hidden`}>
          {hasImage ? (
            <Image
              src={item.image_url!}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-500"
              style={{ transform: isHovered ? 'scale(1.1)' : 'scale(1)' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <motion.div
                animate={isHovered ? { rotate: 360, scale: 1.1 } : { rotate: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Tag className="w-16 h-16 text-white/40" />
              </motion.div>
              {/* Decorative circles */}
              <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-xl" />
              <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
            </div>
          )}
          
          {/* Category badge */}
          {item.category && (
            <div className="absolute top-3 left-3">
              <span className="badge bg-white/90 backdrop-blur-sm text-gray-700 text-xs shadow-lg">
                {item.category}
              </span>
            </div>
          )}

          {/* Leading indicator */}
          {isLeading && (
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="absolute top-3 right-3"
            >
              <span className="badge bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold shadow-lg">
                <Crown className="w-3 h-3 mr-1" />
                Winning!
              </span>
            </motion.div>
          )}

          {/* Price overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <motion.p 
              key={item.current_bid}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="font-heading text-3xl font-bold text-white drop-shadow-lg"
            >
              ${item.current_bid.toLocaleString()}
            </motion.p>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-heading font-bold text-lg text-gray-800 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {item.title}
          </h3>
          
          {item.description && (
            <p className="text-sm text-gray-500 mb-3 line-clamp-2">
              {item.description}
            </p>
          )}

          {/* Donor & current bidder */}
          <div className="flex items-center justify-between text-sm mb-4">
            {item.donor_name && (
              <p className="text-gray-400">
                by <span className="text-gray-600">{item.donor_name}</span>
              </p>
            )}
            
            {item.current_bidder && (
              <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-full"
                   style={{ backgroundColor: `${theme.primary}15`, color: theme.primary }}>
                <User className="w-3 h-3" />
                <span className="text-xs font-medium max-w-[80px] truncate">
                  {item.current_bidder.name.split(' ')[0]}
                </span>
              </div>
            )}
          </div>

          {/* Bid button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-2 font-semibold py-3 px-6 rounded-xl text-white transition-all shadow-lg"
            style={{ 
              background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)`,
              boxShadow: `0 4px 15px ${theme.primary}40`
            }}
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
            }}
          >
            <TrendingUp className="w-4 h-4" />
            Place Bid
            <Sparkles className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* Bid Modal */}
      <BidModal
        item={item}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onBidPlaced={onBidPlaced}
      />
    </>
  );
}
