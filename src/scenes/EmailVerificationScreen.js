import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { supabase } from '../../supabase';

const BACKEND_URL = process.env.REACT_APP_AUTH_URL || 'http://192.168.1.19:3000';

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
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Email</Text>

      <Text style={styles.subtitle}>
        We've sent a 6-digit OTP to:
      </Text>

      <Text style={styles.emailText}>{pageEmail}</Text>

      <TextInput
        placeholder="Enter 6-digit OTP"
        placeholderTextColor="#999"
        style={styles.otpInput}
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={6}
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.verifyBtn, loading && styles.disabledBtn]}
        onPress={handleVerifyOTP}
        disabled={loading}
      >
        <Text style={styles.verifyText}>
          {loading ? 'Verifying...' : 'Verify OTP'}
        </Text>
      </TouchableOpacity>

      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>Didn't receive OTP?</Text>
        <TouchableOpacity
          onPress={sendOTP}
          disabled={timer > 0 || resending}
        >
          <Text style={[
            styles.resendLink,
            (timer > 0 || resending) && styles.disabledLink
          ]}>
            {resending ? 'Sending...' : timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D2A',
    justifyContent: 'center',
    padding: 20,
  },

  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 15,
  },

  subtitle: {
    color: '#AAA',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },

  emailText: {
    color: '#1E2BFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 30,
  },

  otpInput: {
    backgroundColor: '#1C1F4A',
    color: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 24,
    letterSpacing: 10,
    textAlign: 'center',
    fontWeight: '600',
  },

  verifyBtn: {
    backgroundColor: '#1E2BFF',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
  },

  disabledBtn: {
    backgroundColor: '#888',
  },

  verifyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },

  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    alignItems: 'center',
  },

  resendText: {
    color: '#AAA',
    fontSize: 14,
    marginRight: 5,
  },

  resendLink: {
    color: '#1E2BFF',
    fontSize: 14,
    fontWeight: '600',
  },

  disabledLink: {
    color: '#666',
  },
});
