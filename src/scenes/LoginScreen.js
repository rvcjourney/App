import React, { useState } from 'react';
import { supabase } from '../../supabase';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';

export default function LoginScreen({ navigation, route }) {
  const { role } = route.params;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email & password required');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert('Login Error', error.message);
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
        await supabase.auth.signOut();
        Alert.alert('Error', 'Could not load your profile. Please try again.');
        setLoading(false);
        return;
      }

      // Ensure user is logging in from the correct section (teacher vs student)
      const profileRole = (profile.role || '').toLowerCase();
      const selectedRole = (role || '').toLowerCase();
      if (profileRole !== selectedRole) {
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
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
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
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

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
      >
        <Text style={styles.signupText}>
          Don't have an account? Sign Up
        </Text>
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
});
