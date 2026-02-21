import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';
import { supabase } from '../../../supabase';

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
          <ActivityIndicator size="large" color="#5568FE" />
          <Text style={styles.loadingText}>Loading bank details...</Text>
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
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bank Account</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Razorpay Payout</Text>
            <Text style={styles.infoText}>
              These details are used to transfer your earnings to your bank account. They are required for Razorpay Payout and will be used when you request a withdrawal.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account holder name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Full name as on bank account"
              placeholderTextColor="#666"
              value={accountHolderName}
              onChangeText={setAccountHolderName}
              editable={!saving}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bank name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. HDFC Bank, State Bank of India, ICICI Bank"
              placeholderTextColor="#666"
              value={bankName}
              onChangeText={setBankName}
              editable={!saving}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account number *</Text>
            <TextInput
              style={styles.input}
              placeholder="9–18 digits"
              placeholderTextColor="#666"
              value={accountNumber}
              onChangeText={(t) => setAccountNumber(t.replace(/\D/g, ''))}
              keyboardType="numeric"
              editable={!saving}
              maxLength={18}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>IFSC code *</Text>
            <TextInput
              style={styles.input}
              placeholder="11 characters (e.g. HDFC0001234)"
              placeholderTextColor="#666"
              value={ifscCode}
              onChangeText={(t) => setIfscCode(t.toUpperCase())}
              editable={!saving}
              maxLength={11}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.section}>
            <View style={styles.termsBox}>
              <Text style={styles.termsTitle}>Note</Text>
              <Text style={styles.term}>• Name must match the bank account.</Text>
              <Text style={styles.term}>• IFSC is on your cheque or net banking.</Text>
              <Text style={styles.term}>• These details are stored securely and used only for payouts.</Text>
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
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save bank details</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: '#1C1F4A',
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
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#999',
    fontSize: 14,
    marginTop: 12,
  },
  scrollView: {
    flex: 1,
    paddingBottom: 100,
  },
  infoCard: {
    backgroundColor: '#1C1F4A',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#5568FE',
  },
  infoTitle: {
    color: '#5568FE',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoText: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    color: '#ccc',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1C1F4A',
    borderWidth: 1,
    borderColor: '#2A2D5A',
    borderRadius: 10,
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  termsBox: {
    backgroundColor: '#1C1F4A',
    padding: 14,
    borderRadius: 10,
  },
  termsTitle: {
    color: '#999',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  term: {
    color: '#999',
    fontSize: 12,
    lineHeight: 20,
    marginBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0B0D2A',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#1C1F4A',
  },
  saveBtn: {
    backgroundColor: '#5568FE',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
