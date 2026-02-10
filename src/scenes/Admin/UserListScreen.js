import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
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
import User from '../../assets/icons/User';
import ChevronRight from '../../assets/icons/ChevronRight';
import SearchIcon from '../../assets/icons/SearchIcon';

const ROLE_LABELS = { student: 'Student', teacher: 'Teacher', super_admin: 'Super Admin' };
const ROLE_COLORS = { student: '#3B82F6', teacher: '#2ECC71', super_admin: '#E74C3C' };

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
    const color = ROLE_COLORS[role] || '#6b7280';
    const isTeacher = role === 'teacher';
    return (
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.rowMain}
          onPress={() => openEdit(item)}
          activeOpacity={0.8}
        >
          <View style={styles.avatar}>
            <User width={24} height={24} fill="#5568FE" />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.name} numberOfLines={1}>{item.full_name || '—'}</Text>
            <Text style={styles.id} numberOfLines={1}>{item.id}</Text>
            <View style={[styles.badge, { backgroundColor: color + '22' }]}>
              <Text style={[styles.badgeText, { color }]}>{label}</Text>
            </View>
          </View>
        </TouchableOpacity>
        {isTeacher && (
          <TouchableOpacity
            style={styles.walletChip}
            onPress={() => openTeacherWallet(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.walletChipText}>Wallet</Text>
          </TouchableOpacity>
        )}
        <ChevronRight width={20} height={20} fill="#6b7280" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Users</Text>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          placeholderTextColor="#6b7280"
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.searchIcon}>
          <SearchIcon width={20} height={20} fill="#6b7280" />
        </View>
      </View>

      <View style={styles.filterRow}>
        {['all', 'student', 'teacher', 'super_admin'].map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.filterChip, roleFilter === r && styles.filterChipActive]}
            onPress={() => setRoleFilter(r)}
          >
            <Text style={[styles.filterChipText, roleFilter === r && styles.filterChipTextActive]}>
              {r === 'all' ? 'All' : ROLE_LABELS[r] || r}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5568FE" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No users match your filters</Text>
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
  searchWrap: { marginHorizontal: 20, marginTop: 16, position: 'relative' },
  searchInput: {
    backgroundColor: '#1C1F4A',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingRight: 44,
    color: '#fff',
    fontSize: 14,
  },
  searchIcon: { position: 'absolute', right: 14, top: 14 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, marginTop: 12, gap: 8 },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#1C1F4A',
  },
  filterChipActive: { backgroundColor: '#5568FE' },
  filterChipText: { color: '#9ca3af', fontSize: 13, fontWeight: '500' },
  filterChipTextActive: { color: '#fff' },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#5568FE22',
    marginRight: 8,
  },
  walletChipText: { color: '#5568FE', fontSize: 12, fontWeight: '600' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#252965',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowContent: { flex: 1 },
  name: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  id: { color: '#6b7280', fontSize: 11, marginBottom: 6 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { color: '#6b7280', fontSize: 14 },
});
