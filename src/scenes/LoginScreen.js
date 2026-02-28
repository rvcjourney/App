import React, { useState } from 'react';
import { supabase } from '../../supabase';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';

const isNetworkError = (error) => {
  if (!error) return false;
  const errorMsg = (error.message || '').toLowerCase();
  return errorMsg.includes('network') || 
         errorMsg.includes('failed to fetch') || 
         errorMsg.includes('enotfound') || 
         errorMsg.includes('econnrefused') ||
         errorMsg.includes('timeout') ||
         errorMsg.includes('offline');
};

export default function LoginScreen({ navigation, route }) {
  const { role } = route.params;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email & password required');
      return;
    }

    setLoading(true);
    setNetworkError(false);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (isNetworkError(error)) {
          setNetworkError(true);
        } else {
          // User-friendly messages for common Supabase errors
          let message = error.message;
          if (error.message?.includes('Invalid login credentials')) {
            message = 'Invalid email or password. Please check and try again.';
          } else if (error.message?.includes('Email not confirmed')) {
            message = 'Please confirm your email first. Check your inbox for the verification link.';
          }
          Alert.alert('Login Error', message);
        }
        setLoading(false);
        return;
      }

      // Fetch profile to check role and email verification
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, email_verified')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        if (isNetworkError(profileError)) {
          setNetworkError(true);
        } else {
          await supabase.auth.signOut();
          const detail = profileError?.message || 'No profile found.';
          Alert.alert(
            'Profile Error',
            `Could not load your profile. ${detail}\n\nIf you just signed up, try closing and reopening the app.`
          );
        }
        setLoading(false);
        return;
      }

      // Ensure user is logging in from the correct section (teacher vs student)
      // Super admin can log in from either Student or Teacher entry point
      const profileRole = (profile.role || '').toLowerCase();
      const selectedRole = (role || '').toLowerCase();
      if (profileRole !== 'super_admin' && profileRole !== selectedRole) {
        await supabase.auth.signOut();
        const actualLabel = profileRole === 'teacher' ? 'Teacher' : 'Student';
        Alert.alert(
          'Wrong login section',
          `You are registered as a ${actualLabel}. Please go back and use the "${actualLabel}" login option.`
        );
        setLoading(false);
        return;
      }

      // Check if email is verified
      if (!profile.email_verified) {
        // Send OTP for verification
        navigation.navigate('OTPVerification', {
          email,
          fullName: '',
          role,
          userId: data.user.id,
          isSignup: false,
        });
      } else {
        // Email already verified
        // RootNavigator will automatically detect the new session and route accordingly
        // No need to navigate - auth state change will trigger re-render
      }
    } catch (err) {
      if (isNetworkError(err)) {
        setNetworkError(true);
      } else {
        Alert.alert('Error', err?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNetworkErrorDismiss = () => {
    setNetworkError(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Login as {role === 'teacher' ? 'Teacher' : 'Student'}
      </Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#999"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        editable={!loading}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        editable={!loading}
      />

      <TouchableOpacity
        onPress={() => navigation.navigate('ResetPassword', { role })}
        disabled={loading}
        style={styles.forgotWrap}
      >
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.loginBtn}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.loginText}>
          {loading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Signup', { role })}
        disabled={loading}
      >
        <Text style={styles.signupText}>
          Don't have an account? Sign Up
        </Text>
      </TouchableOpacity>

      {/* Network Error Modal */}
      <Modal
        visible={networkError}
        transparent={true}
        animationType="fade"
        onRequestClose={handleNetworkErrorDismiss}
      >
        <TouchableWithoutFeedback onPress={handleNetworkErrorDismiss}>
          <View style={styles.networkErrorOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.networkErrorCard}>
                <Text style={styles.networkErrorIcon}>📡</Text>
                <Text style={styles.networkErrorTitle}>Network is Not Connected</Text>
                <Text style={styles.networkErrorMessage}>
                  Please check your internet connection and try again.
                </Text>
                <TouchableOpacity
                  style={styles.networkErrorBtn}
                  onPress={handleNetworkErrorDismiss}
                >
                  <Text style={styles.networkErrorBtnText}>OK</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
    textAlign: 'center',
    marginBottom: 30,
  },

  input: {
    backgroundColor: '#1C1F4A',
    color: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },

  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  forgotText: {
    color: '#6CA0FF',
    fontSize: 14,
  },
  loginBtn: {
    backgroundColor: '#1E2BFF',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
  },

  loginText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },

  signupText: {
    color: '#6CA0FF',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },

  networkErrorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  networkErrorCard: {
    backgroundColor: '#1C1F4A',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },

  networkErrorIcon: {
    fontSize: 48,
    marginBottom: 15,
  },

  networkErrorTitle: {
    color: '#FF6B6B',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },

  networkErrorMessage: {
    color: '#AAA',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },

  networkErrorBtn: {
    backgroundColor: '#5568FE',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
  },

  networkErrorBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
