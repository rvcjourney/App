import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { supabase } from '../../supabase';
import AuthStack from './AuthStack';
import StudentStack from './StudentStack';
import TeacherStack from './TeacherStack';
import EmailVerificationScreen from './EmailVerificationScreen';

export default function RootNavigator() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(null);

  // Initialize auth session
  useEffect(() => {
    console.log('🔵 RootNavigator: Initializing auth');
    
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('🔵 RootNavigator: Current session:', currentSession?.user?.id);
        setSession(currentSession);
        
        if (currentSession?.user) {
          await fetchRole(currentSession.user.id);
        }
      } catch (err) {
        console.error('🔴 RootNavigator: Auth init error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('🔵 RootNavigator: Auth state changed:', event, newSession?.user?.id);
      setSession(newSession);
      
      if (newSession?.user) {
        await fetchRole(newSession.user.id);
      } else {
        setRole(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Fetch user role from profiles table
  const fetchRole = async (userId) => {
    try {
      console.log('🔵 RootNavigator: Fetching role and verification status for user:', userId);
      
      // Retry logic in case profile is not synced yet
      let attempts = 0;
      let data = null;
      let error = null;
      
      while (attempts < 3) {
        const result = await supabase
          .from('profiles')
          .select('role, email_verified')
          .eq('id', userId)
          .single();
        
        data = result.data;
        error = result.error;
        
        if (!error && data?.role) {
          console.log('✅ RootNavigator: Role fetched:', data.role, 'Verified:', data.email_verified);
          setRole(data.role);
          setEmailVerified(data.email_verified || false);
          return;
        }
        
        attempts++;
        if (attempts < 3) {
          console.log(`⏳ RootNavigator: Retry ${attempts}/3 - waiting for profile sync...`);
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
        }
      }

      if (error) {
        throw new Error(`Failed after 3 attempts: ${error.message}`);
      }
      
      if (!data?.role) {
        throw new Error('Role not found in profile after 3 attempts');
      }
    } catch (err) {
      console.error('🔴 RootNavigator: Failed to fetch role:', err.message);
      // Set a default role to prevent infinite loading
      setRole('student');
      setEmailVerified(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0D2A' }}>
        <ActivityIndicator size="large" color="#2ECC71" />
      </View>
    );
  }

  // Not authenticated - show auth screens
  if (!session) {
    console.log('🔵 RootNavigator: No session, showing AuthStack');
    return <AuthStack />;
  }

  // Authenticated but role/verification not loaded yet
  if (!role || emailVerified === null) {
    console.log('🔵 RootNavigator: Session exists, waiting for role and verification status');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0D2A' }}>
        <ActivityIndicator size="large" color="#2ECC71" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Loading your dashboard...</Text>
      </View>
    );
  }

  // Check if email is not verified - show OTP screen
  if (!emailVerified) {
    console.log('🔵 RootNavigator: Email not verified, showing verification screen');
    return (
      <EmailVerificationScreen
        route={{
          params: {
            email: session.user.email,
            userId: session.user.id,
            role: role,
          },
        }}
        onVerificationComplete={() => {
          // Refresh email verification status
          console.log('✅ RootNavigator: Email verification complete, refreshing...');
          setEmailVerified(true);
        }}
      />
    );
  }

  // Authenticated - show role-based stack
  console.log('🔵 RootNavigator: Showing stack for role:', role);

  if (role === 'teacher') {
    return <TeacherStack />;
  }

  if (role === 'student') {
    return <StudentStack />;
  }

  // Invalid role
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0D2A' }}>
      <Text style={{ color: '#fff', fontSize: 18 }}>Invalid role: {role}</Text>
      <Text style={{ color: '#aaa', marginTop: 10 }}>Please contact support</Text>
    </View>
  );
}
