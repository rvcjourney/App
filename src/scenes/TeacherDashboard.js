import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';
import { SCREEN_NAMES } from '../navigators/screenNames';
import { supabase } from '../../supabase';
import { getTeacherProfile, getTeacherBookings, getTeacherTodayCallHistory, getTeacherEarnings, getTeacherTodayEarnings } from '../database/database';
import Home from '../assets/icons/Home';
import DollarSign from '../assets/icons/DollarSign';
import Phone from '../assets/icons/Phone';
import Settings from '../assets/icons/Settings';
import BookOpen from '../assets/icons/BookOpen';
import Play from '../assets/icons/Play';
import Calendar from '../assets/icons/Calendar';
import Video from '../assets/icons/Video';
import Clock from '../assets/icons/Clock';
import Star from '../assets/icons/Star';
import Users from '../assets/icons/Users';
import ChevronRight from '../assets/icons/ChevronRight';
import User from '../assets/icons/User';
import CheckCircle from '../assets/icons/CheckCircle';
import MoneyBag from '../assets/icons/MoneyBag';


export default function TeacherDashboard({ navigation }) {
  const [activeTab, setActiveTab] = useState('home');
  const [earningsFilter, setEarningsFilter] = useState('weekly');
  const [teacherName, setTeacherName] = useState('Teacher Name');
  const [pricePerCall, setPricePerCall] = useState(0);
  const [rating, setRating] = useState(0.0);
  const [followers, setFollowers] = useState(0);
  const [specializations, setSpecializations] = useState('Subject Name');
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [todayCallHistory, setTodayCallHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacherStatus, setTeacherStatus] = useState('offline'); // 'online' | 'away' | 'offline'
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [earningsData, setEarningsData] = useState({
    weekly: [{ day: 'Mon', amount: 0 }, { day: 'Tue', amount: 0 }, { day: 'Wed', amount: 0 }, { day: 'Thu', amount: 0 }, { day: 'Fri', amount: 0 }, { day: 'Sat', amount: 0 }, { day: 'Sun', amount: 0 }],
    monthly: [{ month: 'Week 1', amount: 0 }, { month: 'Week 2', amount: 0 }, { month: 'Week 3', amount: 0 }, { month: 'Week 4', amount: 0 }, { month: 'Week 5', amount: 0 }],
    yearly: [{ month: 'Jan', amount: 0 }, { month: 'Feb', amount: 0 }, { month: 'Mar', amount: 0 }, { month: 'Apr', amount: 0 }, { month: 'May', amount: 0 }, { month: 'Jun', amount: 0 }, { month: 'Jul', amount: 0 }, { month: 'Aug', amount: 0 }, { month: 'Sep', amount: 0 }, { month: 'Oct', amount: 0 }, { month: 'Nov', amount: 0 }, { month: 'Dec', amount: 0 }]
  });
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [todayEarnings, setTodayEarnings] = useState({ totalAmount: 0, sessionsCount: 0, pendingAmount: 0, pendingCount: 0 });
  const loadTeacherProfileRef = useRef(null);

  // Function to load teacher profile data
  const loadTeacherProfile = async () => {
    try {
      console.log('🔵 [TeacherDashboard] Loading profile... Time:', new Date().toLocaleTimeString());

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get teacher profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (profile?.full_name) {
          setTeacherName(profile.full_name);
        }

        // Get teacher details
        const { data: teacherRows } = await supabase
          .from('teacher_profiles')
          .select('*')
          .eq('id', user.id)
          .limit(1);
        const teacherData = Array.isArray(teacherRows) && teacherRows.length > 0 ? teacherRows[0] : (teacherRows && !Array.isArray(teacherRows) ? teacherRows : null);

        if (teacherData) {
          setPricePerCall(teacherData.price_per_call || 500);
          setRating(teacherData.rating || 4.8);
          setFollowers(teacherData.followers || 0);
          setSpecializations(teacherData.specializations || '');
          const status = teacherData.availability_status;
          if (status === 'online' || status === 'away' || status === 'offline') {
            setTeacherStatus(status);
          }
          const hasContent = (teacherData.specializations || '').trim() || (teacherData.bio || '').trim();
          setProfileIncomplete(!hasContent);
        } else {
          // No teacher_profiles row or empty profile → show snackbar to complete profile
          setProfileIncomplete(true);
        }

        // Get teacher's bookings (include today and future; only show confirmed bookings)
        try {
          const bookingsData = await getTeacherBookings(user.id);
          console.log('📚 [TeacherDashboard] Bookings fetched:', bookingsData?.length, bookingsData);
          if (bookingsData && bookingsData.length > 0) {
            const now = new Date();
            // Use UTC dates for comparison to match ISO format in database
            const startOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            const upcoming = bookingsData.filter(b => {
              const bookedAt = new Date(b.booked_date);
              // Only show confirmed/ongoing bookings (not pending, not cancelled, not completed)
              const isUpcoming = bookedAt >= startOfTodayUTC && (b.status === 'confirmed' || b.status === 'ongoing');
              console.log(`📅 [TeacherDashboard] Booking ${b.id}: status='${b.status}', date=${bookedAt.toISOString()}, startOfToday=${startOfTodayUTC.toISOString()}, isUpcoming=${isUpcoming}`);
              return isUpcoming;
            });
            console.log('📅 [TeacherDashboard] Upcoming bookings filtered:', upcoming.length, upcoming);
            setUpcomingBookings(upcoming);
          } else {
            setUpcomingBookings([]);
          }
        } catch (bookingsErr) {
          console.error('🔴 [TeacherDashboard] Error fetching bookings:', bookingsErr);
          setUpcomingBookings([]);
          Toast.show(bookingsErr?.message || 'Could not load bookings');
        }

        // Today's call history (only visible for the current day)
        try {
          const historyData = await getTeacherTodayCallHistory(user.id);
          setTodayCallHistory(historyData || []);
        } catch (historyErr) {
          console.error('🔴 [TeacherDashboard] Error fetching call history:', historyErr);
          setTodayCallHistory([]);
        }

        // Fetch earnings data
        try {
          const earnings = await getTeacherEarnings(user.id);
          if (earnings) {
            setEarningsData(earnings);
          }
        } catch (earningsErr) {
          console.error('🔴 [TeacherDashboard] Error fetching earnings:', earningsErr);
        }

        // Fetch today's earnings
        try {
          const todayData = await getTeacherTodayEarnings(user.id);
          setTodayEarnings(todayData);
        } catch (todayErr) {
          console.error('🔴 [TeacherDashboard] Error fetching today earnings:', todayErr);
        }
      }

    } catch (error) {
      console.error('🔴 [TeacherDashboard] Error loading profile:', error);
      Toast.show('Error loading profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  loadTeacherProfileRef.current = loadTeacherProfile;
  const onRefresh = React.useCallback(() => { setRefreshing(true); loadTeacherProfile(); }, []);

  // Change status (online / away / offline) – manual only
  const handleStatusPress = () => {
    // Show options dynamically based on current status:
    // - If Online → show Away + Offline
    // - If Offline → show Away + Online
    // - If Away → show Online + Offline
    let options = [];

    if (teacherStatus === 'online') {
      options = [
        { text: 'Away', onPress: () => setStatusAndSave('away') },
        { text: 'Offline', onPress: () => setStatusAndSave('offline') },
      ];
    } else if (teacherStatus === 'offline') {
      options = [
        { text: 'Online', onPress: () => setStatusAndSave('online') },
        { text: 'Away', onPress: () => setStatusAndSave('away') },
      ];
    } else {
      // current = away
      options = [
        { text: 'Online', onPress: () => setStatusAndSave('online') },
        { text: 'Offline', onPress: () => setStatusAndSave('offline') },
      ];
    }

    Alert.alert('Set your status', 'Choose your new status:', options);
  };

  const setStatusAndSave = async (newStatus) => {
    const previousStatus = teacherStatus;
    setTeacherStatus(newStatus);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from('teacher_profiles')
        .update({ availability_status: newStatus })
        .eq('id', user.id);
      if (error) {
        setTeacherStatus(previousStatus);
        console.error('🔴 Status update error:', error);
        Toast.show(error.message || 'Failed to save status');
        return;
      }
      Toast.show(`Status set to ${newStatus}`);
    } catch (e) {
      setTeacherStatus(previousStatus);
      console.error('🔴 Status save error:', e);
      Toast.show(e?.message || 'Failed to save status');
    }
  };

  const statusColor = { online: '#22c55e', away: '#eab308', offline: '#6b7280' };
  const statusLabel = { online: 'Online', away: 'Away', offline: 'Offline' };

  // Fetch teacher profile data on mount
  useEffect(() => {
    loadTeacherProfile();
  }, []);

  // Refresh profile data when screen comes into focus (after edit)
  useFocusEffect(
    React.useCallback(() => {
      loadTeacherProfile();
    }, [])
  );

  // Real-time: bookings (INSERT + UPDATE) and notifications so changes show quickly
  useEffect(() => {
    let bookingsChannel;
    let notificationsChannel;

    const setupSubscriptions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        console.log('🔵 [TeacherDashboard] Setting up real-time subscriptions...');

        bookingsChannel = supabase
          .channel(`bookings:teacher_${user.id}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'bookings', filter: `teacher_id=eq.${user.id}` },
            (payload) => {
              console.log('📡 New booking (INSERT):', payload?.new?.id);
              Toast.show('📚 New booking! A student scheduled a session.');
              if (loadTeacherProfileRef.current) loadTeacherProfileRef.current();
            }
          )
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `teacher_id=eq.${user.id}` },
            (payload) => {
              console.log('📡 Booking updated (UPDATE):', payload?.new?.id, 'Status:', payload?.new?.status, 'Updated_at:', payload?.new?.updated_at);
              if (loadTeacherProfileRef.current) loadTeacherProfileRef.current();
            }
          )
          .subscribe((status) => console.log('📡 Bookings channel:', status));

        notificationsChannel = supabase
          .channel(`notifications:teacher_${user.id}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
            (payload) => {
              const n = payload?.new;
              if (n?.title || n?.message) Toast.show(n.title ? `${n.title}\n${n.message || ''}` : n.message);
            }
          )
          .subscribe((status) => console.log('📡 Notifications channel:', status));

        console.log('✅ [TeacherDashboard] Real-time subscriptions started');
      } catch (error) {
        console.error('🔴 Error setting up subscriptions:', error);
      }
    };

    setupSubscriptions();
    
    // Fallback: Poll for booking updates every 8 seconds (in case real-time subscriptions are slow)
    const bookingsPollInterval = setInterval(() => {
      if (loadTeacherProfileRef.current) {
        console.log('🔄 [TeacherDashboard] Polling for booking updates...');
        loadTeacherProfileRef.current();
      }
    }, 8000); // 8 seconds - more frequent to catch meeting completions faster
    
    return () => {
      clearInterval(bookingsPollInterval);
      if (bookingsChannel) supabase.removeChannel(bookingsChannel);
      if (notificationsChannel) supabase.removeChannel(notificationsChannel);
    };
  }, []);

  // Full-screen loading until profile is fetched
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5568FE" />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // HOME TAB
  if (activeTab === 'home') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {profileIncomplete && (
          <View style={styles.snackbar}>
            <Text style={styles.snackbarText}>Complete your profile for a better experience.</Text>
            <TouchableOpacity
              style={styles.snackbarBtn}
              onPress={() => {
                setProfileIncomplete(false);
                navigation.navigate(SCREEN_NAMES.EditTeacherProfile);
              }}
            >
              <Text style={styles.snackbarBtnText}>Go to edit profile</Text>
            </TouchableOpacity>
          </View>
        )}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5568FE']} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcome}>Welcome Back</Text>
              <Text style={styles.welcomeWave}>👋</Text>
            </View>
            <Text style={styles.teacherName}>{teacherName}</Text>
          </View>

          {/* Dashboard Overview */}
          <View style={styles.overviewCard}>
            <View style={styles.profileSection}>
              <TouchableOpacity onPress={handleStatusPress} style={styles.profileImageWrapper} activeOpacity={0.8}>
                <View style={styles.profileImageContainer}>
                  <User width={48} height={48} fill="#5568FE" />
                </View>
                <View style={[styles.statusDot, { backgroundColor: statusColor[teacherStatus] }]} />
              </TouchableOpacity>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{teacherName}</Text>
                <Text style={styles.profileSubtitle}>{specializations || 'Tutor'}</Text>
                <Text style={styles.statusLabel}>{statusLabel[teacherStatus]}</Text>
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>₹{pricePerCall}</Text>
                <Text style={styles.statLabel}>Per Call</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{rating}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{(followers / 1000).toFixed(1)}K</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>

          {/* Schedule Lecture - commented out
          <TouchableOpacity
            style={[styles.actionCard, styles.scheduleCard]}
            onPress={() => navigation.navigate(SCREEN_NAMES.ScheduleLecture)}
          >
            <BookOpen width={32} height={32} fill="#2ECC71" style={{ marginRight: 12 }} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Schedule Lecture</Text>
              <Text style={styles.actionSubtitle}>Plan a group class</Text>
            </View>
            <ChevronRight width={24} height={24} fill="#666" />
          </TouchableOpacity>
          */}

          {/* Go Live - commented out
          <TouchableOpacity
            style={[styles.actionCard, styles.availableCard]}
            onPress={() => navigation.navigate(SCREEN_NAMES.Join)}
          >
            <Video width={32} height={32} fill="#FF6B6B" style={{ marginRight: 12 }} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Go Live</Text>
              <Text style={styles.actionSubtitle}>Start teaching now</Text>
            </View>
            <ChevronRight width={24} height={24} fill="#666" />
          </TouchableOpacity>
          */}

          <TouchableOpacity
            style={[styles.actionCard, styles.upcomingCard]}
            onPress={() => setActiveTab('calls')}
          >
            <Calendar width={32} height={32} fill="#4ECDC4" style={{ marginRight: 12 }} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Upcoming Calls</Text>
              <Text style={styles.actionSubtitle}>{upcomingBookings.length} sessions scheduled</Text>
            </View>
            <ChevronRight width={24} height={24} fill="#666" />
          </TouchableOpacity>

          {/* Today's Earnings */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Earnings</Text>
          </View>

          <TouchableOpacity
            style={styles.earningsCard}
            onPress={() => navigation.navigate(SCREEN_NAMES.TeacherEarnings)}
            activeOpacity={0.8}
          >
            <Text style={styles.earningsAmount}>₹{todayEarnings.totalAmount.toLocaleString()}</Text>
            <Text style={styles.earningsText}>
              from {todayEarnings.sessionsCount} completed session{todayEarnings.sessionsCount !== 1 ? 's' : ''}
            </Text>
            {todayEarnings.pendingCount > 0 && (
              <Text style={styles.earningsPending}>
                ⏳ ₹{todayEarnings.pendingAmount.toLocaleString()} pending ({todayEarnings.pendingCount} session{todayEarnings.pendingCount !== 1 ? 's' : ''})
              </Text>
            )}
            <View style={styles.earningsBar}>
              <View style={[styles.earningsBarFill, { width: `${Math.min((todayEarnings.totalAmount / 5000) * 100, 100)}%` }]} />
            </View>
            {/* <Text style={styles.earningsTarget}>Target: ₹5,000/day</Text> */}
          </TouchableOpacity>

          {/* Recent Activity */}
          {/* <View style={{ height: 100 }} /> */}
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={[styles.navItem, activeTab === 'home']}
            onPress={() => setActiveTab('home')}
          >
            <Home width={24} height={24} fill={activeTab === 'home' ? '#5568FE' : '#999'} />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeTab === 'earnings']}
            onPress={() => setActiveTab('earnings')}
          >
            <DollarSign width={24} height={24} fill={activeTab === 'earnings' ? '#5568FE' : '#999'} />
            <Text style={styles.navLabel}>Earnings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeTab === 'calls']}
            onPress={() => setActiveTab('calls')}
          >
            <View style={{ position: 'relative' }}>
              <Phone width={24} height={24} fill={activeTab === 'calls' ? '#5568FE' : '#999'} />
              {upcomingBookings.filter(b => b.status === 'confirmed' && !b.meeting_id).length > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  backgroundColor: '#22c55e',
                  borderRadius: 10,
                  width: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                    {upcomingBookings.filter(b => b.status === 'confirmed' && !b.meeting_id).length}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.navLabel}>Calls</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeTab === 'settings']}
            onPress={() => setActiveTab('settings')}
          >
            <Settings width={24} height={24} fill={activeTab === 'settings' ? '#5568FE' : '#999'} />
            <Text style={styles.navLabel}>Settings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // EARNINGS TAB
  if (activeTab === 'earnings') {
    const currentData =
      earningsFilter === 'weekly'
        ? earningsData.weekly
        : earningsFilter === 'monthly'
          ? earningsData.monthly
          : earningsData.yearly;

    const totalEarnings = currentData.reduce((sum, item) => sum + item.amount, 0);
    const maxAmount = Math.max(...currentData.map(item => item.amount), 1); // Ensure at least 1 to avoid division by zero

    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5568FE']} />
          }
        >
          <View style={styles.header}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcome}>Earnings Analytics</Text>
              <DollarSign width={20} height={20} fill="#5568FE" style={{ marginLeft: 8 }} />
            </View>
          </View>

          {/* Total Earnings */}
          <View style={styles.totalEarningsCard}>
            <Text style={styles.totalEarningsLabel}>Total Earnings ({earningsFilter})</Text>
            <Text style={styles.totalEarningsAmount}>₹{totalEarnings.toLocaleString()}</Text>
          </View>

          {/* Filter Buttons */}
          <View style={styles.filterContainer}>
            {['weekly', 'monthly', 'yearly'].map(filter => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterBtn,
                  earningsFilter === filter && styles.filterBtnActive,
                ]}
                onPress={() => setEarningsFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterText,
                    earningsFilter === filter && styles.filterTextActive,
                  ]}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Chart */}
          <View style={styles.chartContainer}>
            <View style={styles.chartBars}>
              {currentData.map((item, index) => (
                <View key={index} style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      { height: (item.amount / maxAmount) * 150 },
                    ]}
                  />
                  <Text style={styles.barLabel}>{item.day || item.month}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Earnings Breakdown */}
          <View style={styles.breakdownContainer}>
            <Text style={styles.breakdownTitle}>Earnings Breakdown</Text>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Gross Earnings</Text>
              <Text style={styles.breakdownValue}>₹{Math.round(totalEarnings / 0.67).toLocaleString()}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>GST (18%)</Text>
              <Text style={styles.breakdownValue}>-₹{Math.round((totalEarnings / 0.67) * 0.18).toLocaleString()}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Platform Fee (15%)</Text>
              <Text style={styles.breakdownValue}>-₹{Math.round((totalEarnings / 0.67) * 0.15).toLocaleString()}</Text>
            </View>
            <View style={[styles.breakdownItem, styles.breakdownItemLast]}>
              <Text style={styles.breakdownLabel}>Net Earnings (67%)</Text>
              <Text style={styles.breakdownValueNet}>₹{totalEarnings.toLocaleString()}</Text>
            </View>
          </View>
          <View style={{ marginBottom: 80 }} />
        </ScrollView>
        

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('home')}
          >
            <Home width={22} height={22} fill={activeTab === 'home' ? '#5568FE' : '#999'} />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem]}
            onPress={() => setActiveTab('earnings')}
          >
            <DollarSign width={22} height={22} fill={activeTab === 'earnings' ? '#5568FE' : '#999'} />
            <Text style={styles.navLabel}>Earnings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('calls')}
          >
            <Phone width={22} height={22} fill={activeTab === 'calls' ? '#5568FE' : '#999'} />
            <Text style={styles.navLabel}>Calls</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('settings')}
          >
            <Settings width={22} height={22} fill={activeTab === 'settings' ? '#5568FE' : '#999'} />
            <Text style={styles.navLabel}>Settings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

    );
  }

  // CALLS TAB
  if (activeTab === 'calls') {
    // Show confirmed bookings (auto-confirmed when student pays - teacher availability already set)
    const confirmedBookings = upcomingBookings.filter(b => b.status === 'confirmed');
    const liveBookings = confirmedBookings.filter(b => b.meeting_id); // Meetings that have started
    const readyToStart = confirmedBookings.filter(b => !b.meeting_id); // Ready to join
    
    console.log('📊 [TeacherDashboard] Booking stats:', {
      total: upcomingBookings.length,
      confirmed: confirmedBookings.length,
      live: liveBookings.length,
      readyToStart: readyToStart.length,
    });

    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5568FE']} />
          }
        >
          <View style={styles.header}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcome}>My Calls</Text>
              <Phone width={20} height={20} fill="#5568FE" style={{ marginLeft: 8 }} />
            </View>
          </View>

          {/* Live Now */}
          {liveBookings.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: '#FF6B6B' }]}>🔴 LIVE NOW</Text>
              </View>
              {liveBookings.map(booking => (
                <TouchableOpacity
                  key={booking.id}
                  style={[styles.callCard, { borderLeftColor: '#FF6B6B', borderLeftWidth: 4 }]}
                  onPress={() => navigation.navigate(SCREEN_NAMES.Join, {
                    booking: booking,
                    isTeacher: true,
                  })}
                >
                  <View style={[styles.callTime, { backgroundColor: '#FF6B6B' }]}>
                    <Text style={styles.callTimeText}>🔴 LIVE</Text>
                  </View>
                  <View style={styles.callContent}>
                    <Text style={styles.callStudent}>{booking.student?.full_name || 'Student'}</Text>
                    <Text style={styles.callSubject}>{booking.subject}</Text>
                    <View style={styles.callMeta}>
                      <Clock width={12} height={12} fill="#999" style={{ marginRight: 4 }} />
                      <Text style={styles.callDuration}>{booking.duration_minutes} min</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                        <DollarSign width={12} height={12} fill="#2ECC71" style={{ marginRight: 4 }} />
                        <Text style={styles.callPrice}>₹{pricePerCall}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, color: '#666', marginTop: 5 }}>Meeting ID: {booking.meeting_id}</Text>
                  </View>
                  <Text style={styles.callArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Upcoming Calls - Confirmed & Ready to Start */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📅 Upcoming Calls</Text>
          </View>

          {readyToStart.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No upcoming calls</Text>
              <Text style={styles.emptySubtext}>Booked sessions will appear here</Text>
            </View>
          ) : (
            readyToStart.map(booking => (
              <TouchableOpacity
                key={booking.id}
                style={styles.callCard}
                onPress={() => navigation.navigate(SCREEN_NAMES.Join, {
                  booking: booking,
                  isTeacher: true,
                })}
              >
                <View style={styles.callTime}>
                  <Text style={styles.callTimeText}>{new Date(booking.booked_date).toLocaleTimeString()}</Text>
                </View>
                <View style={styles.callContent}>
                  <Text style={styles.callStudent}>{booking.student?.full_name || 'Student'}</Text>
                  <Text style={styles.callSubject}>{booking.subject}</Text>
                  <View style={styles.callMeta}>
                    <Clock width={12} height={12} fill="#999" style={{ marginRight: 4 }} />
                    <Text style={styles.callDuration}>{booking.duration_minutes} min</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                      <DollarSign width={12} height={12} fill="#2ECC71" style={{ marginRight: 4 }} />
                      <Text style={styles.callPrice}>₹{pricePerCall}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.callArrow}>→</Text>
              </TouchableOpacity>
            ))
          )}

          {/* Confirmed Calls - Ready to start */}

          {/* Call History - today only; after the day ends history is not visible */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📋 Today&apos;s call history</Text>
          </View>

          {todayCallHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Video width={48} height={48} fill="#999" />
              <Text style={styles.emptyText}>No calls today yet</Text>
              <Text style={styles.emptySubtext}>Completed sessions for today will appear here. History is only visible for the current day.</Text>
            </View>
          ) : (
            todayCallHistory.map(booking => (
              <View key={booking.id} style={[styles.callCard, { borderLeftColor: '#999', borderLeftWidth: 4, opacity: 0.95 }]}>
                <View style={[styles.callTime, { backgroundColor: '#999' }]}>
                  <Text style={styles.callTimeText}>
                    {booking.meeting_ended_at
                      ? new Date(booking.meeting_ended_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : new Date(booking.booked_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={styles.callContent}>
                  <Text style={styles.callStudent}>{booking.student?.full_name || 'Student'}</Text>
                  <Text style={styles.callSubject}>{booking.subject}</Text>
                  <View style={styles.callMeta}>
                    <Clock width={12} height={12} fill="#999" style={{ marginRight: 4 }} />
                    <Text style={styles.callDuration}>{booking.duration_minutes || 60} min</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#2ECC71', marginTop: 4 }}>✓ Completed</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('home')}
          >
            <Home width={22} height={22} fill={activeTab === 'home' ? '#5568FE' : '#999'} />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('earnings')}
          >
            <DollarSign width={22} height={22} fill={activeTab === 'earnings' ? '#5568FE' : '#999'} />
            <Text style={styles.navLabel}>Earnings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem]}
            onPress={() => setActiveTab('calls')}
          >
            <Phone width={22} height={22} fill={activeTab === 'calls' ? '#5568FE' : '#999'} />
            <Text style={styles.navLabel}>Calls</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('settings')}
          >
            <Settings width={22} height={22} fill={activeTab === 'settings' ? '#5568FE' : '#999'} />
            <Text style={styles.navLabel}>Settings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // SETTINGS TAB
  if (activeTab === 'settings') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView>
          <View style={styles.header}>
            <View style={styles.settingsHeaderContainer}>
              <Text style={styles.welcome}>Settings</Text>
              {/* <Settings width={24} height={24} fill="#5568FE" /> */}
            </View>
          </View>

          {/* Profile Section */}
          <View style={styles.profileSettingsCard}>
            <TouchableOpacity onPress={handleStatusPress} style={styles.profileImageWrapperSettings} activeOpacity={0.8}>
              <View style={[styles.profileImageContainer, styles.profileImageContainerSettings]}>
                <User width={64} height={64} fill="#5568FE" />
              </View>
              <View style={[styles.statusDot, styles.statusDotSettings, { backgroundColor: statusColor[teacherStatus] }]} />
            </TouchableOpacity>
            <Text style={styles.settingName}>{teacherName}</Text>
            <Text style={styles.settingSubtitle}>{specializations || 'Tutor'}</Text>
            <Text style={styles.settingStatusLabel}>{statusLabel[teacherStatus]}</Text>
          </View>

          {/* Profile Settings */}
          <View style={styles.settingsSection}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate(SCREEN_NAMES.EditTeacherProfile)}
            >
              <View style={styles.settingIconContainer}>
                <User width={20} height={20} fill="#5568FE" />
              </View>
              <Text style={styles.settingText}>Edit Profile</Text>
              <ChevronRight width={16} height={16} fill="#999999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Set Price', `Current: ₹${pricePerCall}/call`)}>
              <View style={styles.settingIconContainer}>
                <DollarSign width={20} height={20} fill="#5568FE" />
              </View>
              <Text style={styles.settingText}>Set Hourly Rate</Text>
              <Text style={styles.settingValue}>₹{pricePerCall}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Bank Account')}>
              <View style={styles.settingIconContainer}>
                <User width={20} height={20} fill="#5568FE" />
              </View>
              <Text style={styles.settingText}>Bank Account</Text>
              <ChevronRight width={16} height={16} fill="#999999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Notifications')}>
              <View style={styles.settingIconContainer}>
                <Clock width={20} height={20} fill="#5568FE" />
              </View>
              <Text style={styles.settingText}>Notifications</Text>
              <ChevronRight width={16} height={16} fill="#999999" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate(SCREEN_NAMES.TeacherAvailability)}
            >
              <View style={styles.settingIconContainer}>
                <Calendar width={20} height={20} fill="#5568FE" />
              </View>
              <Text style={styles.settingText}>Set Availability</Text>
              <ChevronRight width={16} height={16} fill="#999999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Privacy')}>
              <View style={styles.settingIconContainer}>
                <User width={20} height={20} fill="#5568FE" />
              </View>
              <Text style={styles.settingText}>Privacy & Security</Text>
              <ChevronRight width={16} height={16} fill="#999999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Help')}>
              <Text style={styles.settingIcon}>❓</Text>
              <Text style={styles.settingText}>Help & Support</Text>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate(SCREEN_NAMES.TeacherEarnings)}
            >
              <View style={styles.settingIconContainer}>
                <MoneyBag width={20} height={20} fill="#5568FE" />
              </View>
              <Text style={styles.settingText}>My Earnings & Withdrawals</Text>
              <ChevronRight width={16} height={16} fill="#999999" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, styles.logoutItem]}
              onPress={() =>
                Alert.alert(
                  'Logout',
                  'Are you sure you want to log out?',
                  [
                    { text: 'No', style: 'cancel', onPress: () => { } },
                    { text: 'Yes', onPress: async () => { await supabase.auth.signOut(); } },
                  ]
                )
              }
            >
              <Text style={styles.settingIcon}>🚪</Text>
              <Text style={styles.settingText}>Logout</Text>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginBottom: 100 }} />
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('home')}
          >
            <Home width={22} height={22} fill={activeTab === 'home' ? '#5568FE' : '#999'} />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('earnings')}
          >
            <DollarSign width={22} height={22} fill={activeTab === 'earnings' ? '#5568FE' : '#999'} />
            <Text style={styles.navLabel}>Earnings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('calls')}
          >
            <Phone width={22} height={22} fill={activeTab === 'calls' ? '#5568FE' : '#999'} />
            <Text style={styles.navLabel}>Calls</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem]}
            onPress={() => setActiveTab('settings')}
          >
            <Settings width={22} height={22} fill={activeTab === 'settings' ? '#5568FE' : '#999'} />
            <Text style={styles.navLabel}>Settings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D2A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
    flexGrow: 1,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 10,
  },
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  welcome: {
    color: '#ccc',
    fontSize: 14,
    marginRight: 8,
  },
  welcomeWave: {
    fontSize: 20,
  },
  teacherName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },

  // Overview Card
  overviewCard: {
    marginHorizontal: 20,
    marginVertical: 15,
    backgroundColor: '#1C1F4A',
    borderRadius: 15,
    padding: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImageWrapper: {
    position: 'relative',
    marginRight: 15,
  },
  profileImageContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#2E2E5E',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#1C1F4A',
  },
  statusLabel: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  profileImageWrapperSettings: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  profileImageContainerSettings: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  statusDotSettings: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: '#1C1F4A',
  },
  settingStatusLabel: {
    color: '#999',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  profileImage: {
    fontSize: 50,
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileSubtitle: {
    color: '#6CA0FF',
    fontSize: 13,
    marginTop: 3,
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    backgroundColor: '#2E2E5E',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  statLabel: {
    color: '#999',
    fontSize: 11,
  },

  // Section Header
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Action Cards
  actionCard: {
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  availableCard: {
    backgroundColor: '#1E7A3C',
  },
  upcomingCard: {
    backgroundColor: '#3D5A80',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  actionSubtitle: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 2,
  },

  // Earnings Card
  earningsCard: {
    marginHorizontal: 20,
    marginVertical: 15,
    backgroundColor: '#1C1F4A',
    padding: 20,
    borderRadius: 15,
  },
  earningsAmount: {
    color: '#2ECC71',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  earningsText: {
    color: '#ccc',
    fontSize: 13,
    marginBottom: 12,
  },
  earningsPending: {
    color: '#FF9800',
    fontSize: 12,
    marginBottom: 12,
  },
  earningsBar: {
    height: 8,
    backgroundColor: '#2E2E5E',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  earningsBarFill: {
    height: '100%',
    backgroundColor: '#2ECC71',
  },
  earningsTarget: {
    color: '#999',
    fontSize: 12,
  },

  // Activity Card
  activityCard: {
    marginHorizontal: 20,
    marginVertical: 8,
    backgroundColor: '#1C1F4A',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  activityTime: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  activitySubtitle: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  meetingStartedBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  meetingStartedBadge: {
    color: '#2ECC71',
    fontSize: 11,
    marginLeft: 6,
    fontWeight: 'bold',
  },
  activityEarning: {
    color: '#2ECC71',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Total Earnings Card (Earnings Tab)
  totalEarningsCard: {
    marginHorizontal: 20,
    marginVertical: 20,
    backgroundColor: '#2E4053',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
  },
  totalEarningsLabel: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
  },
  totalEarningsAmount: {
    color: '#2ECC71',
    fontSize: 36,
    fontWeight: 'bold',
  },

  // Filter Buttons
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    backgroundColor: '#1C1F4A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2E2E5E',
  },
  filterBtnActive: {
    backgroundColor: '#5568FE',
    borderColor: '#5568FE',
  },
  filterText: {
    color: '#ccc',
    fontSize: 13,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },

  // Chart Container
  chartContainer: {
    marginHorizontal: 20,
    marginVertical: 20,
    backgroundColor: '#1C1F4A',
    padding: 15,
    borderRadius: 12,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 180,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 30,
    backgroundColor: '#5568FE',
    borderRadius: 8,
    marginBottom: 8,
  },
  barLabel: {
    color: '#999',
    fontSize: 11,
  },

  // Breakdown Container
  breakdownContainer: {
    marginHorizontal: 20,
    marginVertical: 15,
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 15,
  },
  breakdownTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E5E',
  },
  breakdownItemLast: {
    borderBottomWidth: 0,
    paddingVertical: 12,
    backgroundColor: '#2E2E5E',
    marginHorizontal: -15,
    marginBottom: -15,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  breakdownLabel: {
    color: '#ccc',
    fontSize: 13,
  },
  breakdownValue: {
    color: '#2ECC71',
    fontSize: 13,
    fontWeight: 'bold',
  },
  breakdownValueNet: {
    color: '#2ECC71',
    fontSize: 13,
    fontWeight: 'bold',
  },

  // Call Card
  callCard: {
    marginHorizontal: 20,
    marginVertical: 8,
    backgroundColor: '#1C1F4A',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  callTime: {
    backgroundColor: '#2E2E5E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  callTimeText: {
    color: '#5568FE',
    fontSize: 12,
    fontWeight: 'bold',
  },
  callContent: {
    flex: 1,
  },
  callStudent: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  callSubject: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  callMeta: {
    flexDirection: 'row',
    marginTop: 6,
  },
  callDuration: {
    color: '#ccc',
    fontSize: 11,
    marginRight: 12,
  },
  callPrice: {
    color: '#2ECC71',
    fontSize: 11,
    fontWeight: 'bold',
  },
  callArrow: {
    color: '#5568FE',
    fontSize: 16,
  },

  // History Card
  historyCard: {
    marginHorizontal: 20,
    marginVertical: 8,
    backgroundColor: '#1C1F4A',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyLeft: {
    flex: 1,
  },
  historyDate: {
    color: '#999',
    fontSize: 11,
  },
  historyStudent: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 3,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historySubject: {
    color: '#ccc',
    fontSize: 12,
  },
  historyEarned: {
    color: '#2ECC71',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 3,
  },

  // Profile Settings Card
  profileSettingsCard: {
    marginHorizontal: 20,
    marginVertical: 20,
    backgroundColor: '#1C1F4A',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  settingName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  settingSubtitle: {
    color: '#6CA0FF',
    fontSize: 13,
    marginTop: 3,
  },

  // Setting Item
  settingSection: {
    marginHorizontal: 20,
    marginVertical: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1F4A',
    paddingVertical: 14,
    paddingHorizontal: 15,
    marginBottom: 10,
    borderRadius: 12,
  },
  logoutItem: {
    backgroundColor: '#4A1C1C',
    marginTop: 15,
  },
  settingIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: '#2E2E5E',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  settingValue: {
    color: '#fff',
  },
  settingArrow: {
    color: '#999',
    fontSize: 16,
  },
  settingsHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Pricing Section
  pricingSection: {
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  priceCard: {
    backgroundColor: '#1C1F4A',
    padding: 20,
    borderRadius: 12,
    marginTop: 15,
  },
  priceLabel: {
    color: '#ccc',
    fontSize: 13,
  },
  priceValue: {
    color: '#2ECC71',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  priceButtons: {
    flexDirection: 'row',
    marginVertical: 15,
  },
  priceBtn: {
    flex: 1,
    backgroundColor: '#2E2E5E',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  priceBtnAdd: {
    backgroundColor: '#5568FE',
  },
  priceBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  priceSuggestion: {
    color: '#999',
    fontSize: 12,
    marginTop: 12,
  },

  // Schedule Card
  scheduleCard: {
    backgroundColor: '#2E7D32',
  },

  // Bottom Navigation
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1C1F4A',
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#2E2E5E',
    paddingVertical: 10,
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 10,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    borderTopWidth: 3,
    borderTopColor: '#5568FE',
  },
  navLabel: {
    color: '#ccc',
    fontSize: 11,
    marginTop: 4,
  },
  emptyText: {
    color: '#fffdfd',
  },
  emptySubtext: {
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ccc',
    marginTop: 10,
  },

  snackbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#B45309',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  snackbarText: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
  },
  snackbarBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  snackbarBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Pending Booking Card
  pendingBookingCard: {
    marginHorizontal: 20,
    marginVertical: 12,
    backgroundColor: '#2a2d4a',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    padding: 15,
    borderRadius: 10,
  },
  bookingInfo: {
    marginBottom: 12,
  },
  studentName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  bookingDate: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 4,
  },
  bookingSubject: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 4,
  },
  bookingDuration: {
    color: '#999',
    fontSize: 11,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  declineBtn: {
    flex: 1,
    backgroundColor: '#f44336',
    paddingVertical: 10,
    borderRadius: 8,
  },
  declineBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  badge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
