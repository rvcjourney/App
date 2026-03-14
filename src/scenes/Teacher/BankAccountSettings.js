import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import ChevronRight from '../../assets/icons/ChevronRight';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';
import { supabase } from '../../../supabase';
import UNIFIED_THEME from '../../constants/unifiedTheme';
import ThemedText from '../../components/ThemedText';

/**
 * Bank Account Settings – collect banking details required for Razorpay Payout.
 * Saved to profiles: account_holder_name, bank_account_number, bank_ifsc_code, bank_name.
 */
export default function BankAccountSettings({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');

  useEffect(() => {
    loadBankDetails();
  }, []);

  const loadBankDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('account_holder_name, bank_account_number, bank_ifsc_code, bank_name')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setAccountHolderName(data.account_holder_name || '');
        setAccountNumber(data.bank_account_number || '');
        setIfscCode(data.bank_ifsc_code || '');
        setBankName(data.bank_name || '');
      }
    } catch (e) {
      console.error('Error loading bank details:', e);
      Toast.show('Failed to load bank details');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const name = (accountHolderName || '').trim();
    if (!name || name.length < 2) {
      Alert.alert('Invalid input', 'Account holder name must be at least 2 characters.');
      return false;
    }
    const num = (accountNumber || '').replace(/\D/g, '');
    if (num.length < 9 || num.length > 18) {
      Alert.alert('Invalid input', 'Account number must be 9–18 digits.');
      return false;
    }
    const ifsc = (ifscCode || '').trim().toUpperCase();
    if (ifsc.length !== 11) {
      Alert.alert('Invalid input', 'IFSC code must be exactly 11 characters.');
      return false;
    }
    const bank = (bankName || '').trim();
    if (!bank || bank.length < 2) {
      Alert.alert('Invalid input', 'Bank name is required (e.g. HDFC Bank, SBI).');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Toast.show('Please sign in again');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          account_holder_name: (accountHolderName || '').trim(),
          bank_account_number: (accountNumber || '').replace(/\D/g, ''),
          bank_ifsc_code: (ifscCode || '').trim().toUpperCase(),
          bank_name: (bankName || '').trim(),
        })
        .eq('id', user.id);

      if (error) throw error;
      Toast.show('Bank account details saved. You can use them for withdrawals.');
      navigation.goBack();
    } catch (e) {
      console.error('Error saving bank details:', e);
      Toast.show(e.message || 'Failed to save bank details');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={UNIFIED_THEME.colors.accent.primary} />
          <ThemedText variant="body" size="md" color="muted" style={{ marginTop: 12 }}>Loading bank details...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButtonContainer} onPress={() => navigation.goBack()}>
            {/* <ThemedText style={styles.backBtn}>← Back</ThemedText> */}
            <ChevronRight width={24} height={24} fill={UNIFIED_THEME.colors.accent.primary} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <ThemedText variant="heading" size="md">Bank Account</ThemedText>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.infoCard}>
            <ThemedText variant="label" size="md" color="primary" style={{ marginBottom: 8 }}>Razorpay Payout</ThemedText>
            <ThemedText variant="body" size="sm" color="secondary">
              These details are used to transfer your earnings to your bank account. They are required for Razorpay Payout and will be used when you request a withdrawal.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText variant="label" size="md" color="secondary" style={{ marginBottom: 8 }}>Account holder name *</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Full name as on bank account"
              placeholderTextColor={UNIFIED_THEME.colors.text.muted}
              value={accountHolderName}
              onChangeText={setAccountHolderName}
              editable={!saving}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.section}>
            <ThemedText variant="label" size="md" color="secondary" style={{ marginBottom: 8 }}>Bank name *</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="e.g. HDFC Bank, State Bank of India, ICICI Bank"
              placeholderTextColor={UNIFIED_THEME.colors.text.muted}
              value={bankName}
              onChangeText={setBankName}
              editable={!saving}
            />
          </View>

          <View style={styles.section}>
            <ThemedText variant="label" size="md" color="secondary" style={{ marginBottom: 8 }}>Account number *</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="9–18 digits"
              placeholderTextColor={UNIFIED_THEME.colors.text.muted}
              value={accountNumber}
              onChangeText={(t) => setAccountNumber(t.replace(/\D/g, ''))}
              keyboardType="numeric"
              editable={!saving}
              maxLength={18}
            />
          </View>

          <View style={styles.section}>
            <ThemedText variant="label" size="md" color="secondary" style={{ marginBottom: 8 }}>IFSC code *</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="11 characters (e.g. HDFC0001234)"
              placeholderTextColor={UNIFIED_THEME.colors.text.muted}
              value={ifscCode}
              onChangeText={(t) => setIfscCode(t.toUpperCase())}
              editable={!saving}
              maxLength={11}
              autoCapitalize="characters"
            />
          </View>

          <View style={[styles.section,{marginBottom: 100}]}>
            <View style={styles.termsBox}>
              <ThemedText variant="label" size="md" color="muted" style={{ marginBottom: 8 }}>Note</ThemedText>
              <ThemedText variant="body" size="sm" color="muted" style={{ marginBottom: 4 }}>• Name must match the bank account.</ThemedText>
              <ThemedText variant="body" size="sm" color="muted" style={{ marginBottom: 4 }}>• IFSC is on your cheque or net banking.</ThemedText>
              <ThemedText variant="body" size="sm" color="muted">• These details are stored securely and used only for payouts.</ThemedText>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={UNIFIED_THEME.colors.text.primary} size="small" />
            ) : (
              <ThemedText variant="label" size="lg" color="onAccent">Save bank details</ThemedText>
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
    borderBottomWidth: 1,
    borderBottomColor: UNIFIED_THEME.colors.border.light,
  },
  backButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: UNIFIED_THEME.spacing.md,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    paddingBottom: 100,
  },
  infoCard: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    marginHorizontal: UNIFIED_THEME.spacing.lg,
    marginTop: UNIFIED_THEME.spacing.lg,
    padding: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: UNIFIED_THEME.colors.accent.primary,
  },
  section: {
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    marginTop: UNIFIED_THEME.spacing.lg,
  },
  input: {
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    color: UNIFIED_THEME.colors.text.primary,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingVertical: UNIFIED_THEME.spacing.md,
    fontSize: 15,
  },
  termsBox: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    padding: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.md,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: UNIFIED_THEME.colors.border.light,
  },
  saveBtn: {
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    paddingVertical: UNIFIED_THEME.spacing.lg,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    alignItems: 'center',
    ...UNIFIED_THEME.shadows.medium,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
});
