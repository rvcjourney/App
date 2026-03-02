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
        editable={!loading}
      />

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
        style={styles.signupBtn}
        onPress={handleSignup}
        disabled={loading}
      >
        <Text style={styles.signupText}>
          {loading ? 'Creating...' : 'Create Account'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
        <Text style={styles.loginText}>
          Already have an account? Login
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
