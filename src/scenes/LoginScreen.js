import React, { useState } from 'react';
import { supabase } from '../../supabase';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { isNetworkError } from '../utils/networkUtils';
import NetworkErrorModal from '../components/NetworkErrorModal';
import UNIFIED_THEME from '../constants/unifiedTheme';
import ThemedText from '../components/ThemedText';

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
      const { data: profileRows, error: profileError } = await supabase
        .from('profiles')
        .select('role, email_verified')
        .eq('id', data.user.id)
        .limit(1);

      const profile = Array.isArray(profileRows) && profileRows.length > 0 ? profileRows[0] : profileRows;

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
        // const actualLabel = profileRole === 'teacher' ? 'Teacher' : 'Student';
        Alert.alert(
          'Wrong login section',
          // `You are registered as a ${actualLabel}. Please go back and use the "${actualLabel}" login option.`
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
    <SafeAreaView style={styles.container}>
      <ThemedText variant="heading" size="lg" style={styles.title}>
        Logging as {role === 'teacher' ? 'Instructor' : 'Learner'}
      </ThemedText>
      <TextInput
        placeholder="Email"
        placeholderTextColor={UNIFIED_THEME.colors.text.muted}
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        editable={!loading}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor={UNIFIED_THEME.colors.text.muted}
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
        <ThemedText size="sm" color="accent.primary" style={styles.forgotText}>Forgot Password?</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.loginBtn, UNIFIED_THEME.shadows.medium]}
        onPress={handleLogin}
        disabled={loading}
      >
        <ThemedText weight="600" color="onAccent">
          {loading ? 'Logging in...' : 'Login'}
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Signup', { role })}
        disabled={loading}
      >
        <ThemedText size="sm" color="accent.primary" style={styles.signupText}>
          Don't have an account? Sign Up
        </ThemedText>
      </TouchableOpacity>

      <NetworkErrorModal
        visible={networkError}
        onDismiss={handleNetworkErrorDismiss}
      />
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
    marginBottom: UNIFIED_THEME.spacing.xxxl,
  },

  input: {
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
    color: UNIFIED_THEME.colors.text.primary,
    padding: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    marginBottom: UNIFIED_THEME.spacing.md,
  },

  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: UNIFIED_THEME.spacing.sm,
  },
  forgotText: {
    marginRight: UNIFIED_THEME.spacing.sm,
  },
  loginBtn: {
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    padding: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.round,
    alignItems: 'center',
    marginTop: UNIFIED_THEME.spacing.lg,
  },

  signupText: {
    textAlign: 'center',
    marginTop: UNIFIED_THEME.spacing.lg,
  },
});
