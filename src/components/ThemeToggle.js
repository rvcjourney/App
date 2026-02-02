import React from 'react';
import { Pressable, StyleSheet, View, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { mode, toggleTheme, colors } = useTheme();
  const isLight = mode === 'light';

  return (
    <Pressable onPress={toggleTheme} style={styles.container}>
      <View
        style={[
          styles.toggleTrack,
          {
            backgroundColor: isLight
              ? 'rgba(255,255,255,0.9)'
              : 'rgba(15,23,42,0.9)',
            borderColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.knob,
            isLight ? styles.knobRight : styles.knobLeft,
          ]}
        >
          <Text style={styles.icon}>{isLight ? '🌞' : '🌙'}</Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  toggleTrack: {
    width: 60,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  knob: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  knobLeft: {
    left: 4,
  },
  knobRight: {
    right: 4,
  },
  icon: {
    fontSize: 14,
    color: '#fff',
  },
});

export default ThemeToggle;

