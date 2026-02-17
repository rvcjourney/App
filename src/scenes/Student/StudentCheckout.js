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
import ChevronRight from '../../assets/icons/ChevronRight';

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
      const teacherRate = teacher?.price_per_call; 
      console.log(teacherRate);
      
      const gstAmount = Math.round(teacherRate * 0.18); // 18% GST
      const platformFeeAmount = Math.round(teacherRate * 0.075); // 7.5% Platform Fee
      const grossAmount = Math.round(teacherRate + gstAmount + platformFeeAmount); // Teacher Rate + 18% + 7.5%
      
      try {
        const chargesResponse = await fetch(
          `${API_URL}/api/admin/charges/${teacher?.id}`,
          { timeout: 5000 }
        );
        
        if (chargesResponse.ok) {
          const chargesData = await chargesResponse.json();
          setCharges(chargesData?.data || {
            teacher_rate: teacherRate,
            gross_amount: grossAmount,
            gst_amount: gstAmount,
            platform_fee_amount: platformFeeAmount,
            total_amount: grossAmount,
          });
        } else {
          // API not available, use fallback
          setCharges({
            teacher_rate: teacherRate,
            gross_amount: grossAmount,
            gst_amount: gstAmount,
            platform_fee_amount: platformFeeAmount,
            total_amount: grossAmount,
          });
        }
      } catch (apiError) {
        if (isNetworkError(apiError)) {
          setNetworkError(true);
        } else {
          console.warn('Admin charges API not available, using defaults:', apiError.message);
        }
        // Use default charges if API fails
        const teacherRate = teacher?.price_per_call;
        // const grossAmount = Math.round(teacherRate / 0.745);
        const gstAmount = Math.round(teacherRate * 0.18);
        const platformFeeAmount = Math.round(teacherRate * 0.075);
        const grossAmount = Math.round(teacherRate + gstAmount + platformFeeAmount);
        
        setCharges({
          teacher_rate: teacherRate,
          gross_amount: grossAmount,
          gst_amount: gstAmount,
          platform_fee_amount: platformFeeAmount,
          total_amount: grossAmount,
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
          basePrice: charges.teacher_rate || teacher.price_per_call,
          adminCharge: charges.gst_amount || Math.round((charges.total_amount || 0) * 0.18),
          totalAmount: charges.total_amount || charges.gross_amount,
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
        amount: orderData.amount, // Convert to paise
        order_id: orderData.orderId,
        name: 'Connectiqo',
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
          basePrice: charges.teacher_rate,
          adminCharge: charges.gst_amount,
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

  const teacherRate = charges.teacher_rate || teacher.price_per_call;
  const gstAmount = charges.gst_amount || Math.round(teacherRate * 0.18);
  const platformFeeAmount = charges.platform_fee_amount || Math.round(teacherRate * 0.075);
  const grossAmount = charges.gross_amount || Math.round(teacherRate + gstAmount + platformFeeAmount);
  const totalAmount = charges.total_amount || grossAmount;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          {/* <Text style={styles.backBtn}>← Back</Text> */}
           <ChevronRight width={24} height={24} color="#5568FE" style={{ transform: [{ rotate: '180deg' }] }} /> 
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
                  {teacher.specializations}
                </Text>
                <Text style={styles.teacherSpec}>
                  {teacher.bio}
                </Text> 
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date & Time:</Text>
              <Text style={styles.infoValue}>
                {slot ? new Date(slot.start_time).toLocaleDateString() : 'TBD'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Duration:</Text>
              <Text style={styles.infoValue}>60 minutes</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Topic:</Text>
              <Text style={styles.infoValue}>{booking?.subject || 'Not specified'}</Text>
            </View>
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Price Breakdown</Text>

          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <View style={styles.priceLeft}>
                <Text style={styles.priceLabel}>Teacher Rate</Text>
                {/* <Text style={styles.priceSubtext}>Net amount to teacher</Text> */}
              </View>
              <View style={styles.priceRight}>
                <Text style={styles.priceAmount}>₹{teacherRate}</Text>
                {/* <Text style={styles.pricePercentage}>74.5%</Text> */}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.priceRow}>
              <View style={styles.priceLeft}>
                <Text style={styles.priceLabel}>GST</Text>
                {/* <Text style={styles.priceSubtext}>Government tax</Text> */}
                <Text style={styles.pricePercentage}>18%</Text>
              </View>
              <View style={styles.priceRight}>
                <Text style={[styles.priceAmount, styles.feeAmount]}>+₹{gstAmount}</Text>
              </View>
            </View>

            <View style={styles.priceRow}>
              <View style={styles.priceLeft}>
                <Text style={styles.priceLabel}>Platform Fee</Text>
                {/* <Text style={styles.priceSubtext}>Service charges</Text> */}
                <Text style={styles.pricePercentage}>7.5%</Text>
              </View>
              <View style={styles.priceRight}>
                <Text style={[styles.priceAmount, styles.feeAmount]}>+₹{platformFeeAmount}</Text>
                
              </View>
            </View>

            {/* <View style={styles.totalDivider} /> */}

            <View style={[styles.priceRow, styles.totalRow]}>
              <View style={styles.priceLeft}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                {/* <Text style={styles.totalSubtext}>Amount you pay</Text> */}
              </View>
              <View style={styles.priceRight}>
                <Text style={styles.totalAmount}>₹{totalAmount}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* What Happens Next */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 What Happens Next</Text>

          <View style={styles.stepsContainer}>
            <View style={styles.infoStep}>
              <View style={styles.stepIcon}>
                <Text style={styles.stepNumber}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Complete secure payment via Razorpay
              </Text>
            </View>

            <View style={styles.infoStep}>
              <View style={styles.stepIcon}>
                <Text style={styles.stepNumber}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Teacher gets instant notification
              </Text>
            </View>

            <View style={styles.infoStep}>
              <View style={styles.stepIcon}>
                <Text style={styles.stepNumber}>3</Text>
              </View>
              <Text style={styles.stepText}>
                Your booking is confirmed automatically
              </Text>
            </View>

            <View style={styles.infoStep}>
              <View style={styles.stepIcon}>
                <Text style={styles.stepNumber}>4</Text>
              </View>
              <Text style={styles.stepText}>
                Join the meeting at scheduled time
              </Text>
            </View>
          </View>
        </View>

        {/* Security & Terms */}
        <View style={styles.section}>
          <View style={styles.securityBox}>
            <Text style={styles.securityTitle}>🔒 Secure & Protected</Text>
            <Text style={styles.termsText}>
              ✓ Encrypted payment via Razorpay
            </Text>
            <Text style={styles.termsText}>
              ✓ Instant booking confirmation
            </Text>
            <Text style={styles.termsText}>
              ✓ 24-hour cancellation policy
            </Text>
            <Text style={styles.termsText}>
              ✓ Money-back guarantee
            </Text>
          </View>
        </View>
        <View style={{ height: 80 }} /> 
      </ScrollView>

      {/* Enhanced Payment Button */}
      <View style={styles.footer}>
        {/* <View style={styles.paymentSummary}>
          <Text style={styles.paymentSummaryLabel}>Total Amount</Text>
          <Text style={styles.paymentSummaryAmount}>₹{totalAmount}</Text>
        </View> */}
        <TouchableOpacity
          style={[styles.payBtn, processing && styles.payBtnDisabled]}
          onPress={handlePayment}
          disabled={processing}
          activeOpacity={0.8}
        >
          {processing ? (
            <>
              <ActivityIndicator color="#fff" size="small" style={{marginRight: 8}} />
              <Text style={styles.payBtnText}>Processing...</Text>
            </>
          ) : (
            <>
              <Text style={styles.payBtnText}>💳 Pay Now</Text>
              <Text style={styles.payBtnSubtext}>₹{totalAmount}</Text>
            </>
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
    fontSize: 16,
    fontWeight: '600',
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
    marginTop: 2,
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

  priceLeft: {
    flex: 1,
  },

  priceRight: {
    alignItems: 'flex-end',
    minWidth: 80,
  },

  pricePercentage: {
    color: '#5568FE',
    fontSize: 12,
    fontWeight: '500',
    backgroundColor: '#5568FE20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },

  feeAmount: {
    color: '#FF9800',
  },

  totalDivider: {
    height: 2,
    backgroundColor: '#5568FE',
    marginVertical: 8,
    borderRadius: 1,
  },

  stepsContainer: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 16,
  },

  infoStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },

  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#5568FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  stepNumber: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  stepText: {
    color: '#ccc',
    fontSize: 13,
    flex: 1,
    lineHeight: 19,
    marginTop: 2,
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

  securityBox: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },

  securityTitle: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },

  termsText: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 20,
    marginBottom: 6,
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0B0D2A',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopColor: '#2A2D5A',
    borderTopWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },

  paymentSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  paymentSummaryLabel: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '500',
  },

  paymentSummaryAmount: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '700',
  },

  payBtn: {
    backgroundColor: '#5568FE',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 4,
    shadowColor: '#5568FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  payBtnDisabled: {
    opacity: 0.6,
  },

  payBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },

  payBtnSubtext: {
    color: '#E3F2FD',
    fontSize: 14,
    fontWeight: '600',
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
