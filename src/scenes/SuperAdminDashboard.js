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
import Users from '../assets/icons/Users';
import User from '../assets/icons/User';
import Calendar from '../assets/icons/Calendar';
import ChevronRight from '../assets/icons/ChevronRight';
import Settings from '../assets/icons/Settings';

export default function SuperAdminDashboard({ navigation }) {
  const [adminName, setAdminName] = useState('Admin');
  const [userCount, setUserCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
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
          <Text style={styles.loadingText}>Loading admin...</Text>
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
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerIconWrap}>
              <Settings width={28} height={28} fill="#5568FE" />
            </View>
            <View>
              <Text style={styles.welcome}>Super Admin</Text>
              <Text style={styles.adminName}>{adminName}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Manage</Text>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate(SCREEN_NAMES.AdminUserList)}
          activeOpacity={0.8}
        >
          <View style={styles.cardLeft}>
            <View style={styles.cardIcon}>
              <Users width={24} height={24} fill="#5568FE" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Users</Text>
              <Text style={styles.cardSubtitle}>CRUD on all users (students, teachers, admins)</Text>
              <Text style={styles.cardStat}>{userCount} users</Text>
            </View>
          </View>
          <ChevronRight width={22} height={22} fill="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate(SCREEN_NAMES.AdminBookingsList)}
          activeOpacity={0.8}
        >
          <View style={styles.cardLeft}>
            <View style={styles.cardIcon}>
              <Calendar width={24} height={24} fill="#2ECC71" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Bookings</Text>
              <Text style={styles.cardSubtitle}>View and manage all bookings</Text>
              <Text style={styles.cardStat}>{bookingCount} bookings</Text>
            </View>
          </View>
          <ChevronRight width={22} height={22} fill="#6b7280" />
        </TouchableOpacity>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <User width={20} height={20} fill="#fff" />
            <Text style={styles.logoutBtnText}>Logout</Text>
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
    paddingBottom: 40,
  },
  header: {
    paddingVertical: 20,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#1C1F4A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  welcome: {
    color: '#9ca3af',
    fontSize: 13,
    marginBottom: 2,
  },
  adminName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1C1F4A',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderLeftColor: '#5568FE',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#252965',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 4,
  },
  cardStat: {
    color: '#5568FE',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E74C3C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    gap: 8,
  },
  logoutBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
