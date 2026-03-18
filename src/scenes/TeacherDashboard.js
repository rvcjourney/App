import React, { useState, useEffect } from 'react';
import {
  View,
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
import { supabase } from '../../supabase';
import databaseApi from '../database/databaseApi';
import { SCREEN_NAMES } from '../navigators/screenNames';
import UNIFIED_THEME from '../constants/unifiedTheme';
import ThemedText from '../components/ThemedText';
import Icon from '../components/Icon';
import logger from '../utils/logger';
import { useTeacherDashboard } from '../hooks/useTeacherDashboard';

export default function TeacherDashboard({ navigation }) {
  // Custom hook manages all dashboard state
  const dashboard = useTeacherDashboard();

  // UI state only
  const [activeTab, setActiveTab] = useState('home');
  const [earningsFilter, setEarningsFilter] = useState('weekly');
  const [refreshing, setRefreshing] = useState(false);

  // Convenience aliases for hook properties
  const {
    teacherName,
    pricePerCall,
    rating,
    followers,
    specializations,
    upcomingBookings,
    todayCallHistory,
    loading,
    teacherStatus,
    profileIncomplete,
    setProfileIncomplete,
    earningsData,
    earningsLoading,
    todayEarnings,
    unreadNotificationCount,
  } = dashboard;

  // Refresh dashboard on pull-to-refresh
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await dashboard.refreshAll();
    } catch (error) {
      logger.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Initialize on focus (runs on mount and when screen comes back into focus after navigation)
  useFocusEffect(
    React.useCallback(() => {
      dashboard.refreshAll().catch(error => {
        logger.error('Error loading dashboard:', error);
        Toast.show('Failed to load dashboard');
      });
    }, [])
  );

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
      await databaseApi.updateProfile(user.id, { availability_status: newStatus });
      Toast.show(`Status set to ${newStatus}`);
    } catch (e) {
      setTeacherStatus(previousStatus);
      logger.error('🔴 Status save error:', e);
      Toast.show(e?.message || 'Failed to save status');
    }
  };

  const statusColor = { online: '#22c55e', away: '#eab308', offline: '#6b7280' };
  const statusLabel = { online: 'Online', away: 'Away', offline: 'Offline' };

  // Note: Real-time updates are handled by the useTeacherDashboard hook with polling
  // The hook fetches bookings every 8 seconds and notifications automatically
  // No need for Supabase subscriptions - using polling-based approach

  // Full-screen loading until profile is fetched
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={UNIFIED_THEME.colors.accent.primary} />
          <ThemedText variant="body" size="md" color="secondary" style={{ marginTop: 10 }}>Loading your profile...</ThemedText>
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
            <ThemedText variant="body" size="sm" color="primary" style={{ flex: 1 }}>Complete your profile for a better experience.</ThemedText>
            <TouchableOpacity
              style={styles.snackbarBtn}
              onPress={() => {
                setProfileIncomplete(false);
                navigation.navigate(SCREEN_NAMES.EditTeacherProfile);
              }}
            >
              <ThemedText variant="body" size="sm" color="primary" weight="600">Go to edit profile</ThemedText>
            </TouchableOpacity>
          </View>
        )}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff006e']} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.welcomeContainer}>
                <ThemedText variant="body" size="sm" color="secondary">Welcome Back</ThemedText>
                <ThemedText style={{ marginLeft: 8 }}>👋</ThemedText>
              </View>
              <ThemedText variant="heading" size="md" color="primary" weight="700">{teacherName}</ThemedText>
            </View>
            <TouchableOpacity
              style={styles.notificationBellWrap}
              onPress={() => navigation.navigate(SCREEN_NAMES.Notifications)}
              activeOpacity={0.7}
            >
              <View style={styles.notificationBell}>
                <ThemedText style={{ fontSize: 22 }}>🔔</ThemedText>
                {unreadNotificationCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <ThemedText variant="body" size="xs" color="primary" weight="700">
                      {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                    </ThemedText>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Dashboard Overview */}
          <View style={styles.overviewCard}>
            <View style={styles.profileSection}>
              <TouchableOpacity onPress={handleStatusPress} style={styles.profileImageWrapper} activeOpacity={0.8}>
                <View style={styles.profileImageContainer}>
                  <Icon name="user" size={48} color="#ff006e" />
                </View>
                <View style={[styles.statusDot, { backgroundColor: statusColor[teacherStatus] }]} />
              </TouchableOpacity>
              <View style={styles.profileInfo}>
                <ThemedText variant="heading" size="sm" color="primary" weight="700">{teacherName}</ThemedText>
                <ThemedText variant="body" size="sm" color="secondary" style={{ marginTop: 3 }}>{specializations || 'Tutor'}</ThemedText>
                <ThemedText variant="body" size="xs" color="muted" style={{ marginTop: 2 }}>{statusLabel[teacherStatus]}</ThemedText>
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <ThemedText variant="heading" size="xs" color="primary" weight="700">₹{pricePerCall}</ThemedText>
                <ThemedText variant="body" size="xs" color="muted" style={{ marginTop: 3 }}>Per Call</ThemedText>
              </View>
              <View style={styles.statBox}>
                <ThemedText variant="heading" size="xs" color="primary" weight="700">{rating}</ThemedText>
                <ThemedText variant="body" size="xs" color="muted" style={{ marginTop: 3 }}>Rating</ThemedText>
              </View>
              <View style={styles.statBox}>
                <ThemedText variant="heading" size="xs" color="primary" weight="700">{(followers / 1000).toFixed(1)}K</ThemedText>
                <ThemedText variant="body" size="xs" color="muted" style={{ marginTop: 3 }}>Followers</ThemedText>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.sectionHeader}>
            <ThemedText variant="heading" size="sm" color="primary" weight="700">Quick Actions</ThemedText>
          </View>

          {/* Schedule Lecture - commented out
          <TouchableOpacity
            style={[styles.actionCard, styles.scheduleCard]}
            onPress={() => navigation.navigate(SCREEN_NAMES.ScheduleLecture)}
          >
            <Icon name="academicTeacher" size={32} color="#2ECC71" style={{ marginRight: 12 }} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Schedule Lecture</Text>
              <Text style={styles.actionSubtitle}>Plan a group class</Text>
            </View>
            <Icon name="forward" size={24} color="muted" />
          </TouchableOpacity>
          */}

          {/* Go Live - commented out
          <TouchableOpacity
            style={[styles.actionCard, styles.availableCard]}
            onPress={() => navigation.navigate(SCREEN_NAMES.Join)}
          >
            <Icon name="video" size={32} color="#FF6B6B" style={{ marginRight: 12 }} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Go Live</Text>
              <Text style={styles.actionSubtitle}>Start teaching now</Text>
            </View>
            <Icon name="forward" size={24} color="muted" />
          </TouchableOpacity>
          */}

          <TouchableOpacity
            style={[styles.actionCard, styles.upcomingCard]}
            onPress={() => setActiveTab('calls')}
          >
            <Icon name="calendar" size={32} color="#4ECDC4" style={{ marginRight: 12 }} />
            <View style={styles.actionContent}>
              <ThemedText variant="heading" size="xs" color="primary" weight="700">Upcoming Calls</ThemedText>
              <ThemedText variant="body" size="sm" color="secondary" style={{ marginTop: 2 }}>{upcomingBookings.length} sessions scheduled</ThemedText>
            </View>
            <Icon name="forward" size={24} color="muted" />
          </TouchableOpacity>

          {/* Today's Earnings */}
          <View style={styles.sectionHeader}>
            <ThemedText variant="heading" size="sm" color="primary" weight="700">Today's Earnings</ThemedText>
          </View>

          <TouchableOpacity
            style={styles.earningsCard}
            onPress={() => navigation.navigate(SCREEN_NAMES.TeacherEarnings)}
            activeOpacity={0.8}
          >
            <ThemedText variant="heading" size="lg" color="approved" weight="700">₹{todayEarnings.totalAmount.toLocaleString()}</ThemedText>
            <ThemedText variant="body" size="sm" color="secondary" style={{ marginBottom: 12 }}>
              from {todayEarnings.sessionsCount} completed session{todayEarnings.sessionsCount !== 1 ? 's' : ''}
            </ThemedText>
            {todayEarnings.pendingCount > 0 && (
              <ThemedText variant="body" size="xs" color="pending" style={{ marginBottom: 12 }}>
                ⏳ ₹{todayEarnings.pendingAmount.toLocaleString()} pending ({todayEarnings.pendingCount} session{todayEarnings.pendingCount !== 1 ? 's' : ''})
              </ThemedText>
            )}
            <View style={styles.earningsBar}>
              <View style={[styles.earningsBarFill, { width: `${Math.min((todayEarnings.totalAmount / 5000) * 100, 100)}%` }]} />
            </View>
            {/* <ThemedText variant="body" size="xs" color="muted">Target: ₹5,000/day</ThemedText> */}
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
            <Icon name="home" size={24} color={activeTab === 'home' ? 'primary' : 'muted'} />
            <ThemedText variant="body" size="xs" color={activeTab === 'home' ? 'secondary' : 'muted'} style={{ marginTop: 4 }}>Home</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeTab === 'earnings']}
            onPress={() => setActiveTab('earnings')}
          >
            <Icon name="dollarSign" size={24} color={activeTab === 'earnings' ? 'primary' : 'muted'} />
            <ThemedText variant="body" size="xs" color={activeTab === 'earnings' ? 'secondary' : 'muted'} style={{ marginTop: 4 }}>Earnings</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeTab === 'calls']}
            onPress={() => setActiveTab('calls')}
          >
            <View style={{ position: 'relative' }}>
              <Icon name="phone" size={24} color={activeTab === 'calls' ? 'primary' : 'muted'} />
              {upcomingBookings.filter(b => b.status === 'confirmed' && !b.meeting_id).length > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  backgroundColor: UNIFIED_THEME.colors.status.approved,
                  borderRadius: 10,
                  width: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <ThemedText variant="body" size="xs" color="primary" weight="700">
                    {upcomingBookings.filter(b => b.status === 'confirmed' && !b.meeting_id).length}
                  </ThemedText>
                </View>
              )}
            </View>
            <ThemedText variant="body" size="xs" color={activeTab === 'calls' ? 'secondary' : 'muted'} style={{ marginTop: 4 }}>Calls</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeTab === 'settings']}
            onPress={() => setActiveTab('settings')}
          >
            <Icon name="settings" size={24} color={activeTab === 'settings' ? 'primary' : 'muted'} />
            <ThemedText variant="body" size="xs" color={activeTab === 'settings' ? 'secondary' : 'muted'} style={{ marginTop: 4 }}>Settings</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // EARNINGS TAB
  if (activeTab === 'earnings') {
    const currentData =
      earningsFilter === 'weekly'
        ? earningsData?.weekly
        : earningsFilter === 'monthly'
          ? earningsData?.monthly
          : earningsData?.yearly;

    const totalEarnings = (currentData || []).reduce((sum, item) => sum + (item?.amount || 0), 0);
    const maxAmount = Math.max(...(currentData || []).map(item => item?.amount || 0), 1); // Ensure at least 1 to avoid division by zero

    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff006e']} />
          }
        >
          <View style={styles.header}>
            <View style={styles.welcomeContainer}>
              <ThemedText variant="heading" size="sm" color="primary" weight="700">Earnings Analytics</ThemedText>
              <Icon name="dollarSign" size={20} color="primary" style={{ marginLeft: 8 }} />
            </View>
          </View>

          {/* Total Earnings */}
          <View style={styles.totalEarningsCard}>
            <ThemedText variant="body" size="sm" color="secondary">Total Earnings ({earningsFilter})</ThemedText>
            <ThemedText variant="heading" size="lg" color="approved" weight="700" style={{ marginTop: 8 }}>₹{totalEarnings.toLocaleString()}</ThemedText>
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
                <ThemedText
                  variant="body"
                  size="sm"
                  color={earningsFilter === filter ? 'primary' : 'secondary'}
                  weight={earningsFilter === filter ? '600' : '400'}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Chart */}
          <View style={styles.chartContainer}>
            <View style={styles.chartBars}>
              {(currentData || []).map((item, index) => (
                <View key={index} style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      { height: ((item?.amount || 0) / maxAmount) * 150 },
                    ]}
                  />
                  <ThemedText variant="body" size="xs" color="muted">{item?.day || item?.month}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* Earnings Breakdown */}
          <View style={styles.breakdownContainer}>
            <ThemedText variant="heading" size="xs" color="primary" weight="700">Earnings Breakdown</ThemedText>
            <View style={styles.breakdownItem}>
              <ThemedText variant="body" size="sm" color="secondary">Gross Earnings</ThemedText>
              <ThemedText variant="body" size="sm" color="approved" weight="700">₹{Math.round(totalEarnings / 0.67).toLocaleString()}</ThemedText>
            </View>
            <View style={styles.breakdownItem}>
              <ThemedText variant="body" size="sm" color="secondary">GST (18%)</ThemedText>
              <ThemedText variant="body" size="sm" color="approved" weight="700">-₹{Math.round((totalEarnings / 0.67) * 0.18).toLocaleString()}</ThemedText>
            </View>
            <View style={styles.breakdownItem}>
              <ThemedText variant="body" size="sm" color="secondary">Platform Fee (15%)</ThemedText>
              <ThemedText variant="body" size="sm" color="approved" weight="700">-₹{Math.round((totalEarnings / 0.67) * 0.15).toLocaleString()}</ThemedText>
            </View>
            <View style={[styles.breakdownItem, styles.breakdownItemLast]}>
              <ThemedText variant="body" size="sm" color="secondary">Net Earnings (67%)</ThemedText>
              <ThemedText variant="body" size="sm" color="approved" weight="700">₹{totalEarnings.toLocaleString()}</ThemedText>
            </View>
          </View>
          <View style={{ marginBottom: 80 }} />
        </ScrollView>
        

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('home')}
          >
            <Icon name="home" size={22} color={activeTab === 'home' ? 'primary' : 'muted'} />
            <ThemedText variant="body" size="xs" color={activeTab === 'home' ? 'secondary' : 'muted'} style={{ marginTop: 4 }}>Home</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem]}
            onPress={() => setActiveTab('earnings')}
          >
            <Icon name="dollarSign" size={22} color={activeTab === 'earnings' ? 'primary' : 'muted'} />
            <ThemedText variant="body" size="xs" color={activeTab === 'earnings' ? 'secondary' : 'muted'} style={{ marginTop: 4 }}>Earnings</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('calls')}
          >
            <Icon name="phone" size={22} color={activeTab === 'calls' ? 'primary' : 'muted'} />
            <ThemedText variant="body" size="xs" color={activeTab === 'calls' ? 'secondary' : 'muted'} style={{ marginTop: 4 }}>Calls</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('settings')}
          >
            <Icon name="settings" size={22} color={activeTab === 'settings' ? 'primary' : 'muted'} />
            <ThemedText variant="body" size="xs" color={activeTab === 'settings' ? 'secondary' : 'muted'} style={{ marginTop: 4 }}>Settings</ThemedText>
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
    
    logger.info('📊 [TeacherDashboard] Booking stats:', {
      total: upcomingBookings.length,
      confirmed: confirmedBookings.length,
      live: liveBookings.length,
      readyToStart: readyToStart.length,
    });

    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 60 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff006e']} />
          }
        >
          <View style={styles.header}>
            <View style={styles.welcomeContainer}>
              <ThemedText variant="heading" size="sm" color="primary" weight="700">My Calls</ThemedText>
              <Icon name="phone" size={20} color="primary" style={{ marginLeft: 8 }} />
            </View>
          </View>

          {/* Live Now */}
          {liveBookings.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <ThemedText variant="heading" size="sm" color="rejected" weight="700">🔴 LIVE NOW</ThemedText>
              </View>
              {liveBookings.map(booking => (
                <View key={booking.id} style={[styles.callCard, { borderLeftColor: UNIFIED_THEME.colors.status.rejected, borderLeftWidth: 4 }]}>
                  <View style={styles.callCardLeft}>
                    <View style={[styles.callTime, { backgroundColor: UNIFIED_THEME.colors.status.rejected }]}>
                      <ThemedText variant="body" size="xs" color="primary" weight="700">🔴 LIVE</ThemedText>
                    </View>
                    <View style={styles.callContent}>
                      <ThemedText variant="body" size="sm" color="primary" weight="600">{booking.student?.full_name || 'Student'}</ThemedText>
                      <ThemedText variant="body" size="xs" color="muted" style={{ marginTop: 2 }}>{booking.subject}</ThemedText>
                      <View style={styles.callMeta}>
                        <Icon name="clock" size={12} color="muted" style={{ marginRight: 4 }} />
                        <ThemedText variant="body" size="xs" color="secondary">{booking.duration_minutes} min</ThemedText>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                          <Icon name="dollarSign" size={12} color="approved" style={{ marginRight: 4 }} />
                          <ThemedText variant="body" size="xs" color="approved" weight="700">₹{pricePerCall}</ThemedText>
                        </View>
                      </View>
                      <ThemedText variant="body" size="xs" color="muted" style={{ marginTop: 5 }}>Meeting ID: {booking.meeting_id}</ThemedText>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.startCallBtn, { backgroundColor: UNIFIED_THEME.colors.status.rejected }]}
                    onPress={() => navigation.navigate(SCREEN_NAMES.Join, {
                      booking: booking,
                      isTeacher: true,
                    })}
                  >
                    <Icon name="phone" size={18} color="primary" style={{ marginRight: 6 }} />
                    <ThemedText variant="body" size="sm" color="primary" weight="600">Join</ThemedText>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {/* Upcoming Calls - Confirmed & Ready to Start */}
          <View style={styles.sectionHeader}>
            <ThemedText variant="heading" size="sm" color="primary" weight="700">Upcoming Calls</ThemedText>
          </View>

          {readyToStart.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateIcon}>
                <Icon name="calendar" size={48} color="primary" />
              </View>
              <ThemedText variant="heading" size="sm" color="primary" weight="600">No upcoming calls</ThemedText>
              <ThemedText variant="body" size="sm" color="muted" style={{ marginTop: 8, textAlign: 'center', lineHeight: 18 }}>Booked sessions will appear here once students book your slots</ThemedText>
            </View>
          ) : (
            readyToStart.map(booking => (
              <View key={booking.id} style={styles.callCard}>
                <View style={styles.callCardLeft}>
                  <View style={styles.callTime}>
                    <ThemedText variant="body" size="xs" color="accent.primary" weight="700">{new Date(booking.booked_date).toLocaleTimeString()}</ThemedText>
                  </View>
                  <View style={styles.callContent}>
                    <ThemedText variant="body" size="sm" color="primary" weight="600">{booking.student?.full_name || 'Student'}</ThemedText>
                    <ThemedText variant="body" size="xs" color="muted" style={{ marginTop: 2 }}>{booking.subject}</ThemedText>
                    <View style={styles.callMeta}>
                      <Icon name="clock" size={12} color="muted" style={{ marginRight: 4 }} />
                      <ThemedText variant="body" size="xs" color="secondary">{booking.duration_minutes} min</ThemedText>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                        <Icon name="dollarSign" size={12} color="approved" style={{ marginRight: 4 }} />
                        <ThemedText variant="body" size="xs" color="approved" weight="700">₹{pricePerCall}</ThemedText>
                      </View>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.startCallBtn}
                  onPress={() => navigation.navigate(SCREEN_NAMES.Join, {
                    booking: booking,
                    isTeacher: true,
                  })}
                >
                  <Icon name="phone" size={18} color="primary" style={{ marginRight: 6 }} />
                  <ThemedText variant="body" size="sm" color="primary" weight="600">Start Call</ThemedText>
                </TouchableOpacity>
              </View>
            ))
          )}

          {/* Confirmed Calls - Ready to start */}

          {/* Call History - today only; after the day ends history is not visible */}
          <View style={styles.sectionHeader}>
            <ThemedText variant="heading" size="sm" color="primary" weight="700">Today's call history</ThemedText>
          </View>

          {todayCallHistory.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateIcon}>
                <Icon name="video" size={48} color="primary" />
              </View>
              <ThemedText variant="heading" size="sm" color="primary" weight="600">No calls today yet</ThemedText>
              <ThemedText variant="body" size="sm" color="muted" style={{ marginTop: 8, textAlign: 'center', lineHeight: 18 }}>Completed sessions will appear here as you finish your calls</ThemedText>
            </View>
          ) : (
            todayCallHistory.map(booking => (
              <View key={booking.id} style={[styles.callCard, { borderLeftColor: UNIFIED_THEME.colors.text.disabled, borderLeftWidth: 4, opacity: 0.95 }]}>
                <View style={[styles.callTime, { backgroundColor: UNIFIED_THEME.colors.text.disabled }]}>
                  <ThemedText variant="body" size="xs" color="accent.primary" weight="700">
                    {booking.meeting_ended_at
                      ? new Date(booking.meeting_ended_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : new Date(booking.booked_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </ThemedText>
                </View>
                <View style={styles.callContent}>
                  <ThemedText variant="body" size="sm" color="primary" weight="600">{booking.student?.full_name || 'Student'}</ThemedText>
                  <ThemedText variant="body" size="xs" color="muted" style={{ marginTop: 2 }}>{booking.subject}</ThemedText>
                  <View style={styles.callMeta}>
                    <Icon name="clock" size={12} color="muted" style={{ marginRight: 4 }} />
                    <ThemedText variant="body" size="xs" color="secondary">{booking.duration_minutes || 60} min</ThemedText>
                  </View>
                  <ThemedText variant="body" size="xs" color="approved" weight="700" style={{ marginTop: 4 }}>✓ Completed</ThemedText>
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
            <Icon name="home" size={22} color={activeTab === 'home' ? 'primary' : 'muted'} />
            <ThemedText variant="body" size="xs" color={activeTab === 'home' ? 'secondary' : 'muted'} style={{ marginTop: 4 }}>Home</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('earnings')}
          >
            <Icon name="dollarSign" size={22} color={activeTab === 'earnings' ? 'primary' : 'muted'} />
            <ThemedText variant="body" size="xs" color={activeTab === 'earnings' ? 'secondary' : 'muted'} style={{ marginTop: 4 }}>Earnings</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem]}
            onPress={() => setActiveTab('calls')}
          >
            <Icon name="phone" size={22} color={activeTab === 'calls' ? 'primary' : 'muted'} />
            <ThemedText variant="body" size="xs" color={activeTab === 'calls' ? 'secondary' : 'muted'} style={{ marginTop: 4 }}>Calls</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('settings')}
          >
            <Icon name="settings" size={22} color={activeTab === 'settings' ? 'primary' : 'muted'} />
            <ThemedText variant="body" size="xs" color={activeTab === 'settings' ? 'secondary' : 'muted'} style={{ marginTop: 4 }}>Settings</ThemedText>
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
              <ThemedText variant="heading" size="sm" color="secondary" weight="700">Settings</ThemedText>
              {/* <Icon name="settings" size={24} color="primary" /> */}
            </View>
          </View>

          {/* Profile Section */}
          <View style={styles.profileSettingsCard}>
            <TouchableOpacity onPress={handleStatusPress} style={styles.profileImageWrapperSettings} activeOpacity={0.8}>
              <View style={[styles.profileImageContainer, styles.profileImageContainerSettings]}>
                <Icon name="user" size={64} color="secondary" />
              </View>
              <View style={[styles.statusDot, styles.statusDotSettings, { backgroundColor: statusColor[teacherStatus] }]} />
            </TouchableOpacity>
            <ThemedText variant="heading" size="sm" color="secondary" weight="700" style={{ marginTop: 10 }}>{teacherName}</ThemedText>
            <ThemedText variant="body" size="sm" color="secondary" style={{ marginTop: 3 }}>{specializations || 'Tutor'}</ThemedText>
            <ThemedText variant="body" size="xs" color="muted" style={{ marginTop: 4, textAlign: 'center' }}>{statusLabel[teacherStatus]}</ThemedText>
          </View>

          {/* Profile Settings */}
          <View style={styles.settingsSection}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate(SCREEN_NAMES.EditTeacherProfile)}
            >
              <View style={styles.settingIconContainer}>
                <Icon name="user" size={20} color="secondary" />
              </View>
              <ThemedText variant="body" size="sm" color="secondary" weight="500" style={{ flex: 1 }}>Edit Profile</ThemedText>
              <Icon name="forward" size={16} color="muted" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Set Price', `Current: ₹${pricePerCall}/call`)}>
              <View style={styles.settingIconContainer}>
                <Icon name="dollarSign" size={20} color="secondary" />
              </View>
              <ThemedText variant="body" size="sm" color="secondary" weight="500" style={{ flex: 1 }}>Set Hourly Rate</ThemedText>
              <ThemedText variant="body" size="sm" color="secondary">₹{pricePerCall}</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate(SCREEN_NAMES.BankAccountSettings)}
            >
              <View style={styles.settingIconContainer}>
                <Icon name="user" size={20} color="secondary" />
              </View>
              <ThemedText variant="body" size="sm" color="secondary" weight="500" style={{ flex: 1 }}>Bank Account</ThemedText>
              <Icon name="forward" size={16} color="muted" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate(SCREEN_NAMES.Notifications)}>
              <View style={styles.settingIconContainer}>
                <Icon name="clock" size={20} color="secondary" />
              </View>
              <ThemedText variant="body" size="sm" color="secondary" weight="500" style={{ flex: 1 }}>Notifications</ThemedText>
              <Icon name="forward" size={16} color="muted" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={async () => {
                try {
                  const { data: { user } } = await supabase.auth.getUser();
                  const email = user?.email;
                  if (!email) {
                    Alert.alert('Error', 'Could not get your email.');
                    return;
                  }
                  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
                  if (error) {
                    if (error.message?.toLowerCase().includes('rate limit')) {
                      Toast.show('Too many requests. Try again in a few minutes.');
                    } else {
                      Toast.show('Could not send reset email. Try again.');
                    }
                    return;
                  }
                  Alert.alert('Check your email', `A password reset link has been sent to ${email}. Open the link to set a new password.`);
                } catch (e) {
                  Toast.show('Something went wrong. Try again.');
                }
              }}
            >
              <View style={styles.settingIconContainer}>
                <ThemedText style={{ fontSize: 18 }}>🔒</ThemedText>
              </View>
              <ThemedText variant="body" size="sm" color="secondary" weight="500" style={{ flex: 1 }}>Reset Password</ThemedText>
              <Icon name="forward" size={16} color="muted" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate(SCREEN_NAMES.TeacherAvailability)}
            >
              <View style={styles.settingIconContainer}>
                <Icon name="calendar" size={20} color="secondary" />
              </View>
              <ThemedText variant="body" size="sm" color="secondary" weight="500" style={{ flex: 1 }}>Set Availability</ThemedText>
              <Icon name="forward" size={16} color="muted" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Privacy')}>
              <View style={styles.settingIconContainer}>
                <Icon name="user" size={20} color="secondary" />
              </View>
              <ThemedText variant="body" size="sm" color="secondary" weight="500" style={{ flex: 1 }}>Privacy & Security</ThemedText>
              <Icon name="forward" size={16} color="muted" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Help')}>
              <ThemedText style={{ fontSize: 20, marginRight: 12 }}>❓</ThemedText>
              <ThemedText variant="body" size="sm" color="secondary" weight="500" style={{ flex: 1 }}>Help & Support</ThemedText>
              <ThemedText variant="body" size="lg" color="muted">→</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate(SCREEN_NAMES.TeacherEarnings)}
            >
              <View style={styles.settingIconContainer}>
                <Icon name="money" size={20} color="secondary" />
              </View>
              <ThemedText variant="body" size="sm" color="secondary" weight="500" style={{ flex: 1 }}>My Earnings & Withdrawals</ThemedText>
              <Icon name="forward" size={16} color="muted" />
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
              <ThemedText style={{ fontSize: 20, marginRight: 12 }}>🚪</ThemedText>
              <ThemedText variant="body" size="sm" color="primary" weight="500" style={{ flex: 1 }}>Logout</ThemedText>
              <ThemedText variant="body" size="lg" color="muted">→</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={{ marginBottom: 100 }} />
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('home')}
          >
            <Icon name="home" size={22} color={activeTab === 'home' ? 'primary' : 'muted'} />
            <ThemedText variant="body" size="xs" color={activeTab === 'home' ? 'secondary' : 'muted'} style={{ marginTop: 4 }}>Home</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('earnings')}
          >
            <Icon name="dollarSign" size={22} color={activeTab === 'earnings' ? 'primary' : 'muted'} />
            <ThemedText variant="body" size="xs" color={activeTab === 'earnings' ? 'secondary' : 'muted'} style={{ marginTop: 4 }}>Earnings</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('calls')}
          >
            <Icon name="phone" size={22} color={activeTab === 'calls' ? 'primary' : 'muted'} />
            <ThemedText variant="body" size="xs" color={activeTab === 'calls' ? 'secondary' : 'muted'} style={{ marginTop: 4 }}>Calls</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem]}
            onPress={() => setActiveTab('settings')}
          >
            <Icon name="settings" size={22} color={activeTab === 'settings' ? 'primary' : 'muted'} />
            <ThemedText variant="body" size="xs" color={activeTab === 'settings' ? 'secondary' : 'muted'} style={{ marginTop: 4 }}>Settings</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 10,
  },
  headerLeft: {
    flex: 1,
  },
  notificationBellWrap: {
    alignSelf: 'flex-start',
  },
  notificationBell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.light,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBellIcon: {
    fontSize: 22,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: UNIFIED_THEME.colors.status.rejected,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  welcome: {
    color: UNIFIED_THEME.colors.text.secondary,
    fontSize: 14,
    marginRight: 8,
  },
  welcomeWave: {
    fontSize: 20,
  },
  teacherName: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },

  // Overview Card
  overviewCard: {
    marginHorizontal: 20,
    marginVertical: 15,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.light,
    borderWidth: 1,
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
    backgroundColor: UNIFIED_THEME.colors.component.card,
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
    borderColor: UNIFIED_THEME.colors.border.light,
  },
  statusLabel: {
    color: UNIFIED_THEME.colors.text.muted,
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
    borderColor: UNIFIED_THEME.colors.border.light,
  },
  settingStatusLabel: {
    color: UNIFIED_THEME.colors.text.muted,
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
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileSubtitle: {
    color: UNIFIED_THEME.colors.text.secondary,
    fontSize: 13,
    marginTop: 3,
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  statValue: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  statLabel: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 11,
  },

  // Section Header
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    color: UNIFIED_THEME.colors.text.primary,
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
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 15,
    fontWeight: 'bold',
  },
  actionSubtitle: {
    color: UNIFIED_THEME.colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },

  // Earnings Card
  earningsCard: {
    marginHorizontal: 20,
    marginVertical: 15,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.light,
    borderWidth: 1,
    padding: 20,
    borderRadius: 15,
  },
  earningsAmount: {
    color: UNIFIED_THEME.colors.status.approved,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  earningsText: {
    color: UNIFIED_THEME.colors.text.secondary,
    fontSize: 13,
    marginBottom: 12,
  },
  earningsPending: {
    color: UNIFIED_THEME.colors.status.pending,
    fontSize: 12,
    marginBottom: 12,
  },
  earningsBar: {
    height: 8,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  earningsBarFill: {
    height: '100%',
    backgroundColor: UNIFIED_THEME.colors.status.approved,
  },
  earningsTarget: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 12,
  },

  // Activity Card
  activityCard: {
    marginHorizontal: 20,
    marginVertical: 8,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.light,
    borderWidth: 1,
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
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  activityTime: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 12,
    marginTop: 2,
  },
  activitySubtitle: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 12,
    marginTop: 2,
  },
  meetingStartedBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  meetingStartedBadge: {
    color: UNIFIED_THEME.colors.status.approved,
    fontSize: 11,
    marginLeft: 6,
    fontWeight: 'bold',
  },
  activityEarning: {
    color: UNIFIED_THEME.colors.status.approved,
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Total Earnings Card (Earnings Tab)
  totalEarningsCard: {
    marginHorizontal: 20,
    marginVertical: 20,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
  },
  totalEarningsLabel: {
    color: UNIFIED_THEME.colors.text.secondary,
    fontSize: 14,
    marginBottom: 8,
  },
  totalEarningsAmount: {
    color: UNIFIED_THEME.colors.status.approved,
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
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.light,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterBtnActive: {
    // backgroundColor: UNIFIED_THEME.colors.component.button,
    borderColor: UNIFIED_THEME.colors.accent.primary,
  },
  filterText: {
    color: UNIFIED_THEME.colors.text.secondary,
    fontSize: 13,
    fontWeight: '500',
  },
  filterTextActive: {
    color: UNIFIED_THEME.colors.text.secondary,
  },

  // Chart Container
  chartContainer: {
    marginHorizontal: 20,
    marginVertical: 20,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.light,
    borderWidth: 1,
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
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    borderRadius: 8,
    marginBottom: 8,
  },
  barLabel: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 11,
  },

  // Breakdown Container
  breakdownContainer: {
    marginHorizontal: 20,
    marginVertical: 15,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.light,
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
  },
  breakdownTitle: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: UNIFIED_THEME.colors.border.light,
  },
  breakdownItemLast: {
    borderBottomWidth: 0,
    paddingVertical: 12,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    marginHorizontal: -15,
    marginBottom: -15,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  breakdownLabel: {
    color: UNIFIED_THEME.colors.text.secondary,
    fontSize: 13,
  },
  breakdownValue: {
    color: UNIFIED_THEME.colors.status.approved,
    fontSize: 13,
    fontWeight: 'bold',
  },
  breakdownValueNet: {
    color: UNIFIED_THEME.colors.status.approved,
    fontSize: 13,
    fontWeight: 'bold',
  },

  // Call Card
  callCard: {
    marginHorizontal: 20,
    marginVertical: 10,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.light,
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  callCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  callTime: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  callTimeText: {
    color: UNIFIED_THEME.colors.accent.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  callContent: {
    flex: 1,
  },
  callStudent: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  callSubject: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 12,
    marginTop: 2,
  },
  callMeta: {
    flexDirection: 'row',
    marginTop: 6,
  },
  callDuration: {
    color: UNIFIED_THEME.colors.text.secondary,
    fontSize: 11,
    marginRight: 12,
  },
  callPrice: {
    color: UNIFIED_THEME.colors.status.approved,
    fontSize: 11,
    fontWeight: 'bold',
  },
  callArrow: {
    color: UNIFIED_THEME.colors.accent.primary,
    fontSize: 16,
  },

  startCallBtn: {
    backgroundColor: 'transparent',   // Use LinearGradient wrapper for gradient
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  startCallBtnText: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  // History Card
  historyCard: {
    marginHorizontal: 20,
    marginVertical: 8,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.light,
    borderWidth: 1,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyLeft: {
    flex: 1,
  },
  historyDate: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 11,
  },
  historyStudent: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 3,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historySubject: {
    color: UNIFIED_THEME.colors.text.secondary,
    fontSize: 12,
  },
  historyEarned: {
    color: UNIFIED_THEME.colors.status.approved,
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 3,
  },

  // Profile Settings Card
  profileSettingsCard: {
    marginHorizontal: 20,
    marginVertical: 20,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.light,
    borderWidth: 1,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  settingName: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  settingSubtitle: {
    color: UNIFIED_THEME.colors.text.secondary,
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
    backgroundColor: UNIFIED_THEME.colors.component.card,
    paddingVertical: 14,
    paddingHorizontal: 15,
    marginBottom: 10,
    borderRadius: 12,
  },
  logoutItem: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    marginTop: 15,
  },
  settingIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: UNIFIED_THEME.colors.component.card,
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
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  settingValue: {
    color: UNIFIED_THEME.colors.text.primary,
  },
  settingArrow: {
    color: UNIFIED_THEME.colors.text.muted,
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
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.light,
    borderWidth: 1,
    padding: 20,
    borderRadius: 12,
    marginTop: 15,
  },
  priceLabel: {
    color: UNIFIED_THEME.colors.text.secondary,
    fontSize: 13,
  },
  priceValue: {
    color: UNIFIED_THEME.colors.status.approved,
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
    backgroundColor: UNIFIED_THEME.colors.component.card,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  priceBtnAdd: {
    backgroundColor: 'transparent',   // Use LinearGradient wrapper for gradient
  },
  priceBtnText: {
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: 'bold',
  },
  priceSuggestion: {
    color: UNIFIED_THEME.colors.text.muted,
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
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderTopColor: UNIFIED_THEME.colors.border.light,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    borderTopColor: UNIFIED_THEME.colors.accent.primary,
  },
  navLabel: {
    color: UNIFIED_THEME.colors.text.secondary,
    fontSize: 11,
    marginTop: 4,
  },

  emptyStateContainer: {
    marginHorizontal: 20,
    marginVertical: 40,
    paddingHorizontal: 24,
    paddingVertical: 40,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
  },

  emptyStateIcon: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 0, 110, 0.1)',
    borderRadius: 12,
  },

  emptyText: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },

  emptySubtext: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: UNIFIED_THEME.colors.text.secondary,
    marginTop: 10,
  },

  snackbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: UNIFIED_THEME.colors.status.pending,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  snackbarText: {
    flex: 1,
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 13,
  },
  snackbarBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  snackbarBtnText: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 13,
    fontWeight: '600',
  },

  // Pending Booking Card
  pendingBookingCard: {
    marginHorizontal: 20,
    marginVertical: 12,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderLeftWidth: 4,
    borderLeftColor: UNIFIED_THEME.colors.status.pending,
    padding: 15,
    borderRadius: 10,
  },
  bookingInfo: {
    marginBottom: 12,
  },
  studentName: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  bookingDate: {
    color: UNIFIED_THEME.colors.text.secondary,
    fontSize: 12,
    marginBottom: 4,
  },
  bookingSubject: {
    color: UNIFIED_THEME.colors.text.secondary,
    fontSize: 12,
    marginBottom: 4,
  },
  bookingDuration: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 11,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.status.approved,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmBtnText: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  declineBtn: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.status.rejected,
    paddingVertical: 10,
    borderRadius: 8,
  },
  declineBtnText: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  badge: {
    backgroundColor: UNIFIED_THEME.colors.status.pending,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
