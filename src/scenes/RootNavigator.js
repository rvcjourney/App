import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { supabase } from '../../supabase';
import { isProfileComplete } from '../database/database';
import AuthStack from './AuthStack';
import StudentStack from './StudentStack';
import TeacherStack from './TeacherStack';
import EmailVerificationScreen from './EmailVerificationScreen';

export default function RootNavigator() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(null);
  const [profileComplete, setProfileComplete] = useState(null);

  // Initialize auth session
  useEffect(() => {
    console.log('🔵 RootNavigator: Initializing auth');
    
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('🔵 RootNavigator: Current session:', currentSession?.user?.id);
        setSession(currentSession);
        
        if (currentSession?.user) {
          await fetchRole(currentSession.user);
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
        await fetchRole(newSession.user);
        setProfileComplete(null);
      } else {
        setRole(null);
        setProfileComplete(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Fetch user role from profiles table (user = full auth user object for fallback)
  const fetchRole = async (user) => {
    const userId = user?.id;
    if (!userId) return;

    try {
      console.log('🔵 RootNavigator: Fetching role and verification status for user:', userId);

      // Retry logic in case profile is not synced yet (e.g. right after signup)
      const maxAttempts = 6;
      const retryDelayMs = 600;
      let attempts = 0;
      let profile = null;
      let error = null;

      while (attempts < maxAttempts) {
        const result = await supabase
          .from('profiles')
          .select('role, email_verified')
          .eq('id', userId)
          .limit(1);

        const rows = result.data;
        error = result.error;
        profile = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

        if (!error && profile?.role) {
          console.log('✅ RootNavigator: Role fetched:', profile.role, 'Verified:', profile.email_verified);
          setRole(profile.role);
          setEmailVerified(profile.email_verified || false);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          console.log(`⏳ RootNavigator: Retry ${attempts}/${maxAttempts} - waiting for profile sync...`);
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        }
      }

      // Fallback: use role from signup metadata so teacher doesn't land on student dashboard
      const metaRole = user?.user_metadata?.role;
      if (metaRole === 'teacher' || metaRole === 'student') {
        console.log('⚠️ RootNavigator: Using role from user_metadata:', metaRole);
        setRole(metaRole);
        setEmailVerified(false);
        return;
      }

      if (error) {
        throw new Error(`Failed after ${maxAttempts} attempts: ${error?.message || 'unknown'}`);
      }
      if (!profile?.role) {
        throw new Error('Role not found in profile after retries');
      }
    } catch (err) {
      console.error('🔴 RootNavigator: Failed to fetch role:', err.message);
      const metaRole = user?.user_metadata?.role;
      if (metaRole === 'teacher' || metaRole === 'student') {
        setRole(metaRole);
      } else {
        setRole('student');
      }
      setEmailVerified(false);
    }
  };

  // When session + role + emailVerified are set, check if role-specific profile is complete
  useEffect(() => {
    if (!session?.user?.id || !role || emailVerified !== true) return;
    let cancelled = false;
    isProfileComplete(role, session.user.id)
      .then((complete) => {
        if (!cancelled) setProfileComplete(complete);
      })
      .catch(() => {
        if (!cancelled) setProfileComplete(false);
      });
    return () => { cancelled = true; };
  }, [session?.user?.id, role, emailVerified]);

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

  // Wait for profile-completion check (done in useEffect above)
  if (profileComplete === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0D2A' }}>
        <ActivityIndicator size="large" color="#2ECC71" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  // When profile is incomplete we still show the dashboard; snackbar there prompts "Go to edit profile"
  if (profileComplete === false) {
    console.log('🔵 RootNavigator: Profile incomplete, showing dashboard with snackbar prompt');
  }

  // Authenticated, verified - show role-based stack (snackbar on dashboard if profile incomplete)
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
