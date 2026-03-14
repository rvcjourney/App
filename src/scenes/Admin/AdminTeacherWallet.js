import React, { useState, useEffect } from 'react';
import {
  View,
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
import UNIFIED_THEME from '../../constants/unifiedTheme';
import ThemedText from '../../components/ThemedText';

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
          <ActivityIndicator size="large" color={UNIFIED_THEME.colors.accent.primary} />
          <ThemedText variant="body" size="sm" color="muted" style={styles.loadingText}>Loading wallet...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (!teacherId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ThemedText color="primary" style={styles.backBtn}>← Back</ThemedText>
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <ThemedText variant="body" size="sm" color="muted" style={styles.emptyText}>No teacher selected</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backWrap}>
          <ThemedText color="primary" style={styles.backBtn}>← Back</ThemedText>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <ThemedText variant="heading" size="md" style={styles.headerTitle}>Teacher Wallet</ThemedText>
          {teacherName ? (
            <ThemedText variant="body" size="sm" color="muted" numberOfLines={1} style={styles.headerSubtitle}>{teacherName}</ThemedText>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[UNIFIED_THEME.colors.accent.primary]} />}
      >
        <View style={styles.balanceSection}>
          <View style={styles.balanceCard}>
            <ThemedText variant="label" size="sm" color="muted" style={styles.balanceLabel}>Total Balance</ThemedText>
            <ThemedText variant="heading" size="lg" style={styles.balanceAmount}>₹{wallet?.total_balance?.toLocaleString() ?? 0}</ThemedText>
            <ThemedText variant="body" size="xs" color="muted" style={styles.balanceSubtext}>All time earnings</ThemedText>
          </View>
          <View style={[styles.balanceCard, { backgroundColor: UNIFIED_THEME.colors.status.approved }]}>
            <ThemedText variant="label" size="sm" color="muted" style={styles.balanceLabel}>Available Balance</ThemedText>
            <ThemedText variant="heading" size="lg" style={styles.balanceAmount}>₹{wallet?.available_balance?.toLocaleString() ?? 0}</ThemedText>
            <ThemedText variant="body" size="xs" color="muted" style={styles.balanceSubtext}>Can withdraw now</ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText variant="heading" size="sm" style={styles.sectionTitle}>Edit wallet amounts</ThemedText>
          <View style={styles.editBox}>
            <ThemedText variant="label" size="sm" color="muted" style={styles.editLabel}>Total balance (₹)</ThemedText>
            <TextInput
              style={styles.input}
              value={editTotal}
              onChangeText={setEditTotal}
              placeholder="0"
              placeholderTextColor={UNIFIED_THEME.colors.text.muted}
              keyboardType="numeric"
            />
            <ThemedText variant="label" size="sm" color="muted" style={styles.editLabel}>Available balance (₹)</ThemedText>
            <TextInput
              style={styles.input}
              value={editAvailable}
              onChangeText={setEditAvailable}
              placeholder="0"
              placeholderTextColor={UNIFIED_THEME.colors.text.muted}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSaveWallet}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={UNIFIED_THEME.colors.text.onAccent} size="small" />
              ) : (
                <ThemedText color="onAccent" style={styles.saveBtnText}>Update wallet</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {eligibility && (
          <View style={styles.section}>
            <ThemedText variant="heading" size="sm" style={styles.sectionTitle}>Withdrawal Eligibility</ThemedText>
            <View style={styles.eligibilityBox}>
              <View style={styles.statusRow}>
                <ThemedText variant="label" size="sm" color="muted" style={styles.statusLabel}>Status:</ThemedText>
                <ThemedText
                  variant="label"
                  size="sm"
                  style={[
                    styles.statusValue,
                    { color: eligibility.can_withdraw ? UNIFIED_THEME.colors.status.approved : UNIFIED_THEME.colors.status.pending },
                  ]}
                >
                  {eligibility.can_withdraw ? '✓ Eligible' : 'Not Eligible'}
                </ThemedText>
              </View>
              <View style={styles.reasonBox}>
                <ThemedText variant="body" size="sm" style={styles.reasonText}>{eligibility.eligibility_reason}</ThemedText>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <ThemedText variant="heading" size="sm" style={styles.sectionTitle}>Recent Earnings</ThemedText>
          {earnings.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyIcon}>📭</ThemedText>
              <ThemedText variant="body" size="sm" color="muted" style={styles.emptyText}>No earnings yet</ThemedText>
            </View>
          ) : (
            earnings.slice(0, 15).map((earning, index) => (
              <View key={earning.id || index} style={styles.earningCard}>
                <View style={styles.earningHeader}>
                  <ThemedText variant="body" size="sm" color="muted" style={styles.earningDate}>
                    {new Date(earning.created_at).toLocaleDateString()}
                  </ThemedText>
                  <ThemedText color="success" style={styles.earningAmount}>+₹{earning.teacher_earn?.toLocaleString()}</ThemedText>
                </View>
                <View style={styles.earningDetails}>
                  <View style={styles.detailRow}>
                    <ThemedText variant="body" size="xs" color="muted" style={styles.detailLabel}>Student Paid:</ThemedText>
                    <ThemedText variant="body" size="xs" style={styles.detailValue}>₹{earning.total_collected}</ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText variant="body" size="xs" color="muted" style={styles.detailLabel}>Admin Fee:</ThemedText>
                    <ThemedText variant="body" size="xs" style={styles.detailValue}>-₹{earning.admin_deduction}</ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText variant="body" size="xs" color="muted" style={styles.detailLabel}>Platform Fee:</ThemedText>
                    <ThemedText variant="body" size="xs" style={styles.detailValue}>-₹{earning.platform_fee}</ThemedText>
                  </View>
                  <View style={[styles.detailRow, styles.yourEarnRow]}>
                    <ThemedText color="success" style={styles.yourEarnLabel}>Teacher Share:</ThemedText>
                    <ThemedText color="success" style={styles.yourEarnValue}>₹{earning.teacher_earn}</ThemedText>
                  </View>
                </View>
                <View style={styles.statusBadge}>
                  <ThemedText color="success" style={styles.statusBadgeText}>{earning.status}</ThemedText>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <ThemedText variant="body" size="sm" color="muted" style={styles.note}>
            💡 Approve pending withdrawals from the Withdrawals tab on the admin dashboard.
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UNIFIED_THEME.colors.primary.light },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: UNIFIED_THEME.spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: UNIFIED_THEME.colors.border.light,
  },
  backWrap: { marginRight: UNIFIED_THEME.spacing.md },
  backBtn: { fontSize: 16, fontWeight: '600' },
  headerTitleWrap: { flex: 1 },
  headerTitle: {},
  headerSubtitle: { marginTop: UNIFIED_THEME.spacing.xs },
  scrollView: { flex: 1, paddingBottom: UNIFIED_THEME.spacing.xxxl },
  balanceSection: {
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.md,
    flexDirection: 'row',
    gap: UNIFIED_THEME.spacing.md,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    padding: UNIFIED_THEME.spacing.md,
  },
  balanceLabel: { marginBottom: UNIFIED_THEME.spacing.xs },
  balanceAmount: { marginBottom: UNIFIED_THEME.spacing.xs },
  balanceSubtext: {},
  section: { paddingHorizontal: UNIFIED_THEME.spacing.lg, marginVertical: UNIFIED_THEME.spacing.md },
  sectionTitle: { marginBottom: UNIFIED_THEME.spacing.md },
  eligibilityBox: { backgroundColor: UNIFIED_THEME.colors.component.card, borderRadius: UNIFIED_THEME.borderRadius.md, padding: UNIFIED_THEME.spacing.md },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: UNIFIED_THEME.spacing.md },
  statusLabel: {},
  statusValue: {},
  reasonBox: { backgroundColor: UNIFIED_THEME.colors.primary.dark, borderRadius: UNIFIED_THEME.borderRadius.sm, padding: UNIFIED_THEME.spacing.sm },
  reasonText: {},
  emptyState: { alignItems: 'center', paddingVertical: UNIFIED_THEME.spacing.xxxl },
  emptyIcon: { fontSize: 48, marginBottom: UNIFIED_THEME.spacing.lg },
  emptyText: {},
  earningCard: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    padding: UNIFIED_THEME.spacing.md,
    marginBottom: UNIFIED_THEME.spacing.sm,
  },
  earningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.md,
  },
  earningDate: {},
  earningAmount: {},
  earningDetails: { backgroundColor: UNIFIED_THEME.colors.primary.dark, borderRadius: UNIFIED_THEME.borderRadius.sm, padding: UNIFIED_THEME.spacing.sm, marginBottom: UNIFIED_THEME.spacing.sm },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: UNIFIED_THEME.spacing.xs,
    borderBottomColor: UNIFIED_THEME.colors.border.default,
    borderBottomWidth: 1,
  },
  detailLabel: {},
  detailValue: {},
  yourEarnRow: { borderBottomWidth: 0, paddingVertical: UNIFIED_THEME.spacing.xs, marginTop: UNIFIED_THEME.spacing.xs },
  yourEarnLabel: {},
  yourEarnValue: {},
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: UNIFIED_THEME.colors.status.approved,
    paddingHorizontal: UNIFIED_THEME.spacing.sm,
    paddingVertical: UNIFIED_THEME.spacing.xs,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
  },
  statusBadgeText: {
    textTransform: 'capitalize',
  },
  note: {},
  editBox: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    padding: UNIFIED_THEME.spacing.lg,
  },
  editLabel: { marginBottom: UNIFIED_THEME.spacing.sm, marginTop: UNIFIED_THEME.spacing.md },
  input: {
    backgroundColor: UNIFIED_THEME.colors.primary.dark,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    paddingVertical: UNIFIED_THEME.spacing.md,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    paddingVertical: UNIFIED_THEME.spacing.md,
    alignItems: 'center',
    marginTop: UNIFIED_THEME.spacing.xxxl,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: {},
});
