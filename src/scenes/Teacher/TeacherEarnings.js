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
import ChevronRight from '../../assets/icons/ChevronRight';

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
        setWallet(result.wallet || {
          total_balance: 0,
          available_balance: 0,
          pending_balance: 0,
        });
        setEarnings(result.earnings || []);
        setEligibility(result.eligibility);
      } else {
        console.warn('API returned failure:', result);
        // Set default values
        setWallet({ total_balance: 0, available_balance: 0, pending_balance: 0 });
        setEarnings([]);
        Toast.show('Failed to load earnings');
      }
    } catch (error) {
      console.error('Error loading earnings:', error);
      // Set default values on error
      setWallet({ total_balance: 0, available_balance: 0, pending_balance: 0 });
      setEarnings([]);
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
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronRight width={24} height={24} fill="#5568FE" style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Earnings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Main Balance Card */}
        <View style={styles.mainBalanceCard}>
          <View>
            <Text style={styles.balanceLabel}>Total Earned</Text>
            <Text style={styles.mainBalance}>₹{wallet?.total_balance?.toLocaleString() || 0}</Text>
          </View>
          <View style={styles.divider} />
          <View>
            <Text style={styles.balanceLabel}>Available to Withdraw</Text>
            <Text style={styles.availableBalance}>₹{wallet?.available_balance?.toLocaleString() || 0}</Text>
          </View>
        </View>

        {/* Pending Balance - only if exists */}
        {(wallet?.pending_balance || 0) > 0 && (
          <View style={styles.pendingSection}>
            <Text style={styles.pendingLabel}>⏳ Pending (from ongoing sessions)</Text>
            <Text style={styles.pendingAmount}>₹{wallet?.pending_balance?.toLocaleString() || 0}</Text>
          </View>
        )}

        {/* Quick Info */}
        <View style={styles.quickInfoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>💡 How you earn:</Text>
            <Text style={styles.infoValue}>Student pays → You get 100% of your rate</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📊 Fee structure:</Text>
            <Text style={styles.infoValue}>18% GST + 7.5% platform fee (deducted from student payment)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>💰 Gets added:</Text>
            <Text style={styles.infoValue}>After your session completes</Text>
          </View>
        </View>

        {/* Withdrawal Section */}
        {eligibility && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Withdrawal</Text>
            
            <View style={[styles.statusBox, { borderLeftColor: eligibility.can_withdraw ? '#4CAF50' : '#FF9800' }]}>
              <View>
                <Text style={[styles.statusText, { color: eligibility.can_withdraw ? '#4CAF50' : '#FF9800' }]}>
                  {eligibility.can_withdraw ? '✓ Ready to Withdraw' : '⏳ ' + eligibility.eligibility_reason}
                </Text>
              </View>
              {eligibility.can_withdraw && (
                <TouchableOpacity
                  style={styles.withdrawBtn}
                  onPress={() =>
                    navigation.navigate('WithdrawalRequest', {
                      availableBalance: wallet?.available_balance,
                      teacherId: teacherId,
                    })
                  }
                >
                  <Text style={styles.withdrawBtnText}>Withdraw Now</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Recent Earnings - Simplified */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            {earnings.length > 0 && <Text style={styles.countBadge}>{earnings.length}</Text>}
          </View>

          {earnings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No earnings yet</Text>
              <Text style={styles.emptySubtext}>Complete your first session to earn</Text>
            </View>
          ) : (
            earnings.slice(0, 15).map((earning, index) => {
              const isPending = earning.status === 'pending';
              return (
                <View key={earning.id || index} style={[styles.earningCard, isPending && styles.earningCardPending]}>
                  <View style={styles.earningLeft}>
                    <Text style={styles.earningDate}>
                      {new Date(earning.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </Text>
                    <Text style={styles.earningStatus}>{isPending ? '⏳ Pending' : '✓ Completed'}</Text>
                  </View>
                  
                  <Text style={[styles.earningAmount, isPending ? styles.pending : styles.completed]}>
                    ₹{earning.teacher_earn?.toLocaleString() || 0}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 20 }} />
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
    borderBottomWidth: 1,
    borderBottomColor: '#1C1F4A',
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1C1F4A',
    justifyContent: 'center',
    alignItems: 'center',
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

  mainBalanceCard: {
    marginHorizontal: 20,
    marginVertical: 20,
    backgroundColor: '#1C1F4A',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  balanceLabel: {
    color: '#999',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },

  mainBalance: {
    color: '#4CAF50',
    fontSize: 28,
    fontWeight: '700',
  },

  availableBalance: {
    color: '#2ECC71',
    fontSize: 24,
    fontWeight: '700',
  },

  divider: {
    width: 1,
    height: 50,
    backgroundColor: '#2A2D5A',
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

  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  countBadge: {
    color: '#5568FE',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: '#1C1F4A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  quickInfoBox: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 15,
  },

  infoRow: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2D5A',
  },

  infoLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },

  infoValue: {
    color: '#999',
    fontSize: 11,
  },

  pendingSection: {
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: '#3D3200',
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },

  pendingLabel: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },

  pendingAmount: {
    color: '#FFB74D',
    fontSize: 20,
    fontWeight: '700',
  },

  statusBox: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 4,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },

  withdrawBtn: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },

  withdrawBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
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
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },

  emptySubtext: {
    color: '#999',
    fontSize: 12,
  },

  earningCard: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  earningCardPending: {
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },

  earningLeft: {
    flex: 1,
  },

  earningDate: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },

  earningStatus: {
    color: '#999',
    fontSize: 11,
  },

  earningAmount: {
    fontSize: 16,
    fontWeight: '700',
  },

  completed: {
    color: '#4CAF50',
  },

  pending: {
    color: '#FF9800',
  },
});
