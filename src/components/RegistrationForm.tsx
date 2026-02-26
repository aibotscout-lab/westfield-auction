'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, ArrowRight, Sparkles, PartyPopper, EyeOff, Eye, Globe, MessageSquare, Check } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import { supabase } from '@/lib/supabase';

interface RegistrationFormProps {
  onComplete: (bidderId: string) => void;
}

type Step = 'phone' | 'otp' | 'name';

export default function RegistrationForm({ onComplete }: RegistrationFormProps) {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [name, setName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [existingBidderId, setExistingBidderId] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { theme } = useTheme();

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  // Step 1: Send OTP
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send code');
      setStep('otp');
      startResendCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendCode = async () => {
    setError('');
    setResendCooldown(30);
    startResendCooldown();
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    }
  };

  // Step 2: Verify OTP
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otpCode.length !== 6) {
      setError('Enter the 6-digit code we sent you');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid code');

      if (data.existingBidder) {
        // Returning bidder — log them straight in
        localStorage.setItem('bidder_id', data.existingBidder.id);
        localStorage.setItem('bidder_name', data.existingBidder.name);
        onComplete(data.existingBidder.id);
      } else {
        // New bidder — need name
        setStep('name');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Complete registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    setIsSubmitting(true);
    try {
      const digits = phone.replace(/\D/g, '');
      const e164 = digits.startsWith('1') ? `+${digits}` : `+1${digits}`;
      const { data, error: insertError } = await supabase
        .from('bidders')
        .insert({
          name: name.trim(),
          email: `${digits}@auction.local`, // placeholder email
          phone: e164,
          is_anonymous: isAnonymous,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      if (data) {
        localStorage.setItem('bidder_id', data.id);
        localStorage.setItem('bidder_name', name.trim());
        localStorage.setItem('bidder_anonymous', isAnonymous ? '1' : '0');
        onComplete(data.id);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
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
        {/* Hero */}
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
            {step === 'phone' && 'Welcome to the Auction!'}
            {step === 'otp' && 'Check Your Texts!'}
            {step === 'name' && 'One More Thing...'}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-white/80 text-lg"
          >
            {step === 'phone' && `Bid from anywhere! ${theme.emoji}`}
            {step === 'otp' && `We sent a code to ${phone}`}
            {step === 'name' && 'What should we call you?'}
          </motion.p>
          {step === 'phone' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-1.5 mt-2 text-white/60 text-sm"
            >
              <Globe className="w-3.5 h-3.5" />
              Works on any device, anywhere
            </motion.div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Phone */}
          {step === 'phone' && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="glass rounded-3xl p-8 shadow-2xl"
            >
              <form onSubmit={handleSendCode} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)` }}
                    >
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      placeholder="(555) 123-4567"
                      className="input flex-1 py-4 text-lg"
                      required
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2 ml-1">We&apos;ll text you a code to verify — no app needed.</p>
                </div>

                {error && (
                  <p className="text-red-500 text-sm bg-red-50 rounded-xl p-3 text-center">{error}</p>
                )}

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-3 text-lg py-4 text-white font-semibold rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)`,
                    boxShadow: `0 4px 20px ${theme.primary}50`,
                  }}
                >
                  {isSubmitting ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                      <Sparkles className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <>
                      <MessageSquare className="w-5 h-5" />
                      Send My Code
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* Step 2: OTP */}
          {step === 'otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass rounded-3xl p-8 shadow-2xl"
            >
              <form onSubmit={handleVerifyCode} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    6-Digit Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="input w-full py-5 text-3xl text-center tracking-widest font-bold"
                    maxLength={6}
                    autoFocus
                    required
                  />
                </div>

                {error && (
                  <p className="text-red-500 text-sm bg-red-50 rounded-xl p-3 text-center">{error}</p>
                )}

                <motion.button
                  type="submit"
                  disabled={isSubmitting || otpCode.length !== 6}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-3 text-lg py-4 text-white font-semibold rounded-xl disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)`,
                    boxShadow: `0 4px 20px ${theme.primary}50`,
                  }}
                >
                  {isSubmitting ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                      <Sparkles className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Verify Code
                    </>
                  )}
                </motion.button>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => { setStep('phone'); setOtpCode(''); setError(''); setResendCooldown(0); }}
                    className="py-2 text-gray-400 text-sm hover:text-gray-600"
                  >
                    ← Different number
                  </button>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0}
                    className="py-2 text-sm font-medium disabled:text-gray-300"
                    style={{ color: resendCooldown > 0 ? undefined : theme.primary }}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Step 3: Name */}
          {step === 'name' && (
            <motion.div
              key="name"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass rounded-3xl p-8 shadow-2xl"
            >
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)` }}
                    >
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Smith"
                      className="input flex-1 py-4 text-lg"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* Anonymous toggle */}
                <div
                  className="flex items-start gap-3 bg-gray-50 rounded-xl p-4 cursor-pointer"
                  onClick={() => setIsAnonymous(!isAnonymous)}
                >
                  <button
                    type="button"
                    className={`flex-shrink-0 w-10 h-6 rounded-full transition-colors mt-0.5`}
                    style={{ background: isAnonymous ? theme.primary : '#D1D5DB' }}
                  >
                    <motion.div
                      animate={{ x: isAnonymous ? 16 : 2 }}
                      className="w-5 h-5 bg-white rounded-full shadow"
                    />
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {isAnonymous ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                      <span className="text-sm font-semibold text-gray-700">Bid Anonymously</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Other bidders see &quot;Anonymous&quot; — admins always know who you are.
                    </p>
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-sm bg-red-50 rounded-xl p-3 text-center">{error}</p>
                )}

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-3 text-lg py-4 text-white font-semibold rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)`,
                    boxShadow: `0 4px 20px ${theme.primary}50`,
                  }}
                >
                  {isSubmitting ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
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
        </AnimatePresence>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-white/50 text-xs text-center mt-6"
        >
          Your info is only used for auction purposes ❤️
        </motion.p>
      </motion.div>
    </div>
  );
}
