import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { getNotificationsPage, markNotificationAsRead } from '../database/database';
import ChevronRight from '../assets/icons/ChevronRight';

const NOTIFICATION_ICONS = {
  booking_request: { icon: '📅', label: 'Booking Request' },
  booking_confirmed: { icon: '✅', label: 'Booking Confirmed' },
  booking_cancelled: { icon: '❌', label: 'Cancellation' },
  booking_rescheduled: { icon: '🔄', label: 'Reschedule' },
  meeting_reminder: { icon: '⏰', label: 'Reminder' },
  meeting_started: { icon: '📞', label: 'Meeting Started' },
  meeting_completed: { icon: '✔️', label: 'Meeting Completed' },
  payment_confirmed: { icon: '💳', label: 'Payment Confirmed' },
  payment_received: { icon: '💰', label: 'Payment Received' },
  withdrawal_requested: { icon: '🏦', label: 'Withdrawal Request' },
  withdrawal_approved: { icon: '✅', label: 'Withdrawal Approved' },
  earnings_added: { icon: '💵', label: 'Earnings Added' },
};

function getNotificationMeta(type) {
  return NOTIFICATION_ICONS[type] || { icon: '📬', label: 'Notification' };
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

export default function NotificationsScreen({ navigation }) {
  const [userId, setUserId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const loadUserId = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  }, []);

  const loadPage = useCallback(async (cursor = null, append = false) => {
    if (!userId) return;
    if (append) setLoadingMore(true);
    else if (!cursor) setLoading(true);

    try {
      const { items: pageItems, nextCursor: next, hasMore: more } = await getNotificationsPage(userId, {
        limit: 20,
        cursor,
      });
      if (append) {
        setItems((prev) => [...prev, ...pageItems]);
      } else {
        setItems(pageItems);
      }
      setNextCursor(next);
      setHasMore(more);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUserId();
  }, [loadUserId]);

  useEffect(() => {
    if (userId) loadPage();
  }, [userId, loadPage]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPage();
  }, [loadPage]);

  const onLoadMore = useCallback(() => {
    if (loadingMore || !hasMore || !nextCursor) return;
    loadPage(nextCursor, true);
  }, [loadPage, loadingMore, hasMore, nextCursor]);

  const onPressItem = useCallback(async (item) => {
    if (!item.is_read) {
      try {
        await markNotificationAsRead(item.id);
        setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)));
      } catch (e) {
        console.warn('Mark read failed:', e);
      }
    }
  }, []);

  const renderItem = useCallback(({ item }) => {
    const meta = getNotificationMeta(item.notification_type);
    return (
      <TouchableOpacity
        style={[styles.card, !item.is_read && styles.cardUnread]}
        onPress={() => onPressItem(item)}
        activeOpacity={0.7}
      >
        <View style={styles.iconWrap}>
          <Text style={styles.iconText}>{meta.icon}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.typeLabel}>{meta.label}</Text>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.time}>{formatTime(item.created_at)}</Text>
        </View>
        <ChevronRight width={20} height={20} color="#666" />
      </TouchableOpacity>
    );
  }, [onPressItem]);

  const keyExtractor = useCallback((item) => item.id, []);

  if (!userId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronRight width={24} height={24} color="#ff006e" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#ff006e" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronRight width={24} height={24} color="#ff006e" style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#ff006e" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySub}>Bookings, payments & reminders will show here</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff006e']} />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#ff006e" />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1b3f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 0, 110, 0.2)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 110, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 110, 0.3)',
    shadowColor: 'rgba(255, 0, 110, 0.2)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  cardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff006e',
    shadowColor: 'rgba(255, 0, 110, 0.6)',
    shadowRadius: 15,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 0, 110, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 110, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 22,
  },
  body: {
    flex: 1,
  },
  typeLabel: {
    color: '#ff006e',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    color: '#b0b0b0',
    fontSize: 12,
    marginBottom: 4,
  },
  time: {
    color: '#808080',
    fontSize: 11,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#b0b0b0',
    marginTop: 10,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySub: {
    color: '#b0b0b0',
    fontSize: 14,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
