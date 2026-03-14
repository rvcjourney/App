/**
 * ThemedView Component
 * Unified container component that applies consistent styling based on UNIFIED_THEME
 * Replaces hardcoded style objects with centralized, reusable themes
 */

import React from 'react';
import { View } from 'react-native';
import UNIFIED_THEME from '../../constants/unifiedTheme';

/**
 * ThemedView Component
 * @param {string} variant - Style variant: 'default', 'card', 'input', 'button', 'overlay'
 * @param {string} background - Custom background color
 * @param {number} elevation - Shadow elevation level: 'small', 'medium', 'large', 'glow', 'none'
 * @param {number} padding - Padding size: 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl'
 * @param {object} style - Additional styles to merge
 * @param {object} children - Child components
 */
export const ThemedView = ({
  variant = 'default',
  background,
  elevation = 'none',
  padding = 'md',
  style,
  children,
  ...props
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'card':
        return {
          backgroundColor: background || UNIFIED_THEME.colors.component.card,
          borderColor: UNIFIED_THEME.colors.border.light,
          borderWidth: 1,
          borderRadius: UNIFIED_THEME.borderRadius.md,
          padding: UNIFIED_THEME.spacing[padding],
        };

      case 'input':
        return {
          backgroundColor: background || UNIFIED_THEME.colors.component.input,
          borderColor: UNIFIED_THEME.colors.border.default,
          borderWidth: 1,
          borderRadius: UNIFIED_THEME.borderRadius.sm,
          paddingHorizontal: UNIFIED_THEME.spacing.md,
          paddingVertical: UNIFIED_THEME.spacing.sm,
        };

      case 'button':
        return {
          backgroundColor: background || UNIFIED_THEME.colors.accent.primary,
          borderRadius: UNIFIED_THEME.borderRadius.round,
          paddingVertical: UNIFIED_THEME.spacing.md,
          paddingHorizontal: UNIFIED_THEME.spacing.lg,
          justifyContent: 'center',
          alignItems: 'center',
        };

      case 'overlay':
        return {
          ...StyleSheet.absoluteFill,
          backgroundColor: UNIFIED_THEME.colors.component.overlay,
          justifyContent: 'center',
          alignItems: 'center',
        };

      case 'section':
        return {
          paddingHorizontal: UNIFIED_THEME.spacing.lg,
          paddingVertical: UNIFIED_THEME.spacing.md,
          marginVertical: UNIFIED_THEME.spacing.sm,
        };

      default:
        return {
          backgroundColor: background || UNIFIED_THEME.colors.primary.light,
          padding: UNIFIED_THEME.spacing[padding],
        };
    }
  };

  const getElevationStyle = () => {
    const elevationMap = {
      'small': UNIFIED_THEME.shadows.small,
      'medium': UNIFIED_THEME.shadows.medium,
      'large': UNIFIED_THEME.shadows.large,
      'glow': UNIFIED_THEME.shadows.glow,
      'none': UNIFIED_THEME.shadows.none,
    };

    return elevationMap[elevation] || {};
  };

  const variantStyle = getVariantStyle();
  const elevationStyle = getElevationStyle();

  return (
    <View
      style={[
        variantStyle,
        elevationStyle,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

export default ThemedView;

// Import StyleSheet from react-native at the end to avoid issues
import { StyleSheet } from 'react-native';
