import { StyleSheet } from 'react-native';

// Tailwind-like utility styles for React Native
export const tw = StyleSheet.create({
  // Layout
  'flex-1': { flex: 1 },
  'flex-row': { flexDirection: 'row' },
  'flex-wrap': { flexWrap: 'wrap' },
  'items-center': { alignItems: 'center' },
  'justify-center': { justifyContent: 'center' },
  'justify-between': { justifyContent: 'space-between' },
  'justify-around': { justifyContent: 'space-around' },
  'self-center': { alignSelf: 'center' },
  
  // Background Colors
  'bg-primary-500': { backgroundColor: '#007bff' },
  'bg-primary-50': { backgroundColor: '#e3f2fd' },
  'bg-white': { backgroundColor: '#ffffff' },
  'bg-gray-50': { backgroundColor: '#f9fafb' },
  'bg-gray-100': { backgroundColor: '#f3f4f6' },
  'bg-gray-200': { backgroundColor: '#e9ecef' },
  'bg-gray-500': { backgroundColor: '#6b7280' },
  'bg-red-500': { backgroundColor: '#ef4444' },
  'bg-green-500': { backgroundColor: '#10b981' },
  
  // Enhanced Background Colors with Gradients
  'bg-gradient-primary': { backgroundColor: '#007bff' }, // We'll enhance this later
  'bg-gradient-blue': { backgroundColor: '#1e40af' },
  'bg-gradient-purple': { backgroundColor: '#7c3aed' },
  'bg-gradient-green': { backgroundColor: '#059669' },
  'bg-gradient-red': { backgroundColor: '#dc2626' },
  'bg-gradient-orange': { backgroundColor: '#ea580c' },
  
  // Enhanced Color Palette
  'bg-blue-50': { backgroundColor: '#eff6ff' },
  'bg-blue-100': { backgroundColor: '#dbeafe' },
  'bg-blue-500': { backgroundColor: '#3b82f6' },
  'bg-blue-600': { backgroundColor: '#2563eb' },
  'bg-purple-50': { backgroundColor: '#faf5ff' },
  'bg-purple-100': { backgroundColor: '#f3e8ff' },
  'bg-purple-500': { backgroundColor: '#8b5cf6' },
  'bg-indigo-50': { backgroundColor: '#eef2ff' },
  'bg-indigo-500': { backgroundColor: '#6366f1' },
  'bg-emerald-50': { backgroundColor: '#ecfdf5' },
  'bg-emerald-500': { backgroundColor: '#10b981' },
  'bg-orange-50': { backgroundColor: '#fff7ed' },
  'bg-orange-100': { backgroundColor: '#fed7aa' },
  'bg-orange-500': { backgroundColor: '#f97316' },
  
  // Text Colors
  'text-white': { color: '#ffffff' },
  'text-gray-500': { color: '#6c757d' },
  'text-gray-600': { color: '#4b5563' },
  'text-gray-700': { color: '#374151' },
  'text-gray-800': { color: '#212529' },
  'text-primary-500': { color: '#007bff' },
  'text-primary-50': { color: '#e3f2fd' },
  'text-blue-700': { color: '#1565c0' },
  'text-gray-400': { color: '#6b7280' },
  'text-blue-50': { color: '#eff6ff' },
  'text-blue-600': { color: '#2563eb' },
  'text-purple-600': { color: '#9333ea' },
  'text-indigo-600': { color: '#4f46e5' },
  'text-emerald-600': { color: '#059669' },
  'text-orange-600': { color: '#ea580c' },
  'text-gray-300': { color: '#d1d5db' },
  'text-gray-900': { color: '#111827' },
  'text-green-600': { color: '#16a34a' },
  
  // Font Sizes
  'text-xs': { fontSize: 12 },
  'text-sm': { fontSize: 14 },
  'text-base': { fontSize: 16 },
  'text-lg': { fontSize: 18 },
  'text-xl': { fontSize: 20 },
  'text-2xl': { fontSize: 24 },
  'text-3xl': { fontSize: 28 },
  'text-4xl': { fontSize: 32 },
  'text-5xl': { fontSize: 48 },
  'text-6xl': { fontSize: 60 },
  
  // Enhanced Typography
  'text-xs-plus': { fontSize: 13 },
  'text-sm-plus': { fontSize: 15 },
  'text-7xl': { fontSize: 72 },
  'text-8xl': { fontSize: 96 },
  'font-light': { fontWeight: '300' },
  'font-normal': { fontWeight: '400' },
  'font-extrabold': { fontWeight: '800' },
  'font-black': { fontWeight: '900' },
  'font-bold': { fontWeight: 'bold' },
  'font-semibold': { fontWeight: '600' },
  'font-medium': { fontWeight: '500' },
  'italic': { fontStyle: 'italic' },
  'uppercase': { textTransform: 'uppercase' },
  'lowercase': { textTransform: 'lowercase' },
  'capitalize': { textTransform: 'capitalize' },
  'tracking-wide': { letterSpacing: 0.5 },
  'tracking-wider': { letterSpacing: 1 },
  'leading-tight': { lineHeight: 20 },
  'leading-relaxed': { lineHeight: 28 },
  
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
  'py-2': { paddingVertical: 8 },
  'py-3': { paddingVertical: 12 },
  'py-4': { paddingVertical: 16 },
  'py-6': { paddingVertical: 24 },
  'py-1': { paddingVertical: 4 },
  'py-10': { paddingVertical: 40 },
  
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
  'ml-4': { marginLeft: 16 },
  'mr-2': { marginRight: 8 },
  'mr-3': { marginRight: 12 },
  'mr-4': { marginRight: 16 },
  'mt-1': { marginTop: 4 },
  'mt-2': { marginTop: 8 },
  'mt-3': { marginTop: 12 },
  'mt-4': { marginTop: 16 },
  'mt-6': { marginTop: 24 },
  
  // Opacity utilities
  'opacity-50': { opacity: 0.5 },
  
  // Enhanced Spacing
  'space-y-2': { marginTop: 8 }, // Use for vertical spacing between elements
  'space-y-3': { marginTop: 12 },
  'space-y-4': { marginTop: 16 },
  'space-y-6': { marginTop: 24 },
  'space-x-2': { marginLeft: 8 }, // Use for horizontal spacing
  'space-x-3': { marginLeft: 12 },
  'space-x-4': { marginLeft: 16 },
  
  // Width & Height
  'w-2': { width: 8 },
  'w-4': { width: 16 },
  'w-5': { width: 20 },
  'w-6': { width: 24 },
  'w-8': { width: 32 },
  'w-10': { width: 40 },
  'w-11': { width: 44 },
  'w-12': { width: 48 },
  'w-15': { width: 60 },
  'w-20': { width: 80 },
  'w-24': { width: 96 },
  'w-96': { width: 384 },
  'h-10': { height: 40 },
  'h-8': { height: 32 },
  'h-12': { height: 48 },
  'h-13': { height: 52 },
  'h-15': { height: 60 },
  'h-20': { height: 80 },
  'h-24': { height: 96 },
  'h-11': { height: 44 },
  'h-full': { height: '100%' },
  'h-px': { height: 1 },
  'h-16': { height: 64 },
  'w-16': { width: 64 },
  
  // Border
  'border': { borderWidth: 1 },
  'border-2': { borderWidth: 2 },
  'border-gray-100': { borderColor: '#f3f4f6' },
  'border-gray-200': { borderColor: '#e9ecef' },
  'border-gray-300': { borderColor: '#d1d5db' },
  'border-primary-500': { borderColor: '#007bff' },
  'border-blue-500': { borderColor: '#3b82f6' },
  'border-blue-100': { borderColor: '#dbeafe' },
  'border-purple-500': { borderColor: '#8b5cf6' },
  'border-b': { borderBottomWidth: 1 },
  'border-t': { borderTopWidth: 1 },
  
  // Enhanced Border Styles
  'border-l-4': { borderLeftWidth: 4 },
  'border-r-4': { borderRightWidth: 4 },
  'border-t-4': { borderTopWidth: 4 },
  'border-b-4': { borderBottomWidth: 4 },
  'border-primary-300': { borderColor: '#93c5fd' },
  'border-blue-200': { borderColor: '#bfdbfe' },
  'border-purple-200': { borderColor: '#e9d5ff' },
  'border-emerald-200': { borderColor: '#a7f3d0' },
  'border-orange-200': { borderColor: '#fed7aa' },
  
  // Border Radius
  'rounded-xl': { borderRadius: 12 },
  'rounded-2xl': { borderRadius: 16 },
  'rounded-3xl': { borderRadius: 24 },
  'rounded-full': { borderRadius: 9999 },
  'rounded-lg': { borderRadius: 8 },
  'rounded-b-3xl': { borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  
  // Enhanced Border Radius
  'rounded-sm': { borderRadius: 2 },
  'rounded-md': { borderRadius: 6 },
  'rounded-4xl': { borderRadius: 32 },
  'rounded-tl-lg': { borderTopLeftRadius: 8 },
  'rounded-tr-lg': { borderTopRightRadius: 8 },
  'rounded-bl-lg': { borderBottomLeftRadius: 8 },
  'rounded-br-lg': { borderBottomRightRadius: 8 },
  'rounded-t-xl': { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  'rounded-b-xl': { borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  
  // Shadow
  'shadow-sm': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  'shadow-lg': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  
  // Enhanced Shadows and Elevations
  'shadow-xs': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  'shadow-md': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  'shadow-xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  'shadow-2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 15,
  },
  'shadow-colored-blue': {
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  'shadow-colored-purple': {
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  
  // Text Alignment
  'text-center': { textAlign: 'center' },
  
  // Line Height
  'leading-5': { lineHeight: 20 },
  'leading-6': { lineHeight: 24 },
  
  // Overflow
  'overflow-hidden': { overflow: 'hidden' },
  
  // Flex
  'flex-grow': { flexGrow: 1 },
  
  // Gap (for newer React Native versions)
  'gap-4': { gap: 16 },
  
  // Additional width utilities
  'min-w-48': { minWidth: 192 },
  'w-80': { width: 320 },
});

// Utility function to combine styles
export const combineStyles = (...styles: any[]) => {
  return styles.filter(Boolean);
};
