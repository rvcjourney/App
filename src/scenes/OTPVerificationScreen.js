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

const BACKEND_URL = process.env.REACT_APP_AUTH_URL || 'http://192.168.1.12:3000';

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
      console.log('📧 Sending OTP to:', email);
      console.log('🔗 Backend URL:', BACKEND_URL);

      const response = await fetch(`${BACKEND_URL}/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
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
      Alert.alert('Success', `OTP sent to ${email}`);
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

    setLoading(true);

    try {
      // Verify OTP with backend
      const response = await fetch(`${BACKEND_URL}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
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

      // Update user verification status in database
      if (isSignup) {
        console.log('✅ Updating profile with email_verified=true');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            email_verified: true,
            verified_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (updateError) {
          console.error('❌ Profile update error:', updateError);
          Alert.alert('Success', 'Email verified! Redirecting...');
          // Still navigate even if update fails, will retry from RootNavigator
        } else {
          console.log('✅ Profile updated successfully');
        }
      }

      Alert.alert('Success', 'Email verified successfully!');
      
      // Add small delay to ensure database is updated before navigation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Email is now verified, RootNavigator will automatically detect and route appropriately
      // Just close this screen or navigate back - auth state change will trigger re-render
      navigation.goBack();
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

      <Text style={styles.emailText}>{email}</Text>

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

      <TouchableOpacity
        style={styles.changeEmailBtn}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.changeEmailText}>Use different email</Text>
      </TouchableOpacity>
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

  changeEmailBtn: {
    marginTop: 30,
  },

  changeEmailText: {
    color: '#6CA0FF',
    textAlign: 'center',
    fontSize: 14,
  },
});
