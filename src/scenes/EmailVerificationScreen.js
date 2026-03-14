import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { supabase } from '../../supabase';
import UNIFIED_THEME from '../constants/unifiedTheme';
import ThemedText from '../components/ThemedText';
import { API_URL } from '../api/api';

const BACKEND_URL = process.env.REACT_APP_AUTH_URL || API_URL;

/**
 * Email Verification Screen
 * Shows when user needs to verify their email via OTP
 * Used for both signup and first login
 */
export default function EmailVerificationScreen({ route, onVerificationComplete }) {
  const { email, userId, role } = route?.params || {};

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(0);
  const [pageEmail, setPageEmail] = useState(email || '');

  // Auto-start OTP sending on screen load
  useEffect(() => {
    if (pageEmail) {
      sendOTP();
    }
  }, []);

  // Timer for resend button
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const sendOTP = async () => {
    if (!pageEmail) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    try {
      setResending(true);
      console.log('📧 Sending OTP to:', pageEmail);
      console.log('🔗 Backend URL:', BACKEND_URL);

      const response = await fetch(`${BACKEND_URL}/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: pageEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ OTP Send Error:', data);
        Alert.alert(
          'Error Sending OTP',
          `${data.error || 'Failed to send OTP'}\n\nMake sure:\n1. Backend is running\n2. Email is configured\n3. Backend URL is correct`
        );
        return;
      }

      console.log('✅ OTP sent successfully');
      Alert.alert('Success', `OTP sent to ${pageEmail}`);
      setTimer(60); // 60 second cooldown
    } catch (error) {
      console.error('❌ Network Error:', error.message);
      Alert.alert(
        'Connection Error',
        `Cannot reach backend at ${BACKEND_URL}\n\nMake sure backend is running on port 3000`
      );
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    if (!pageEmail) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    setLoading(true);

    try {
      // Verify OTP with backend
      const response = await fetch(`${BACKEND_URL}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: pageEmail, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          'Verification Failed',
          data.error || 'Invalid OTP. Please try again.'
        );
        setOtp('');
        return;
      }

      console.log('✅ OTP verified successfully');

      // Update profile with email_verified = true
      if (userId) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            email_verified: true,
            verified_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (updateError) {
          console.error('⚠️ Profile update error (non-critical):', updateError);
          // Don't fail, continue anyway
        } else {
          console.log('✅ Profile marked as verified');
        }
      }

      Alert.alert('Success', 'Email verified successfully!');
      
      // Call the callback to notify parent component
      if (onVerificationComplete) {
        onVerificationComplete();
      }
    } catch (error) {
      console.error('❌ OTP verification error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ThemedText variant="heading" size="lg" style={styles.title}>Verify Your Email</ThemedText>

      <ThemedText color="muted" size="sm" style={styles.subtitle}>
        We've sent a 6-digit OTP to:
      </ThemedText>

      <ThemedText weight="600" color="accent.primary" style={styles.emailText}>{pageEmail}</ThemedText>

      <TextInput
        placeholder="Enter 6-digit OTP"
        placeholderTextColor={UNIFIED_THEME.colors.text.muted}
        style={styles.otpInput}
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={6}
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.verifyBtn, loading && styles.disabledBtn, !loading && UNIFIED_THEME.shadows.medium]}
        onPress={handleVerifyOTP}
        disabled={loading}
      >
        <ThemedText weight="600" color="onAccent">
          {loading ? 'Verifying...' : 'Verify OTP'}
        </ThemedText>
      </TouchableOpacity>

      <View style={styles.resendContainer}>
        <ThemedText size="sm" color="muted">Didn't receive OTP?</ThemedText>
        <TouchableOpacity
          onPress={sendOTP}
          disabled={timer > 0 || resending}
        >
          <ThemedText size="sm" color={timer > 0 || resending ? "muted" : "accent.primary"} style={styles.resendLink}>
            {resending ? 'Sending...' : timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
          </ThemedText>
        </TouchableOpacity>
      </View>
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

  title: {
    textAlign: 'center',
    marginBottom: UNIFIED_THEME.spacing.md,
  },

  subtitle: {
    textAlign: 'center',
    marginBottom: UNIFIED_THEME.spacing.sm,
  },

  emailText: {
    textAlign: 'center',
    marginBottom: UNIFIED_THEME.spacing.xxxl,
  },

  otpInput: {
    backgroundColor: UNIFIED_THEME.colors.component.input,
    color: UNIFIED_THEME.colors.text.primary,
    padding: UNIFIED_THEME.spacing.lg,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    marginBottom: UNIFIED_THEME.spacing.lg,
    fontSize: 24,
    letterSpacing: 10,
    textAlign: 'center',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.default,
  },

  verifyBtn: {
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    padding: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.round,
    alignItems: 'center',
    marginTop: UNIFIED_THEME.spacing.lg,
  },

  disabledBtn: {
    backgroundColor: UNIFIED_THEME.colors.border.light,
    shadowOpacity: 0,
    elevation: 0,
  },

  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: UNIFIED_THEME.spacing.lg,
    alignItems: 'center',
    gap: UNIFIED_THEME.spacing.xs,
  },

  resendLink: {
    marginLeft: UNIFIED_THEME.spacing.xs,
  },
});
