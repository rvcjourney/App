/**
 * Unified Icon Component
 * Renders vector icons using react-native-vector-icons
 * Supports all libraries: AntDesign, MaterialCommunityIcons, Feather, etc.
 */

import React from 'react';
import { View } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import UNIFIED_THEME from '../../constants/unifiedTheme';
import { ICON_MAP } from '../../constants/icons';

/**
 * Icon Component
 * @param {string} name - Icon key from ICON_MAP or direct icon name
 * @param {number} size - Icon size (overrides default)
 * @param {string} color - Color name or hex value
 * @param {string} library - Icon library (for direct usage)
 * @param {object} style - Additional styles
 * @param {object} props - Additional props to pass to Icon
 */
export const Icon = ({
  name,
  size,
  color = 'primary',
  library,
  style,
  ...props
}) => {
  // Try to get config from ICON_MAP first
  let iconConfig = ICON_MAP[name];

  // If not found and library is specified, use direct params
  if (!iconConfig && library) {
    iconConfig = { library, name };
  }

  // If still not found, warn and return null
  if (!iconConfig) {
    console.warn(`Icon "${name}" not found in ICON_MAP and no library specified`);
    return null;
  }

  // Determine icon size
  const iconSize = size || iconConfig.size || 24;

  // Determine icon color
  const getColor = () => {
    // If color is a hex code, use it directly
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

    // Default to provided color (in case it's a valid color string)
    return color;
  };

  // Select the correct Icon component based on library
  const IconComponent = {
    'AntDesign': AntDesign,
    'MaterialCommunityIcons': MaterialCommunityIcons,
    'MaterialIcons': MaterialIcons,
    'Feather': Feather,
    'FontAwesome': FontAwesome,
  }[iconConfig.library];

  // If library not supported, warn and return null
  if (!IconComponent) {
    console.warn(
      `Icon library "${iconConfig.library}" not supported. Supported: AntDesign, MaterialCommunityIcons, MaterialIcons, Feather, FontAwesome`
    );
    return null;
  }

  return (
    <View style={style}>
      <IconComponent
        name={iconConfig.name}
        size={iconSize}
        color={getColor()}
        {...props}
      />
    </View>
  );
};

export default Icon;
