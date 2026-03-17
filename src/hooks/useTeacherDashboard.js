import { useState, useCallback, useEffect, useRef } from 'react';
import databaseApi from '../database/databaseApi';
import logger from '../utils/logger';
import Toast from 'react-native-simple-toast';

/**
 * Custom hook to manage teacher dashboard state
 * Encapsulates profile, bookings, earnings, and notification state
 */
export const useTeacherDashboard = () => {
  // Teacher Profile
  const [teacherId, setTeacherId] = useState(null);
  const [teacherName, setTeacherName] = useState('Teacher Name');
  const [pricePerCall, setPricePerCall] = useState(0);
  const [rating, setRating] = useState(0.0);
  const [followers, setFollowers] = useState(0);
  const [specializations, setSpecializations] = useState('Subject Name');
  const [teacherStatus, setTeacherStatus] = useState('offline');
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  // Bookings
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [todayCallHistory, setTodayCallHistory] = useState([]);

  // Earnings
  const [earningsData, setEarningsData] = useState({
    weekly: [
      { day: 'Mon', amount: 0 },
      { day: 'Tue', amount: 0 },
      { day: 'Wed', amount: 0 },
      { day: 'Thu', amount: 0 },
      { day: 'Fri', amount: 0 },
      { day: 'Sat', amount: 0 },
      { day: 'Sun', amount: 0 },
    ],
    monthly: [
      { month: 'Week 1', amount: 0 },
      { month: 'Week 2', amount: 0 },
      { month: 'Week 3', amount: 0 },
      { month: 'Week 4', amount: 0 },
      { month: 'Week 5', amount: 0 },
    ],
    yearly: [
      { month: 'Jan', amount: 0 },
      { month: 'Feb', amount: 0 },
      { month: 'Mar', amount: 0 },
      { month: 'Apr', amount: 0 },
      { month: 'May', amount: 0 },
      { month: 'Jun', amount: 0 },
      { month: 'Jul', amount: 0 },
      { month: 'Aug', amount: 0 },
      { month: 'Sep', amount: 0 },
      { month: 'Oct', amount: 0 },
      { month: 'Nov', amount: 0 },
      { month: 'Dec', amount: 0 },
    ],
  });
  const [todayEarnings, setTodayEarnings] = useState({
    totalAmount: 0,
    sessionsCount: 0,
    pendingAmount: 0,
    pendingCount: 0,
  });
  const [earningsLoading, setEarningsLoading] = useState(false);

  // Notifications
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Prevent concurrent refreshAll calls and track first load
  const isRefreshingRef = useRef(false);
  const isInitializedRef = useRef(false);

  // Fetch teacher profile and related data
  const fetchTeacherProfile = useCallback(async (userId) => {
    try {
      // Only show loading on first load
      if (!isInitializedRef.current) {
        setLoading(true);
      }

      if (!userId) {
        logger.warn('No user ID provided');
        return null;
      }

      logger.info('Fetching teacher profile via backend API...');

      setTeacherId(userId);

      // Get teacher profile from backend
      const response = await databaseApi.getProfile(userId);
      const profile = response.profile;

      if (profile?.full_name) {
        setTeacherName(profile.full_name);
      }

      if (profile) {
        setPricePerCall(profile.price_per_call || 500);
        setRating(profile.rating || 4.8);
        setFollowers(profile.followers || 0);
        setSpecializations(profile.specializations || '');

        const status = profile.availability_status;
        if (status === 'online' || status === 'away' || status === 'offline') {
          setTeacherStatus(status);
        }

        const hasContent = (profile.specializations || '').trim() || (profile.bio || '').trim();
        setProfileIncomplete(!hasContent);
      } else {
        setProfileIncomplete(true);
      }

      logger.success('Teacher profile loaded');

      // Mark as initialized after first successful load
      if (!isInitializedRef.current) {
        isInitializedRef.current = true;
        setLoading(false);
      }

      return userId;
    } catch (error) {
      logger.error('Error fetching teacher profile:', error);
      throw error;
    }
  }, []);

  // Fetch teacher's bookings
  const fetchTeacherBookings = useCallback(async (userId) => {
    try {
      if (!userId) return;
      logger.info('Fetching teacher bookings...');

      const bookingsData = await getTeacherBookings(userId);
      if (bookingsData && bookingsData.length > 0) {
        const now = new Date();
        const startOfTodayUTC = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
        );

        const upcoming = bookingsData.filter(b => {
          const bookedAt = new Date(b.booked_date);
          return bookedAt >= startOfTodayUTC && (b.status === 'confirmed' || b.status === 'ongoing');
        });

        setUpcomingBookings(upcoming);
        logger.success('Bookings loaded:', upcoming.length);
      } else {
        setUpcomingBookings([]);
      }
    } catch (error) {
      logger.error('Error fetching bookings:', error);
      setUpcomingBookings([]);
      throw error;
    }
  }, []);

  // Fetch today's call history
  const fetchTodayCallHistory = useCallback(async (userId) => {
    try {
      if (!userId) return;
      logger.info('Fetching today call history...');

      const historyData = await getTeacherTodayCallHistory(userId);
      setTodayCallHistory(historyData || []);
      logger.success('Call history loaded');
    } catch (error) {
      logger.error('Error fetching call history:', error);
      setTodayCallHistory([]);
      throw error;
    }
  }, []);

  // Fetch earnings data
  const fetchEarnings = useCallback(async (userId) => {
    try {
      if (!userId) return;
      setEarningsLoading(true);
      logger.info('Fetching earnings data...');

      const earnings = await getTeacherEarnings(userId);
      if (earnings) {
        setEarningsData(earnings);
      }

      // Fetch today's earnings
      const todayData = await getTeacherTodayEarnings(userId);
      setTodayEarnings(todayData);

      logger.success('Earnings data loaded');
    } catch (error) {
      logger.error('Error fetching earnings:', error);
    } finally {
      setEarningsLoading(false);
    }
  }, []);

  // Refresh all data (deduplicated to prevent concurrent calls)
  const refreshAll = useCallback(async () => {
    // Skip if already refreshing
    if (isRefreshingRef.current) {
      logger.warn('Dashboard refresh already in progress, skipping duplicate request');
      return;
    }

    isRefreshingRef.current = true;
    try {
      const userId = await fetchTeacherProfile();
      if (userId) {
        await Promise.all([
          fetchTeacherBookings(userId),
          fetchTodayCallHistory(userId),
          fetchEarnings(userId),
        ]);
      }
    } catch (error) {
      logger.error('Error refreshing dashboard:', error);
      throw error;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [fetchTeacherProfile, fetchTeacherBookings, fetchTodayCallHistory, fetchEarnings]);

  return {
    // Profile
    teacherId,
    teacherName,
    pricePerCall,
    rating,
    followers,
    specializations,
    teacherStatus,
    profileIncomplete,
    loading,

    // Bookings
    upcomingBookings,
    todayCallHistory,

    // Earnings
    earningsData,
    todayEarnings,
    earningsLoading,

    // Notifications
    unreadNotificationCount,
    setUnreadNotificationCount,

    // Status
    teacherStatus,
    setTeacherStatus,

    // Methods
    fetchTeacherProfile,
    fetchTeacherBookings,
    fetchTodayCallHistory,
    fetchEarnings,
    refreshAll,
  };
};
