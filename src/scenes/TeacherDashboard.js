import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';
import { SCREEN_NAMES } from '../navigators/screenNames';
import { supabase } from '../../supabase';
import { getTeacherProfile, getTeacherBookings } from '../database/database';

// Mock data for teacher earnings
const mockEarnings = {
  weekly: [
    { day: 'Mon', amount: 2500 },
    { day: 'Tue', amount: 3000 },
    { day: 'Wed', amount: 2800 },
    { day: 'Thu', amount: 3500 },
    { day: 'Fri', amount: 4000 },
    { day: 'Sat', amount: 3200 },
    { day: 'Sun', amount: 2700 },
  ],
  monthly: [
    { month: 'Week 1', amount: 18000 },
    { month: 'Week 2', amount: 22000 },
    { month: 'Week 3', amount: 19500 },
    { month: 'Week 4', amount: 24000 },
  ],
  yearly: [
    { month: 'Jan', amount: 85000 },
    { month: 'Feb', amount: 92000 },
    { month: 'Mar', amount: 88000 },
    { month: 'Apr', amount: 95000 },
    { month: 'May', amount: 102000 },
    { month: 'Jun', amount: 98000 },
    { month: 'Jul', amount: 105000 },
    { month: 'Aug', amount: 100000 },
    { month: 'Sep', amount: 97000 },
    { month: 'Oct', amount: 108000 },
    { month: 'Nov', amount: 115000 },
    { month: 'Dec', amount: 120000 },
  ],
};

export default function TeacherDashboard({ navigation }) {
  const [activeTab, setActiveTab] = useState('home');
  const [earningsFilter, setEarningsFilter] = useState('weekly');
  const [teacherName, setTeacherName] = useState('Teacher');
  const [pricePerCall, setPricePerCall] = useState(500);
  const [rating, setRating] = useState(4.8);
  const [followers, setFollowers] = useState(0);
  const [specializations, setSpecializations] = useState('');
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to load teacher profile data
  const loadTeacherProfile = async () => {
    try {
      console.log('🔵 [TeacherDashboard] Loading profile...');
      
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
        const { data: teacherData } = await supabase
          .from('teacher_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (teacherData) {
          setPricePerCall(teacherData.price_per_call || 500);
          setRating(teacherData.rating || 4.8);
          setFollowers(teacherData.followers || 0);
          setSpecializations(teacherData.specializations || '');
        }

        // Get upcoming bookings
        const bookingsData = await getTeacherBookings(user.id);
        if (bookingsData) {
          const upcoming = bookingsData.filter(b => new Date(b.booked_date) > new Date() && b.status !== 'cancelled');
          setUpcomingBookings(upcoming);
        }
      }
      
    } catch (error) {
      console.error('🔴 [TeacherDashboard] Error loading profile:', error);
      Toast.show('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

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

  // HOME TAB
  if (activeTab === 'home') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.welcome}>Welcome Back 👋</Text>
            <Text style={styles.teacherName}>{teacherName}</Text>
          </View>

          {/* Dashboard Overview */}
          <View style={styles.overviewCard}>
            <View style={styles.profileSection}>
              <Text style={styles.profileImage}>👨‍🏫</Text>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{teacherName}</Text>
                <Text style={styles.profileSubtitle}>{specializations || 'Tutor'}</Text>
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

          <TouchableOpacity
            style={[styles.actionCard, styles.scheduleCard]}
            onPress={() => navigation.navigate(SCREEN_NAMES.ScheduleLecture)}
          >
            <Text style={styles.actionIcon}>📚</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Schedule Lecture</Text>
              <Text style={styles.actionSubtitle}>Plan a group class</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.availableCard]}
            onPress={() => navigation.navigate(SCREEN_NAMES.Join)}
          >
            <Text style={styles.actionIcon}>📹</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Go Live</Text>
              <Text style={styles.actionSubtitle}>Start teaching now</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.upcomingCard]}
            onPress={() => Alert.alert('Upcoming Calls', `You have ${upcomingBookings.length} sessions scheduled`)}
          >
            <Text style={styles.actionIcon}>📅</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Upcoming Calls</Text>
              <Text style={styles.actionSubtitle}>{upcomingBookings.length} sessions scheduled</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          {/* Today's Earnings */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Earnings</Text>
          </View>

          <View style={styles.earningsCard}>
            <Text style={styles.earningsAmount}>₹3,200</Text>
            <Text style={styles.earningsText}>from 5 sessions</Text>
            <View style={styles.earningsBar}>
              <View style={[styles.earningsBarFill, { width: '75%' }]} />
            </View>
            <Text style={styles.earningsTarget}>Target: ₹5,000/day</Text>
          </View>

          {/* Recent Activity */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
          </View>

          {upcomingBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No upcoming sessions</Text>
              <Text style={styles.emptySubtext}>Students will book sessions soon</Text>
            </View>
          ) : (
            upcomingBookings.slice(0, 3).map(booking => (
              <TouchableOpacity
                key={booking.id}
                style={styles.activityCard}
                onPress={() => Alert.alert(booking.subject, `Student: ${booking.student?.profile?.full_name}\nTime: ${new Date(booking.booked_date).toLocaleString()}`)}
              >
                <View style={styles.activityDot} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{booking.subject}</Text>
                  <Text style={styles.activitySubtitle}>{booking.student?.profile?.full_name || 'Student'}</Text>
                  <Text style={styles.activityTime}>{new Date(booking.booked_date).toLocaleString()}</Text>
                </View>
                <Text style={styles.activityPrice}>₹{pricePerCall}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={[styles.navItem, activeTab === 'home' && styles.navItemActive]}
            onPress={() => setActiveTab('home')}
          >
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeTab === 'earnings' && styles.navItemActive]}
            onPress={() => setActiveTab('earnings')}
          >
            <Text style={styles.navIcon}>💰</Text>
            <Text style={styles.navLabel}>Earnings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeTab === 'calls' && styles.navItemActive]}
            onPress={() => setActiveTab('calls')}
          >
            <Text style={styles.navIcon}>📞</Text>
            <Text style={styles.navLabel}>Calls</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeTab === 'settings' && styles.navItemActive]}
            onPress={() => setActiveTab('settings')}
          >
            <Text style={styles.navIcon}>⚙️</Text>
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
        ? mockEarnings.weekly
        : earningsFilter === 'monthly'
        ? mockEarnings.monthly
        : mockEarnings.yearly;

    const totalEarnings = currentData.reduce((sum, item) => sum + item.amount, 0);
    const maxAmount = Math.max(...currentData.map(item => item.amount));

    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.welcome}>Earnings Analytics 💰</Text>
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
              <Text style={styles.breakdownLabel}>Total Earnings</Text>
              <Text style={styles.breakdownValue}>₹{totalEarnings.toLocaleString()}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Platform Fee (5%)</Text>
              <Text style={styles.breakdownValue}>-₹{Math.round(totalEarnings * 0.05).toLocaleString()}</Text>
            </View>
            <View style={[styles.breakdownItem, styles.breakdownItemLast]}>
              <Text style={styles.breakdownLabel}>Net Earnings</Text>
              <Text style={styles.breakdownValueNet}>₹{Math.round(totalEarnings * 0.95).toLocaleString()}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('home')}
          >
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, styles.navItemActive]}
            onPress={() => setActiveTab('earnings')}
          >
            <Text style={styles.navIcon}>💰</Text>
            <Text style={styles.navLabel}>Earnings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('calls')}
          >
            <Text style={styles.navIcon}>📞</Text>
            <Text style={styles.navLabel}>Calls</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('settings')}
          >
            <Text style={styles.navIcon}>⚙️</Text>
            <Text style={styles.navLabel}>Settings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // CALLS TAB
  if (activeTab === 'calls') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView>
          <View style={styles.header}>
            <Text style={styles.welcome}>My Calls 📞</Text>
          </View>

          {/* Upcoming Calls */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
          </View>

          {upcomingBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No upcoming calls</Text>
              <Text style={styles.emptySubtext}>Waiting for students to book sessions</Text>
            </View>
          ) : (
            upcomingBookings.map(booking => (
              <TouchableOpacity
                key={booking.id}
                style={styles.callCard}
                onPress={() => navigation.navigate(SCREEN_NAMES.Join)}
              >
                <View style={styles.callTime}>
                  <Text style={styles.callTimeText}>{new Date(booking.booked_date).toLocaleTimeString()}</Text>
                </View>
                <View style={styles.callContent}>
                  <Text style={styles.callStudent}>{booking.student?.profile?.full_name || 'Student'}</Text>
                  <Text style={styles.callSubject}>{booking.subject}</Text>
                  <View style={styles.callMeta}>
                    <Text style={styles.callDuration}>⏱️ {booking.duration_minutes} min</Text>
                    <Text style={styles.callPrice}>💵 ₹{pricePerCall}</Text>
                  </View>
                </View>
                <Text style={styles.callArrow}>→</Text>
              </TouchableOpacity>
            ))
          )}

          {/* Call History */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Call History</Text>
          </View>

          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>No history yet</Text>
            <Text style={styles.emptySubtext}>Complete a session to see it here</Text>
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('home')}
          >
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('earnings')}
          >
            <Text style={styles.navIcon}>💰</Text>
            <Text style={styles.navLabel}>Earnings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, styles.navItemActive]}
            onPress={() => setActiveTab('calls')}
          >
            <Text style={styles.navIcon}>📞</Text>
            <Text style={styles.navLabel}>Calls</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('settings')}
          >
            <Text style={styles.navIcon}>⚙️</Text>
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
            <Text style={styles.welcome}>Settings ⚙️</Text>
          </View>

          {/* Profile Section */}
          <View style={styles.profileSettingsCard}>
            <Text style={styles.profileImage}>👨‍🏫</Text>
            <Text style={styles.settingName}>{teacherName}</Text>
            <Text style={styles.settingSubtitle}>{specializations || 'Tutor'}</Text>
          </View>

          {/* Profile Settings */}
          <View style={styles.settingsSection}>
            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={() => navigation.navigate(SCREEN_NAMES.EditTeacherProfile)}
            >
              <Text style={styles.settingIcon}>✏️</Text>
              <Text style={styles.settingText}>Edit Profile</Text>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Set Price', `Current: ₹${pricePerCall}/call`)}>
              <Text style={styles.settingIcon}>💵</Text>
              <Text style={styles.settingText}>Set Hourly Rate</Text>
              <Text style={styles.settingValue}>₹{pricePerCall}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Bank Account')}>
              <Text style={styles.settingIcon}>🏦</Text>
              <Text style={styles.settingText}>Bank Account</Text>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Notifications')}>
              <Text style={styles.settingIcon}>🔔</Text>
              <Text style={styles.settingText}>Notifications</Text>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Privacy')}>
              <Text style={styles.settingIcon}>🔒</Text>
              <Text style={styles.settingText}>Privacy & Security</Text>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Help')}>
              <Text style={styles.settingIcon}>❓</Text>
              <Text style={styles.settingText}>Help & Support</Text>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingItem, styles.logoutItem]} 
              onPress={() => Alert.alert('Logout', 'Are you sure you want to logout?')}
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
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('earnings')}
          >
            <Text style={styles.navIcon}>💰</Text>
            <Text style={styles.navLabel}>Earnings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('calls')}
          >
            <Text style={styles.navIcon}>📞</Text>
            <Text style={styles.navLabel}>Calls</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, styles.navItemActive]}
            onPress={() => setActiveTab('settings')}
          >
            <Text style={styles.navIcon}>⚙️</Text>
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

  // Header
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 10,
  },
  welcome: {
    color: '#ccc',
    fontSize: 14,
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
  actionIcon: {
    fontSize: 32,
    marginRight: 15,
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
  actionArrow: {
    color: '#fff',
    fontSize: 18,
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
    color: '#fff',
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
  },
  navItemActive: {
    borderTopWidth: 3,
    borderTopColor: '#5568FE',
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 3,
  },
  navLabel: {
    color: '#ccc',
    fontSize: 11,
  },
  emptyText: {
    color: '#fffdfd',
  },
  emptySubtext: {
    color: '#ffffff',
  },
});
