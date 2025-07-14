import { StyleSheet } from 'react-native';
import { ThemeColors } from '../contexts/ThemeContext';

// Create themed styles based on the current theme
export const createThemedStyles = (colors: ThemeColors) => StyleSheet.create({
  // Layout
  'flex-1': { flex: 1 },
  'flex-row': { flexDirection: 'row' },
  'flex-wrap': { flexWrap: 'wrap' },
  'flex-grow': { flexGrow: 1 },
  'items-center': { alignItems: 'center' },
  'justify-center': { justifyContent: 'center' },
  'justify-between': { justifyContent: 'space-between' },
  'justify-around': { justifyContent: 'space-around' },
  'self-center': { alignSelf: 'center' },
  
  // Dynamic Background Colors (theme-aware)
  'bg-primary': { backgroundColor: colors.primary },
  'bg-primary-light': { backgroundColor: colors.primaryLight },
  'bg-surface': { backgroundColor: colors.surface },
  'bg-background': { backgroundColor: colors.background },
  'bg-card': { backgroundColor: colors.card },
  
  // Static Background Colors
  'bg-white': { backgroundColor: '#ffffff' },
  'bg-transparent': { backgroundColor: 'transparent' },
  'bg-success': { backgroundColor: colors.success },
  'bg-warning': { backgroundColor: colors.warning },
  'bg-error': { backgroundColor: colors.error },
  'bg-info': { backgroundColor: colors.info },
  
  // Enhanced Background Colors with Gradients
  'bg-gradient-primary': { backgroundColor: colors.gradientStart },
  'bg-gradient-blue': { backgroundColor: colors.gradientStart },
  'bg-gradient-purple': { backgroundColor: '#7c3aed' },
  'bg-gradient-green': { backgroundColor: colors.success },
  'bg-gradient-red': { backgroundColor: colors.error },
  'bg-gradient-orange': { backgroundColor: '#ea580c' },
  
  // Enhanced Color Palette
  'bg-blue-50': { backgroundColor: colors.primaryLight },
  'bg-blue-100': { backgroundColor: colors.primaryLight },
  'bg-blue-200': { backgroundColor: colors.primary },
  'bg-blue-500': { backgroundColor: colors.primary },
  'bg-blue-600': { backgroundColor: colors.primaryDark },
  'bg-purple-50': { backgroundColor: '#faf5ff' },
  'bg-purple-100': { backgroundColor: '#f3e8ff' },
  'bg-purple-500': { backgroundColor: '#8b5cf6' },
  'bg-indigo-50': { backgroundColor: '#eef2ff' },
  'bg-indigo-500': { backgroundColor: '#6366f1' },
  'bg-emerald-50': { backgroundColor: '#ecfdf5' },
  'bg-emerald-500': { backgroundColor: colors.success },
  'bg-orange-50': { backgroundColor: '#fff7ed' },
  'bg-orange-100': { backgroundColor: '#fed7aa' },
  'bg-orange-500': { backgroundColor: '#f97316' },
  'bg-gray-50': { backgroundColor: colors.background },
  'bg-gray-100': { backgroundColor: colors.borderLight },
  'bg-gray-200': { backgroundColor: colors.border },
  'bg-gray-500': { backgroundColor: colors.textMuted },
  'bg-red-500': { backgroundColor: colors.error },
  'bg-green-500': { backgroundColor: colors.success },
  
  // Dynamic Text Colors (theme-aware)
  'text-primary': { color: colors.text },
  'text-secondary': { color: colors.textSecondary },
  'text-muted': { color: colors.textMuted },
  'text-primary-500': { color: colors.primary },
  
  // Static Text Colors
  'text-white': { color: '#ffffff' },
  'text-black': { color: '#000000' },
  'text-success': { color: colors.success },
  'text-warning': { color: colors.warning },
  'text-error': { color: colors.error },
  'text-info': { color: colors.info },
  
  // Enhanced Text Colors
  'text-gray-400': { color: colors.textMuted },
  'text-gray-500': { color: colors.textMuted },
  'text-gray-600': { color: colors.textSecondary },
  'text-gray-700': { color: colors.text },
  'text-gray-800': { color: colors.text },
  'text-gray-900': { color: colors.text },
  'text-blue-600': { color: colors.primary },
  'text-blue-700': { color: colors.primaryDark },
  'text-purple-600': { color: '#7c3aed' },
  'text-green-600': { color: colors.success },
  'text-red-600': { color: colors.error },
  'text-orange-600': { color: '#ea580c' },
  
  // Dynamic Border Colors (theme-aware)
  'border': { borderWidth: 1, borderColor: colors.border },
  'border-primary': { borderColor: colors.primary },
  'border-surface': { borderColor: colors.border },
  
  // Static Border Colors
  'border-gray-100': { borderColor: colors.borderLight },
  'border-gray-200': { borderColor: colors.border },
  'border-gray-300': { borderColor: colors.border },
  'border-blue-100': { borderColor: colors.primaryLight },
  'border-blue-200': { borderColor: colors.primary },
  'border-success': { borderColor: colors.success },
  'border-warning': { borderColor: colors.warning },
  'border-error': { borderColor: colors.error },
  
  // Rest of the styles remain the same...
  // Margin
  'm-2': { margin: 8 },
  'm-3': { margin: 12 },
  'm-4': { margin: 16 },
  'm-5': { margin: 20 },
  'mx-4': { marginHorizontal: 16 },
  'mx-5': { marginHorizontal: 20 },
  'mx-6': { marginHorizontal: 24 },
  'my-2': { marginVertical: 8 },
  'my-4': { marginVertical: 16 },
  'my-6': { marginVertical: 24 },
  'mb-2': { marginBottom: 8 },
  'mb-3': { marginBottom: 12 },
  'mb-4': { marginBottom: 16 },
  'mb-6': { marginBottom: 24 },
  'mb-1': { marginBottom: 4 },
  'mb-5': { marginBottom: 20 },
  'mb-10': { marginBottom: 40 },
  'mb-0': { marginBottom: 0 },
  'ml-2': { marginLeft: 8 },
  'ml-3': { marginLeft: 12 },
  'mr-2': { marginRight: 8 },
  'mr-3': { marginRight: 12 },
  'mr-4': { marginRight: 16 },
  'mt-2': { marginTop: 8 },
  'mt-3': { marginTop: 12 },
  'mt-4': { marginTop: 16 },
  'mt-1': { marginTop: 4 },
  
  // Padding
  'p-1': { padding: 4 },
  'p-2': { padding: 8 },
  'p-3': { padding: 12 },
  'p-4': { padding: 16 },
  'p-5': { padding: 20 },
  'p-6': { padding: 24 },
  'p-8': { padding: 32 },
  'px-2': { paddingHorizontal: 8 },
  'px-3': { paddingHorizontal: 12 },
  'px-4': { paddingHorizontal: 16 },
  'px-5': { paddingHorizontal: 20 },
  'px-6': { paddingHorizontal: 24 },
  'py-1': { paddingVertical: 4 },
  'py-2': { paddingVertical: 8 },
  'py-3': { paddingVertical: 12 },
  'py-4': { paddingVertical: 16 },
  'py-6': { paddingVertical: 24 },
  'py-10': { paddingVertical: 40 },
  'pb-2': { paddingBottom: 8 },
  'pb-4': { paddingBottom: 16 },
  'pt-2': { paddingTop: 8 },
  'pt-4': { paddingTop: 16 },
  'pl-4': { paddingLeft: 16 },
  'pr-4': { paddingRight: 16 },
  
  // Width & Height
  'w-8': { width: 32 },
  'w-10': { width: 40 },
  'w-12': { width: 48 },
  'w-16': { width: 64 },
  'w-20': { width: 80 },
  'w-24': { width: 96 },
  'w-2': { width: 8 },
  'w-6': { width: 24 },
  'h-8': { height: 32 },
  'h-10': { height: 40 },
  'h-12': { height: 48 },
  'h-16': { height: 64 },
  'h-20': { height: 80 },
  'h-24': { height: 96 },
  'h-2': { height: 8 },
  'h-6': { height: 24 },
  'h-full': { height: '100%' },
  'w-full': { width: '100%' },
  
  // Border Radius
  'rounded': { borderRadius: 4 },
  'rounded-lg': { borderRadius: 8 },
  'rounded-xl': { borderRadius: 12 },
  'rounded-2xl': { borderRadius: 16 },
  'rounded-3xl': { borderRadius: 24 },
  'rounded-full': { borderRadius: 9999 },
  
  // Font Weight
  'font-light': { fontWeight: '300' },
  'font-normal': { fontWeight: '400' },
  'font-medium': { fontWeight: '500' },
  'font-semibold': { fontWeight: '600' },
  'font-bold': { fontWeight: '700' },
  'font-extrabold': { fontWeight: '800' },
  
  // Font Size
  'text-xs': { fontSize: 12 },
  'text-sm': { fontSize: 14 },
  'text-base': { fontSize: 16 },
  'text-lg': { fontSize: 18 },
  'text-xl': { fontSize: 20 },
  'text-2xl': { fontSize: 24 },
  'text-3xl': { fontSize: 30 },
  'text-4xl': { fontSize: 36 },
  'text-5xl': { fontSize: 48 },
  
  // Text Alignment
  'text-left': { textAlign: 'left' },
  'text-center': { textAlign: 'center' },
  'text-right': { textAlign: 'right' },
  
  // Text Transform
  'uppercase': { textTransform: 'uppercase' },
  'lowercase': { textTransform: 'lowercase' },
  'capitalize': { textTransform: 'capitalize' },
  
  // Line Height
  'leading-relaxed': { lineHeight: 24 },
  'leading-loose': { lineHeight: 28 },
  
  // Letter Spacing
  'tracking-wide': { letterSpacing: 0.5 },
  'tracking-wider': { letterSpacing: 1 },
  
  // Shadow (enhanced with colors)
  'shadow-xs': {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  'shadow-sm': {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  'shadow-lg': {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  'shadow-xl': {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  'shadow-2xl': {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  'shadow-colored-blue': {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // Position
  'absolute': { position: 'absolute' },
  'relative': { position: 'relative' },
  
  // Overflow
  'overflow-hidden': { overflow: 'hidden' },
  
  // Border Width
  'border-b': { borderBottomWidth: 1 },
  'border-t': { borderTopWidth: 1 },
  'border-l': { borderLeftWidth: 1 },
  'border-r': { borderRightWidth: 1 },
  'border-l-4': { borderLeftWidth: 4 },
  'border-2': { borderWidth: 2 },
  
  // Height & Width Extensions
  'h-13': { height: 52 },
  'h-px': { height: 1 },
  
  // Enhanced Background Colors
  'bg-primary-50': { backgroundColor: colors.primaryLight },
  'bg-primary-500': { backgroundColor: colors.primary },
  
  // Enhanced Border Colors
  'border-primary-300': { borderColor: colors.primary },
  'border-primary-500': { borderColor: colors.primary },
  'border-blue-500': { borderColor: colors.primary },
  'border-purple-200': { borderColor: '#e9d5ff' },
  'border-purple-500': { borderColor: '#8b5cf6' },
});

// Export the themed styles hook
export const useThemedStyles = (colors: ThemeColors) => {
  return createThemedStyles(colors);
};
