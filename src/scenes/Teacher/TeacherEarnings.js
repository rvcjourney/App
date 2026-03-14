import React, { useState, useEffect } from 'react';
import {
  View,
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
import UNIFIED_THEME from '../../constants/unifiedTheme';
import ThemedText from '../../components/ThemedText';
import Icon from '../../components/Icon';
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
          <ActivityIndicator size="large" color={UNIFIED_THEME.colors.accent.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronRight width={24} height={24} fill={UNIFIED_THEME.colors.accent.primary} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <ThemedText variant="heading" size="md">My Earnings</ThemedText>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Main Balance Card */}
        <View style={styles.mainBalanceCard}>
          <View>
            <ThemedText variant="body" size="sm" color="muted">Total Earned</ThemedText>
            <ThemedText variant="heading" size="lg" color="success">₹{wallet?.total_balance?.toLocaleString() || 0}</ThemedText>
          </View>
          <View style={styles.divider} />
          <View>
            <ThemedText variant="body" size="sm" color="muted">Available to Withdraw</ThemedText>
            <ThemedText variant="heading" size="lg" color="success">₹{wallet?.available_balance?.toLocaleString() || 0}</ThemedText>
          </View>
        </View>

        {/* Pending Balance - only if exists */}
        {(wallet?.pending_balance || 0) > 0 && (
          <View style={styles.pendingSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Icon name="hourglass" size={18} color="warning" style={{ marginRight: 6 }} />
              <ThemedText variant="label" size="md" color="warning">Pending (from ongoing sessions)</ThemedText>
            </View>
            <ThemedText variant="heading" size="lg" color="warning">₹{wallet?.pending_balance?.toLocaleString() || 0}</ThemedText>
          </View>
        )}

        {/* Quick Info */}
        <View style={styles.quickInfoBox}>
          <View style={styles.infoRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Icon name="lightbulb" size={18} color="info" style={{ marginRight: 6 }} />
              <ThemedText variant="label" size="sm" color="primary">How you earn:</ThemedText>
            </View>
            <ThemedText variant="body" size="sm" color="secondary">Student pays → You get 100% of your rate</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Icon name="barChart" size={18} color="primary" style={{ marginRight: 6 }} />
              <ThemedText variant="label" size="sm" color="primary">Fee structure:</ThemedText>
            </View>
            <ThemedText variant="body" size="sm" color="secondary">18% GST + 7.5% platform fee (deducted from student payment)</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Icon name="money" size={18} color="success" style={{ marginRight: 6 }} />
              <ThemedText variant="label" size="sm" color="primary">Gets added:</ThemedText>
            </View>
            <ThemedText variant="body" size="sm" color="secondary">After your session completes</ThemedText>
          </View>
        </View>

        {/* Withdrawal Section */}
        {eligibility && (
          <View style={styles.section}>
            <ThemedText variant="heading" size="md" color="primary">Withdrawal</ThemedText>

            <View style={[styles.statusBox, { borderLeftColor: eligibility.can_withdraw ? UNIFIED_THEME.colors.status.approved : UNIFIED_THEME.colors.status.pending }]}>
              <View>
                {eligibility.can_withdraw ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="check" size={20} color="success" style={{ marginRight: 6 }} />
                    <ThemedText variant="label" size="md" color="success">Ready to Withdraw</ThemedText>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="hourglass" size={20} color="warning" style={{ marginRight: 6 }} />
                    <ThemedText variant="label" size="md" color="warning">{eligibility.eligibility_reason}</ThemedText>
                  </View>
                )}
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
                  <ThemedText variant="label" size="sm" color="onAccent">Withdraw Now</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Recent Earnings - Simplified */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <ThemedText variant="heading" size="md" color="primary">Recent Sessions</ThemedText>
            {earnings.length > 0 && <ThemedText variant="label" size="sm" color="primary" style={styles.countBadge}>{earnings.length}</ThemedText>}
          </View>

          {earnings.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="bell" size={48} color="muted" style={styles.emptyIcon} />
              <ThemedText variant="heading" size="md" color="primary">No earnings yet</ThemedText>
              <ThemedText variant="body" size="sm" color="muted">Complete your first session to earn</ThemedText>
            </View>
          ) : (
            earnings.slice(0, 15).map((earning, index) => {
              const isPending = earning.status === 'pending';
              return (
                <View key={earning.id || index} style={[styles.earningCard, isPending && styles.earningCardPending]}>
                  <View style={styles.earningLeft}>
                    <ThemedText variant="label" size="md" color="primary">
                      {new Date(earning.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </ThemedText>
                    {isPending ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Icon name="hourglass" size={16} color="warning" style={{ marginRight: 4 }} />
                        <ThemedText variant="body" size="sm" color="warning">Pending</ThemedText>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Icon name="check" size={16} color="success" style={{ marginRight: 4 }} />
                        <ThemedText variant="body" size="sm" color="success">Completed</ThemedText>
                      </View>
                    )}
                  </View>

                  <ThemedText variant="heading" size="lg" color={isPending ? 'warning' : 'success'}>
                    ₹{earning.teacher_earn?.toLocaleString() || 0}
                  </ThemedText>
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
    backgroundColor: UNIFIED_THEME.colors.primary.light,
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: UNIFIED_THEME.spacing.md,
  },

  scrollView: {
    flex: 1,
    paddingBottom: 30,
  },

  mainBalanceCard: {
    marginHorizontal: UNIFIED_THEME.spacing.lg,
    marginVertical: UNIFIED_THEME.spacing.lg,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    padding: UNIFIED_THEME.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  divider: {
    width: 1,
    height: 50,
    backgroundColor: UNIFIED_THEME.colors.border.light,
  },

  section: {
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    marginVertical: UNIFIED_THEME.spacing.md,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.md,
  },

  countBadge: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    paddingHorizontal: UNIFIED_THEME.spacing.sm,
    paddingVertical: UNIFIED_THEME.spacing.xs,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
  },

  quickInfoBox: {
    marginHorizontal: UNIFIED_THEME.spacing.lg,
    marginBottom: UNIFIED_THEME.spacing.lg,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    padding: UNIFIED_THEME.spacing.md,
  },

  infoRow: {
    marginBottom: UNIFIED_THEME.spacing.md,
    paddingBottom: UNIFIED_THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: UNIFIED_THEME.colors.border.light,
  },

  pendingSection: {
    marginHorizontal: UNIFIED_THEME.spacing.lg,
    marginBottom: UNIFIED_THEME.spacing.md,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    padding: UNIFIED_THEME.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: UNIFIED_THEME.colors.status.pending,
  },

  statusBox: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    padding: UNIFIED_THEME.spacing.md,
    borderLeftWidth: 4,
    marginBottom: UNIFIED_THEME.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  withdrawBtn: {
    backgroundColor: UNIFIED_THEME.colors.status.approved,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingVertical: UNIFIED_THEME.spacing.sm,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    ...UNIFIED_THEME.shadows.small,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },

  emptyIcon: {
    marginBottom: UNIFIED_THEME.spacing.md,
  },

  earningCard: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    padding: UNIFIED_THEME.spacing.md,
    marginBottom: UNIFIED_THEME.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  earningCardPending: {
    borderLeftWidth: 3,
    borderLeftColor: UNIFIED_THEME.colors.status.pending,
  },

  earningLeft: {
    flex: 1,
  },
});
