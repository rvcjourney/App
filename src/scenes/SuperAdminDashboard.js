import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SCREEN_NAMES } from '../navigators/screenNames';
import { supabase } from '../../supabase';
import { getAllUsersForAdmin, getAllBookingsForAdmin } from '../database/database';
import { API_URL } from '../api/api';
import Users from '../assets/icons/Users';
import User from '../assets/icons/User';
import Calendar from '../assets/icons/Calendar';
import ChevronRight from '../assets/icons/ChevronRight';
import DollarSign from '../assets/icons/DollarSign';
import MoneyBag from '../assets/icons/MoneyBag';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getDateLabel() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function SuperAdminDashboard({ navigation }) {
  const [adminName, setAdminName] = useState('Admin');
  const [userCount, setUserCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [pendingWithdrawalsCount, setPendingWithdrawalsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const [users, bookings] = await Promise.all([
        getAllUsersForAdmin(),
        getAllBookingsForAdmin(),
      ]);
      setUserCount(users?.length || 0);
      setBookingCount(bookings?.length || 0);

      try {
        const res = await fetch(`${API_URL}/api/admin/withdrawals`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setPendingWithdrawalsCount(json.data.length);
        }
      } catch (_) {
        setPendingWithdrawalsCount(0);
      }
    } catch (e) {
      console.error('🔴 SuperAdmin load stats:', e);
    }
  };

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: rows } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .limit(1);
        const name = (Array.isArray(rows) && rows[0]) ? rows[0].full_name : (rows?.full_name);
        if (name) setAdminName(name);
      }
    } catch (e) {
      console.error('🔴 SuperAdmin load profile:', e);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([loadStats(), loadProfile()]);
    setRefreshing(false);
  };

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setLoading(true);
      await loadProfile();
      await loadStats();
      if (!cancelled) setLoading(false);
    };
    init();
    return () => { cancelled = true; };
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out from Admin?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => supabase.auth.signOut() },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5568FE" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={['#5568FE']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.adminName}>{adminName}</Text>
            </View>
          </View>
          <Text style={styles.dateLabel}>{getDateLabel()}</Text>
          <Text style={styles.headerSubtitle}>Here’s your overview</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: '#5568FE' }]}>
            <Users width={22} height={22} fill="#5568FE" />
            <Text style={styles.statValue}>{userCount}</Text>
            <Text style={styles.statLabel}>Users</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#2ECC71' }]}>
            <Calendar width={22} height={22} fill="#2ECC71" />
            <Text style={styles.statValue}>{bookingCount}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
            <MoneyBag width={22} height={22} fill="#F59E0B" />
            <Text style={styles.statValue}>{pendingWithdrawalsCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Section: Manage */}
        <Text style={styles.sectionTitle}>Manage</Text>

        <TouchableOpacity
          style={[styles.card, styles.cardUsers]}
          onPress={() => navigation.navigate(SCREEN_NAMES.AdminUserList)}
          activeOpacity={0.8}
        >
          <View style={styles.cardLeft}>
            <View style={[styles.cardIcon, { backgroundColor: '#5568FE22' }]}>
              <Users width={26} height={26} fill="#5568FE" />
            </View>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Users</Text>
              <Text style={styles.cardSubtitle}>Students, teachers & admins</Text>
              <Text style={styles.cardStat}>{userCount} total</Text>
            </View>
          </View>
          <ChevronRight width={22} height={22} fill="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.cardBookings]}
          onPress={() => navigation.navigate(SCREEN_NAMES.AdminBookingsList)}
          activeOpacity={0.8}
        >
          <View style={styles.cardLeft}>
            <View style={[styles.cardIcon, { backgroundColor: '#2ECC7122' }]}>
              <Calendar width={26} height={26} fill="#2ECC71" />
            </View>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Bookings</Text>
              <Text style={styles.cardSubtitle}>All sessions & status</Text>
              <Text style={styles.cardStat}>{bookingCount} total</Text>
            </View>
          </View>
          <ChevronRight width={22} height={22} fill="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.cardFinance]}
          onPress={() => navigation.navigate(SCREEN_NAMES.AdminFinance)}
          activeOpacity={0.8}
        >
          <View style={styles.cardLeft}>
            <View style={[styles.cardIcon, { backgroundColor: '#F59E0B22' }]}>
              <DollarSign width={26} height={26} fill="#F59E0B" />
            </View>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Finance</Text>
              <Text style={styles.cardSubtitle}>Charges, withdrawals & analytics</Text>
              <Text style={styles.cardStat}>{pendingWithdrawalsCount} pending</Text>
            </View>
          </View>
          <ChevronRight width={22} height={22} fill="#6b7280" />
        </TouchableOpacity>

        {/* Logout */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <User width={20} height={20} fill="#EF4444" />
            <Text style={styles.logoutBtnText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D2A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 10,
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    color: '#9ca3af',
    fontSize: 15,
    marginBottom: 2,
  },
  adminName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dateLabel: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 8,
  },
  headerSubtitle: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1C1F4A',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 10,
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: '#1C1F4A',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardUsers: { borderLeftWidth: 4, borderLeftColor: '#5568FE' },
  cardBookings: { borderLeftWidth: 4, borderLeftColor: '#2ECC71' },
  cardFinance: { borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardTextWrap: { flex: 1 },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardSubtitle: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 4,
  },
  cardStat: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    marginTop: 28,
    alignItems: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1F4A',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#374151',
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
});
