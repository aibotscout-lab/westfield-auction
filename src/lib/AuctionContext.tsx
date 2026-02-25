'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Default times - March 25, 2026
const DEFAULT_START_TIME = new Date('2026-03-25T18:30:00-07:00'); // 6:30 PM MST
const DEFAULT_END_TIME = new Date('2026-03-25T20:30:00-07:00');   // 8:30 PM MST (2 hour window)

type BiddingStatus = 'not-started' | 'active' | 'ended';

interface AuctionContextType {
  startTime: Date;
  endTime: Date;
  biddingStatus: BiddingStatus;
  isStarted: boolean;
  isEnded: boolean;
  canBid: boolean;
  timeUntilStart: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  timeRemaining: {
    hours: number;
    minutes: number;
    seconds: number;
  };
}

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

export function AuctionProvider({ 
  children,
  customStartTime,
  customEndTime 
}: { 
  children: ReactNode;
  customStartTime?: Date;
  customEndTime?: Date;
}) {
  const startTime = customStartTime || DEFAULT_START_TIME;
  const endTime = customEndTime || DEFAULT_END_TIME;
  
  const [biddingStatus, setBiddingStatus] = useState<BiddingStatus>('not-started');
  const [timeUntilStart, setTimeUntilStart] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const untilStart = startTime.getTime() - now.getTime();
      const untilEnd = endTime.getTime() - now.getTime();
      
      // Determine bidding status
      if (untilStart > 0) {
        // Before start time
        setBiddingStatus('not-started');
        setTimeUntilStart({
          hours: Math.floor(untilStart / (1000 * 60 * 60)),
          minutes: Math.floor((untilStart % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((untilStart % (1000 * 60)) / 1000),
        });
        setTimeRemaining({
          hours: Math.floor(untilEnd / (1000 * 60 * 60)),
          minutes: Math.floor((untilEnd % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((untilEnd % (1000 * 60)) / 1000),
        });
      } else if (untilEnd > 0) {
        // Bidding active
        setBiddingStatus('active');
        setTimeUntilStart({ hours: 0, minutes: 0, seconds: 0 });
        setTimeRemaining({
          hours: Math.floor(untilEnd / (1000 * 60 * 60)),
          minutes: Math.floor((untilEnd % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((untilEnd % (1000 * 60)) / 1000),
        });
      } else {
        // Auction ended
        setBiddingStatus('ended');
        setTimeUntilStart({ hours: 0, minutes: 0, seconds: 0 });
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [startTime, endTime]);

  const isStarted = biddingStatus !== 'not-started';
  const isEnded = biddingStatus === 'ended';
  const canBid = biddingStatus === 'active';

  return (
    <AuctionContext.Provider value={{ 
      startTime,
      endTime, 
      biddingStatus,
      isStarted,
      isEnded, 
      canBid,
      timeUntilStart,
      timeRemaining 
    }}>
      {children}
    </AuctionContext.Provider>
  );
}

export function useAuction() {
  const context = useContext(AuctionContext);
  if (context === undefined) {
    throw new Error('useAuction must be used within an AuctionProvider');
  }
  return context;
}
