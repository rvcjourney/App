import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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
      console.error('Error loading data:', error);
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
      console.error('Error loading teachers:', error);
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
      console.error('Error loading withdrawals:', error);
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
      console.error('Error loading analytics:', error);
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
      console.error('Error:', error);
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
        Toast.show('Withdrawal approved');
        await loadWithdrawals();
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', error.message);
    }
  };

  // ==========================================
  // RENDER: CHARGES TAB
  // ==========================================
  const renderChargesTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Manage Teacher Charges</Text>
      <Text style={styles.tabDescription}>
        Set base price + admin charge that will be visible to students
      </Text>

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
            <Text style={styles.teacherName}>{teacher.profile?.full_name}</Text>
            <Text style={styles.teacherEmail}>{teacher.profile?.email}</Text>
            <Text style={styles.priceInfo}>Current: ₹{teacher.price_per_call || 0}/hr</Text>
          </View>
          <Text style={styles.editArrow}>→</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ==========================================
  // RENDER: WITHDRAWALS TAB
  // ==========================================
  const renderWithdrawalsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Pending Withdrawal Requests</Text>
      <Text style={styles.tabDescription}>
        Review and approve teacher withdrawal requests
      </Text>

      {withdrawals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No pending withdrawals</Text>
        </View>
      ) : (
        withdrawals.map(withdrawal => (
          <View key={withdrawal.id} style={styles.withdrawalCard}>
            <View style={styles.withdrawalHeader}>
              <Text style={styles.teacherName}>{withdrawal.account_holder_name}</Text>
              <Text style={styles.withdrawalAmount}>₹{withdrawal.amount}</Text>
            </View>

            <View style={styles.withdrawalDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Account Number:</Text>
                <Text style={styles.detailValue}>****{withdrawal.bank_account_number?.slice(-4)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>IFSC:</Text>
                <Text style={styles.detailValue}>{withdrawal.bank_ifsc_code}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Requested:</Text>
                <Text style={styles.detailValue}>
                  {new Date(withdrawal.requested_at).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.approveBtn}
              onPress={() => {
                Alert.alert(
                  'Approve Withdrawal?',
                  `Approve ₹${withdrawal.amount} withdrawal for ${withdrawal.account_holder_name}?`,
                  [
                    { text: 'Cancel', onPress: () => {} },
                    {
                      text: 'Approve',
                      onPress: () =>
                        handleApproveWithdrawal(
                          withdrawal.id,
                          withdrawal.teacher_id,
                          withdrawal.amount
                        ),
                    },
                  ]
                );
              }}
            >
              <Text style={styles.approveBtnText}>✓ Approve</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );

  // ==========================================
  // RENDER: ANALYTICS TAB
  // ==========================================
  const renderAnalyticsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Payment Analytics</Text>

      {!analytics ? (
        <ActivityIndicator size="large" color="#5568FE" />
      ) : (
        <>
          {/* Revenue Cards */}
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsLabel}>Total Revenue</Text>
            <Text style={styles.analyticsAmount}>₹{analytics.totalRevenue?.toLocaleString()}</Text>
            <Text style={styles.analyticsSubtext}>{analytics.totalPayments} transactions</Text>
          </View>

          <View style={[styles.analyticsCard, { backgroundColor: '#2E7D32' }]}>
            <Text style={styles.analyticsLabel}>Pending Withdrawals</Text>
            <Text style={styles.analyticsAmount}>₹{analytics.pendingWithdrawals?.toLocaleString()}</Text>
            <Text style={styles.analyticsSubtext}>Awaiting processing</Text>
          </View>

          {/* Top Teachers */}
          <Text style={styles.sectionTitle}>Top Earning Teachers</Text>
          {analytics.topTeachers?.map((item, index) => (
            <View key={index} style={styles.topTeacherRow}>
              <Text style={styles.rank}>{index + 1}.</Text>
              <Text style={styles.topTeacherName}>Teacher {item.teacher_id?.substring(0, 8)}</Text>
              <Text style={styles.topTeacherEarnings}>₹{item.teacher_earn?.toLocaleString()}</Text>
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
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNav}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'charges' && styles.tabButtonActive]}
          onPress={() => setActiveTab('charges')}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'charges' && styles.tabButtonTextActive]}
          >
            💰 Charges
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'withdrawals' && styles.tabButtonActive]}
          onPress={() => setActiveTab('withdrawals')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'withdrawals' && styles.tabButtonTextActive,
            ]}
          >
            📤 Withdrawals
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'analytics' && styles.tabButtonActive]}
          onPress={() => setActiveTab('analytics')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'analytics' && styles.tabButtonTextActive,
            ]}
          >
            📊 Analytics
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5568FE" />
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

      {/* Charge Modal */}
      <Modal visible={showChargeModal} animationType="slide" transparent>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Charges</Text>
              <TouchableOpacity onPress={() => setShowChargeModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedTeacher && (
              <>
                <Text style={styles.modalSubtitle}>{selectedTeacher.profile?.full_name}</Text>

                {/* Price Breakdown */}
                <View style={styles.breakdownBox}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Teacher Rate (Base):</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="600"
                      value={baseCharge}
                      onChangeText={setBaseCharge}
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Admin Charge:</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="150"
                      value={adminCharge}
                      onChangeText={setAdminCharge}
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={[styles.breakdownRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total (Student pays):</Text>
                    <Text style={styles.totalAmount}>
                      ₹{(parseFloat(baseCharge || 0) + parseFloat(adminCharge || 0)).toFixed(0)}
                    </Text>
                  </View>
                </View>

                {/* Fee Breakdown */}
                <View style={styles.feeBox}>
                  <Text style={styles.feeTitle}>How the Payment is Split:</Text>
                  <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Admin Commission: ₹{adminCharge}</Text>
                    <Text style={styles.feePercentage}>({((parseFloat(adminCharge || 0) / (parseFloat(baseCharge || 0) + parseFloat(adminCharge || 0))) * 100).toFixed(0)}%)</Text>
                  </View>
                  <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Platform Fee: ₹100</Text>
                    <Text style={styles.feePercentage}>(13.33%)</Text>
                  </View>
                  <View style={[styles.feeRow, styles.teacherEarnRow]}>
                    <Text style={styles.teacherEarnLabel}>Teacher Gets: ₹{(parseFloat(baseCharge || 0) + parseFloat(adminCharge || 0) - 100 - parseFloat(adminCharge || 0)).toFixed(0)}</Text>
                    <Text style={styles.teacherEarnPercentage}>{((parseFloat(baseCharge || 0) / (parseFloat(baseCharge || 0) + parseFloat(adminCharge || 0))) * 100).toFixed(0)}%</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSetCharge} disabled={loading}>
                  <Text style={styles.saveBtnText}>{loading ? 'Saving...' : '✓ Save Charges'}</Text>
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
    backgroundColor: '#0B0D2A',
  },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },

  tabNav: {
    flexDirection: 'row',
    backgroundColor: '#1C1F4A',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 10,
    padding: 5,
  },

  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },

  tabButtonActive: {
    backgroundColor: '#5568FE',
  },

  tabButtonText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
  },

  tabButtonTextActive: {
    color: '#fff',
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
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  tabTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },

  tabDescription: {
    color: '#999',
    fontSize: 13,
    marginBottom: 20,
  },

  // Charges Tab
  teacherCard: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  teacherInfo: {
    flex: 1,
  },

  teacherName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },

  teacherEmail: {
    color: '#999',
    fontSize: 12,
    marginBottom: 6,
  },

  priceInfo: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
  },

  editArrow: {
    color: '#5568FE',
    fontSize: 20,
    marginLeft: 12,
  },

  // Withdrawals Tab
  withdrawalCard: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderLeftColor: '#FF9800',
    borderLeftWidth: 4,
  },

  withdrawalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  withdrawalAmount: {
    color: '#FF9800',
    fontSize: 18,
    fontWeight: '700',
  },

  withdrawalDetails: {
    backgroundColor: '#0B0D2A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  detailLabel: {
    color: '#999',
    fontSize: 12,
  },

  detailValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },

  approveBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  approveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },

  emptyText: {
    color: '#999',
    fontSize: 14,
  },

  // Analytics
  analyticsCard: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },

  analyticsLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 8,
  },

  analyticsAmount: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },

  analyticsSubtext: {
    color: '#666',
    fontSize: 11,
  },

  sectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginVertical: 15,
  },

  topTeacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomColor: '#2A2D5A',
    borderBottomWidth: 1,
  },

  rank: {
    color: '#5568FE',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 12,
    width: 20,
  },

  topTeacherName: {
    color: '#fff',
    fontSize: 13,
    flex: 1,
  },

  topTeacherEarnings: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '600',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#0B0D2A',
  },

  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },

  closeBtn: {
    color: '#999',
    fontSize: 24,
  },

  modalSubtitle: {
    color: '#999',
    fontSize: 13,
    marginBottom: 20,
  },

  breakdownBox: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },

  breakdownRow: {
    marginBottom: 15,
  },

  breakdownLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 6,
  },

  input: {
    backgroundColor: '#0B0D2A',
    borderColor: '#2A2D5A',
    borderWidth: 1,
    borderRadius: 8,
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },

  totalRow: {
    paddingTop: 15,
    borderTopColor: '#2A2D5A',
    borderTopWidth: 1,
    marginBottom: 0,
  },

  totalLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  totalAmount: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '700',
  },

  feeBox: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderColor: '#2E7D32',
    borderWidth: 1,
  },

  feeTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },

  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomColor: '#2A2D5A',
    borderBottomWidth: 1,
  },

  feeLabel: {
    color: '#999',
    fontSize: 12,
  },

  feePercentage: {
    color: '#FF9800',
    fontSize: 11,
    fontWeight: '600',
  },

  teacherEarnRow: {
    borderBottomWidth: 0,
    paddingVertical: 10,
    backgroundColor: '#0B0D2A',
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 8,
  },

  teacherEarnLabel: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },

  teacherEarnPercentage: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '700',
  },

  saveBtn: {
    backgroundColor: '#5568FE',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
