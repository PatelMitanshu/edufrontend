import React from 'react';
import { Text, TextProps } from 'react-native';

interface SafeTextProps extends TextProps {
  children: any;
  context?: string;
}

export const SafeText: React.FC<SafeTextProps> = ({ children, context = 'unknown', ...props }) => {
  const safeChildren = React.useMemo(() => {
    if (children === null || children === undefined) {return '';
    }
    
    if (typeof children === 'string') {
      return children;
    }
    
    if (typeof children === 'number') {return String(children);
    }
    
    if (typeof children === 'boolean') {return String(children);
    }
    
    if (Array.isArray(children)) {return children.join(', ');
    }
    
    if (typeof children === 'object') {// Check if it's a React element
      if (children.$$typeof) {return '[React Element]';
      }
      
      try {
        return JSON.stringify(children);
      } catch (e) {
        return '[Object]';
      }
    }return String(children);
  }, [children, context]);

  return <Text {...props}>{safeChildren}</Text>;
};
