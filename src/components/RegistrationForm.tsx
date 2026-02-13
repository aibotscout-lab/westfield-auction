'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, ArrowRight, Sparkles, PartyPopper } from 'lucide-react';
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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { theme } = useTheme();

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
        .select('id')
        .eq('email', formData.email)
        .single();

      if (existingBidder) {
        localStorage.setItem('bidder_id', existingBidder.id);
        localStorage.setItem('bidder_name', formData.name);
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
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      if (data) {
        localStorage.setItem('bidder_id', data.id);
        localStorage.setItem('bidder_name', formData.name);
        onComplete(data.id);
      }

    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputFields = [
    { name: 'name', label: 'Full Name', icon: User, placeholder: 'John Smith', type: 'text' },
    { name: 'email', label: 'Email', icon: Mail, placeholder: 'john@email.com', type: 'email' },
    { name: 'phone', label: 'Phone', icon: Phone, placeholder: '(555) 123-4567', type: 'tel' },
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="w-full max-w-md"
      >
        {/* Hero section */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative inline-block mb-6"
          >
            <div 
              className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl mx-auto"
              style={{ 
                background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientMid} 50%, ${theme.gradientEnd} 100%)`,
                boxShadow: `0 20px 40px ${theme.primary}40`
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
            Enter your info to start bidding {theme.emoji}
          </motion.p>
        </div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-3xl p-8 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {inputFields.map((field, index) => (
              <motion.div
                key={field.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {field.label} <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div 
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center group-focus-within:scale-110 transition-transform"
                    style={{ 
                      background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)`
                    }}
                  >
                    <field.icon className="w-5 h-5 text-white" />
                  </div>
                  <input
                    type={field.type}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    placeholder={field.placeholder}
                    className="input pl-20 py-4 text-lg"
                    style={{ 
                      '--tw-ring-color': `${theme.primary}30`,
                    } as React.CSSProperties}
                    required
                  />
                </div>
              </motion.div>
            ))}

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
              transition={{ delay: 0.9 }}
              className="w-full flex items-center justify-center gap-3 text-lg py-4 mt-6 text-white font-semibold rounded-xl transition-all"
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
                  Let&apos;s Go!
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-white/60 text-xs text-center mt-6"
        >
          Your info is only used for auction purposes ❤️
        </motion.p>
      </motion.div>
    </div>
  );
}
