import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';
import { API_URL } from '../../api/api';

/**
 * Admin view of a teacher's wallet: balance, eligibility, recent earnings.
 * Admin can edit total_balance and available_balance.
 */
export default function AdminTeacherWallet({ navigation, route }) {
  const { teacherId, teacherName } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [earnings, setEarnings] = useState([]);
  const [eligibility, setEligibility] = useState(null);
  const [editTotal, setEditTotal] = useState('');
  const [editAvailable, setEditAvailable] = useState('');

  const loadData = async () => {
    if (!teacherId) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/teacher/earnings/${teacherId}`);
      const result = await response.json();

      if (result.success) {
        const w = result.wallet;
        setWallet(w);
        setEditTotal(String(w?.total_balance ?? 0));
        setEditAvailable(String(w?.available_balance ?? 0));
        setEarnings(result.earnings || []);
        setEligibility(result.eligibility);
      } else {
        Toast.show(result.error || 'Failed to load wallet');
      }
    } catch (error) {
      console.error('Error loading teacher wallet:', error);
      Toast.show('Error loading wallet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [teacherId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSaveWallet = async () => {
    const total = parseFloat(editTotal);
    const available = parseFloat(editAvailable);
    if (isNaN(total) || total < 0 || isNaN(available) || available < 0) {
      Toast.show('Enter valid non-negative numbers');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/teacher/${teacherId}/wallet`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total_balance: total, available_balance: available }),
      });
      const result = await response.json();
      if (result.success) {
        setWallet(result.wallet);
        Toast.show('Wallet updated');
      } else {
        Toast.show(result.error || 'Failed to update wallet');
      }
    } catch (error) {
      console.error('Error updating wallet:', error);
      Toast.show('Error updating wallet');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#5568FE" />
          <Text style={styles.loadingText}>Loading wallet...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!teacherId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No teacher selected</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backWrap}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Teacher Wallet</Text>
          {teacherName ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>{teacherName}</Text>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.balanceSection}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>₹{wallet?.total_balance?.toLocaleString() ?? 0}</Text>
            <Text style={styles.balanceSubtext}>All time earnings</Text>
          </View>
          <View style={[styles.balanceCard, { backgroundColor: '#2E7D32' }]}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>₹{wallet?.available_balance?.toLocaleString() ?? 0}</Text>
            <Text style={styles.balanceSubtext}>Can withdraw now</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Edit wallet amounts</Text>
          <View style={styles.editBox}>
            <Text style={styles.editLabel}>Total balance (₹)</Text>
            <TextInput
              style={styles.input}
              value={editTotal}
              onChangeText={setEditTotal}
              placeholder="0"
              placeholderTextColor="#6b7280"
              keyboardType="numeric"
            />
            <Text style={styles.editLabel}>Available balance (₹)</Text>
            <TextInput
              style={styles.input}
              value={editAvailable}
              onChangeText={setEditAvailable}
              placeholder="0"
              placeholderTextColor="#6b7280"
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSaveWallet}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Update wallet</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {eligibility && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Withdrawal Eligibility</Text>
            <View style={styles.eligibilityBox}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Status:</Text>
                <Text
                  style={[
                    styles.statusValue,
                    { color: eligibility.can_withdraw ? '#4CAF50' : '#FF9800' },
                  ]}
                >
                  {eligibility.can_withdraw ? '✓ Eligible' : 'Not Eligible'}
                </Text>
              </View>
              <View style={styles.reasonBox}>
                <Text style={styles.reasonText}>{eligibility.eligibility_reason}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Earnings</Text>
          {earnings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No earnings yet</Text>
            </View>
          ) : (
            earnings.slice(0, 15).map((earning, index) => (
              <View key={earning.id || index} style={styles.earningCard}>
                <View style={styles.earningHeader}>
                  <Text style={styles.earningDate}>
                    {new Date(earning.created_at).toLocaleDateString()}
                  </Text>
                  <Text style={styles.earningAmount}>+₹{earning.teacher_earn?.toLocaleString()}</Text>
                </View>
                <View style={styles.earningDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Student Paid:</Text>
                    <Text style={styles.detailValue}>₹{earning.total_collected}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Admin Fee:</Text>
                    <Text style={styles.detailValue}>-₹{earning.admin_deduction}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Platform Fee:</Text>
                    <Text style={styles.detailValue}>-₹{earning.platform_fee}</Text>
                  </View>
                  <View style={[styles.detailRow, styles.yourEarnRow]}>
                    <Text style={styles.yourEarnLabel}>Teacher Share:</Text>
                    <Text style={styles.yourEarnValue}>₹{earning.teacher_earn}</Text>
                  </View>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{earning.status}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.note}>
            💡 Approve pending withdrawals from the Withdrawals tab on the admin dashboard.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D2A' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#9ca3af', marginTop: 10, fontSize: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1F4A',
  },
  backWrap: { marginRight: 12 },
  backBtn: { color: '#5568FE', fontSize: 16, fontWeight: '600' },
  headerTitleWrap: { flex: 1 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerSubtitle: { color: '#9ca3af', fontSize: 13, marginTop: 2 },
  scrollView: { flex: 1, paddingBottom: 30 },
  balanceSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    gap: 12,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 15,
  },
  balanceLabel: { color: '#999', fontSize: 11, fontWeight: '600', marginBottom: 6 },
  balanceAmount: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  balanceSubtext: { color: '#666', fontSize: 10 },
  section: { paddingHorizontal: 20, marginVertical: 15 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  eligibilityBox: { backgroundColor: '#1C1F4A', borderRadius: 12, padding: 15 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statusLabel: { color: '#999', fontSize: 13 },
  statusValue: { fontSize: 14, fontWeight: '700' },
  reasonBox: { backgroundColor: '#0B0D2A', borderRadius: 8, padding: 10 },
  reasonText: { color: '#FF9800', fontSize: 12, lineHeight: 18 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#999', fontSize: 14, fontWeight: '600' },
  earningCard: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  earningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  earningDate: { color: '#999', fontSize: 12 },
  earningAmount: { color: '#4CAF50', fontSize: 14, fontWeight: '700' },
  earningDetails: { backgroundColor: '#0B0D2A', borderRadius: 6, padding: 8, marginBottom: 8 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomColor: '#2A2D5A',
    borderBottomWidth: 1,
  },
  detailLabel: { color: '#999', fontSize: 11 },
  detailValue: { color: '#fff', fontSize: 11, fontWeight: '500' },
  yourEarnRow: { borderBottomWidth: 0, paddingVertical: 4, marginTop: 2 },
  yourEarnLabel: { color: '#4CAF50', fontSize: 11, fontWeight: '600' },
  yourEarnValue: { color: '#4CAF50', fontSize: 12, fontWeight: '700' },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  note: { color: '#9ca3af', fontSize: 12, lineHeight: 18 },
  editBox: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 16,
  },
  editLabel: { color: '#9ca3af', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: '#0B0D2A',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: '#fff',
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: '#5568FE',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
