import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllBookingsForAdmin } from '../../database/database';
import Calendar from '../../assets/icons/Calendar';
import Clock from '../../assets/icons/Clock';
import CheckCircle from '../../assets/icons/CheckCircle';

const STATUS_COLORS = { pending: '#F59E0B', confirmed: '#2ECC71', completed: '#6b7280', cancelled: '#E74C3C' };

export default function AdminBookingsList({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getAllBookingsForAdmin();
      setBookings(data || []);
    } catch (e) {
      console.error('🔴 AdminBookings load:', e);
      setBookings([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    };
    init();
    return () => { cancelled = true; };
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderItem = ({ item }) => {
    const status = (item.status || 'pending').toLowerCase();
    const statusColor = STATUS_COLORS[status] || '#6b7280';
    const date = item.booked_date ? new Date(item.booked_date) : null;
    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.label}>Student</Text>
          <Text style={styles.value}>{item.student_name || '—'}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.label}>Teacher</Text>
          <Text style={styles.value}>{item.teacher_name || '—'}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.label}>Subject</Text>
          <Text style={styles.value}>{item.subject || '—'}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.label}>Date & time</Text>
          <Text style={styles.value}>
            {date ? date.toLocaleString() : '—'}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: statusColor + '22' }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>{status}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>All Bookings</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5568FE" />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Calendar width={48} height={48} fill="#6b7280" />
              <Text style={styles.emptyText}>No bookings yet</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5568FE']} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D2A' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1C1F4A' },
  backBtn: { marginRight: 12 },
  backText: { color: '#5568FE', fontSize: 16, fontWeight: '600' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#5568FE',
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { color: '#9ca3af', fontSize: 12 },
  value: { color: '#fff', fontSize: 13, fontWeight: '500', flex: 1, marginLeft: 8, textAlign: 'right' },
  badge: { alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { paddingVertical: 48, alignItems: 'center' },
  emptyText: { color: '#6b7280', marginTop: 12, fontSize: 14 },
});
