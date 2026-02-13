'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, X } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import { themeList, ThemeName } from '@/lib/themes';

export default function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { themeName, setTheme } = useTheme();

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-white rounded-full shadow-2xl flex items-center justify-center hover:shadow-3xl transition-shadow"
      >
        <Palette className="w-6 h-6 text-gray-700" />
      </motion.button>

      {/* Theme picker modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 pb-10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-heading text-xl font-bold text-gray-800">
                  Choose Theme
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {themeList.map((theme) => (
                  <motion.button
                    key={theme.name}
                    onClick={() => {
                      setTheme(theme.name as ThemeName);
                      setIsOpen(false);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      relative p-4 rounded-2xl border-2 transition-all
                      ${themeName === theme.name 
                        ? 'border-gray-800 shadow-lg' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    {/* Theme preview */}
                    <div 
                      className="h-20 rounded-xl mb-3 shadow-inner"
                      style={{ background: theme.background }}
                    />
                    
                    {/* Theme name */}
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xl">{theme.emoji}</span>
                      <span className="font-semibold text-gray-700">{theme.label}</span>
                    </div>

                    {/* Selected indicator */}
                    {themeName === theme.name && (
                      <motion.div
                        layoutId="selected-theme"
                        className="absolute top-2 right-2 w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
