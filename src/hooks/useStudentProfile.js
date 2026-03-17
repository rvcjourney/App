import { useState, useCallback, useEffect, useRef } from 'react';
import databaseApi from '../database/databaseApi';
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
  const fetchStudentProfile = useCallback(async (userId) => {
    // Skip if already fetching
    if (isProfileFetchingRef.current) {
      logger.warn('Student profile fetch already in progress, skipping duplicate request');
      return null;
    }

    if (!userId) {
      logger.warn('No user ID provided');
      return null;
    }

    isProfileFetchingRef.current = true;
    try {
      logger.info('Fetching student profile via backend API...');
      setStudentId(userId);

      // Get student profile from backend
      const response = await databaseApi.getProfile(userId);
      const profile = response.profile;

      if (profile?.full_name) {
        setStudentName(profile.full_name);
      }

      // Check if profile is complete (has grade_level or subjects_interested)
      const isComplete = profile?.grade_level || profile?.subjects_interested;
      setProfileIncomplete(!isComplete);

      logger.success('Student profile fetched');
      return userId;
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
      logger.info('Fetching student bookings via backend API...');
      const bookingsData = await databaseApi.getStudentBookings(userId);
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

    if (!studentId) {
      logger.warn('No student ID available');
      return;
    }

    isProfileFetchingRef.current = true;
    try {
      logger.info('Refreshing student profile via backend API...');

      // Fetch and update profile
      const response = await databaseApi.getProfile(studentId);
      const profile = response.profile;

      if (profile?.full_name) {
        setStudentName(profile.full_name);
      }

      // Check profile completeness
      const isComplete = profile?.grade_level || profile?.subjects_interested;
      setProfileIncomplete(!isComplete);

      // Refresh bookings in parallel
      if (!isBookingsFetchingRef.current) {
        isBookingsFetchingRef.current = true;
        try {
          const bookingsData = await databaseApi.getStudentBookings(studentId);
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
  }, [studentId]);

  // Setup polling for bookings and notifications (replaces real-time subscriptions)
  useEffect(() => {
    let bookingsInterval;
    let notificationsInterval;
    let notificationDebounceTimer = null;
    let lastNotificationCount = 0;

    const setupPolling = async () => {
      if (!studentId) return;

      try {
        logger.info('Setting up polling for bookings and notifications...');

        // Poll bookings every 8 seconds
        bookingsInterval = setInterval(async () => {
          try {
            const bookingsData = await databaseApi.getStudentBookings(studentId);
            setMyBookings(bookingsData || []);
          } catch (error) {
            logger.error('Error polling bookings:', error);
          }
        }, 8000);

        // Poll notifications every 5 seconds
        notificationsInterval = setInterval(async () => {
          try {
            const response = await databaseApi.getUnreadNotifications(studentId, 10);
            const notificationCount = response?.length || 0;

            // Show toast if new notifications
            if (notificationCount > lastNotificationCount) {
              const newCount = notificationCount - lastNotificationCount;
              if (notificationDebounceTimer) clearTimeout(notificationDebounceTimer);
              notificationDebounceTimer = setTimeout(() => {
                Toast.show(`🔔 You have ${newCount} new notification${newCount > 1 ? 's' : ''}`);
              }, UI_CONFIG.NOTIFICATION_DEBOUNCE_MS);
            }

            lastNotificationCount = notificationCount;
            setUnreadNotificationCount(notificationCount);
          } catch (error) {
            logger.error('Error polling notifications:', error);
          }
        }, 5000);

        logger.success('Polling setup complete');
      } catch (error) {
        logger.error('Error setting up polling:', error);
      }
    };

    if (studentId) {
      setupPolling();
    }

    return () => {
      if (bookingsInterval) clearInterval(bookingsInterval);
      if (notificationsInterval) clearInterval(notificationsInterval);
      if (notificationDebounceTimer) clearTimeout(notificationDebounceTimer);
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
