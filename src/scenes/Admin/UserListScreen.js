import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SCREEN_NAMES } from '../../navigators/screenNames';
import { getAllUsersForAdmin } from '../../database/database';
import UNIFIED_THEME from '../../constants/unifiedTheme';
import ThemedText from '../../components/ThemedText';
import Icon from '../../components/Icon';

const ROLE_LABELS = { student: 'Student', teacher: 'Teacher', super_admin: 'Super Admin' };
const ROLE_COLORS = {
  student: UNIFIED_THEME.colors.accent.info,
  teacher: UNIFIED_THEME.colors.status.approved,
  super_admin: UNIFIED_THEME.colors.status.rejected,
};

export default function UserListScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const data = await getAllUsersForAdmin();
      setUsers(data || []);
      applyFilters(data || [], search, roleFilter);
    } catch (e) {
      console.error('🔴 UserList load:', e);
      setUsers([]);
      setFiltered([]);
    }
  }, []);

  const applyFilters = (list, q, role) => {
    let out = list;
    if (role && role !== 'all') {
      out = out.filter(u => (u.role || '').toLowerCase() === role);
    }
    if (q && q.trim()) {
      const lower = q.trim().toLowerCase();
      out = out.filter(u =>
        (u.full_name || '').toLowerCase().includes(lower)
      );
    }
    setFiltered(out);
  };

  useEffect(() => {
    applyFilters(users, search, roleFilter);
  }, [search, roleFilter, users]);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setLoading(true);
      await loadUsers();
      if (!cancelled) setLoading(false);
    };
    init();
    return () => { cancelled = true; };
  }, [loadUsers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const openEdit = (user) => {
    navigation.navigate(SCREEN_NAMES.AdminUserEdit, { user });
  };

  const openTeacherWallet = (user) => {
    navigation.navigate(SCREEN_NAMES.AdminTeacherWallet, {
      teacherId: user.id,
      teacherName: user.full_name || 'Teacher',
    });
  };

  const renderItem = ({ item }) => {
    const role = (item.role || 'student').toLowerCase();
    const label = ROLE_LABELS[role] || role;
    const color = ROLE_COLORS[role] || UNIFIED_THEME.colors.text.muted;
    const isTeacher = role === 'teacher';
    return (
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.rowMain}
          onPress={() => openEdit(item)}
          activeOpacity={0.8}
        >
          <View style={styles.avatar}>
            <Icon name="user" size={24} color={UNIFIED_THEME.colors.accent.primary} />
          </View>
          <View style={styles.rowContent}>
            <ThemedText variant="body" size="md" numberOfLines={1} style={styles.name}>{item.full_name || '—'}</ThemedText>
            <ThemedText variant="body" size="xs" color="muted" numberOfLines={1} style={styles.id}>{item.id}</ThemedText>
            <View style={[styles.badge, { backgroundColor: color + '22' }]}>
              <ThemedText variant="label" size="xs" style={[styles.badgeText, { color }]}>{label}</ThemedText>
            </View>
          </View>
        </TouchableOpacity>
        {isTeacher && (
          <TouchableOpacity
            style={styles.walletChip}
            onPress={() => openTeacherWallet(item)}
            activeOpacity={0.8}
          >
            <ThemedText color="primary" style={styles.walletChipText}>Wallet</ThemedText>
          </TouchableOpacity>
        )}
        <Icon name="chevronRight" size={20} color={UNIFIED_THEME.colors.text.muted} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ThemedText color="primary" style={styles.backText}>← Back</ThemedText>
        </TouchableOpacity>
        <ThemedText variant="heading" size="md" style={styles.title}>Users</ThemedText>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          placeholderTextColor={UNIFIED_THEME.colors.text.muted}
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.searchIcon}>
          <Icon name="search" size={20} color={UNIFIED_THEME.colors.text.muted} />
        </View>
      </View>

      <View style={styles.filterRow}>
        {['all', 'student', 'teacher', 'super_admin'].map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.filterChip, roleFilter === r && styles.filterChipActive]}
            onPress={() => setRoleFilter(r)}
          >
            <ThemedText
              variant="label"
              size="sm"
              color={roleFilter === r ? 'onAccent' : 'muted'}
              style={styles.filterChipText}
            >
              {r === 'all' ? 'All' : ROLE_LABELS[r] || r}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={UNIFIED_THEME.colors.accent.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <ThemedText variant="body" size="sm" color="muted" style={styles.emptyText}>No users match your filters</ThemedText>
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
  searchWrap: { marginHorizontal: UNIFIED_THEME.spacing.lg, marginTop: UNIFIED_THEME.spacing.lg, position: 'relative' },
  searchInput: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    paddingVertical: UNIFIED_THEME.spacing.md,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingRight: 44,
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 14,
  },
  searchIcon: { position: 'absolute', right: 14, top: 14 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: UNIFIED_THEME.spacing.lg, marginTop: UNIFIED_THEME.spacing.md, gap: UNIFIED_THEME.spacing.sm },
  filterChip: {
    paddingVertical: UNIFIED_THEME.spacing.sm,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.round,
    backgroundColor: UNIFIED_THEME.colors.component.card,
  },
  filterChipActive: { backgroundColor: UNIFIED_THEME.colors.accent.primary },
  filterChipText: {},
  filterChipTextActive: { color: UNIFIED_THEME.colors.text.onAccent },
  listContent: { paddingHorizontal: UNIFIED_THEME.spacing.lg, paddingBottom: UNIFIED_THEME.spacing.xxxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    padding: UNIFIED_THEME.spacing.md,
    marginBottom: UNIFIED_THEME.spacing.sm,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletChip: {
    paddingVertical: UNIFIED_THEME.spacing.sm,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    backgroundColor: 'rgba(255, 0, 110, 0.15)',
    marginRight: UNIFIED_THEME.spacing.md,
  },
  walletChipText: { fontSize: 12, fontWeight: '600' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: UNIFIED_THEME.borderRadius.round,
    backgroundColor: UNIFIED_THEME.colors.primary.dark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: UNIFIED_THEME.spacing.md,
  },
  rowContent: { flex: 1 },
  name: { marginBottom: UNIFIED_THEME.spacing.xs },
  id: { marginBottom: UNIFIED_THEME.spacing.md },
  badge: { alignSelf: 'flex-start', paddingHorizontal: UNIFIED_THEME.spacing.sm, paddingVertical: UNIFIED_THEME.spacing.xs, borderRadius: UNIFIED_THEME.borderRadius.sm },
  badgeText: {},
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { paddingVertical: UNIFIED_THEME.spacing.xxxl, alignItems: 'center' },
  emptyText: {},
});
