import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../api/api';
import UNIFIED_THEME from '../constants/unifiedTheme';
import ThemedText from '../components/ThemedText';

export default function ResetPasswordScreen({ navigation, route }) {
  const { role } = route?.params || {};
  const [step, setStep] = useState(1); // 1: email, 2: OTP + new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const baseUrl = (API_URL || '').replace(/\/$/, '');

  const handleSendOTP = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/auth/request-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        Alert.alert('Error', data?.error || 'Could not send OTP. Please try again.');
        setLoading(false);
        return;
      }

      setEmail(trimmed);
      setStep(2);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Check your email', 'If an account exists, you will receive an OTP shortly. Enter it below with your new password.');
    } catch (err) {
      Alert.alert('Error', err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const trimmedOtp = otp.trim();
    if (!trimmedOtp) {
      Alert.alert('Error', 'Please enter the OTP from your email.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/auth/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp: trimmedOtp,
          newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        Alert.alert('Error', data?.error || 'Could not reset password. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      Alert.alert('Error', err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.card}>
          <ThemedText style={styles.successIcon}>✓</ThemedText>
          <ThemedText variant="heading" size="md" style={styles.successTitle}>Password reset</ThemedText>
          <ThemedText color="muted" size="sm" style={styles.successMessage}>
            Your password has been reset. You can now log in with your new password.
          </ThemedText>
          <TouchableOpacity
            style={[styles.backBtn, UNIFIED_THEME.shadows.medium]}
            onPress={() => navigation.goBack()}
          >
            <ThemedText weight="600" color="onAccent">Back to Login</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 1) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <View style={styles.card}>
            <ThemedText variant="heading" size="md" style={styles.title}>Reset Password</ThemedText>
            <ThemedText color="muted" size="sm" style={styles.subtitle}>
              Enter the email address for your account. We'll send you an OTP to reset your password.
            </ThemedText>

            <TextInput
              placeholder="Email"
              placeholderTextColor={UNIFIED_THEME.colors.text.muted}
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled, !loading && UNIFIED_THEME.shadows.medium]}
              onPress={handleSendOTP}
              disabled={loading}
            >
              <ThemedText weight="600" color="onAccent">
                {loading ? 'Sending...' : 'Send OTP'}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkWrap}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <ThemedText size="sm" color="accent.primary">Back to Login</ThemedText>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Step 2: OTP + new password
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <View style={styles.card}>
          <ThemedText variant="heading" size="md" style={styles.title}>Enter OTP & new password</ThemedText>
          <ThemedText color="muted" size="sm" style={styles.subtitle}>
            We sent an OTP to {email}. Enter it below and choose a new password.
          </ThemedText>

          <TextInput
            placeholder="OTP"
            placeholderTextColor={UNIFIED_THEME.colors.text.muted}
            style={styles.input}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            editable={!loading}
          />
          <TextInput
            placeholder="New password (min 6 characters)"
            placeholderTextColor={UNIFIED_THEME.colors.text.muted}
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />
          <TextInput
            placeholder="Confirm new password"
            placeholderTextColor={UNIFIED_THEME.colors.text.muted}
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled, !loading && UNIFIED_THEME.shadows.medium]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            <ThemedText weight="600" color="onAccent">
              {loading ? 'Resetting...' : 'Reset Password'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkWrap}
            onPress={() => { setStep(1); setOtp(''); setNewPassword(''); setConfirmPassword(''); }}
            disabled={loading}
          >
            <ThemedText size="sm" color="accent.primary">Use a different email</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.linkWrap, { marginTop: UNIFIED_THEME.spacing.xs }]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <ThemedText size="sm" color="accent.primary">Back to Login</ThemedText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
    justifyContent: 'center',
    padding: UNIFIED_THEME.spacing.lg,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    padding: UNIFIED_THEME.spacing.lg,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
  },
  title: {
    textAlign: 'center',
    marginBottom: UNIFIED_THEME.spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: UNIFIED_THEME.spacing.lg,
    lineHeight: 20,
  },
  input: {
    backgroundColor: UNIFIED_THEME.colors.component.input,
    color: UNIFIED_THEME.colors.text.primary,
    padding: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    marginBottom: UNIFIED_THEME.spacing.lg,
    fontSize: 16,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.default,
  },
  submitBtn: {
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    padding: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  linkWrap: {
    alignItems: 'center',
    marginTop: UNIFIED_THEME.spacing.lg,
  },
  successIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: UNIFIED_THEME.spacing.md,
  },
  successTitle: {
    textAlign: 'center',
    marginBottom: UNIFIED_THEME.spacing.sm,
  },
  successMessage: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: UNIFIED_THEME.spacing.lg,
  },
  backBtn: {
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    padding: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    alignItems: 'center',
  },
});
