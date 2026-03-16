import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';
import { supabase } from '../../../supabase';
import { API_URL } from '../../api/api';
import UNIFIED_THEME from '../../constants/unifiedTheme';
import ThemedText from '../../components/ThemedText';

export default function AdminDashboard({ navigation }) {
  const [activeTab, setActiveTab] = useState('charges'); // charges, withdrawals, analytics
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Charges
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [baseCharge, setBaseCharge] = useState('600');
  const [adminCharge, setAdminCharge] = useState('150');
  const [showChargeModal, setShowChargeModal] = useState(false);

  // Withdrawals
  const [withdrawals, setWithdrawals] = useState([]);

  // Analytics
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'charges') {
        await loadTeachers();
      } else if (activeTab === 'withdrawals') {
        await loadWithdrawals();
      } else if (activeTab === 'analytics') {
        await loadAnalytics();
      }
    } catch (error) {
      logger.error('Error loading data:', error);
      Toast.show('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('teacher_profiles')
        .select(`
          id,
          price_per_call,
          profile:profiles(full_name, email)
        `)
        .order('profile(full_name)', { ascending: true });

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      logger.error('Error loading teachers:', error);
      throw error;
    }
  };

  const loadWithdrawals = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/withdrawals`);
      const result = await response.json();

      if (result.success) {
        setWithdrawals(result.data || []);
      } else {
        Toast.show('Failed to load withdrawals');
      }
    } catch (error) {
      logger.error('Error loading withdrawals:', error);
      throw error;
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/analytics`);
      const result = await response.json();

      if (result.success) {
        setAnalytics(result.analytics);
      } else {
        Toast.show('Failed to load analytics');
      }
    } catch (error) {
      logger.error('Error loading analytics:', error);
      throw error;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSetCharge = async () => {
    if (!selectedTeacher || !baseCharge || !adminCharge) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/charges/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: selectedTeacher.id,
          baseCharge: parseFloat(baseCharge),
          adminCharge: parseFloat(adminCharge),
        }),
      });

      const result = await response.json();
      if (result.success) {
        Toast.show('Charge updated successfully');
        setShowChargeModal(false);
        setSelectedTeacher(null);
        setBaseCharge('600');
        setAdminCharge('150');
        await loadTeachers();
      } else {
        Alert.alert('Error', result.error || 'Failed to update charge');
      }
    } catch (error) {
      logger.error('Error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWithdrawal = async (withdrawalId, teacherId, amount) => {
    try {
      const { data: adminUser } = await supabase.auth.getUser();

      const response = await fetch(
        `${API_URL}/api/admin/withdrawals/${withdrawalId}/approve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminId: adminUser.user.id,
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        Toast.show('Withdrawal approved – transfer will be initiated');
        setShowRequestModal(false);
        setSelectedRequest(null);
        setRequestDetail(null);
        setRevealedAccount(null);
        await loadWithdrawals();
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      logger.error('Error:', error);
      Alert.alert('Error', error.message);
    }
  };

  const [showRequestModal, setShowRequestModal] = useState(false);

  const openRequestDetail = async (withdrawal) => {
    setSelectedRequest(withdrawal);
    setShowRequestModal(true);
    setRequestDetail(null);
    setRevealedAccount(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/withdrawals/${withdrawal.id}`);
      const json = await res.json();
      if (json.success && json.data) setRequestDetail(json.data);
      else Toast.show('Failed to load request details');
    } catch (e) {
      Toast.show('Failed to load request details');
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleRevealAccount = async () => {
    if (!selectedRequest) return;
    if (revealedAccount) {
      setRevealedAccount(null);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/admin/withdrawals/${selectedRequest.id}/reveal`);
      const json = await res.json();
      if (json.success && json.data) setRevealedAccount(json.data);
      else Toast.show('Failed to load account details');
    } catch (e) {
      Toast.show('Failed to load account details');
    }
  };

  // ==========================================
  // RENDER: CHARGES TAB
  // ==========================================
  const renderChargesTab = () => (
    <View style={styles.tabContent}>
      <ThemedText variant="heading" size="md" style={styles.tabTitle}>Manage Teacher Charges</ThemedText>
      <ThemedText variant="body" size="sm" color="muted" style={styles.tabDescription}>
        Set base price + admin charge that will be visible to students
      </ThemedText>

      {teachers.map(teacher => (
        <TouchableOpacity
          key={teacher.id}
          style={styles.teacherCard}
          onPress={() => {
            setSelectedTeacher(teacher);
            setBaseCharge(teacher.price_per_call?.toString() || '600');
            setAdminCharge('150');
            setShowChargeModal(true);
          }}
        >
          <View style={styles.teacherInfo}>
            <ThemedText variant="body" size="md" style={styles.teacherName}>{teacher.profile?.full_name}</ThemedText>
            <ThemedText variant="body" size="sm" color="muted" style={styles.teacherEmail}>{teacher.profile?.email}</ThemedText>
            <ThemedText variant="body" size="sm" color="warning" style={styles.priceInfo}>Current: ₹{teacher.price_per_call || 0}/hr</ThemedText>
          </View>
          <ThemedText color="primary" style={styles.editArrow}>→</ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ==========================================
  // RENDER: WITHDRAWALS / PAYMENT REQUESTS TAB
  // ==========================================
  const renderWithdrawalsTab = () => (
    <View style={styles.tabContent}>
      <ThemedText variant="heading" size="md" style={styles.tabTitle}>Payment Requests</ThemedText>
      <ThemedText variant="body" size="sm" color="muted" style={styles.tabDescription}>
        Review teacher redemption requests. Tap a request to see full details and approve.
      </ThemedText>

      {withdrawals.length === 0 ? (
        <View style={styles.emptyState}>
          <ThemedText style={styles.emptyIcon}>📭</ThemedText>
          <ThemedText variant="body" size="sm" color="muted" style={styles.emptyText}>No pending payment requests</ThemedText>
        </View>
      ) : (
        withdrawals.map((withdrawal) => (
          <TouchableOpacity
            key={withdrawal.id}
            style={styles.withdrawalCard}
            onPress={() => openRequestDetail(withdrawal)}
            activeOpacity={0.8}
          >
            <View style={styles.withdrawalHeader}>
              <ThemedText variant="body" size="md" style={styles.teacherName}>
                {withdrawal.sender?.full_name || withdrawal.account_holder_name}
              </ThemedText>
              <ThemedText variant="heading" size="sm" color="warning" style={styles.withdrawalAmount}>₹{Number(withdrawal.amount).toLocaleString()}</ThemedText>
            </View>
            <View style={styles.withdrawalDetails}>
              <View style={styles.detailRow}>
                <ThemedText variant="body" size="sm" color="muted" style={styles.detailLabel}>Account:</ThemedText>
                <ThemedText variant="body" size="sm" style={styles.detailValue}>{withdrawal.bank_account_number_masked || '******'}</ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText variant="body" size="sm" color="muted" style={styles.detailLabel}>Requested:</ThemedText>
                <ThemedText variant="body" size="sm" style={styles.detailValue}>
                  {new Date(withdrawal.requested_at).toLocaleDateString()}
                </ThemedText>
              </View>
            </View>
            <ThemedText variant="body" size="sm" color="primary" style={styles.tapToView}>Tap to view details →</ThemedText>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  // ==========================================
  // RENDER: ANALYTICS TAB
  // ==========================================
  const renderAnalyticsTab = () => (
    <View style={styles.tabContent}>
      <ThemedText variant="heading" size="md" style={styles.tabTitle}>Payment Analytics</ThemedText>

      {!analytics ? (
        <ActivityIndicator size="large" color={UNIFIED_THEME.colors.accent.primary} />
      ) : (
        <>
          {/* Revenue Cards */}
          <View style={styles.analyticsCard}>
            <ThemedText variant="body" size="sm" color="muted" style={styles.analyticsLabel}>Total Revenue</ThemedText>
            <ThemedText variant="heading" size="lg" style={styles.analyticsAmount}>₹{analytics.totalRevenue?.toLocaleString()}</ThemedText>
            <ThemedText variant="body" size="xs" color="muted" style={styles.analyticsSubtext}>{analytics.totalPayments} transactions</ThemedText>
          </View>

          <View style={[styles.analyticsCard, { backgroundColor: UNIFIED_THEME.colors.status.approved }]}>
            <ThemedText variant="body" size="sm" color="muted" style={styles.analyticsLabel}>Pending Withdrawals</ThemedText>
            <ThemedText variant="heading" size="lg" style={styles.analyticsAmount}>₹{analytics.pendingWithdrawals?.toLocaleString()}</ThemedText>
            <ThemedText variant="body" size="xs" color="muted" style={styles.analyticsSubtext}>Awaiting processing</ThemedText>
          </View>

          {/* Top Teachers */}
          <ThemedText variant="heading" size="sm" style={styles.sectionTitle}>Top Earning Teachers</ThemedText>
          {analytics.topTeachers?.map((item, index) => (
            <View key={index} style={styles.topTeacherRow}>
              <ThemedText variant="body" size="sm" color="primary" style={styles.rank}>{index + 1}.</ThemedText>
              <ThemedText variant="body" size="sm" style={styles.topTeacherName}>Teacher {item.teacher_id?.substring(0, 8)}</ThemedText>
              <ThemedText variant="body" size="sm" color="success" style={styles.topTeacherEarnings}>₹{item.teacher_earn?.toLocaleString()}</ThemedText>
            </View>
          ))}
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ThemedText color="primary" style={styles.backBtnText}>← Back</ThemedText>
        </TouchableOpacity>
        <ThemedText variant="heading" size="md" style={styles.headerTitle}>Finance</ThemedText>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNav}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'charges' && styles.tabButtonActive]}
          onPress={() => setActiveTab('charges')}
        >
          <ThemedText
            variant="label"
            size="sm"
            color={activeTab === 'charges' ? 'primary' : 'muted'}
          >
            💰 Charges
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'withdrawals' && styles.tabButtonActive]}
          onPress={() => setActiveTab('withdrawals')}
        >
          <ThemedText
            variant="label"
            size="sm"
            color={activeTab === 'withdrawals' ? 'primary' : 'muted'}
          >
            💳 Payment Requests
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'analytics' && styles.tabButtonActive]}
          onPress={() => setActiveTab('analytics')}
        >
          <ThemedText
            variant="label"
            size="sm"
            color={activeTab === 'analytics' ? 'primary' : 'muted'}
          >
            📊 Analytics
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={UNIFIED_THEME.colors.accent.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {activeTab === 'charges' && renderChargesTab()}
          {activeTab === 'withdrawals' && renderWithdrawalsTab()}
          {activeTab === 'analytics' && renderAnalyticsTab()}
        </ScrollView>
      )}

      {/* Payment Request Detail Modal */}
      <Modal visible={showRequestModal} animationType="slide" transparent>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="heading" size="md" style={styles.modalTitle}>Payment Request Details</ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setShowRequestModal(false);
                  setSelectedRequest(null);
                  setRequestDetail(null);
                  setRevealedAccount(null);
                }}
              >
                <ThemedText color="muted" style={styles.closeBtn}>✕</ThemedText>
              </TouchableOpacity>
            </View>
            {detailLoading ? (
              <View style={styles.detailLoadingBox}>
                <ActivityIndicator size="large" color={UNIFIED_THEME.colors.accent.primary} />
                <ThemedText variant="body" size="sm" color="muted" style={styles.detailLoadingText}>Loading request...</ThemedText>
              </View>
            ) : requestDetail ? (
              <ScrollView style={styles.requestDetailScroll} showsVerticalScrollIndicator={false}>
                <ThemedText color="primary" style={styles.detailSectionTitle}>Sender info</ThemedText>
                <View style={styles.detailBlock}>
                  <View style={styles.detailRow}>
                    <ThemedText variant="body" size="sm" color="muted" style={styles.detailLabel}>Name</ThemedText>
                    <ThemedText variant="body" size="sm" style={styles.detailValue}>
                      {requestDetail.sender?.full_name || requestDetail.account_holder_name}
                    </ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText variant="body" size="sm" color="muted" style={styles.detailLabel}>Email</ThemedText>
                    <ThemedText variant="body" size="sm" style={styles.detailValue}>{requestDetail.sender?.email || '—'}</ThemedText>
                  </View>
                </View>

                <ThemedText color="primary" style={styles.detailSectionTitle}>Balance</ThemedText>
                <View style={styles.detailBlock}>
                  <View style={styles.detailRow}>
                    <ThemedText variant="body" size="sm" color="muted" style={styles.detailLabel}>Available balance</ThemedText>
                    <ThemedText variant="body" size="sm" style={styles.detailValue}>
                      ₹{Number(requestDetail.available_balance ?? 0).toLocaleString()}
                    </ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText variant="body" size="sm" color="muted" style={styles.detailLabel}>Total balance</ThemedText>
                    <ThemedText variant="body" size="sm" style={styles.detailValue}>
                      ₹{Number(requestDetail.total_balance ?? 0).toLocaleString()}
                    </ThemedText>
                  </View>
                </View>

                <ThemedText color="primary" style={styles.detailSectionTitle}>Account info</ThemedText>
                <View style={styles.detailBlock}>
                  <View style={styles.detailRow}>
                    <ThemedText variant="body" size="sm" color="muted" style={styles.detailLabel}>Bank name</ThemedText>
                    <ThemedText variant="body" size="sm" style={styles.detailValue}>
                      {revealedAccount?.bank_name || requestDetail.bank_name || '—'}
                    </ThemedText>
                  </View>
                  <View style={[styles.detailRow, styles.accountRow]}>
                    <View>
                      <ThemedText variant="body" size="sm" color="muted" style={styles.detailLabel}>Account number</ThemedText>
                      <ThemedText variant="body" size="sm" style={styles.detailValue}>
                        {revealedAccount
                          ? revealedAccount.bank_account_number
                          : (requestDetail.bank_account_number_masked || '******')}
                      </ThemedText>
                    </View>
                    <TouchableOpacity
                      style={styles.eyeBtn}
                      onPress={toggleRevealAccount}
                    >
                      <ThemedText color="primary" style={styles.eyeBtnText}>{revealedAccount ? '🙈 Hide' : '👁 Show'}</ThemedText>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText variant="body" size="sm" color="muted" style={styles.detailLabel}>IFSC</ThemedText>
                    <ThemedText variant="body" size="sm" style={styles.detailValue}>
                      {requestDetail.bank_ifsc_code || '—'}
                    </ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText variant="body" size="sm" color="muted" style={styles.detailLabel}>Account holder</ThemedText>
                    <ThemedText variant="body" size="sm" style={styles.detailValue}>
                      {requestDetail.account_holder_name || '—'}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.detailBlock}>
                  <View style={styles.detailRow}>
                    <ThemedText variant="body" size="sm" color="muted" style={styles.detailLabel}>Requested amount</ThemedText>
                    <ThemedText color="warning" style={[styles.detailValue, styles.amountHighlight]}>
                      ₹{Number(requestDetail.amount).toLocaleString()}
                    </ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText variant="body" size="sm" color="muted" style={styles.detailLabel}>Requested at</ThemedText>
                    <ThemedText variant="body" size="sm" style={styles.detailValue}>
                      {requestDetail.requested_at
                        ? new Date(requestDetail.requested_at).toLocaleString()
                        : '—'}
                    </ThemedText>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => {
                    Alert.alert(
                      'Approve payment request?',
                      `Approve ₹${requestDetail.amount} transfer to ${requestDetail.sender?.full_name || requestDetail.account_holder_name}? The transfer will be initiated after approval.`,
                      [
                        { text: 'Cancel', onPress: () => {} },
                        {
                          text: 'Approve',
                          onPress: () =>
                            handleApproveWithdrawal(
                              requestDetail.id,
                              requestDetail.teacher_id,
                              requestDetail.amount
                            ),
                        },
                      ]
                    );
                  }}
                >
                  <ThemedText color="onAccent" style={styles.approveBtnText}>✓ Approve & start transfer</ThemedText>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <ThemedText variant="body" size="sm" color="muted" style={styles.detailLoadingText}>Could not load request.</ThemedText>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Charge Modal */}
      <Modal visible={showChargeModal} animationType="slide" transparent>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="heading" size="md" style={styles.modalTitle}>Set Charges</ThemedText>
              <TouchableOpacity onPress={() => setShowChargeModal(false)}>
                <ThemedText color="muted" style={styles.closeBtn}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            {selectedTeacher && (
              <>
                <ThemedText variant="body" size="sm" color="muted" style={styles.modalSubtitle}>{selectedTeacher.profile?.full_name}</ThemedText>

                {/* Price Breakdown */}
                <View style={styles.breakdownBox}>
                  <View style={styles.breakdownRow}>
                    <ThemedText variant="body" size="sm" color="muted" style={styles.breakdownLabel}>Teacher Rate (Base):</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="600"
                      placeholderTextColor={UNIFIED_THEME.colors.text.muted}
                      value={baseCharge}
                      onChangeText={setBaseCharge}
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={styles.breakdownRow}>
                    <ThemedText variant="body" size="sm" color="muted" style={styles.breakdownLabel}>Admin Charge:</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="150"
                      placeholderTextColor={UNIFIED_THEME.colors.text.muted}
                      value={adminCharge}
                      onChangeText={setAdminCharge}
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={[styles.breakdownRow, styles.totalRow]}>
                    <ThemedText variant="body" size="md" style={styles.totalLabel}>Total (Student pays):</ThemedText>
                    <ThemedText color="warning" style={styles.totalAmount}>
                      ₹{(parseFloat(baseCharge || 0) + parseFloat(adminCharge || 0)).toFixed(0)}
                    </ThemedText>
                  </View>
                </View>

                {/* Fee Breakdown */}
                <View style={styles.feeBox}>
                  <ThemedText style={styles.feeTitle}>How the Payment is Split:</ThemedText>
                  <View style={styles.feeRow}>
                    <ThemedText variant="body" size="sm" color="muted" style={styles.feeLabel}>Admin Commission: ₹{adminCharge}</ThemedText>
                    <ThemedText color="warning" style={styles.feePercentage}>({((parseFloat(adminCharge || 0) / (parseFloat(baseCharge || 0) + parseFloat(adminCharge || 0))) * 100).toFixed(0)}%)</ThemedText>
                  </View>
                  <View style={styles.feeRow}>
                    <ThemedText variant="body" size="sm" color="muted" style={styles.feeLabel}>Platform Fee: ₹100</ThemedText>
                    <ThemedText color="warning" style={styles.feePercentage}>(13.33%)</ThemedText>
                  </View>
                  <View style={[styles.feeRow, styles.teacherEarnRow]}>
                    <ThemedText color="success" style={styles.teacherEarnLabel}>Teacher Gets: ₹{(parseFloat(baseCharge || 0) + parseFloat(adminCharge || 0) - 100 - parseFloat(adminCharge || 0)).toFixed(0)}</ThemedText>
                    <ThemedText color="success" style={styles.teacherEarnPercentage}>{((parseFloat(baseCharge || 0) / (parseFloat(baseCharge || 0) + parseFloat(adminCharge || 0))) * 100).toFixed(0)}%</ThemedText>
                  </View>
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSetCharge} disabled={loading}>
                  <ThemedText color="onAccent" style={styles.saveBtnText}>{loading ? 'Saving...' : '✓ Save Charges'}</ThemedText>
                </TouchableOpacity>
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>
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
  backBtn: { marginRight: UNIFIED_THEME.spacing.sm },
  backBtnText: { fontSize: 16, fontWeight: '600' },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },

  tabNav: {
    flexDirection: 'row',
    backgroundColor: UNIFIED_THEME.colors.component.card,
    marginHorizontal: UNIFIED_THEME.spacing.lg,
    marginVertical: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    padding: UNIFIED_THEME.spacing.xs,
  },

  tabButton: {
    flex: 1,
    paddingVertical: UNIFIED_THEME.spacing.sm,
    alignItems: 'center',
    borderRadius: UNIFIED_THEME.borderRadius.sm,
  },

  tabButtonActive: {
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
  },

  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },

  tabButtonTextActive: {
    color: UNIFIED_THEME.colors.text.primary,
  },

  scrollView: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  tabContent: {
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.lg,
  },

  tabTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: UNIFIED_THEME.spacing.sm,
  },

  tabDescription: {
    fontSize: 13,
    marginBottom: UNIFIED_THEME.spacing.lg,
  },

  // Charges Tab
  teacherCard: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    padding: UNIFIED_THEME.spacing.md,
    marginBottom: UNIFIED_THEME.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  teacherInfo: {
    flex: 1,
  },

  teacherName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: UNIFIED_THEME.spacing.xs,
  },

  teacherEmail: {
    fontSize: 12,
    marginBottom: UNIFIED_THEME.spacing.xs,
  },

  priceInfo: {
    fontSize: 12,
    fontWeight: '600',
  },

  editArrow: {
    fontSize: 20,
    marginLeft: UNIFIED_THEME.spacing.sm,
  },

  // Withdrawals Tab
  withdrawalCard: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    padding: UNIFIED_THEME.spacing.md,
    marginBottom: UNIFIED_THEME.spacing.sm,
    borderLeftColor: UNIFIED_THEME.colors.status.pending,
    borderLeftWidth: 4,
  },

  withdrawalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.sm,
  },

  withdrawalAmount: {
    fontSize: 18,
    fontWeight: '700',
  },

  withdrawalDetails: {
    backgroundColor: UNIFIED_THEME.colors.primary.dark,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    padding: UNIFIED_THEME.spacing.sm,
    marginBottom: UNIFIED_THEME.spacing.sm,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: UNIFIED_THEME.spacing.xs,
  },

  detailLabel: {
    fontSize: 12,
  },

  detailValue: {
    fontSize: 12,
    fontWeight: '500',
  },

  approveBtn: {
    backgroundColor: UNIFIED_THEME.colors.status.approved,
    paddingVertical: UNIFIED_THEME.spacing.sm,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    alignItems: 'center',
  },

  approveBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: UNIFIED_THEME.spacing.xxxl,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: UNIFIED_THEME.spacing.sm,
  },

  emptyText: {
    fontSize: 14,
  },

  tapToView: {
    fontSize: 12,
    marginTop: UNIFIED_THEME.spacing.xs,
    textAlign: 'right',
  },

  detailLoadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: UNIFIED_THEME.spacing.xxxl,
  },
  detailLoadingText: {
    fontSize: 14,
  },
  requestDetailScroll: {
    flex: 1,
  },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: UNIFIED_THEME.spacing.lg,
    marginBottom: UNIFIED_THEME.spacing.sm,
  },
  detailBlock: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    padding: UNIFIED_THEME.spacing.md,
    marginBottom: UNIFIED_THEME.spacing.sm,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyeBtn: {
    paddingVertical: UNIFIED_THEME.spacing.xs,
    paddingHorizontal: UNIFIED_THEME.spacing.sm,
    backgroundColor: UNIFIED_THEME.colors.primary.dark,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
  },
  eyeBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  amountHighlight: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Analytics
  analyticsCard: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    padding: UNIFIED_THEME.spacing.lg,
    marginBottom: UNIFIED_THEME.spacing.md,
  },

  analyticsLabel: {
    fontSize: 12,
    marginBottom: UNIFIED_THEME.spacing.xs,
  },

  analyticsAmount: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: UNIFIED_THEME.spacing.xs,
  },

  analyticsSubtext: {
    fontSize: 11,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginVertical: UNIFIED_THEME.spacing.md,
  },

  topTeacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: UNIFIED_THEME.spacing.sm,
    borderBottomColor: UNIFIED_THEME.colors.border.light,
    borderBottomWidth: 1,
  },

  rank: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: UNIFIED_THEME.spacing.sm,
    width: 20,
  },

  topTeacherName: {
    fontSize: 13,
    flex: 1,
  },

  topTeacherEarnings: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
  },

  modalContent: {
    flex: 1,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.lg,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.lg,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },

  closeBtn: {
    fontSize: 24,
  },

  modalSubtitle: {
    fontSize: 13,
    marginBottom: UNIFIED_THEME.spacing.lg,
  },

  breakdownBox: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    padding: UNIFIED_THEME.spacing.md,
    marginBottom: UNIFIED_THEME.spacing.lg,
  },

  breakdownRow: {
    marginBottom: UNIFIED_THEME.spacing.md,
  },

  breakdownLabel: {
    fontSize: 12,
    marginBottom: UNIFIED_THEME.spacing.xs,
  },

  input: {
    backgroundColor: UNIFIED_THEME.colors.primary.dark,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    color: UNIFIED_THEME.colors.text.primary,
    paddingHorizontal: UNIFIED_THEME.spacing.sm,
    paddingVertical: UNIFIED_THEME.spacing.xs,
    fontSize: 14,
  },

  totalRow: {
    paddingTop: UNIFIED_THEME.spacing.md,
    borderTopColor: UNIFIED_THEME.colors.border.default,
    borderTopWidth: 1,
    marginBottom: 0,
  },

  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },

  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
  },

  feeBox: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    padding: UNIFIED_THEME.spacing.md,
    marginBottom: UNIFIED_THEME.spacing.lg,
    borderColor: UNIFIED_THEME.colors.status.approved,
    borderWidth: 1,
  },

  feeTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: UNIFIED_THEME.spacing.sm,
  },

  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: UNIFIED_THEME.spacing.xs,
    borderBottomColor: UNIFIED_THEME.colors.border.default,
    borderBottomWidth: 1,
  },

  feeLabel: {
    fontSize: 12,
  },

  feePercentage: {
    fontSize: 11,
    fontWeight: '600',
  },

  teacherEarnRow: {
    borderBottomWidth: 0,
    paddingVertical: UNIFIED_THEME.spacing.xs,
    backgroundColor: UNIFIED_THEME.colors.primary.dark,
    paddingHorizontal: UNIFIED_THEME.spacing.xs,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    marginTop: UNIFIED_THEME.spacing.xs,
  },

  teacherEarnLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  teacherEarnPercentage: {
    fontSize: 12,
    fontWeight: '700',
  },

  saveBtn: {
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    paddingVertical: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    alignItems: 'center',
  },

  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
