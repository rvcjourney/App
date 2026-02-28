import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../api/api';

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
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>Password reset</Text>
          <Text style={styles.successMessage}>
            Your password has been reset. You can now log in with your new password.
          </Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>Back to Login</Text>
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
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter the email address for your account. We'll send you an OTP to reset your password.
            </Text>

            <TextInput
              placeholder="Email"
              placeholderTextColor="#999"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSendOTP}
              disabled={loading}
            >
              <Text style={styles.submitBtnText}>
                {loading ? 'Sending...' : 'Send OTP'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkWrap}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.linkText}>Back to Login</Text>
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
          <Text style={styles.title}>Enter OTP & new password</Text>
          <Text style={styles.subtitle}>
            We sent an OTP to {email}. Enter it below and choose a new password.
          </Text>

          <TextInput
            placeholder="OTP"
            placeholderTextColor="#999"
            style={styles.input}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            editable={!loading}
          />
          <TextInput
            placeholder="New password (min 6 characters)"
            placeholderTextColor="#999"
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />
          <TextInput
            placeholder="Confirm new password"
            placeholderTextColor="#999"
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            <Text style={styles.submitBtnText}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkWrap}
            onPress={() => { setStep(1); setOtp(''); setNewPassword(''); setConfirmPassword(''); }}
            disabled={loading}
          >
            <Text style={styles.linkText}>Use a different email</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.linkWrap, { marginTop: 8 }]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.linkText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D2A',
    justifyContent: 'center',
    padding: 24,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#1C1F4A',
    borderRadius: 16,
    padding: 24,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#0B0D2A',
    color: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  submitBtn: {
    backgroundColor: '#5568FE',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkWrap: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    color: '#6CA0FF',
    fontSize: 15,
  },
  successIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  successTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  successMessage: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  backBtn: {
    backgroundColor: '#5568FE',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  backBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
