/**
 * ThemedText Component
 * Unified text component with automatic color and typography from UNIFIED_THEME
 * Replaces repeated Text styling throughout the app with a single, consistent component
 */

import React from 'react';
import { Text } from 'react-native';
import UNIFIED_THEME from '../../constants/unifiedTheme';

/**
 * ThemedText Component
 * @param {string} variant - Text variant: 'heading', 'body', 'label', 'caption'
 * @param {string} size - Text size: 'xs', 'sm', 'md', 'lg', 'xl'
 * @param {string} color - Color name or hex: 'primary', 'secondary', 'muted', 'accent', 'success', 'error', etc.
 * @param {number} weight - Custom font weight
 * @param {object} style - Additional styles
 * @param {object} children - Text content
 * @param {object} props - Additional Text props
 */
export const ThemedText = ({
  variant = 'body',
  size = 'md',
  color = 'primary',
  weight,
  style,
  children,
  ...props
}) => {
  // Determine text color
  const getTextColor = () => {
    // If color is hex, use directly
    if (color?.startsWith('#')) return color;

    // Check accent colors
    if (UNIFIED_THEME.colors.accent[color]) {
      return UNIFIED_THEME.colors.accent[color];
    }

    // Check text colors
    if (UNIFIED_THEME.colors.text[color]) {
      return UNIFIED_THEME.colors.text[color];
    }

    // Check status colors
    if (UNIFIED_THEME.colors.status[color]) {
      return UNIFIED_THEME.colors.status[color];
    }

    // Default to primary text
    return UNIFIED_THEME.colors.text.primary;
  };

  // Get typography style based on variant and size
  const getTypographyStyle = () => {
    let typographyKey;

    if (variant === 'heading') {
      typographyKey = `heading${size.charAt(0).toUpperCase() + size.slice(1)}`;
    } else if (variant === 'label') {
      typographyKey = `label${size.charAt(0).toUpperCase() + size.slice(1)}`;
    } else {
      // body or default
      typographyKey = `body${size.charAt(0).toUpperCase() + size.slice(1)}`;
    }

    return UNIFIED_THEME.typography[typographyKey] || UNIFIED_THEME.typography.bodyMd;
  };

  const typographyStyle = getTypographyStyle();

  // Build final style
  const textColor = getTextColor();
  const finalStyle = {
    ...typographyStyle,
    color: textColor,
    ...(weight && { fontWeight: weight.toString() }),
  };

  return (
    <Text
      style={[finalStyle, style]}
      {...props}
    >
      {children}
    </Text>
  );
};

export default ThemedText;
