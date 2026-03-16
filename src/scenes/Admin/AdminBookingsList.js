import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllBookingsForAdmin } from '../../database/database';
import UNIFIED_THEME from '../../constants/unifiedTheme';
import ThemedText from '../../components/ThemedText';
import Icon from '../../components/Icon';

const STATUS_COLORS = {
  pending: UNIFIED_THEME.colors.status.pending,
  confirmed: UNIFIED_THEME.colors.status.approved,
  completed: UNIFIED_THEME.colors.text.muted,
  cancelled: UNIFIED_THEME.colors.status.rejected,
};

export default function AdminBookingsList({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getAllBookingsForAdmin();
      setBookings(data || []);
    } catch (e) {
      logger.error('🔴 AdminBookings load:', e);
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
    const statusColor = STATUS_COLORS[status] || UNIFIED_THEME.colors.text.muted;
    const date = item.booked_date ? new Date(item.booked_date) : null;
    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <ThemedText variant="label" size="sm" color="muted" style={styles.label}>Student</ThemedText>
          <ThemedText variant="body" size="sm" style={styles.value}>{item.student_name || '—'}</ThemedText>
        </View>
        <View style={styles.cardRow}>
          <ThemedText variant="label" size="sm" color="muted" style={styles.label}>Teacher</ThemedText>
          <ThemedText variant="body" size="sm" style={styles.value}>{item.teacher_name || '—'}</ThemedText>
        </View>
        <View style={styles.cardRow}>
          <ThemedText variant="label" size="sm" color="muted" style={styles.label}>Subject</ThemedText>
          <ThemedText variant="body" size="sm" style={styles.value}>{item.subject || '—'}</ThemedText>
        </View>
        <View style={styles.cardRow}>
          <ThemedText variant="label" size="sm" color="muted" style={styles.label}>Date & time</ThemedText>
          <ThemedText variant="body" size="sm" style={styles.value}>
            {date ? date.toLocaleString() : '—'}
          </ThemedText>
        </View>
        <View style={[styles.badge, { backgroundColor: statusColor + '22' }]}>
          <ThemedText variant="label" size="xs" style={[styles.badgeText, { color: statusColor }]}>{status}</ThemedText>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ThemedText color="primary" style={styles.backText}>← Back</ThemedText>
        </TouchableOpacity>
        <ThemedText variant="heading" size="md" style={styles.title}>All Bookings</ThemedText>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={UNIFIED_THEME.colors.accent.primary} />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="calendar" size={48} color={UNIFIED_THEME.colors.text.muted} />
              <ThemedText variant="body" size="sm" color="muted" style={styles.emptyText}>No bookings yet</ThemedText>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[UNIFIED_THEME.colors.accent.primary]} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UNIFIED_THEME.colors.primary.light },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: UNIFIED_THEME.colors.border.light,
  },
  backBtn: { marginRight: UNIFIED_THEME.spacing.md },
  backText: { fontSize: 16, fontWeight: '600' },
  title: { fontWeight: 'bold' },
  listContent: { paddingHorizontal: UNIFIED_THEME.spacing.lg, paddingBottom: UNIFIED_THEME.spacing.xxxl },
  card: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    padding: UNIFIED_THEME.spacing.lg,
    marginBottom: UNIFIED_THEME.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: UNIFIED_THEME.colors.accent.primary,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: UNIFIED_THEME.spacing.sm },
  label: {},
  value: { flex: 1, marginLeft: UNIFIED_THEME.spacing.md, textAlign: 'right' },
  badge: { alignSelf: 'flex-start', marginTop: UNIFIED_THEME.spacing.md, paddingHorizontal: UNIFIED_THEME.spacing.sm, paddingVertical: UNIFIED_THEME.spacing.xs, borderRadius: UNIFIED_THEME.borderRadius.sm },
  badgeText: {},
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { paddingVertical: UNIFIED_THEME.spacing.xxxl, alignItems: 'center' },
  emptyText: { marginTop: UNIFIED_THEME.spacing.lg },
});
