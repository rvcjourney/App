import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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
          .select('bank_account_number, bank_ifsc_code, account_holder_name')
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

      const response = await fetch(`${API_URL}/api/teacher/withdrawal/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: user.id,
          amount: parseFloat(withdrawalAmount),
          bankAccountNumber: bankNumber,
          bankIFSCCode: bankIfsc,
          accountHolderName: bankHolder,
        }),
      });

      const result = await response.json();

      if (result.success) {
        Toast.show('Withdrawal request submitted successfully!');
        
        Alert.alert(
          'Success',
          `Your withdrawal request of ₹${withdrawalAmount} has been submitted.\n\nAdmin will process it within 24-48 hours.`,
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
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request Withdrawal</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Available Balance */}
          <View style={styles.section}>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>₹{availableBalance?.toLocaleString() || 0}</Text>
              <Text style={styles.balanceSubtext}>Can withdraw up to this amount</Text>
            </View>
          </View>

          {/* Withdrawal Amount */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Withdrawal Amount</Text>

            <View style={styles.inputBox}>
              <View style={styles.amountInputRow}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="Enter amount"
                  placeholderTextColor="#666"
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
                      <Text style={styles.quickBtnText}>₹{amount / 1000}K</Text>
                    </TouchableOpacity>
                  )
                ))}
              </View>
            </View>
          </View>

          {/* Bank Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bank Details</Text>

            {/* Saved Details Option */}
            {savedBankDetails && (
              <TouchableOpacity
                style={[styles.savedDetailsBox, useSavedDetails && styles.savedDetailsBoxActive]}
                onPress={() => setUseSavedDetails(!useSavedDetails)}
              >
                <Text style={styles.checkmark}>{useSavedDetails ? '✓' : '○'}</Text>
                <View style={styles.savedDetailsContent}>
                  <Text style={styles.savedDetailsTitle}>Use Saved Bank Details</Text>
                  <Text style={styles.savedDetailsInfo}>
                    {savedBankDetails.account_holder_name}
                  </Text>
                  <Text style={styles.savedDetailsInfo}>
                    ****{savedBankDetails.bank_account_number?.slice(-4)} • {savedBankDetails.bank_ifsc_code}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* New Bank Details Form */}
            {!useSavedDetails && (
              <View style={styles.formBox}>
                {/* Account Holder Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Account Holder Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Full name as per bank"
                    placeholderTextColor="#666"
                    value={accountHolder}
                    onChangeText={setAccountHolder}
                    editable={!loading}
                  />
                </View>

                {/* Account Number */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Account Number *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="9-18 digits"
                    placeholderTextColor="#666"
                    value={accountNumber}
                    onChangeText={(text) => setAccountNumber(text.replace(/\D/g, ''))}
                    editable={!loading}
                    keyboardType="numeric"
                  />
                </View>

                {/* IFSC Code */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>IFSC Code *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="11 characters (e.g., HDFC0000001)"
                    placeholderTextColor="#666"
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
            <Text style={styles.sectionTitle}>Transaction Details</Text>

            <View style={styles.detailsBox}>
              <View style={styles.detail}>
                <Text style={styles.detailLabel}>Withdrawal Amount:</Text>
                <Text style={styles.detailValue}>₹{withdrawalAmount || 0}</Text>
              </View>

              <View style={styles.detail}>
                <Text style={styles.detailLabel}>Processing Time:</Text>
                <Text style={styles.detailValue}>2-3 business days</Text>
              </View>

              <View style={styles.detail}>
                <Text style={styles.detailLabel}>Fee:</Text>
                <Text style={styles.detailValue}>₹0 (No fees)</Text>
              </View>

              <View style={[styles.detail, styles.totalDetail]}>
                <Text style={styles.totalLabel}>You'll Receive:</Text>
                <Text style={styles.totalValue}>₹{withdrawalAmount || 0}</Text>
              </View>
            </View>
          </View>

          {/* Terms & Conditions */}
          <View style={styles.section}>
            <View style={styles.termsBox}>
              <Text style={styles.termsTitle}>Before You Withdraw</Text>
              <Text style={styles.term}>✓ Ensure bank details are correct</Text>
              <Text style={styles.term}>✓ Processing takes 2-3 business days</Text>
              <Text style={styles.term}>✓ No fees charged on withdrawals</Text>
              <Text style={styles.term}>✓ Direct transfer to your bank account</Text>
            </View>
          </View>

          {/* Pro Tips */}
          <View style={styles.section}>
            <View style={styles.tipsBox}>
              <Text style={styles.tipsTitle}>💡 Pro Tips</Text>
              <Text style={styles.tip}>
                Save your bank details in your profile for faster withdrawals in future.
              </Text>
              <Text style={styles.tip}>
                Max withdrawal limit is your available balance. Minimum depends on your bank.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleWithdrawalRequest}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>📤 Request Withdrawal</Text>
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
    backgroundColor: '#0B0D2A',
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
    paddingBottom: 100,
  },

  section: {
    paddingHorizontal: 20,
    marginVertical: 12,
  },

  sectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },

  balanceCard: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 15,
  },

  balanceLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 6,
  },

  balanceAmount: {
    color: '#4CAF50',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },

  balanceSubtext: {
    color: '#999',
    fontSize: 11,
  },

  inputBox: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 15,
  },

  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0D2A',
    borderRadius: 8,
    paddingLeft: 12,
    marginBottom: 12,
  },

  currencySymbol: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: '700',
    marginRight: 6,
  },

  amountInput: {
    flex: 1,
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    paddingVertical: 12,
    paddingRight: 12,
  },

  quickAmountButtons: {
    flexDirection: 'row',
    gap: 8,
  },

  quickBtn: {
    flex: 1,
    backgroundColor: '#2E2E5E',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },

  quickBtnText: {
    color: '#5568FE',
    fontSize: 12,
    fontWeight: '600',
  },

  savedDetailsBox: {
    flexDirection: 'row',
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderColor: '#2A2D5A',
    borderWidth: 1,
  },

  savedDetailsBoxActive: {
    borderColor: '#5568FE',
    backgroundColor: '#2E2E5E',
  },

  checkmark: {
    fontSize: 20,
    color: '#5568FE',
    marginRight: 12,
  },

  savedDetailsContent: {
    flex: 1,
  },

  savedDetailsTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },

  savedDetailsInfo: {
    color: '#999',
    fontSize: 11,
  },

  formBox: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 15,
  },

  inputGroup: {
    marginBottom: 15,
  },

  label: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '600',
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
    fontSize: 13,
  },

  detailsBox: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 15,
  },

  detail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomColor: '#2A2D5A',
    borderBottomWidth: 1,
  },

  detailLabel: {
    color: '#999',
    fontSize: 13,
  },

  detailValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  totalDetail: {
    borderBottomWidth: 0,
    paddingVertical: 12,
    backgroundColor: '#0B0D2A',
    paddingHorizontal: 10,
    borderRadius: 6,
    marginTop: 8,
  },

  totalLabel: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '700',
  },

  totalValue: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '700',
  },

  termsBox: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 15,
    borderLeftColor: '#2E7D32',
    borderLeftWidth: 4,
  },

  termsTitle: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },

  term: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
  },

  tipsBox: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 15,
    borderLeftColor: '#FF9800',
    borderLeftWidth: 4,
  },

  tipsTitle: {
    color: '#FF9800',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },

  tip: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0B0D2A',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopColor: '#2A2D5A',
    borderTopWidth: 1,
  },

  submitBtn: {
    backgroundColor: '#5568FE',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  submitBtnDisabled: {
    opacity: 0.6,
  },

  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
