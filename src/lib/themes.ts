export type ThemeName = 'party' | 'ocean' | 'sunset' | 'forest';

export interface Theme {
  name: ThemeName;
  label: string;
  emoji: string;
  background: string;
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;
  primary: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  cardGradients: string[];
}

export const themes: Record<ThemeName, Theme> = {
  party: {
    name: 'party',
    label: 'Party',
    emoji: '🎉',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    gradientStart: '#6366F1',
    gradientMid: '#A855F7',
    gradientEnd: '#EC4899',
    primary: '#6366F1',
    primaryDark: '#4F46E5',
    secondary: '#EC4899',
    accent: '#A855F7',
    cardGradients: [
      'from-indigo-500 to-purple-500',
      'from-purple-500 to-pink-500',
      'from-pink-500 to-rose-500',
      'from-violet-500 to-purple-500',
      'from-fuchsia-500 to-pink-500',
      'from-indigo-500 to-blue-500',
    ],
  },
  ocean: {
    name: 'ocean',
    label: 'Ocean',
    emoji: '🌊',
    background: 'linear-gradient(135deg, #0093E9 0%, #80D0C7 50%, #a8edea 100%)',
    gradientStart: '#0EA5E9',
    gradientMid: '#14B8A6',
    gradientEnd: '#06B6D4',
    primary: '#0EA5E9',
    primaryDark: '#0284C7',
    secondary: '#14B8A6',
    accent: '#06B6D4',
    cardGradients: [
      'from-sky-500 to-cyan-500',
      'from-cyan-500 to-teal-500',
      'from-teal-500 to-emerald-500',
      'from-blue-500 to-sky-500',
      'from-cyan-500 to-blue-500',
      'from-teal-500 to-cyan-500',
    ],
  },
  sunset: {
    name: 'sunset',
    label: 'Sunset',
    emoji: '🌅',
    background: 'linear-gradient(135deg, #f12711 0%, #f5af19 50%, #ffecd2 100%)',
    gradientStart: '#F97316',
    gradientMid: '#EF4444',
    gradientEnd: '#F59E0B',
    primary: '#F97316',
    primaryDark: '#EA580C',
    secondary: '#EF4444',
    accent: '#F59E0B',
    cardGradients: [
      'from-orange-500 to-amber-500',
      'from-red-500 to-orange-500',
      'from-amber-500 to-yellow-500',
      'from-rose-500 to-red-500',
      'from-orange-500 to-red-500',
      'from-yellow-500 to-orange-500',
    ],
  },
  forest: {
    name: 'forest',
    label: 'Forest',
    emoji: '🌲',
    background: 'linear-gradient(135deg, #134E5E 0%, #71B280 50%, #c6ffdd 100%)',
    gradientStart: '#10B981',
    gradientMid: '#059669',
    gradientEnd: '#14B8A6',
    primary: '#10B981',
    primaryDark: '#059669',
    secondary: '#14B8A6',
    accent: '#34D399',
    cardGradients: [
      'from-emerald-500 to-teal-500',
      'from-green-500 to-emerald-500',
      'from-teal-500 to-cyan-500',
      'from-lime-500 to-green-500',
      'from-emerald-500 to-green-500',
      'from-green-500 to-teal-500',
    ],
  },
};

export const getTheme = (name: ThemeName): Theme => themes[name];
export const themeList = Object.values(themes);
