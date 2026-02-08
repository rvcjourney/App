import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';
import { supabase } from '../../../supabase';
import { API_URL } from '../../api/api';
import RazorpayCheckout from 'react-native-razorpay';

const isNetworkError = (error) => {
  if (!error) return false;
  const errorMsg = (error.message || error.toString() || '').toLowerCase();
  return errorMsg.includes('network') || 
         errorMsg.includes('failed to fetch') || 
         errorMsg.includes('enotfound') || 
         errorMsg.includes('econnrefused') ||
         errorMsg.includes('timeout') ||
         errorMsg.includes('offline') ||
         errorMsg.includes('unable to reach');
};

/**
 * StudentCheckout Component
 * 
 * Handles student payment for booking a teacher session
 * 
 * Flow:
 * 1. Student selects a teacher slot
 * 2. Gets admin charges on top of teacher rate
 * 3. Creates payment order
 * 4. Opens Razorpay payment gateway
 * 5. Verifies payment and confirms booking
 */
export default function StudentCheckout({
  navigation,
  route,
}) {
  const { booking, teacher, slot } = route?.params || {};

  const [loading, setLoading] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [charges, setCharges] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    loadCheckoutData();
  }, []);

  const loadCheckoutData = async () => {
    try {
      setLoading(true);
      setNetworkError(false);
      const { data: { user } } = await supabase.auth.getUser();
      setStudentInfo(user);

      // Try to fetch admin charges for this teacher
      const basePrice = teacher?.price_per_call || 600;
      const adminCharge = 150;
      
      try {
        const chargesResponse = await fetch(
          `${API_URL}/api/admin/charges/${teacher?.id}`,
          { timeout: 5000 }
        );
        
        if (chargesResponse.ok) {
          const chargesData = await chargesResponse.json();
          setCharges(chargesData?.data || {
            base_charge_amount: basePrice,
            admin_charge_amount: adminCharge,
            total_amount: basePrice + adminCharge,
          });
        } else {
          // API not available, use fallback
          setCharges({
            base_charge_amount: basePrice,
            admin_charge_amount: adminCharge,
            total_amount: basePrice + adminCharge,
          });
        }
      } catch (apiError) {
        if (isNetworkError(apiError)) {
          setNetworkError(true);
        } else {
          console.warn('Admin charges API not available, using defaults:', apiError.message);
        }
        // Use default charges if API fails
        setCharges({
          base_charge_amount: basePrice,
          admin_charge_amount: adminCharge,
          total_amount: basePrice + adminCharge,
        });
      }
    } catch (error) {
      if (isNetworkError(error)) {
        setNetworkError(true);
      } else {
        console.error('Error loading checkout:', error);
        Toast.show('Failed to load checkout');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNetworkErrorDismiss = () => {
    setNetworkError(false);
  };

  const handlePayment = async () => {
    try {
      if (!studentInfo || !booking || !charges) {
        Alert.alert('Error', 'Missing required information');
        return;
      }

      setProcessing(true);

      // Step 1: Create Razorpay order
      console.log('Creating payment order...');
      console.log('📌 API URL:', API_URL);
      console.log('📌 Booking Details:', {
        bookingId: booking.id,
        studentId: studentInfo.id,
        teacherId: teacher.id,
        totalAmount: charges.total_amount,
      });

      const orderResponse = await fetch(`${API_URL}/api/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          studentId: studentInfo.id,
          teacherId: teacher.id,
          basePrice: charges.base_charge_amount || teacher.price_per_call,
          adminCharge: charges.admin_charge_amount || 150,
          totalAmount: charges.total_amount || (charges.base_charge_amount + charges.admin_charge_amount),
        }),
      });

      console.log('Order response status:', orderResponse.status);
      const orderData = await orderResponse.json();
      console.log('Order response data:', orderData);

      if (!orderData.success) {
        throw new Error(orderData.razorpayError || orderData.message || orderData.error || 'Failed to create order');
      }

      console.log('✅ Order created:', orderData.orderId);
      setOrderDetails(orderData);

      // Step 2: Open Razorpay checkout
      const options = {
        description: `Booking with ${teacher.profile?.full_name || 'Teacher'}`,
        currency: 'INR',
        key: orderData.keyId, // Razorpay Key ID from server
        amount: orderData.amount * 100, // Convert to paise
        order_id: orderData.orderId,
        name: 'LearnEasy',
        prefill: {
          email: studentInfo.email,
          contact: studentInfo.phone || '',
        },
        notes: {
          bookingId: booking.id,
          teacherId: teacher.id,
        },
      };

      console.log('Opening Razorpay checkout...');
      RazorpayCheckout.open(options)
        .then(async (data) => {
          console.log('✅ Payment successful:', data);
          await verifyPayment(data);
        })
        .catch((error) => {
          console.error('❌ Payment failed:', error);
          Alert.alert(
            'Payment Failed',
            error.message || 'Payment was cancelled'
          );
          setProcessing(false);
        });
    } catch (error) {
      console.error('🔴 Error initiating payment:', error);
      console.error('Error details:', error.message);
      Alert.alert('Error', error.message || 'Failed to process payment');
      setProcessing(false);
    }
  };

  const verifyPayment = async (paymentData) => {
    try {
      console.log('🔵 Verifying payment...');
      console.log('Payment data:', paymentData);

      // Step 3: Verify payment on backend
      const verifyResponse = await fetch(`${API_URL}/api/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpayPaymentId: paymentData.razorpay_payment_id,
          razorpayOrderId: paymentData.razorpay_order_id,
          razorpaySignature: paymentData.razorpay_signature,
          bookingId: booking.id,
          studentId: studentInfo.id,
          teacherId: teacher.id,
          basePrice: charges.base_charge_amount,
          adminCharge: charges.admin_charge_amount,
          totalAmount: charges.total_amount,
        }),
      });

      console.log('Verify response status:', verifyResponse.status);
      const verifyData = await verifyResponse.json();
      console.log('Verify response data:', verifyData);

      if (!verifyData.success) {
        throw new Error(verifyData.error || 'Payment verification failed');
      }

      console.log('✅ Payment verified successfully!');
      Toast.show('Payment successful! Booking confirmed.');

      // Navigate back to StudentDashboard - booking is now confirmed
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'StudentDashboard' }],
        });
      }, 800);
    } catch (error) {
      console.error('🔴 Error verifying payment:', error);
      Alert.alert('Verification Failed', error.message || 'Failed to verify payment');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#5568FE" />
          <Text style={styles.loadingText}>Loading checkout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!charges) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Unable to load pricing information</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={loadCheckoutData}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const basePrice = charges.base_charge_amount || teacher.price_per_call;
  const adminCharge = charges.admin_charge_amount || 150;
  const platformFee = 100;
  const totalAmount = basePrice + adminCharge;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Booking Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Details</Text>

          <View style={styles.detailCard}>
            <View style={styles.teacherHeader}>
              <View style={styles.teacherAvatar}>
                <Text style={styles.avatarIcon}>👨‍🏫</Text>
              </View>
              <View style={styles.teacherDetails}>
                <Text style={styles.teacherName}>{teacher.profile?.full_name}</Text>
                <Text style={styles.teacherSpec}>
                  {teacher.specializations?.split(',')[0].trim()}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📅 Date & Time:</Text>
              <Text style={styles.infoValue}>
                {slot ? new Date(slot.start_time).toLocaleDateString() : 'TBD'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>⏱️ Duration:</Text>
              <Text style={styles.infoValue}>60 minutes</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📚 Topic:</Text>
              <Text style={styles.infoValue}>{booking?.subject || 'Not specified'}</Text>
            </View>
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>

          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <View>
                <Text style={styles.priceLabel}>Teacher Hourly Rate</Text>
                <Text style={styles.priceSubtext}>Charged by teacher</Text>
              </View>
              <Text style={styles.priceAmount}>₹{basePrice}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.priceRow}>
              <View>
                <Text style={styles.priceLabel}>Charges</Text>
                <Text style={styles.priceSubtext}>Platform + Convenience fee</Text>
              </View>
              <Text style={[styles.priceAmount, { color: '#FF9800' }]}>+₹{adminCharge}</Text>
            </View>

            <View style={styles.divider} />

            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>₹{totalAmount}</Text>
            </View>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What Happens Next</Text>

          <View style={styles.infoBox}>
            <View style={styles.infoStep}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>
                Complete payment via Razorpay (card, UPI, or net banking)
              </Text>
            </View>

            <View style={styles.infoStep}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>
                Teacher receives payment notification
              </Text>
            </View>

            <View style={styles.infoStep}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>
                Your booking is confirmed
              </Text>
            </View>

            <View style={styles.infoStep}>
              <Text style={styles.stepNumber}>4</Text>
              <Text style={styles.stepText}>
                Join the meeting at the scheduled time
              </Text>
            </View>
          </View>
        </View>

        {/* Teacher Earnings */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teacher Earnings</Text>

          <View style={styles.earningsBox}>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>You Pay:</Text>
              <Text style={styles.earningsValue}>₹{totalAmount}</Text>
            </View>

            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Admin Commission:</Text>
              <Text style={styles.earningsValue}>-₹{adminCharge}</Text>
            </View>

            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Platform Fee:</Text>
              <Text style={styles.earningsValue}>-₹{platformFee}</Text>
            </View>

            <View style={[styles.earningsRow, styles.teacherEarnRow]}>
              <Text style={styles.teacherEarnLabel}>Teacher Gets:</Text>
              <Text style={styles.teacherEarnValue}>₹{totalAmount - adminCharge - platformFee}</Text>
            </View>
          </View>
        </View> */}

        {/* Terms */}
        <View style={styles.section}>
          <View style={styles.termsBox}>
            <Text style={styles.termsText}>
              ✓ Secure payment via Razorpay
            </Text>
            <Text style={styles.termsText}>
              ✓ Your booking is confirmed after payment
            </Text>
            <Text style={styles.termsText}>
              ✓ You can reschedule or cancel with 24 hours notice
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Payment Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payBtn, processing && styles.payBtnDisabled]}
          onPress={handlePayment}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.payBtnText}>Pay ₹{totalAmount}</Text>
          )}
        </TouchableOpacity>
      </View>
      {/* Network Error Modal */}
      <Modal
        visible={networkError}
        transparent={true}
        animationType="fade"
        onRequestClose={handleNetworkErrorDismiss}
      >
        <TouchableWithoutFeedback onPress={handleNetworkErrorDismiss}>
          <View style={styles.networkErrorOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.networkErrorCard}>
                <Text style={styles.networkErrorIcon}>📡</Text>
                <Text style={styles.networkErrorTitle}>Network is Not Connected</Text>
                <Text style={styles.networkErrorMessage}>
                  Please check your internet connection and try again.
                </Text>
                <TouchableOpacity
                  style={styles.networkErrorBtn}
                  onPress={handleNetworkErrorDismiss}
                >
                  <Text style={styles.networkErrorBtnText}>OK</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
    marginRight: 15,
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
    marginVertical: 15,
  },

  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },

  detailCard: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 15,
  },

  teacherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  teacherAvatar: {
    width: 50,
    height: 50,
    backgroundColor: '#2E2E5E',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  avatarIcon: {
    fontSize: 28,
  },

  teacherDetails: {
    flex: 1,
  },

  teacherName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },

  teacherSpec: {
    color: '#999',
    fontSize: 12,
  },

  divider: {
    height: 1,
    backgroundColor: '#2A2D5A',
    marginVertical: 12,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomColor: '#2A2D5A',
    borderBottomWidth: 1,
  },

  infoLabel: {
    color: '#999',
    fontSize: 13,
  },

  infoValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  priceCard: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 15,
  },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },

  priceLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 3,
  },

  priceSubtext: {
    color: '#999',
    fontSize: 11,
  },

  priceAmount: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '700',
  },

  totalRow: {
    borderTopColor: '#2A2D5A',
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: 0,
  },

  totalLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  totalAmount: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: '800',
  },

  infoBox: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 15,
  },

  infoStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  stepNumber: {
    color: '#5568FE',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 12,
    width: 25,
  },

  stepText: {
    color: '#ccc',
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },

  earningsBox: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 15,
    borderColor: '#2E7D32',
    borderWidth: 1,
  },

  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomColor: '#2A2D5A',
    borderBottomWidth: 1,
  },

  earningsLabel: {
    color: '#999',
    fontSize: 12,
  },

  earningsValue: {
    color: '#fff',
    fontSize: 12,
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
    fontSize: 13,
    fontWeight: '700',
  },

  teacherEarnValue: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '800',
  },

  termsBox: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 15,
  },

  termsText: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 20,
    marginBottom: 8,
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

  payBtn: {
    backgroundColor: '#5568FE',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  payBtnDisabled: {
    opacity: 0.6,
  },

  payBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  loadingText: {
    color: '#999',
    fontSize: 14,
    marginTop: 12,
  },

  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
  },

  retryBtn: {
    backgroundColor: '#5568FE',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 15,
  },

  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },

  networkErrorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  networkErrorCard: {
    backgroundColor: '#1C1F4A',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },

  networkErrorIcon: {
    fontSize: 48,
    marginBottom: 15,
  },

  networkErrorTitle: {
    color: '#FF6B6B',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },

  networkErrorMessage: {
    color: '#AAA',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },

  networkErrorBtn: {
    backgroundColor: '#5568FE',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
  },

  networkErrorBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
