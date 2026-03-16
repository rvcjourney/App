import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../../supabase';
import { isProfileComplete, getStudentBookings } from '../database/database';
import logger from '../utils/logger';
import Toast from 'react-native-simple-toast';
import { UI_CONFIG } from '../constants/appConfig';

/**
 * Custom hook to manage student profile data and bookings
 * Encapsulates profile fetching, validation, booking state, and real-time subscriptions
 */
export const useStudentProfile = () => {
  const [studentId, setStudentId] = useState(null);
  const [studentName, setStudentName] = useState('Student');
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // Prevent concurrent requests
  const isProfileFetchingRef = useRef(false);
  const isBookingsFetchingRef = useRef(false);

  // Fetch current user and profile info
  const fetchStudentProfile = useCallback(async () => {
    // Skip if already fetching
    if (isProfileFetchingRef.current) {
      logger.warn('Student profile fetch already in progress, skipping duplicate request');
      return null;
    }

    isProfileFetchingRef.current = true;
    try {
      logger.info('Fetching student profile...');
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        logger.warn('No authenticated user found');
        return null;
      }

      setStudentId(user.id);

      // Get student profile
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .limit(1);

      const profile = Array.isArray(profileRows) && profileRows.length > 0
        ? profileRows[0]
        : profileRows;

      if (profile?.full_name) {
        setStudentName(profile.full_name);
      }

      // Check if profile is complete
      try {
        const complete = await isProfileComplete('student', user.id);
        setProfileIncomplete(!complete);
      } catch (error) {
        logger.warn('Could not verify profile completeness:', error);
        setProfileIncomplete(true);
      }

      return user.id;
    } catch (error) {
      logger.error('Error fetching student profile:', error);
      throw error;
    } finally {
      isProfileFetchingRef.current = false;
    }
  }, []);

  // Fetch student's bookings
  const fetchStudentBookings = useCallback(async (userId) => {
    // Skip if already fetching
    if (isBookingsFetchingRef.current) {
      logger.warn('Student bookings fetch already in progress, skipping duplicate request');
      return;
    }

    isBookingsFetchingRef.current = true;
    try {
      if (!userId) return;
      logger.info('Fetching student bookings...');
      const bookingsData = await getStudentBookings(userId);
      setMyBookings(bookingsData || []);
      logger.success('Bookings loaded:', bookingsData?.length || 0);
    } catch (error) {
      logger.error('Error fetching bookings:', error);
      setMyBookings([]);
      throw error;
    } finally {
      isBookingsFetchingRef.current = false;
    }
  }, []);

  // Refresh profile (used by pull-to-refresh)
  const refreshProfile = useCallback(async () => {
    if (isProfileFetchingRef.current) {
      logger.warn('Profile refresh already in progress');
      return;
    }

    isProfileFetchingRef.current = true;
    try {
      logger.info('Refreshing student profile...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logger.warn('No authenticated user found');
        return;
      }

      // Update student ID
      setStudentId(user.id);

      // Fetch and update profile
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .limit(1);

      const profile = Array.isArray(profileRows) && profileRows.length > 0
        ? profileRows[0]
        : profileRows;

      if (profile?.full_name) {
        setStudentName(profile.full_name);
      }

      // Check profile completeness
      try {
        const complete = await isProfileComplete('student', user.id);
        setProfileIncomplete(!complete);
      } catch (err) {
        logger.warn('Could not verify profile completeness:', err);
      }

      // Refresh bookings in parallel
      if (!isBookingsFetchingRef.current) {
        isBookingsFetchingRef.current = true;
        try {
          const bookingsData = await getStudentBookings(user.id);
          setMyBookings(bookingsData || []);
        } finally {
          isBookingsFetchingRef.current = false;
        }
      }

      logger.success('Profile refreshed');
    } catch (error) {
      logger.error('Error in refreshProfile:', error?.message || error);
      throw error;
    } finally {
      isProfileFetchingRef.current = false;
    }
  }, []);

  // Setup real-time subscriptions for bookings and notifications
  useEffect(() => {
    let bookingsChannel;
    let notificationsChannel;

    const setupSubscriptions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        logger.info('Setting up real-time subscriptions for student...');

        const refreshBookingsForUser = () => {
          getStudentBookings(user.id).then(updatedBookings => {
            setMyBookings(updatedBookings || []);
            logger.info('Bookings updated in real-time');
          });
        };

        // Bookings subscription (INSERT + UPDATE events)
        bookingsChannel = supabase
          .channel(`bookings:student_${user.id}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'bookings', filter: `student_id=eq.${user.id}` },
            () => {
              logger.info('New booking received (INSERT)');
              Toast.show('📅 Your booking was confirmed.');
              refreshBookingsForUser();
            }
          )
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `student_id=eq.${user.id}` },
            (payload) => {
              logger.info('Booking updated in real-time');
              if (payload.new?.meeting_id && !payload.old?.meeting_id) {
                Toast.show('📞 Class is starting! You can now join!');
              }
              refreshBookingsForUser();
            }
          )
          .subscribe((status) => logger.info('Bookings channel status:', status));

        // Notifications subscription with debouncing
        let notificationDebounceTimer = null;
        let pendingNotification = null;
        const showNotificationToast = () => {
          if (pendingNotification) {
            const n = pendingNotification;
            Toast.show(n.title ? `${n.title}\n${n.message || ''}` : n.message || 'New notification');
            pendingNotification = null;
          }
        };

        notificationsChannel = supabase
          .channel(`notifications:student_${user.id}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
            (payload) => {
              const n = payload?.new;
              if (!n?.title && !n?.message) return;
              setUnreadNotificationCount((c) => c + 1);
              pendingNotification = n;
              if (notificationDebounceTimer) clearTimeout(notificationDebounceTimer);
              notificationDebounceTimer = setTimeout(showNotificationToast, UI_CONFIG.NOTIFICATION_DEBOUNCE_MS);
            }
          )
          .subscribe((status) => logger.info('Notifications channel status:', status));

        logger.success('Real-time subscriptions started');
      } catch (error) {
        logger.error('Error setting up subscriptions:', error);
      }
    };

    if (studentId) {
      setupSubscriptions();
    }

    return () => {
      if (bookingsChannel) supabase.removeChannel(bookingsChannel);
      if (notificationsChannel) supabase.removeChannel(notificationsChannel);
    };
  }, [studentId]);

  return {
    studentId,
    studentName,
    profileIncomplete,
    myBookings,
    unreadNotificationCount,
    setUnreadNotificationCount,
    fetchStudentProfile,
    fetchStudentBookings,
    refreshProfile,
  };
};
