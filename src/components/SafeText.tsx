import React from 'react';
import { Text, TextProps } from 'react-native';

interface SafeTextProps extends TextProps {
  children: any;
  context?: string;
}

export const SafeText: React.FC<SafeTextProps> = ({ children, context = 'unknown', ...props }) => {
  const safeChildren = React.useMemo(() => {
    if (children === null || children === undefined) {
      console.warn(`SafeText: null/undefined children in context: ${context}`);
      return '';
    }
    
    if (typeof children === 'string') {
      return children;
    }
    
    if (typeof children === 'number') {
      console.warn(`SafeText: number children ${children} in context: ${context}, converting to string`);
      return String(children);
    }
    
    if (typeof children === 'boolean') {
      console.warn(`SafeText: boolean children ${children} in context: ${context}, converting to string`);
      return String(children);
    }
    
    if (Array.isArray(children)) {
      console.error(`SafeText: Array children detected in context: ${context}`, children);
      console.trace('Stack trace for array children in Text component:');
      return children.join(', ');
    }
    
    if (typeof children === 'object') {
      console.error(`SafeText: Object children detected in context: ${context}`, children);
      console.trace('Stack trace for object children in Text component:');
      
      // Check if it's a React element
      if (children.$$typeof) {
        console.error('React element detected as Text children!');
        return '[React Element]';
      }
      
      try {
        return JSON.stringify(children);
      } catch (e) {
        return '[Object]';
      }
    }
    
    console.warn(`SafeText: Unknown type ${typeof children} in context: ${context}`, children);
    return String(children);
  }, [children, context]);

  return <Text {...props}>{safeChildren}</Text>;
};
