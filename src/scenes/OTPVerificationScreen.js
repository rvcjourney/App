import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  View,
} from 'react-native';
import { supabase } from '../../supabase';
import UNIFIED_THEME from '../constants/unifiedTheme';
import ThemedText from '../components/ThemedText';
import { API_URL } from '../api/api';
import logger from '../utils/logger';

const BACKEND_URL = process.env.REACT_APP_AUTH_URL || API_URL;

export default function OTPVerificationScreen({ navigation, route }) {
  const { email, fullName, role, userId, isSignup } = route.params;

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(0);

  // Auto-start OTP sending on screen load
  useEffect(() => {
    sendOTP();
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
    try {
      setResending(true);
      logger.info('📧 Development Mode: Skipping actual OTP send');

      // In development, just pretend OTP was sent
      logger.info('✅ OTP would be sent to:', email);
      Alert.alert('Development Mode', `Enter any 6-digit code to proceed\n(Real OTP send is disabled)`);
      setTimer(60); // 60 second cooldown
    } catch (error) {
      logger.error('❌ Error:', error.message);
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOTP = async () => {
    // DEVELOPMENT MODE: Accept any 6-digit input or bypass completely
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter any 6-digit code (dev mode)');
      return;
    }

    setLoading(true);

    try {
      logger.info('✅ Development mode: Accepting any OTP');

      // Update user verification status in database
      if (isSignup) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            email_verified: true,
            verified_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (!updateError) {
          logger.info('✅ Profile marked as verified');
        }
      }

      Alert.alert('Success', 'Verified successfully!');
      setTimeout(() => navigation.replace('RootNavigator'), 1000);
      return;
    } catch (error) {
      logger.error('Error in dev mode:', error);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ThemedText variant="heading" size="lg" style={styles.title}>Verify Your Email</ThemedText>

      <ThemedText color="muted" size="sm" style={styles.subtitle}>
        We've sent a 6-digit OTP to:
      </ThemedText>

      <ThemedText weight="600" color="accent.primary" style={styles.emailText}>{email}</ThemedText>

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

      <TouchableOpacity
        style={styles.changeEmailBtn}
        onPress={() => navigation.goBack()}
      >
        <ThemedText size="sm" color="accent.primary">Use different email</ThemedText>
      </TouchableOpacity>
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
    padding: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    marginBottom: UNIFIED_THEME.spacing.lg,
    fontSize: 24,
    letterSpacing: 5,
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

  changeEmailBtn: {
    marginTop: UNIFIED_THEME.spacing.xxxl,
  },
});
