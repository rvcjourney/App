import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { getNotificationsPage, markNotificationAsRead } from '../database/database';
import UNIFIED_THEME from '../constants/unifiedTheme';
import ThemedText from '../components/ThemedText';
import Icon from '../components/Icon';

const NOTIFICATION_ICONS = {
  booking_request: { iconName: 'calendar', label: 'Booking Request' },
  booking_confirmed: { iconName: 'check', label: 'Booking Confirmed' },
  booking_cancelled: { iconName: 'close', label: 'Cancellation' },
  booking_rescheduled: { iconName: 'refresh', label: 'Reschedule' },
  meeting_reminder: { iconName: 'clock', label: 'Reminder' },
  meeting_started: { iconName: 'phone', label: 'Meeting Started' },
  meeting_completed: { iconName: 'checkCircle', label: 'Meeting Completed' },
  payment_confirmed: { iconName: 'creditCard', label: 'Payment Confirmed' },
  payment_received: { iconName: 'money', label: 'Payment Received' },
  withdrawal_requested: { iconName: 'bank', label: 'Withdrawal Request' },
  withdrawal_approved: { iconName: 'check', label: 'Withdrawal Approved' },
  earnings_added: { iconName: 'dollarSign', label: 'Earnings Added' },
};

function getNotificationMeta(type) {
  return NOTIFICATION_ICONS[type] || { iconName: 'inbox', label: 'Notification' };
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
          <Icon name={meta.iconName} size={20} color={UNIFIED_THEME.colors.accent.primary} />
        </View>
        <View style={styles.body}>
          <ThemedText variant="label" size="sm" color="primary" style={styles.typeLabel}>{meta.label}</ThemedText>
          <ThemedText variant="body" size="md" numberOfLines={1} style={styles.title}>{item.title}</ThemedText>
          <ThemedText variant="body" size="sm" color="muted" numberOfLines={2} style={styles.message}>{item.message}</ThemedText>
          <ThemedText variant="body" size="xs" color="muted" style={styles.time}>{formatTime(item.created_at)}</ThemedText>
        </View>
        <Icon name="chevronRight" size={20} color={UNIFIED_THEME.colors.text.muted} />
      </TouchableOpacity>
    );
  }, [onPressItem]);

  const keyExtractor = useCallback((item) => item.id, []);

  if (!userId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="chevronLeft" size={24} color={UNIFIED_THEME.colors.accent.primary} />
          </TouchableOpacity>
          <ThemedText variant="heading" size="md" style={styles.headerTitle}>Notifications</ThemedText>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={UNIFIED_THEME.colors.accent.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="chevronLeft" size={24} color={UNIFIED_THEME.colors.accent.primary} />
        </TouchableOpacity>
        <ThemedText variant="heading" size="md" style={styles.headerTitle}>Notifications</ThemedText>
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={UNIFIED_THEME.colors.accent.primary} />
          <ThemedText variant="body" size="sm" color="muted" style={styles.loadingText}>Loading notifications...</ThemedText>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <ThemedText style={styles.emptyIcon}>🔔</ThemedText>
          <ThemedText variant="heading" size="sm" style={styles.emptyTitle}>No notifications yet</ThemedText>
          <ThemedText variant="body" size="sm" color="muted" style={styles.emptySub}>Bookings, payments & reminders will show here</ThemedText>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[UNIFIED_THEME.colors.accent.primary]} />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={UNIFIED_THEME.colors.accent.primary} />
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
    backgroundColor: UNIFIED_THEME.colors.primary.light,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: UNIFIED_THEME.colors.border.light,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: UNIFIED_THEME.spacing.md,
  },
  headerTitle: {
    flex: 1,
  },
  listContent: {
    padding: UNIFIED_THEME.spacing.lg,
    paddingBottom: UNIFIED_THEME.spacing.xxxl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    padding: UNIFIED_THEME.spacing.md,
    marginBottom: UNIFIED_THEME.spacing.sm,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.default,
    ...UNIFIED_THEME.shadows.small,
  },
  cardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: UNIFIED_THEME.colors.accent.primary,
    ...UNIFIED_THEME.shadows.medium,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: UNIFIED_THEME.borderRadius.round,
    backgroundColor: 'rgba(255, 0, 110, 0.15)',
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: UNIFIED_THEME.spacing.md,
  },
  body: {
    flex: 1,
  },
  typeLabel: {
    marginBottom: UNIFIED_THEME.spacing.xs,
  },
  title: {
    marginBottom: UNIFIED_THEME.spacing.xs,
  },
  message: {
    marginBottom: UNIFIED_THEME.spacing.xs,
  },
  time: {},
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: UNIFIED_THEME.spacing.md,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: UNIFIED_THEME.spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: UNIFIED_THEME.spacing.lg,
  },
  emptyTitle: {
    marginBottom: UNIFIED_THEME.spacing.md,
  },
  emptySub: {
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: UNIFIED_THEME.spacing.lg,
    alignItems: 'center',
  },
});
