import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Background colors
  background: string;
  surface: string;
  card: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textMuted: string;
  
  // Border colors
  border: string;
  borderLight: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Gradient colors
  gradientStart: string;
  gradientEnd: string;
}

export interface Theme {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
}

const lightTheme: ThemeColors = {
  primary: '#007BFF',
  primaryLight: '#E3F2FD',
  primaryDark: '#0056B3',
  
  background: '#F9FAFB',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  
  text: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  gradientStart: '#007BFF',
  gradientEnd: '#1E40AF',
};

const darkTheme: ThemeColors = {
  primary: '#3B82F6',
  primaryLight: '#1E293B',
  primaryDark: '#1D4ED8',
  
  background: '#0F172A',
  surface: '#1E293B',
  card: '#334155',
  
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  
  border: '#475569',
  borderLight: '#334155',
  
  success: '#22C55E',
  warning: '#EAB308',
  error: '#F87171',
  info: '#60A5FA',
  
  gradientStart: '#3B82F6',
  gradientEnd: '#1D4ED8',
};

interface ThemeContextType {
  theme: Theme;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const systemColorScheme = useColorScheme();

  // Determine if dark mode should be active
  const isDark = themeMode === 'dark' || (themeMode === 'auto' && systemColorScheme === 'dark');
  
  const theme: Theme = {
    mode: themeMode,
    isDark,
    colors: isDark ? darkTheme : lightTheme,
  };

  useEffect(() => {
    loadThemeFromStorage();
  }, []);

  const loadThemeFromStorage = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      // Use default theme if loading fails
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem('theme', mode);
    } catch (error) {
      // Theme save failed - continue without saving
    }
  };

  const toggleTheme = () => {
    const nextMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextMode);
  };

  return (
    <ThemeContext.Provider value={{ theme, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
