import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';
import { supabase } from '../../../supabase';
import { API_URL } from '../../api/api';
import UNIFIED_THEME from '../../constants/unifiedTheme';
import ThemedText from '../../components/ThemedText';
import Icon from '../../components/Icon';

/**
 * WithdrawalRequest Component
 * 
 * Teachers can request withdrawal with:
 * 1. Amount validation
 * 2. Bank details
 * 3. Withdrawal eligibility check
 * 4. One-click request processing
 */
export default function WithdrawalRequest({ navigation, route }) {
  const { availableBalance, teacherId } = route?.params || {};

  const [loading, setLoading] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  
  // Bank details
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  
  // Bank details from profile
  const [savedBankDetails, setSavedBankDetails] = useState(null);
  const [useSavedDetails, setUseSavedDetails] = useState(false);

  useEffect(() => {
    loadBankDetails();
  }, []);

  const loadBankDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('bank_account_number, bank_ifsc_code, account_holder_name, bank_name')
          .eq('id', user.id)
          .single();

        if (profile?.bank_account_number) {
          setSavedBankDetails(profile);
        }
      }
    } catch (error) {
      console.error('Error loading bank details:', error);
    }
  };

  const validateForm = () => {
    if (!withdrawalAmount || withdrawalAmount === '0') {
      Alert.alert('Error', 'Please enter withdrawal amount');
      return false;
    }

    const amount = parseFloat(withdrawalAmount);
    if (amount <= 0) {
      Alert.alert('Error', 'Amount must be greater than 0');
      return false;
    }

    if (amount > availableBalance) {
      Alert.alert('Error', `Available balance: ₹${availableBalance?.toLocaleString()}`);
      return false;
    }

    const bankNumber = useSavedDetails ? savedBankDetails?.bank_account_number : accountNumber;
    const bankIfsc = useSavedDetails ? savedBankDetails?.bank_ifsc_code : ifscCode;
    const bankHolder = useSavedDetails ? savedBankDetails?.account_holder_name : accountHolder;

    if (!bankNumber || !bankIfsc || !bankHolder) {
      Alert.alert('Error', 'Please fill all bank details');
      return false;
    }

    // Basic validation
    if (bankNumber.length < 9 || bankNumber.length > 18) {
      Alert.alert('Error', 'Invalid account number');
      return false;
    }

    if (bankIfsc.length !== 11) {
      Alert.alert('Error', 'IFSC code must be 11 characters');
      return false;
    }

    return true;
  };

  const handleWithdrawalRequest = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      const bankNumber = useSavedDetails ? savedBankDetails?.bank_account_number : accountNumber;
      const bankIfsc = useSavedDetails ? savedBankDetails?.bank_ifsc_code : ifscCode;
      const bankHolder = useSavedDetails ? savedBankDetails?.account_holder_name : accountHolder;
      const bankNameVal = useSavedDetails ? (savedBankDetails?.bank_name || '') : (bankName || '');

      const response = await fetch(`${API_URL}/api/teacher/withdrawal/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: user.id,
          amount: parseFloat(withdrawalAmount),
          bankAccountNumber: bankNumber,
          bankIFSCCode: bankIfsc,
          accountHolderName: bankHolder,
          bankName: bankNameVal || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        Toast.show('Withdrawal request submitted successfully!');

        Alert.alert(
          'Processing',
          `Your amount will be redeemed in your bank in 24hrs.\n\nRequest of ₹${withdrawalAmount} has been sent to admin for approval. Once approved, the transfer will be initiated.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="back" size={24} color="primary" />
          </TouchableOpacity>
          <ThemedText variant="heading" size="md" style={{ marginLeft: 12, flex: 1 }}>Request Withdrawal</ThemedText>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Available Balance */}
          <View style={styles.section}>
            <View style={styles.balanceCard}>
              <ThemedText variant="body" size="sm" color="muted">Available Balance</ThemedText>
              <ThemedText variant="heading" size="lg" color="success" style={{ marginVertical: 8 }}>₹{availableBalance?.toLocaleString() || 0}</ThemedText>
              <ThemedText variant="body" size="sm" color="muted">Can withdraw up to this amount</ThemedText>
            </View>
          </View>

          {/* Withdrawal Amount */}
          <View style={styles.section}>
            <ThemedText variant="heading" size="md" color="primary" style={{ marginBottom: 10 }}>Withdrawal Amount</ThemedText>

            <View style={styles.inputBox}>
              <View style={styles.amountInputRow}>
                <ThemedText variant="heading" size="lg" color="primary" style={{ marginRight: 6 }}>₹</ThemedText>
                <TextInput
                  style={styles.amountInput}
                  placeholder="Enter amount"
                  placeholderTextColor={UNIFIED_THEME.colors.text.muted}
                  value={withdrawalAmount}
                  onChangeText={setWithdrawalAmount}
                  keyboardType="decimal-pad"
                  editable={!loading}
                />
              </View>

              {/* Quick amount buttons */}
              <View style={styles.quickAmountButtons}>
                {[
                  Math.min(10000, availableBalance || 0),
                  Math.min(25000, availableBalance || 0),
                  Math.min(50000, availableBalance || 0),
                ].map((amount) => (
                  amount > 0 && (
                    <TouchableOpacity
                      key={amount}
                      style={styles.quickBtn}
                      onPress={() => setWithdrawalAmount(amount.toString())}
                    >
                      <ThemedText variant="label" size="sm" color="primary">₹{amount / 1000}K</ThemedText>
                    </TouchableOpacity>
                  )
                ))}
              </View>
            </View>
          </View>

          {/* Bank Details */}
          <View style={styles.section}>
            <ThemedText variant="heading" size="md" color="primary" style={{ marginBottom: 10 }}>Bank Details</ThemedText>

            {/* Saved Details Option */}
            {savedBankDetails && (
              <TouchableOpacity
                style={[styles.savedDetailsBox, useSavedDetails && styles.savedDetailsBoxActive]}
                onPress={() => setUseSavedDetails(!useSavedDetails)}
              >
                {useSavedDetails ? (
                  <Icon name="check" size={24} color="primary" style={{ marginRight: 12 }} />
                ) : (
                  <ThemedText style={{ marginRight: 12, fontSize: 20 }}>○</ThemedText>
                )}
                <View style={styles.savedDetailsContent}>
                  <ThemedText variant="label" size="md" color="primary" style={{ marginBottom: 4 }}>Use Saved Bank Details</ThemedText>
                  <ThemedText variant="body" size="sm" color="muted">
                    {savedBankDetails.account_holder_name}
                  </ThemedText>
                  <ThemedText variant="body" size="sm" color="muted">
                    ****{savedBankDetails.bank_account_number?.slice(-4)} • {savedBankDetails.bank_ifsc_code}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            )}

            {/* New Bank Details Form */}
            {!useSavedDetails && (
              <View style={styles.formBox}>
                {/* Account Holder Name */}
                <View style={styles.inputGroup}>
                  <ThemedText variant="label" size="md" color="secondary" style={{ marginBottom: 6 }}>Account Holder Name *</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="Full name as per bank"
                    placeholderTextColor={UNIFIED_THEME.colors.text.muted}
                    value={accountHolder}
                    onChangeText={setAccountHolder}
                    editable={!loading}
                  />
                </View>

                {/* Account Number */}
                <View style={styles.inputGroup}>
                  <ThemedText variant="label" size="md" color="secondary" style={{ marginBottom: 6 }}>Account Number *</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="9-18 digits"
                    placeholderTextColor={UNIFIED_THEME.colors.text.muted}
                    value={accountNumber}
                    onChangeText={(text) => setAccountNumber(text.replace(/\D/g, ''))}
                    editable={!loading}
                    keyboardType="numeric"
                  />
                </View>

                {/* IFSC Code */}
                <View style={styles.inputGroup}>
                  <ThemedText variant="label" size="md" color="secondary" style={{ marginBottom: 6 }}>IFSC Code *</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="11 characters (e.g., HDFC0000001)"
                    placeholderTextColor={UNIFIED_THEME.colors.text.muted}
                    value={ifscCode}
                    onChangeText={(text) => setIfscCode(text.toUpperCase())}
                    editable={!loading}
                    maxLength={11}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Transaction Details */}
          <View style={styles.section}>
            <ThemedText variant="heading" size="md" color="primary" style={{ marginBottom: 10 }}>Transaction Details</ThemedText>

            <View style={styles.detailsBox}>
              <View style={styles.detail}>
                <ThemedText variant="body" size="sm" color="muted">Withdrawal Amount:</ThemedText>
                <ThemedText variant="label" size="md" color="primary">₹{withdrawalAmount || 0}</ThemedText>
              </View>

              <View style={styles.detail}>
                <ThemedText variant="body" size="sm" color="muted">Processing Time:</ThemedText>
                <ThemedText variant="label" size="md" color="primary">Within 24hrs after admin approval</ThemedText>
              </View>

              <View style={styles.detail}>
                <ThemedText variant="body" size="sm" color="muted">Fee:</ThemedText>
                <ThemedText variant="label" size="md" color="primary">₹0 (No fees)</ThemedText>
              </View>

              <View style={[styles.detail, styles.totalDetail]}>
                <ThemedText variant="label" size="md" color="success">You'll Receive:</ThemedText>
                <ThemedText variant="heading" size="lg" color="success">₹{withdrawalAmount || 0}</ThemedText>
              </View>
            </View>
          </View>

          {/* Terms & Conditions */}
          <View style={styles.section}>
            <View style={styles.termsBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Icon name="check" size={18} color="success" style={{ marginRight: 6 }} />
                <ThemedText variant="label" size="md" color="success">Before You Withdraw</ThemedText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Icon name="check" size={16} color="success" style={{ marginRight: 6 }} />
                <ThemedText variant="body" size="sm" color="secondary">Ensure bank details are correct</ThemedText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Icon name="check" size={16} color="success" style={{ marginRight: 6 }} />
                <ThemedText variant="body" size="sm" color="secondary">Amount will be in your bank within 24hrs after approval</ThemedText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Icon name="check" size={16} color="success" style={{ marginRight: 6 }} />
                <ThemedText variant="body" size="sm" color="secondary">No fees charged on withdrawals</ThemedText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="check" size={16} color="success" style={{ marginRight: 6 }} />
                <ThemedText variant="body" size="sm" color="secondary">Direct transfer to your bank account</ThemedText>
              </View>
            </View>
          </View>

          {/* Pro Tips */}
          <View style={styles.section}>
            <View style={styles.tipsBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Icon name="lightbulb" size={18} color="info" style={{ marginRight: 6 }} />
                <ThemedText variant="label" size="md" color="info">Pro Tips</ThemedText>
              </View>
              <ThemedText variant="body" size="sm" color="secondary" style={{ marginBottom: 6 }}>
                Save your bank details in your profile for faster withdrawals in future.
              </ThemedText>
              <ThemedText variant="body" size="sm" color="secondary">
                Max withdrawal limit is your available balance. Minimum depends on your bank.
              </ThemedText>
            </View>
          </View>
        </ScrollView>

        {/* Processing status */}
        {loading && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color={UNIFIED_THEME.colors.accent.primary} />
            <ThemedText variant="heading" size="md" color="primary" style={{ marginTop: 16 }}>Processing your redemption request...</ThemedText>
            <ThemedText variant="body" size="sm" color="muted" style={{ marginTop: 6 }}>Please wait</ThemedText>
          </View>
        )}

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleWithdrawalRequest}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={UNIFIED_THEME.colors.text.primary} size="small" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="upload" size={18} color="onAccent" style={{ marginRight: 6 }} />
                <ThemedText variant="label" size="lg" color="onAccent">Request Withdrawal</ThemedText>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  },

  scrollView: {
    flex: 1,
    paddingBottom: 100,
  },

  section: {
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    marginVertical: UNIFIED_THEME.spacing.md,
  },

  balanceCard: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    padding: UNIFIED_THEME.spacing.md,
  },

  inputBox: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    padding: UNIFIED_THEME.spacing.md,
  },

  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UNIFIED_THEME.colors.primary.light,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    paddingLeft: UNIFIED_THEME.spacing.md,
    marginBottom: UNIFIED_THEME.spacing.md,
  },

  amountInput: {
    flex: 1,
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 20,
    fontWeight: '600',
    paddingVertical: UNIFIED_THEME.spacing.md,
    paddingRight: UNIFIED_THEME.spacing.md,
  },

  quickAmountButtons: {
    flexDirection: 'row',
    gap: UNIFIED_THEME.spacing.sm,
  },

  quickBtn: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.border.light,
    paddingVertical: UNIFIED_THEME.spacing.sm,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    alignItems: 'center',
  },

  savedDetailsBox: {
    flexDirection: 'row',
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    padding: UNIFIED_THEME.spacing.md,
    marginBottom: UNIFIED_THEME.spacing.md,
    alignItems: 'center',
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
  },

  savedDetailsBoxActive: {
    borderColor: UNIFIED_THEME.colors.accent.primary,
    backgroundColor: 'rgba(255, 0, 110, 0.1)',
  },

  savedDetailsContent: {
    flex: 1,
  },

  formBox: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    padding: UNIFIED_THEME.spacing.md,
  },

  inputGroup: {
    marginBottom: UNIFIED_THEME.spacing.lg,
  },

  input: {
    backgroundColor: UNIFIED_THEME.colors.primary.light,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    color: UNIFIED_THEME.colors.text.primary,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingVertical: UNIFIED_THEME.spacing.md,
    fontSize: 13,
  },

  detailsBox: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    padding: UNIFIED_THEME.spacing.md,
  },

  detail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: UNIFIED_THEME.spacing.md,
    borderBottomColor: UNIFIED_THEME.colors.border.light,
    borderBottomWidth: 1,
  },

  totalDetail: {
    borderBottomWidth: 0,
    paddingVertical: UNIFIED_THEME.spacing.md,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    marginTop: UNIFIED_THEME.spacing.md,
  },

  termsBox: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    padding: UNIFIED_THEME.spacing.md,
    borderLeftColor: UNIFIED_THEME.colors.status.approved,
    borderLeftWidth: 4,
  },

  tipsBox: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    padding: UNIFIED_THEME.spacing.md,
    borderLeftColor: UNIFIED_THEME.colors.status.pending,
    borderLeftWidth: 4,
  },

  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: UNIFIED_THEME.colors.component.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.md,
    borderTopColor: UNIFIED_THEME.colors.border.light,
    borderTopWidth: 1,
  },

  submitBtn: {
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    paddingVertical: UNIFIED_THEME.spacing.lg,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    alignItems: 'center',
    ...UNIFIED_THEME.shadows.medium,
  },

  submitBtnDisabled: {
    opacity: 0.6,
  },
});
