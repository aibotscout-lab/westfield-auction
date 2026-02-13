'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Flame } from 'lucide-react';

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
      <AnimatePresence mode="popLayout">
        <motion.div
          key={value}
          initial={{ y: -20, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, type: "spring" }}
          className={`
            w-14 h-14 rounded-xl flex items-center justify-center font-heading text-2xl font-bold
            ${isUrgent 
              ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30' 
              : 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
            }
          `}
        >
          {String(value).padStart(2, '0')}
        </motion.div>
      </AnimatePresence>
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
        <Clock className="w-5 h-5 text-indigo-500" />
      )}
      <div className="flex items-center gap-1">
        <TimeBlock value={timeLeft.hours} label="HRS" />
        <span className="text-indigo-400 font-bold text-xl mb-5">:</span>
        <TimeBlock value={timeLeft.minutes} label="MIN" />
        <span className="text-indigo-400 font-bold text-xl mb-5">:</span>
        <TimeBlock value={timeLeft.seconds} label="SEC" />
      </div>
    </motion.div>
  );
}
