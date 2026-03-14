import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import EditTeacherProfile from './Teacher/EditTeacherProfile';
import EditStudentProfile from './Student/EditStudentProfile';
import UNIFIED_THEME from '../constants/unifiedTheme';
import ThemedText from '../components/ThemedText';

/**
 * Shown when user must complete their role-specific profile before using the app.
 * Renders Edit Teacher/Student profile with onSaveSuccess so RootNavigator can show the app.
 */
export default function CompleteProfileScreen({ role, onComplete }) {
  const noOpNav = { goBack: () => {} };

  if (role === 'teacher') {
    return (
      <SafeAreaView style={styles.wrapper}>
        <View style={styles.banner}>
          <ThemedText weight="600" size="sm">Complete your profile to use the app</ThemedText>
        </View>
        <EditTeacherProfile navigation={noOpNav} onSaveSuccess={onComplete} />
      </SafeAreaView>
    );
  }

  if (role === 'student') {
    return (
      <SafeAreaView style={styles.wrapper}>
        <View style={styles.banner}>
          <ThemedText weight="600" size="sm">Complete your profile to use the app</ThemedText>
        </View>
        <EditStudentProfile navigation={noOpNav} onSaveSuccess={onComplete} />
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
  },
  banner: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    paddingVertical: UNIFIED_THEME.spacing.sm,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: UNIFIED_THEME.colors.border.light,
    alignItems: 'center',
  },
});
