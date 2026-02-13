'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Flame } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';

interface CountdownTimerProps {
  endTime: Date;
  onEnd?: () => void;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer({ endTime, onEnd }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 });
  const [isUrgent, setIsUrgent] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endTime.getTime() - new Date().getTime();
      
      if (difference <= 0) {
        onEnd?.();
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setIsUrgent(hours === 0 && minutes < 10);

      return { hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onEnd]);

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center font-heading text-2xl font-bold text-white shadow-lg transition-colors duration-500"
        style={{
          background: isUrgent 
            ? 'linear-gradient(135deg, #EF4444 0%, #F97316 100%)'
            : `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)`,
          boxShadow: isUrgent 
            ? '0 4px 15px rgba(239, 68, 68, 0.4)'
            : `0 4px 15px ${theme.primary}40`
        }}
      >
        <span className="tabular-nums">{String(value).padStart(2, '0')}</span>
      </div>
      <span className="text-xs text-gray-500 mt-1.5 font-semibold tracking-wide">{label}</span>
    </div>
  );

  return (
    <motion.div 
      className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-2xl px-4 py-2"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      {isUrgent ? (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <Flame className="w-5 h-5 text-orange-500" />
        </motion.div>
      ) : (
        <Clock className="w-5 h-5" style={{ color: theme.primary }} />
      )}
      <div className="flex items-center gap-1">
        <TimeBlock value={timeLeft.hours} label="HRS" />
        <span className="font-bold text-xl mb-5" style={{ color: `${theme.primary}80` }}>:</span>
        <TimeBlock value={timeLeft.minutes} label="MIN" />
        <span className="font-bold text-xl mb-5" style={{ color: `${theme.primary}80` }}>:</span>
        <TimeBlock value={timeLeft.seconds} label="SEC" />
      </div>
    </motion.div>
  );
}
