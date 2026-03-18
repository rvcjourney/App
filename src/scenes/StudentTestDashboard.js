import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { supabase } from '../../supabase';
import logger from '../utils/logger';
import UNIFIED_THEME from '../constants/unifiedTheme';

export default function StudentTestDashboard({ navigation }) {
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      logger.info('Logged out');
    } catch (error) {
      logger.error('Logout error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>📚 Student Dashboard</Text>
        <Text style={styles.subtitle}>Login successful! ✅</Text>

        <Text style={styles.message}>
          The app is working correctly. The backend API integration is complete.
        </Text>

        <View style={styles.features}>
          <Text style={styles.featureTitle}>Completed Features:</Text>
          <Text style={styles.feature}>✅ Login/Signup</Text>
          <Text style={styles.feature}>✅ Backend API Connection</Text>
          <Text style={styles.feature}>✅ Profile Fetching</Text>
          <Text style={styles.feature}>✅ Role-based Navigation</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: UNIFIED_THEME.colors.text.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: UNIFIED_THEME.colors.accent.primary,
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: UNIFIED_THEME.colors.text.muted,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  features: {
    backgroundColor: UNIFIED_THEME.colors.component.input,
    padding: 20,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    marginBottom: 30,
    width: '100%',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: UNIFIED_THEME.colors.text.primary,
    marginBottom: 12,
  },
  feature: {
    fontSize: 14,
    color: UNIFIED_THEME.colors.text.secondary,
    marginBottom: 8,
  },
  logoutBtn: {
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: UNIFIED_THEME.borderRadius.round,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
