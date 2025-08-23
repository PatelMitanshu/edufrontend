import { Text } from 'react-native';

// Override React Native's Text component to catch problematic values
const OriginalText = Text;

const DebugText = (props: any) => {
  const { children, ...otherProps } = props;
  
  // Check children for problematic values
  if (children !== null && children !== undefined) {
    if (Array.isArray(children)) {
      console.error('FOUND ARRAY CHILDREN IN TEXT:', children);
      console.trace('Stack trace for array children');
    } else if (typeof children === 'object' && children.$$typeof) {
      console.error('FOUND REACT ELEMENT IN TEXT:', children);
      console.trace('Stack trace for React element children');
    } else if (typeof children === 'object') {
      console.error('FOUND OBJECT IN TEXT:', children);
      console.trace('Stack trace for object children');
    }
  }
  
  return <OriginalText {...otherProps}>{children}</OriginalText>;
};

// Replace the global Text component for debugging
(Text as any) = DebugText;

export { DebugText };
