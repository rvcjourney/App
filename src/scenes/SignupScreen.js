import React, { useState } from 'react';
import { supabase } from '../../supabase';
import { createTeacherProfile, createStudentProfile } from '../database/database';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';

export default function SignupScreen({ navigation, route }) {
  const { role } = route.params;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!fullName || !email || !password) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    setLoading(true);

    try {
      // Sign up user (options.data so RootNavigator can use role if profile isn't ready yet)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role, full_name: fullName } },
      });

      if (error) {
        Alert.alert('Signup Error', error.message);
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
        console.error('❌ Profile creation error:', profileError);
        Alert.alert('Error', 'Failed to create profile: ' + profileError.message);
        setLoading(false);
        return;
      }

      console.log('✅ Profile created successfully');

      // Create role-specific profile row so edits save to teacher_profiles / student_profiles
      try {
        if (role === 'teacher') {
          await createTeacherProfile(data.user.id);
        } else {
          await createStudentProfile(data.user.id);
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
      console.error('❌ Signup error:', err);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Sign Up as {role === 'teacher' ? 'Teacher' : 'Student'}
      </Text>

      <TextInput
        placeholder="Full Name"
        placeholderTextColor="#999"
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
      />

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
        style={styles.signupBtn}
        onPress={handleSignup}
        disabled={loading}
      >
        <Text style={styles.signupText}>
          {loading ? 'Creating...' : 'Create Account'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.loginText}>
          Already have an account? Login
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

    signupBtn: {
        backgroundColor: '#1E2BFF',
        padding: 15,
        borderRadius: 30,
        alignItems: 'center',
        marginTop: 10,
    },

    signupText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },

    loginText: {
        color: '#6CA0FF',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    },
});
