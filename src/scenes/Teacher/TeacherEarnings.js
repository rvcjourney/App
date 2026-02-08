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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';
import { supabase } from '../../../supabase';
import { API_URL } from '../../api/api';

/**
 * TeacherEarnings Component
 * 
 * Shows:
 * 1. Total balance & available balance
 * 2. Earnings history
 * 3. Withdrawal eligibility
 * 4. Option to request withdrawal
 */
export default function TeacherEarnings({ navigation, route }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teacherId, setTeacherId] = useState(null);
  
  // Data
  const [wallet, setWallet] = useState(null);
  const [earnings, setEarnings] = useState([]);
  const [eligibility, setEligibility] = useState(null);

  useEffect(() => {
    getTeacherId();
  }, []);

  useEffect(() => {
    if (teacherId) {
      loadData();
    }
  }, [teacherId]);

  const getTeacherId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setTeacherId(user.id);
      }
    } catch (error) {
      console.error('Error getting teacher ID:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/teacher/earnings/${teacherId}`);
      const result = await response.json();

      if (result.success) {
        setWallet(result.wallet);
        setEarnings(result.earnings);
        setEligibility(result.eligibility);
      } else {
        Toast.show('Failed to load earnings');
      }
    } catch (error) {
      console.error('Error loading earnings:', error);
      Toast.show('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#5568FE" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Balance Cards */}
        <View style={styles.balanceSection}>
          {/* Total Balance */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>₹{wallet?.total_balance?.toLocaleString() || 0}</Text>
            <Text style={styles.balanceSubtext}>All time earnings</Text>
          </View>

          {/* Available Balance */}
          <View style={[styles.balanceCard, { backgroundColor: '#2E7D32' }]}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>₹{wallet?.available_balance?.toLocaleString() || 0}</Text>
            <Text style={styles.balanceSubtext}>Can withdraw now</Text>
          </View>
        </View>

        {/* Withdrawal Eligibility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Withdrawal Eligibility</Text>

          <View style={styles.eligibilityBox}>
            {eligibility && (
              <View>
                {/* Status */}
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Status:</Text>
                  <Text
                    style={[
                      styles.statusValue,
                      {
                        color: eligibility.can_withdraw ? '#4CAF50' : '#FF9800',
                      },
                    ]}
                  >
                    {eligibility.can_withdraw ? '✓ Eligible' : 'Not Eligible'}
                  </Text>
                </View>

                {/* Reason */}
                <View style={styles.reasonBox}>
                  <Text style={styles.reasonText}>{eligibility.eligibility_reason}</Text>
                </View>

                {/* Conditions */}
                <View style={styles.conditionsList}>
                  <View style={styles.condition}>
                    <Text
                      style={[
                        styles.conditionIcon,
                        {
                          color: wallet?.total_balance >= 10000 ? '#4CAF50' : '#FF9800',
                        },
                      ]}
                    >
                      {wallet?.total_balance >= 10000 ? '✓' : '○'}
                    </Text>
                    <View>
                      <Text style={styles.conditionTitle}>Minimum Balance ₹10,000</Text>
                      <Text style={styles.conditionDetails}>
                        {wallet?.total_balance >= 10000
                          ? `You have ₹${wallet?.total_balance?.toLocaleString()}`
                          : `Need ₹${(10000 - wallet?.total_balance)?.toLocaleString()} more`}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.condition}>
                    <Text
                      style={[
                        styles.conditionIcon,
                        {
                          color: wallet?.one_month_covered ? '#4CAF50' : '#FF9800',
                        },
                      ]}
                    >
                      {wallet?.one_month_covered ? '✓' : '○'}
                    </Text>
                    <View>
                      <Text style={styles.conditionTitle}>Account Age: 1 Month</Text>
                      <Text style={styles.conditionDetails}>
                        {wallet?.one_month_covered
                          ? 'Condition met'
                          : 'Created: ' + new Date(wallet?.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Withdrawal Button */}
                <TouchableOpacity
                  style={[
                    styles.withdrawBtn,
                    !eligibility.can_withdraw && styles.withdrawBtnDisabled,
                  ]}
                  disabled={!eligibility.can_withdraw}
                  onPress={() =>
                    navigation.navigate('WithdrawalRequest', {
                      availableBalance: wallet?.available_balance,
                      teacherId: teacherId,
                    })
                  }
                >
                  <Text style={styles.withdrawBtnText}>
                    {eligibility.can_withdraw ? '📤 Request Withdrawal' : 'Not Eligible Yet'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Earnings Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How You Earn</Text>

          <View style={styles.breakdownBox}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Student Pays:</Text>
              <Text style={styles.breakdownValue}>100%</Text>
              <Text style={styles.breakdownExample}>(e.g., ₹750)</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Admin Commission:</Text>
              <Text style={[styles.breakdownValue, { color: '#FF9800' }]}>-20%</Text>
              <Text style={styles.breakdownExample}>(e.g., -₹150)</Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Platform Fee:</Text>
              <Text style={[styles.breakdownValue, { color: '#FF9800' }]}>-13.33%</Text>
              <Text style={styles.breakdownExample}>(e.g., -₹100)</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>You Get:</Text>
              <Text style={[styles.breakdownValue, { color: '#4CAF50' }]}>66.67%</Text>
              <Text style={styles.breakdownExample}>(e.g., ₹500)</Text>
            </View>
          </View>
        </View>

        {/* Recent Earnings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Earnings</Text>

          {earnings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No earnings yet</Text>
              <Text style={styles.emptySubtext}>Complete sessions to earn</Text>
            </View>
          ) : (
            earnings.slice(0, 10).map((earning, index) => (
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
                    <Text style={styles.yourEarnLabel}>Your Share:</Text>
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

        {/* Important Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Important</Text>

          <View style={styles.noteBox}>
            <Text style={styles.note}>
              💡 Funds are held temporarily for fraud verification and dispute resolution.
            </Text>
            <Text style={styles.note}>
              🏦 Direct bank transfers are processed within 2-3 business days.
            </Text>
            <Text style={styles.note}>
              🔒 All withdrawals are secure via Razorpay Payouts.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D2A',
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },

  backBtn: {
    color: '#5568FE',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },

  scrollView: {
    flex: 1,
    paddingBottom: 30,
  },

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

  balanceLabel: {
    color: '#999',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },

  balanceAmount: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },

  balanceSubtext: {
    color: '#666',
    fontSize: 10,
  },

  section: {
    paddingHorizontal: 20,
    marginVertical: 15,
  },

  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },

  eligibilityBox: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 15,
  },

  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  statusLabel: {
    color: '#999',
    fontSize: 13,
  },

  statusValue: {
    fontSize: 14,
    fontWeight: '700',
  },

  reasonBox: {
    backgroundColor: '#0B0D2A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },

  reasonText: {
    color: '#FF9800',
    fontSize: 12,
    lineHeight: 18,
  },

  conditionsList: {
    marginBottom: 15,
  },

  condition: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  conditionIcon: {
    fontSize: 18,
    marginRight: 12,
    minWidth: 20,
  },

  conditionTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 3,
  },

  conditionDetails: {
    color: '#999',
    fontSize: 11,
  },

  withdrawBtn: {
    backgroundColor: '#5568FE',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },

  withdrawBtnDisabled: {
    opacity: 0.5,
  },

  withdrawBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  breakdownBox: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 15,
  },

  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },

  breakdownLabel: {
    color: '#ccc',
    fontSize: 12,
    flex: 1,
  },

  breakdownValue: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },

  breakdownExample: {
    color: '#666',
    fontSize: 11,
  },

  divider: {
    height: 1,
    backgroundColor: '#2A2D5A',
    marginVertical: 8,
  },

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
    fontWeight: '600',
  },

  emptySubtext: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },

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

  earningDate: {
    color: '#999',
    fontSize: 12,
  },

  earningAmount: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '700',
  },

  earningDetails: {
    backgroundColor: '#0B0D2A',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomColor: '#2A2D5A',
    borderBottomWidth: 1,
  },

  detailLabel: {
    color: '#999',
    fontSize: 11,
  },

  detailValue: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },

  yourEarnRow: {
    borderBottomWidth: 0,
    paddingVertical: 4,
    marginTop: 2,
  },

  yourEarnLabel: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: '600',
  },

  yourEarnValue: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '700',
  },

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

  noteBox: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 15,
  },

  note: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
});
