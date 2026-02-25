'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, ArrowRight, Sparkles, PartyPopper, Eye, EyeOff, Globe } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import { supabase } from '@/lib/supabase';

interface RegistrationFormProps {
  onComplete: (bidderId: string) => void;
}

export default function RegistrationForm({ onComplete }: RegistrationFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    is_anonymous: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [returningEmail, setReturningEmail] = useState('');
  const [showReturning, setShowReturning] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const { theme } = useTheme();

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.phone) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if bidder already exists
      const { data: existingBidder } = await supabase
        .from('bidders')
        .select('id, name')
        .eq('email', formData.email)
        .single();

      if (existingBidder) {
        localStorage.setItem('bidder_id', existingBidder.id);
        localStorage.setItem('bidder_name', existingBidder.name);
        onComplete(existingBidder.id);
        return;
      }

      // Create new bidder
      const { data, error: insertError } = await supabase
        .from('bidders')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          is_anonymous: formData.is_anonymous,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      if (data) {
        localStorage.setItem('bidder_id', data.id);
        localStorage.setItem('bidder_name', formData.name);
        localStorage.setItem('bidder_anonymous', formData.is_anonymous ? '1' : '0');
        onComplete(data.id);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturningLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLookingUp(true);
    try {
      const { data } = await supabase
        .from('bidders')
        .select('id, name')
        .eq('email', returningEmail.toLowerCase().trim())
        .single();

      if (data) {
        localStorage.setItem('bidder_id', data.id);
        localStorage.setItem('bidder_name', data.name);
        onComplete(data.id);
      } else {
        setError("We couldn't find that email. Please register below.");
        setShowReturning(false);
      }
    } catch {
      setError("We couldn't find that email. Please register below.");
      setShowReturning(false);
    } finally {
      setLookingUp(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="w-full max-w-md"
      >
        {/* Hero section */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="relative inline-block mb-6"
          >
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl mx-auto"
              style={{
                background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientMid} 50%, ${theme.gradientEnd} 100%)`,
                boxShadow: `0 20px 40px ${theme.primary}40`,
              }}
            >
              <PartyPopper className="w-12 h-12 text-white" />
            </div>
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-8 h-8 text-yellow-400 drop-shadow-lg" />
            </motion.div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-heading text-3xl font-bold text-white mb-3 drop-shadow-lg"
          >
            Welcome to the Auction!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-white/80 text-lg"
          >
            Bid from anywhere — in person or online! {theme.emoji}
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-1.5 mt-2 text-white/60 text-sm"
          >
            <Globe className="w-3.5 h-3.5" />
            Works on any device, anywhere
          </motion.div>
        </div>

        {/* Returning bidder shortcut */}
        {showReturning ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-8 shadow-2xl mb-4"
          >
            <h3 className="font-heading text-lg font-bold text-gray-800 mb-4">Welcome back!</h3>
            <form onSubmit={handleReturningLookup} className="space-y-4">
              <input
                type="email"
                value={returningEmail}
                onChange={(e) => setReturningEmail(e.target.value)}
                placeholder="Your email address"
                className="input w-full py-3 text-lg"
                required
              />
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
              <button
                type="submit"
                disabled={lookingUp}
                className="w-full py-3 text-white font-semibold rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)`,
                }}
              >
                {lookingUp ? 'Looking up...' : 'Find My Account'}
              </button>
              <button
                type="button"
                onClick={() => setShowReturning(false)}
                className="w-full py-2 text-gray-500 text-sm hover:text-gray-700"
              >
                ← Register instead
              </button>
            </form>
          </motion.div>
        ) : (
          /* Main registration form */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-3xl p-8 shadow-2xl"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3 group">
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)` }}
                  >
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Smith"
                    className="input flex-1 py-4 text-lg"
                    required
                  />
                </div>
              </motion.div>

              {/* Email */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3 group">
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)` }}
                  >
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@email.com"
                    className="input flex-1 py-4 text-lg"
                    required
                  />
                </div>
              </motion.div>

              {/* Phone */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3 group">
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)` }}
                  >
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                    placeholder="(555) 123-4567"
                    className="input flex-1 py-4 text-lg"
                    required
                  />
                </div>
              </motion.div>

              {/* Anonymous toggle */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
                className="flex items-start gap-3 bg-gray-50 rounded-xl p-4"
              >
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_anonymous: !formData.is_anonymous })}
                  className={`flex-shrink-0 w-10 h-6 rounded-full transition-colors mt-0.5 ${
                    formData.is_anonymous ? '' : 'bg-gray-200'
                  }`}
                  style={formData.is_anonymous ? { background: theme.primary } : {}}
                >
                  <motion.div
                    animate={{ x: formData.is_anonymous ? 16 : 2 }}
                    className="w-5 h-5 bg-white rounded-full shadow"
                  />
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {formData.is_anonymous ? (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="text-sm font-semibold text-gray-700">
                      Bid Anonymously
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Other bidders will see &quot;Anonymous&quot; instead of your name. Admins can always see who you are.
                  </p>
                </div>
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3 text-center"
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
                className="w-full flex items-center justify-center gap-3 text-lg py-4 mt-2 text-white font-semibold rounded-xl transition-all"
                style={{
                  background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)`,
                  boxShadow: `0 4px 20px ${theme.primary}50`,
                }}
              >
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <>
                    Let&apos;s Go!
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="text-center mt-4 space-y-1"
        >
          {!showReturning && (
            <button
              onClick={() => setShowReturning(true)}
              className="text-white/70 text-sm hover:text-white underline underline-offset-2"
            >
              Returning bidder? Click here
            </button>
          )}
          <p className="text-white/50 text-xs">Your info is only used for auction purposes ❤️</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
