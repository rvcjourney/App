import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { supabase } from '../../supabase';
import { isProfileComplete } from '../database/database';
import logger from '../utils/logger';
import COLORS from '../constants/appColors';
import AuthStack from './AuthStack';
import StudentStack from './StudentStack';
import TeacherStack from './TeacherStack';
import AdminStack from './AdminStack';
import EmailVerificationScreen from './EmailVerificationScreen';

export default function RootNavigator() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(null);
  const [profileComplete, setProfileComplete] = useState(null);

  // Initialize auth session
  useEffect(() => {
    logger.info('RootNavigator: Initializing auth');

    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        logger.info('RootNavigator: Current session:', currentSession?.user?.id);
        setSession(currentSession);

        if (currentSession?.user) {
          await fetchRole(currentSession.user);
        }
      } catch (err) {
        logger.error('RootNavigator: Auth init error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      logger.info('RootNavigator: Auth state changed:', event, newSession?.user?.id);
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
      logger.info('RootNavigator: Fetching role and verification status for user:', userId);

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
          const normalizedRole = (profile.role || '').toLowerCase().replace('learner', 'student') || profile.role;
          logger.success('RootNavigator: Role fetched:', profile.role, '->', normalizedRole, 'Verified:', profile.email_verified);
          setRole(normalizedRole);
          setEmailVerified(profile.email_verified || false);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          logger.wait(`RootNavigator: Retry ${attempts}/${maxAttempts} - waiting for profile sync...`);
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        }
      }

      // Fallback: use role from signup metadata (normalize learner -> student)
      const metaRole = (user?.user_metadata?.role || '').toLowerCase().replace('learner', 'student');
      if (metaRole === 'teacher' || metaRole === 'student') {
        logger.warn('RootNavigator: Using role from user_metadata:', metaRole);
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
      logger.error('RootNavigator: Failed to fetch role:', err.message);
      const metaRole = (user?.user_metadata?.role || '').toLowerCase().replace('learner', 'student');
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.ADMIN_BG }}>
        <ActivityIndicator size="large" color={COLORS.ADMIN_INDICATOR} />
      </View>
    );
  }

  // Not authenticated - show auth screens
  if (!session) {
    logger.info('RootNavigator: No session, showing AuthStack');
    return <AuthStack />;
  }

  // Authenticated but role/verification not loaded yet
  if (!role || emailVerified === null) {
    logger.info('RootNavigator: Session exists, waiting for role and verification status');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.ADMIN_BG }}>
        <ActivityIndicator size="large" color={COLORS.ADMIN_INDICATOR} />
        <Text style={{ color: COLORS.TEXT, marginTop: 10 }}>Loading your dashboard...</Text>
      </View>
    );
  }

  // Check if email is not verified - show OTP screen (super_admin skips verification)
  if (role !== 'super_admin' && !emailVerified) {
    logger.info('RootNavigator: Email not verified, showing verification screen');
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
          logger.success('RootNavigator: Email verification complete, refreshing...');
          setEmailVerified(true);
        }}
      />
    );
  }

  // Wait for profile-completion check (done in useEffect above)
  if (profileComplete === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.ADMIN_BG }}>
        <ActivityIndicator size="large" color={COLORS.ADMIN_INDICATOR} />
        <Text style={{ color: COLORS.TEXT, marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  // When profile is incomplete we still show the dashboard; snackbar there prompts "Go to edit profile"
  if (profileComplete === false) {
    logger.info('RootNavigator: Profile incomplete, showing dashboard with snackbar prompt');
  }

  // Authenticated, verified - show role-based stack (snackbar on dashboard if profile incomplete)
  logger.info('RootNavigator: Showing stack for role:', role);

  // Route based on role (consolidate admin and super_admin)
  if (role === 'super_admin' || role === 'admin') {
    return <AdminStack />;
  }

  if (role === 'teacher') {
    return <TeacherStack />;
  }

  if (role === 'student' || role === 'learner') {
    return <StudentStack />;
  }

  // Invalid role
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.ADMIN_BG }}>
      <Text style={{ color: COLORS.TEXT, fontSize: 18 }}>Invalid role: {role}</Text>
      <Text style={{ color: COLORS.TEXT_MUTED, marginTop: 10 }}>Please contact support</Text>
    </View>
  );
}
