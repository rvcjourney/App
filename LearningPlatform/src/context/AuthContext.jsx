import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const isSuperAdmin = profile?.role === 'super_admin';

  useEffect(() => {
    let mounted = true;
    let timedOut = false;

    const AUTH_INIT_MAX_MS = 5000;
    const PROFILE_FETCH_TIMEOUT_MS = 4000;

    const fetchProfile = (userId, userEmail) => {
      return Promise.race([
        supabase.from('profiles').select('id, full_name, role').eq('id', userId).maybeSingle(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('profile_timeout')), PROFILE_FETCH_TIMEOUT_MS)),
      ]).then((res) => {
        if (res?.error) return null;
        const prof = res?.data;
        return prof ? { ...prof, email: userEmail } : null;
      }).catch(() => null);
    };

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted || timedOut) return;
        if (!session?.user) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        setUser(session.user);
        const prof = await fetchProfile(session.user.id, session.user?.email);
        if (!mounted || timedOut) return;
        setProfile(prof);
        if (prof && prof.role !== 'super_admin') {
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          setAuthError('Only Super Admin can access this platform.');
        } else {
          setAuthError(null);
        }
      } catch (err) {
        if (mounted && !timedOut) {
          setUser(null);
          setProfile(null);
          setAuthError(err?.message || 'Auth check failed');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    let t;
    let tEarly;
    const clearTimer = () => { if (t) clearTimeout(t); if (tEarly) clearTimeout(tEarly); };
    tEarly = setTimeout(() => { if (mounted) setLoading(false); }, 1500);
    t = setTimeout(() => {
      timedOut = true;
      setLoading(false);
      setAuthError((e) => (e ? e : 'Connection timed out. Check your network and try again.'));
    }, AUTH_INIT_MAX_MS);
    init().finally(clearTimer);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setAuthError(null);
        return;
      }
      if (session?.user) {
        setUser(session.user);
        const prof = await fetchProfile(session.user.id, session.user?.email);
        setProfile(prof);
        if (prof && prof.role !== 'super_admin') {
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          setAuthError('Only Super Admin can access this platform.');
        } else {
          setAuthError(null);
        }
      }
    });

    return () => {
      mounted = false;
      timedOut = true;
      clearTimer();
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message || 'Login failed');
      throw error;
    }

    const PROFILE_TIMEOUT_MS = 10000; // Increased timeout to 10 seconds

    try {
      // Fetch profile with timeout
      const { data: prof, error: profileErr } = await Promise.race([
        supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('id', data.user.id)
          .maybeSingle(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Profile fetch timed out. Please try again.')), PROFILE_TIMEOUT_MS)
        ),
      ]);

      if (profileErr) {
        console.error('Profile fetch error:', profileErr);
        setAuthError('Could not load your profile. Please try again.');
        await supabase.auth.signOut();
        throw new Error(profileErr.message);
      }

      // If profile doesn't exist, create it
      if (!prof) {
        console.warn('Profile not found, creating new profile...');
        const { data: newProfile, error: createErr } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            full_name: data.user?.user_metadata?.full_name || 'User',
            role: 'super_admin', // Default to super_admin for login attempt
            email_verified: true,
          }])
          .select('id, full_name, role')
          .single();

        if (createErr) {
          console.error('Profile creation error:', createErr);
          setAuthError('Could not create your profile. Please try again.');
          await supabase.auth.signOut();
          throw new Error(createErr.message);
        }

        setUser(data.user);
        setProfile(newProfile ? { ...newProfile, email: data.user?.email } : null);
        setAuthError(null);
        return data;
      }

      // Check if user is super_admin
      if (prof?.role !== 'super_admin') {
        console.warn('User does not have super_admin role:', prof?.role);
        await supabase.auth.signOut();
        setAuthError('Only Super Admin can access this platform. Your account role: ' + (prof?.role || 'unknown'));
        throw new Error('Not super admin');
      }

      setUser(data.user);
      setProfile(prof ? { ...prof, email: data.user?.email } : null);
      setAuthError(null);
      return data;
    } catch (err) {
      // Only set error if not already set
      if (!authError) {
        setAuthError(err?.message || 'Login failed. Please try again.');
      }
      await supabase.auth.signOut();
      throw err;
    }
  };

  const logout = async () => {
    setAuthError(null);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      authError,
      setAuthError,
      isSuperAdmin,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
