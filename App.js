import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './src/context/ThemeContext';
import RootNavigator from './src/scenes/RootNavigator';

// Single root: one NavigationContainer with one navigator (RootNavigator returns one stack at a time)
export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <RootNavigator key="root-navigator" />
      </NavigationContainer>
    </ThemeProvider>
  );
}