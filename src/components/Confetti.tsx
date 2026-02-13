'use client';

import { motion } from 'framer-motion';

const confettiColors = [
  '#6366F1', // Indigo
  '#A855F7', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#FFD700', // Gold
];

const shapes = ['circle', 'square', 'triangle'];

export default function Confetti() {
  const confettiPieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    delay: Math.random() * 0.4,
    rotation: Math.random() * 360,
    scale: 0.4 + Math.random() * 0.6,
    shape: shapes[Math.floor(Math.random() * shapes.length)],
    xDrift: (Math.random() - 0.5) * 100,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {confettiPieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{
            x: `${piece.x}%`,
            y: '60%',
            scale: 0,
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            y: '-150%',
            x: `calc(${piece.x}% + ${piece.xDrift}px)`,
            scale: piece.scale,
            rotate: piece.rotation + 720,
            opacity: [1, 1, 1, 0],
          }}
          transition={{
            duration: 2,
            delay: piece.delay,
            ease: 'easeOut',
          }}
          style={{
            position: 'absolute',
            width: piece.shape === 'triangle' ? 0 : 12,
            height: piece.shape === 'triangle' ? 0 : 12,
            backgroundColor: piece.shape !== 'triangle' ? piece.color : 'transparent',
            borderRadius: piece.shape === 'circle' ? '50%' : piece.shape === 'square' ? '2px' : '0',
            borderLeft: piece.shape === 'triangle' ? '6px solid transparent' : 'none',
            borderRight: piece.shape === 'triangle' ? '6px solid transparent' : 'none',
            borderBottom: piece.shape === 'triangle' ? `12px solid ${piece.color}` : 'none',
            boxShadow: piece.shape !== 'triangle' ? `0 2px 4px ${piece.color}40` : 'none',
          }}
        />
      ))}
      
      {/* Sparkle bursts */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: [0, 1.5, 0], opacity: [1, 0.8, 0] }}
          transition={{ duration: 0.8, delay: 0.1 * i }}
          style={{
            position: 'absolute',
            left: `${20 + i * 15}%`,
            top: '50%',
            width: 20,
            height: 20,
            background: `radial-gradient(circle, ${confettiColors[i]} 0%, transparent 70%)`,
            borderRadius: '50%',
          }}
        />
      ))}
    </div>
  );
}
