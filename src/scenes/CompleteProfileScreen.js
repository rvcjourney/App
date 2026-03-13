import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import EditTeacherProfile from './Teacher/EditTeacherProfile';
import EditStudentProfile from './Student/EditStudentProfile';

/**
 * Shown when user must complete their role-specific profile before using the app.
 * Renders Edit Teacher/Student profile with onSaveSuccess so RootNavigator can show the app.
 */
export default function CompleteProfileScreen({ role, onComplete }) {
  const noOpNav = { goBack: () => {} };

  if (role === 'teacher') {
    return (
      <View style={styles.wrapper}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Complete your profile to use the app</Text>
        </View>
        <EditTeacherProfile navigation={noOpNav} onSaveSuccess={onComplete} />
      </View>
    );
  }

  if (role === 'student') {
    return (
      <View style={styles.wrapper}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Complete your profile to use the app</Text>
        </View>
        <EditStudentProfile navigation={noOpNav} onSaveSuccess={onComplete} />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#0f1b3f',
  },
  banner: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 0, 110, 0.3)',
  },
  bannerText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
