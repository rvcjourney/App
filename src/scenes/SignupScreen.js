import React, { useState } from 'react';
import { supabase } from '../../supabase';
import { createTeacherProfile, createStudentProfile } from '../database/database';
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

export default function SignupScreen({ navigation, route }) {
  const { role } = route.params;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  const handleSignup = async () => {
    if (!fullName || !email || !password) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    setLoading(true);
    setNetworkError(false);

    try {
      // Sign up user (options.data so RootNavigator can use role if profile isn't ready yet)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role, full_name: fullName } },
      });

      if (error) {
        if (isNetworkError(error)) {
          setNetworkError(true);
        } else {
          Alert.alert('Signup Error', error.message);
        }
        setLoading(false);
        return;
      }

      console.log('✅ Signup successful, user ID:', data.user.id);

      // Save user profile with error handling
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        role: role,
        email_verified: false,
      });

      if (profileError) {
        if (isNetworkError(profileError)) {
          setNetworkError(true);
        } else {
          console.error('❌ Profile creation error:', profileError);
          Alert.alert('Error', 'Failed to create profile: ' + profileError.message);
        }
        setLoading(false);
        return;
      }

      console.log('✅ Profile created successfully');

      // Create role-specific profile row (with name and email for admin list)
      try {
        const nameAndEmail = { full_name: fullName, email: data.user?.email ?? email, role };
        if (role === 'teacher') {
          await createTeacherProfile(data.user.id, nameAndEmail);
        } else {
          await createStudentProfile(data.user.id, nameAndEmail);
        }
      } catch (roleProfileErr) {
        console.error('❌ Role profile creation error:', roleProfileErr);
        // Continue to OTP; they can complete profile later
      }

      // Navigate to OTP verification screen
      navigation.navigate('OTPVerification', {
        email,
        fullName,
        role,
        userId: data.user.id,
        isSignup: true,
      });
    } catch (err) {
      if (isNetworkError(err)) {
        setNetworkError(true);
      } else {
        console.error('❌ Signup error:', err);
        Alert.alert('Error', err.message);
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
        Sign Up as {role === 'teacher' ? 'Instructor' : 'Learner'}
      </ThemedText>

      <TextInput
        placeholder="Full Name"
        placeholderTextColor={UNIFIED_THEME.colors.text.muted}
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
        editable={!loading}
      />

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
        style={[styles.signupBtn, UNIFIED_THEME.shadows.medium]}
        onPress={handleSignup}
        disabled={loading}
      >
        <ThemedText weight="600" color="onAccent">
          {loading ? 'Creating...' : 'Create Account'}
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
        <ThemedText size="sm" color="accent.primary" style={styles.loginText}>
          Already have an account? Login
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

    signupBtn: {
        backgroundColor: UNIFIED_THEME.colors.accent.primary,
        padding: UNIFIED_THEME.spacing.md,
        borderRadius: UNIFIED_THEME.borderRadius.round,
        alignItems: 'center',
        marginTop: UNIFIED_THEME.spacing.lg,
    },

    loginText: {
        textAlign: 'center',
        marginTop: UNIFIED_THEME.spacing.lg,
    },
});
