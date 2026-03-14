import React, { useState, useEffect } from 'react';
import {
  View,
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
import { releaseAvailabilitySlot } from '../../database/database';
import UNIFIED_THEME from '../../constants/unifiedTheme';
import ThemedText from '../../components/ThemedText';
import Icon from '../../components/Icon';

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPaymentFailedModal, setShowPaymentFailedModal] = useState(false);
  const [paymentFailedMessage, setPaymentFailedMessage] = useState('');

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

  const handlePayment = () => {
    if (!studentInfo || !booking || !charges) {
      Alert.alert('Error', 'Missing required information');
      return;
    }
    // Show confirmation modal with total amount
    setShowConfirmModal(true);
  };

  const confirmAndProceedPayment = async () => {
    try {
      setShowConfirmModal(false);
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
          console.error('❌ Payment error:', error);
          setProcessing(false);
          
          // Check if payment was cancelled by user or network error
          const errorCode = error?.code || error?.error?.code || '';
          const errorDescription = error?.description || error?.error?.description || error?.message || '';
          const isNetworkErr = isNetworkError(error);
          
          // Show payment failed modal for all cases (cancellation, network error, or other errors)
          let failureMessage = 'Payment failed. Please try again.';
          
          if (isNetworkErr) {
            failureMessage = 'Network error occurred. Please check your internet connection and try again.';
          } else if (errorCode === 'BAD_REQUEST_ERROR' || 
              errorDescription.toLowerCase().includes('cancelled') ||
              errorDescription.toLowerCase().includes('cancel') ||
              errorCode === 'USER_CANCELLED' ||
              errorCode === 'PAYMENT_CANCELLED') {
            failureMessage = 'Payment was cancelled.';
          } else if (errorDescription) {
            failureMessage = errorDescription;
          } else if (error.message) {
            failureMessage = error.message;
          }
          
          setPaymentFailedMessage(failureMessage);
          setShowPaymentFailedModal(true);
        });
    } catch (error) {
      console.error('🔴 Error initiating payment:', error);
      console.error('Error details:', error.message);
      setProcessing(false);
      
      // Show payment failed modal for network or other errors during order creation
      let failureMessage = 'Failed to process payment. Please try again.';
      
      if (isNetworkError(error)) {
        failureMessage = 'Network error occurred. Please check your internet connection and try again.';
      } else if (error.message) {
        failureMessage = error.message;
      }
      
      // Release the slot if booking exists (rollback)
      if (booking?.availability_slot_id) {
        console.log('🔄 Releasing slot due to payment failure:', booking.availability_slot_id);
        await releaseAvailabilitySlot(booking.availability_slot_id, booking.id);
      }
      
      setPaymentFailedMessage(failureMessage);
      setShowPaymentFailedModal(true);
    }
  };

  const verifyPayment = async (paymentData, retryCount = 0) => {
    const MAX_RETRIES = 3;
    try {
      console.log('🔵 Verifying payment... (attempt ' + (retryCount + 1) + ')');
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
        // Check if payment already exists (duplicate verification)
        if (verifyData.error?.toLowerCase().includes('duplicate') || 
            verifyData.error?.toLowerCase().includes('already exists') ||
            verifyData.error?.toLowerCase().includes('already verified')) {
          console.log('ℹ️ Payment already verified, checking booking status...');
          // Payment was already verified - check if booking is confirmed
          const { data: bookingData } = await supabase
            .from('bookings')
            .select('status, payment_status')
            .eq('id', booking.id)
            .single();
          
          if (bookingData?.payment_status === 'completed' || bookingData?.status === 'confirmed') {
            console.log('✅ Booking already confirmed');
            Toast.show('Payment already verified! Booking confirmed.', Toast.SHORT);
            setTimeout(() => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'StudentDashboard' }],
              });
            }, 800);
            return;
          }
        }

        // Retry on network errors or temporary failures
        if (retryCount < MAX_RETRIES && (
          verifyData.error?.toLowerCase().includes('network') ||
          verifyData.error?.toLowerCase().includes('timeout') ||
          verifyData.error?.toLowerCase().includes('temporary') ||
          verifyResponse.status >= 500
        )) {
          console.log(`🔄 Retrying verification (${retryCount + 1}/${MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1))); // Exponential backoff
          return verifyPayment(paymentData, retryCount + 1);
        }

        // If verification fails permanently, release the slot
        if (retryCount >= MAX_RETRIES && booking?.availability_slot_id) {
          console.log('🔄 Releasing slot due to verification failure:', booking.availability_slot_id);
          await releaseAvailabilitySlot(booking.availability_slot_id, booking.id);
        }
        
        throw new Error(verifyData.error || 'Payment verification failed');
      }

      console.log('✅ Payment verified successfully!');
      Toast.show('Payment successful! Booking confirmed.', Toast.SHORT);

      // Navigate back to StudentDashboard - booking is now confirmed
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'StudentDashboard' }],
        });
      }, 800);
    } catch (error) {
      console.error('🔴 Error verifying payment:', error);
      
      // Check if it's a network error
      if (isNetworkError(error) && retryCount < MAX_RETRIES) {
        console.log(`🔄 Network error, retrying verification (${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
        return verifyPayment(paymentData, retryCount + 1);
      }

      // Release slot if verification failed permanently (after all retries)
      if (retryCount >= MAX_RETRIES && booking?.availability_slot_id) {
        console.log('🔄 Releasing slot due to verification failure:', booking.availability_slot_id);
        await releaseAvailabilitySlot(booking.availability_slot_id, booking.id);
      }
      
      // Show payment failed modal for verification errors
      let failureMessage = 'Failed to verify payment. Your payment may have been processed. Please check your bookings.';
      
      if (isNetworkError(error)) {
        failureMessage = 'Network error occurred during verification. Please check your internet connection and try again.';
      } else if (error.message) {
        failureMessage = error.message;
      }
      
      setPaymentFailedMessage(failureMessage);
      setShowPaymentFailedModal(true);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={UNIFIED_THEME.colors.accent.primary} />
          <ThemedText variant="bodyMd" color={UNIFIED_THEME.colors.text.muted} style={styles.loadingText}>Loading checkout...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (!charges) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ThemedText variant="bodyMd" color={UNIFIED_THEME.colors.accent.error} style={styles.errorText}>Unable to load pricing information</ThemedText>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={loadCheckoutData}
          >
            <ThemedText variant="labelLg" color={UNIFIED_THEME.colors.text.primary} style={styles.retryBtnText}>Retry</ThemedText>
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
          <Icon name="chevron-left" size={24} color={UNIFIED_THEME.colors.accent.primary} />
        </TouchableOpacity>
        <ThemedText variant="headingXs" color={UNIFIED_THEME.colors.text.primary} style={styles.headerTitle}>Checkout</ThemedText>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Booking Details */}
        <View style={styles.section}>
          <ThemedText variant="headingXs" color={UNIFIED_THEME.colors.text.primary} style={styles.sectionTitle}>Booking Details</ThemedText>

          <View style={styles.detailCard}>
            <View style={styles.teacherHeader}>
              <View style={styles.teacherAvatar}>
                <ThemedText style={styles.avatarIcon}>👨‍🏫</ThemedText>
              </View>
              <View style={styles.teacherDetails}>
                <ThemedText variant="labelLg" color={UNIFIED_THEME.colors.text.primary} style={styles.teacherName}>{teacher.profile?.full_name}</ThemedText>
                <ThemedText variant="bodySm" color={UNIFIED_THEME.colors.text.muted} style={styles.teacherSpec}>
                  {teacher.specializations}
                </ThemedText>
                <ThemedText variant="bodySm" color={UNIFIED_THEME.colors.text.muted} style={styles.teacherSpec}>
                  {teacher.bio}
                </ThemedText>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <ThemedText variant="labelMd" color={UNIFIED_THEME.colors.text.secondary} style={styles.infoLabel}>Date & Time:</ThemedText>
              <ThemedText variant="bodyMd" color={UNIFIED_THEME.colors.text.primary} style={styles.infoValue}>
                {slot
                  ? `${new Date(slot.start_time).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} at ${new Date(slot.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`
                  : booking?.booked_date
                    ? `${new Date(booking.booked_date).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} at ${new Date(booking.booked_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`
                    : 'TBD'}
              </ThemedText>
            </View>

            <View style={styles.infoRow}>
              <ThemedText variant="labelMd" color={UNIFIED_THEME.colors.text.secondary} style={styles.infoLabel}>Duration:</ThemedText>
              <ThemedText variant="bodyMd" color={UNIFIED_THEME.colors.text.primary} style={styles.infoValue}>60 minutes</ThemedText>
            </View>

            <View style={styles.infoRow}>
              <ThemedText variant="labelMd" color={UNIFIED_THEME.colors.text.secondary} style={styles.infoLabel}>Topic:</ThemedText>
              <ThemedText variant="bodyMd" color={UNIFIED_THEME.colors.text.primary} style={styles.infoValue}>{booking?.subject || 'Not specified'}</ThemedText>
            </View>
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <ThemedText variant="headingXs" color={UNIFIED_THEME.colors.text.primary} style={styles.sectionTitle}>💰 Price Breakdown</ThemedText>

          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <View style={styles.priceLeft}>
                <ThemedText variant="labelMd" color={UNIFIED_THEME.colors.text.secondary} style={styles.priceLabel}>Teacher Rate</ThemedText>
              </View>
              <View style={styles.priceRight}>
                <ThemedText variant="bodyMd" color={UNIFIED_THEME.colors.text.primary} style={styles.priceAmount}>₹{teacherRate}</ThemedText>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.priceRow}>
              <View style={styles.priceLeft}>
                <ThemedText variant="labelMd" color={UNIFIED_THEME.colors.text.secondary} style={styles.priceLabel}>GST</ThemedText>
                <ThemedText variant="labelSm" color={UNIFIED_THEME.colors.text.muted} style={styles.pricePercentage}>18%</ThemedText>
              </View>
              <View style={styles.priceRight}>
                <ThemedText variant="bodyMd" color={UNIFIED_THEME.colors.accent.warning} style={[styles.priceAmount, styles.feeAmount]}>+₹{gstAmount}</ThemedText>
              </View>
            </View>

            <View style={styles.priceRow}>
              <View style={styles.priceLeft}>
                <ThemedText variant="labelMd" color={UNIFIED_THEME.colors.text.secondary} style={styles.priceLabel}>Platform Fee</ThemedText>
                <ThemedText variant="labelSm" color={UNIFIED_THEME.colors.text.muted} style={styles.pricePercentage}>7.5%</ThemedText>
              </View>
              <View style={styles.priceRight}>
                <ThemedText variant="bodyMd" color={UNIFIED_THEME.colors.accent.warning} style={[styles.priceAmount, styles.feeAmount]}>+₹{platformFeeAmount}</ThemedText>
              </View>
            </View>

            <View style={[styles.priceRow, styles.totalRow]}>
              <View style={styles.priceLeft}>
                <ThemedText variant="labelLg" color={UNIFIED_THEME.colors.text.primary} style={styles.totalLabel}>Total Amount</ThemedText>
              </View>
              <View style={styles.priceRight}>
                <ThemedText variant="headingSm" color={UNIFIED_THEME.colors.accent.primary} style={styles.totalAmount}>₹{totalAmount}</ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* What Happens Next */}
        <View style={styles.section}>
          <ThemedText variant="headingXs" color={UNIFIED_THEME.colors.text.primary} style={styles.sectionTitle}>📋 What Happens Next</ThemedText>

          <View style={styles.stepsContainer}>
            <View style={styles.infoStep}>
              <View style={styles.stepIcon}>
                <ThemedText variant="labelLg" color={UNIFIED_THEME.colors.text.primary} style={styles.stepNumber}>1</ThemedText>
              </View>
              <ThemedText variant="bodyMd" color={UNIFIED_THEME.colors.text.secondary} style={styles.stepText}>
                Complete secure payment via Razorpay
              </ThemedText>
            </View>

            <View style={styles.infoStep}>
              <View style={styles.stepIcon}>
                <ThemedText variant="labelLg" color={UNIFIED_THEME.colors.text.primary} style={styles.stepNumber}>2</ThemedText>
              </View>
              <ThemedText variant="bodyMd" color={UNIFIED_THEME.colors.text.secondary} style={styles.stepText}>
                Teacher gets instant notification
              </ThemedText>
            </View>

            <View style={styles.infoStep}>
              <View style={styles.stepIcon}>
                <ThemedText variant="labelLg" color={UNIFIED_THEME.colors.text.primary} style={styles.stepNumber}>3</ThemedText>
              </View>
              <ThemedText variant="bodyMd" color={UNIFIED_THEME.colors.text.secondary} style={styles.stepText}>
                Your booking is confirmed automatically
              </ThemedText>
            </View>

            <View style={styles.infoStep}>
              <View style={styles.stepIcon}>
                <ThemedText variant="labelLg" color={UNIFIED_THEME.colors.text.primary} style={styles.stepNumber}>4</ThemedText>
              </View>
              <ThemedText variant="bodyMd" color={UNIFIED_THEME.colors.text.secondary} style={styles.stepText}>
                Join the meeting at scheduled time
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Security & Terms */}
        <View style={styles.section}>
          <View style={styles.securityBox}>
            <ThemedText variant="labelLg" color={UNIFIED_THEME.colors.accent.success} style={styles.securityTitle}>🔒 Secure & Protected</ThemedText>
            <ThemedText variant="bodySm" color={UNIFIED_THEME.colors.text.secondary} style={styles.termsText}>
              ✓ Encrypted payment via Razorpay
            </ThemedText>
            <ThemedText variant="bodySm" color={UNIFIED_THEME.colors.text.secondary} style={styles.termsText}>
              ✓ Instant booking confirmation
            </ThemedText>
            <ThemedText variant="bodySm" color={UNIFIED_THEME.colors.text.secondary} style={styles.termsText}>
              ✓ 24-hour cancellation policy
            </ThemedText>
            <ThemedText variant="bodySm" color={UNIFIED_THEME.colors.text.secondary} style={styles.termsText}>
              ✓ Money-back guarantee
            </ThemedText>
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
              <ActivityIndicator color={UNIFIED_THEME.colors.text.primary} size="small" style={{marginRight: 8}} />
              <ThemedText variant="labelLg" color={UNIFIED_THEME.colors.text.primary} style={styles.payBtnText}>Processing...</ThemedText>
            </>
          ) : (
            <>
              <ThemedText variant="labelLg" color={UNIFIED_THEME.colors.text.primary} style={styles.payBtnText}>💳 Pay Now</ThemedText>
              <ThemedText variant="bodySm" color={UNIFIED_THEME.colors.text.primary} style={styles.payBtnSubtext}>₹{totalAmount}</ThemedText>
            </>
          )}
        </TouchableOpacity>
      </View>
      {/* Payment Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowConfirmModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.confirmModalCard}>
                <ThemedText variant="headingXs" color={UNIFIED_THEME.colors.text.primary} style={styles.confirmModalTitle}>Confirm Payment</ThemedText>
                <ThemedText variant="bodyMd" color={UNIFIED_THEME.colors.text.secondary} style={styles.confirmModalSubtitle}>Please review the total amount before proceeding</ThemedText>
                
                <View style={styles.confirmPriceBreakdown}>
                  <View style={styles.confirmPriceRow}>
                    <ThemedText variant="labelMd" color={UNIFIED_THEME.colors.text.secondary} style={styles.confirmPriceLabel}>Teacher Rate:</ThemedText>
                    <ThemedText variant="bodyMd" color={UNIFIED_THEME.colors.text.primary} style={styles.confirmPriceValue}>₹{teacherRate}</ThemedText>
                  </View>
                  <View style={styles.confirmPriceRow}>
                    <ThemedText variant="labelMd" color={UNIFIED_THEME.colors.text.secondary} style={styles.confirmPriceLabel}>GST (18%):</ThemedText>
                    <ThemedText variant="bodyMd" color={UNIFIED_THEME.colors.accent.warning} style={styles.confirmPriceValue}>+₹{gstAmount}</ThemedText>
                  </View>
                  <View style={styles.confirmPriceRow}>
                    <ThemedText variant="labelMd" color={UNIFIED_THEME.colors.text.secondary} style={styles.confirmPriceLabel}>Platform Fee (7.5%):</ThemedText>
                    <ThemedText variant="bodyMd" color={UNIFIED_THEME.colors.accent.warning} style={styles.confirmPriceValue}>+₹{platformFeeAmount}</ThemedText>
                  </View>
                  <View style={styles.confirmTotalDivider} />
                  <View style={[styles.confirmPriceRow, styles.confirmTotalRow]}>
                    <ThemedText variant="labelLg" color={UNIFIED_THEME.colors.text.primary} style={styles.confirmTotalLabel}>Total Payable:</ThemedText>
                    <ThemedText variant="headingSm" color={UNIFIED_THEME.colors.accent.primary} style={styles.confirmTotalValue}>₹{totalAmount}</ThemedText>
                  </View>
                </View>

                <View style={styles.confirmModalButtons}>
                  <TouchableOpacity
                    style={styles.confirmCancelBtn}
                    onPress={() => setShowConfirmModal(false)}
                  >
                    <ThemedText variant="labelLg" color={UNIFIED_THEME.colors.text.primary} style={styles.confirmCancelBtnText}>Cancel</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmProceedBtn}
                    onPress={confirmAndProceedPayment}
                  >
                    <ThemedText variant="labelLg" color={UNIFIED_THEME.colors.text.primary} style={styles.confirmProceedBtnText}>Proceed to Pay</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

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
                <ThemedText style={styles.networkErrorIcon}>📡</ThemedText>
                <ThemedText variant="headingXs" color={UNIFIED_THEME.colors.accent.error} style={styles.networkErrorTitle}>Network is Not Connected</ThemedText>
                <ThemedText variant="bodyMd" color={UNIFIED_THEME.colors.text.secondary} style={styles.networkErrorMessage}>
                  Please check your internet connection and try again.
                </ThemedText>
                <TouchableOpacity
                  style={styles.networkErrorBtn}
                  onPress={handleNetworkErrorDismiss}
                >
                  <ThemedText variant="labelLg" color={UNIFIED_THEME.colors.text.primary} style={styles.networkErrorBtnText}>OK</ThemedText>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Payment Failed Modal */}
      <Modal
        visible={showPaymentFailedModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPaymentFailedModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowPaymentFailedModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.paymentFailedCard}>
                <ThemedText style={styles.paymentFailedIcon}>❌</ThemedText>
                <ThemedText variant="headingXs" color={UNIFIED_THEME.colors.accent.error} style={styles.paymentFailedTitle}>Payment Failed</ThemedText>
                <ThemedText variant="bodyMd" color={UNIFIED_THEME.colors.text.secondary} style={styles.paymentFailedMessage}>
                  {paymentFailedMessage}
                </ThemedText>
                <TouchableOpacity
                  style={styles.paymentFailedBtn}
                  onPress={() => setShowPaymentFailedModal(false)}
                >
                  <ThemedText variant="labelLg" color={UNIFIED_THEME.colors.text.primary} style={styles.paymentFailedBtnText}>OK</ThemedText>
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
    paddingHorizontal: UNIFIED_THEME.spacing.xl,
    paddingVertical: UNIFIED_THEME.spacing.lg,
  },

  backBtn: {
    fontSize: 16,
    fontWeight: '600',
    width: 40,
    height: 40,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: UNIFIED_THEME.spacing.md,
  },

  headerTitle: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
    paddingBottom: 100,
  },

  section: {
    paddingHorizontal: UNIFIED_THEME.spacing.xl,
    marginVertical: UNIFIED_THEME.spacing.lg,
  },

  sectionTitle: {
    marginBottom: UNIFIED_THEME.spacing.md,
  },

  detailCard: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    padding: UNIFIED_THEME.spacing.lg,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.default,
    ...UNIFIED_THEME.shadows.small,
  },

  teacherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.md,
  },

  teacherAvatar: {
    width: 50,
    height: 50,
    backgroundColor: UNIFIED_THEME.colors.border.light,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    borderWidth: 2,
    borderColor: UNIFIED_THEME.colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: UNIFIED_THEME.spacing.md,
  },

  avatarIcon: {
    fontSize: 28,
  },

  teacherDetails: {
    flex: 1,
  },

  teacherName: {
    marginBottom: 2,
  },

  teacherSpec: {
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: UNIFIED_THEME.colors.border.light,
    marginVertical: UNIFIED_THEME.spacing.md,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: UNIFIED_THEME.spacing.sm,
    borderBottomColor: UNIFIED_THEME.colors.border.light,
    borderBottomWidth: 1,
  },

  infoLabel: {
    fontSize: 13,
  },

  infoValue: {
    fontSize: 13,
    fontWeight: '600',
  },

  priceCard: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    padding: UNIFIED_THEME.spacing.lg,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.default,
    ...UNIFIED_THEME.shadows.small,
  },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: UNIFIED_THEME.spacing.sm,
  },

  priceLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 3,
  },

  priceSubtext: {
    fontSize: 11,
  },

  priceAmount: {
    fontSize: 14,
    fontWeight: '700',
  },

  totalRow: {
    borderTopColor: UNIFIED_THEME.colors.primary.dark,
    borderTopWidth: 1,
    paddingTop: UNIFIED_THEME.spacing.md,
    paddingBottom: 0,
  },

  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
  },

  totalAmount: {
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
    fontSize: 12,
    fontWeight: '500',
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: UNIFIED_THEME.borderRadius.round,
    alignSelf: 'flex-start',
  },

  feeAmount: {
  },

  totalDivider: {
    height: 2,
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    marginVertical: UNIFIED_THEME.spacing.sm,
    borderRadius: 1,
  },

  stepsContainer: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    padding: UNIFIED_THEME.spacing.lg,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.default,
    ...UNIFIED_THEME.shadows.small,
  },

  infoStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: UNIFIED_THEME.spacing.lg,
  },

  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: UNIFIED_THEME.colors.accent.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: UNIFIED_THEME.spacing.md,
    shadowColor: UNIFIED_THEME.colors.accent.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },

  stepNumber: {
    fontSize: 13,
    fontWeight: '700',
  },

  stepText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 19,
    marginTop: 2,
  },

  earningsBox: {
    backgroundColor: UNIFIED_THEME.colors.primary.dark,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    padding: UNIFIED_THEME.spacing.lg,
    borderColor: UNIFIED_THEME.colors.accent.success,
    borderWidth: 1,
  },

  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: UNIFIED_THEME.spacing.sm,
    borderBottomColor: UNIFIED_THEME.colors.primary.dark,
    borderBottomWidth: 1,
  },

  earningsLabel: {
    fontSize: 12,
  },

  earningsValue: {
    fontSize: 12,
    fontWeight: '600',
  },

  teacherEarnRow: {
    borderBottomWidth: 0,
    paddingVertical: UNIFIED_THEME.spacing.sm,
    backgroundColor: UNIFIED_THEME.colors.primary.dark,
    paddingHorizontal: UNIFIED_THEME.spacing.sm,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    marginTop: UNIFIED_THEME.spacing.sm,
  },

  teacherEarnLabel: {
    fontSize: 13,
    fontWeight: '700',
  },

  teacherEarnValue: {
    fontSize: 14,
    fontWeight: '800',
  },

  securityBox: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    padding: UNIFIED_THEME.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: UNIFIED_THEME.colors.accent.secondary,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    shadowColor: UNIFIED_THEME.colors.accent.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },

  securityTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: UNIFIED_THEME.spacing.md,
  },

  termsText: {
    fontSize: 12,
    lineHeight: 20,
    marginBottom: UNIFIED_THEME.spacing.sm,
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
    paddingHorizontal: UNIFIED_THEME.spacing.xl,
    paddingVertical: UNIFIED_THEME.spacing.lg,
    borderTopColor: UNIFIED_THEME.colors.border.light,
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
    marginBottom: UNIFIED_THEME.spacing.md,
    paddingHorizontal: UNIFIED_THEME.spacing.sm,
  },

  paymentSummaryLabel: {
    fontSize: 12,
    fontWeight: '500',
  },

  paymentSummaryAmount: {
    fontSize: 16,
    fontWeight: '700',
  },

  payBtn: {
    background: 'linear-gradient(135deg, ' + UNIFIED_THEME.colors.accent.primary + ', ' + UNIFIED_THEME.colors.accent.secondary + ')',
    paddingVertical: UNIFIED_THEME.spacing.lg,
    borderRadius: UNIFIED_THEME.borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 4,
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    shadowColor: UNIFIED_THEME.colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },

  payBtnDisabled: {
    opacity: 0.6,
  },

  payBtnText: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: UNIFIED_THEME.spacing.sm,
  },

  payBtnSubtext: {
    fontSize: 14,
    fontWeight: '600',
  },

  loadingText: {
    fontSize: 14,
    marginTop: UNIFIED_THEME.spacing.md,
  },

  errorText: {
    fontSize: 14,
  },

  retryBtn: {
    background: 'linear-gradient(135deg, ' + UNIFIED_THEME.colors.accent.primary + ', ' + UNIFIED_THEME.colors.accent.secondary + ')',
    paddingHorizontal: UNIFIED_THEME.spacing.xl,
    paddingVertical: UNIFIED_THEME.spacing.sm,
    borderRadius: UNIFIED_THEME.borderRadius.round,
    marginTop: UNIFIED_THEME.spacing.lg,
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    shadowColor: UNIFIED_THEME.colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },

  retryBtnText: {
    fontWeight: '600',
  },

  networkErrorOverlay: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.component.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: UNIFIED_THEME.spacing.xl,
  },

  networkErrorCard: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    padding: UNIFIED_THEME.spacing.xl,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: UNIFIED_THEME.colors.accent.primary,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.default,
  },

  networkErrorIcon: {
    fontSize: 48,
    marginBottom: UNIFIED_THEME.spacing.lg,
  },

  networkErrorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: UNIFIED_THEME.spacing.sm,
    textAlign: 'center',
  },

  networkErrorMessage: {
    fontSize: 14,
    marginBottom: UNIFIED_THEME.spacing.lg,
    textAlign: 'center',
    lineHeight: 20,
  },

  networkErrorBtn: {
    background: 'linear-gradient(135deg, ' + UNIFIED_THEME.colors.accent.primary + ', ' + UNIFIED_THEME.colors.accent.secondary + ')',
    paddingHorizontal: 30,
    paddingVertical: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.round,
    minWidth: 100,
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    shadowColor: UNIFIED_THEME.colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },

  networkErrorBtnText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.component.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: UNIFIED_THEME.spacing.xl,
  },

  confirmModalCard: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    padding: UNIFIED_THEME.spacing.xl,
    width: '100%',
    maxWidth: 400,
    borderLeftWidth: 4,
    borderLeftColor: UNIFIED_THEME.colors.accent.primary,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.default,
  },

  confirmModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: UNIFIED_THEME.spacing.sm,
    textAlign: 'center',
  },

  confirmModalSubtitle: {
    fontSize: 14,
    marginBottom: UNIFIED_THEME.spacing.lg,
    textAlign: 'center',
  },

  confirmPriceBreakdown: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    padding: UNIFIED_THEME.spacing.lg,
    marginBottom: UNIFIED_THEME.spacing.lg,
  },

  confirmPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: UNIFIED_THEME.spacing.sm,
  },

  confirmPriceLabel: {
    fontSize: 14,
  },

  confirmPriceValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  confirmTotalDivider: {
    height: 1,
    backgroundColor: UNIFIED_THEME.colors.border.light,
    marginVertical: UNIFIED_THEME.spacing.md,
  },

  confirmTotalRow: {
    paddingTop: UNIFIED_THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: UNIFIED_THEME.colors.border.light,
  },

  confirmTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },

  confirmTotalValue: {
    fontSize: 20,
    fontWeight: '800',
  },

  confirmModalButtons: {
    flexDirection: 'row',
    gap: UNIFIED_THEME.spacing.md,
  },

  confirmCancelBtn: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.default,
    paddingVertical: UNIFIED_THEME.spacing.lg,
    borderRadius: UNIFIED_THEME.borderRadius.round,
    alignItems: 'center',
  },

  confirmCancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },

  confirmProceedBtn: {
    flex: 1,
    background: 'linear-gradient(135deg, ' + UNIFIED_THEME.colors.accent.primary + ', ' + UNIFIED_THEME.colors.accent.secondary + ')',
    paddingVertical: UNIFIED_THEME.spacing.lg,
    borderRadius: UNIFIED_THEME.borderRadius.round,
    alignItems: 'center',
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    shadowColor: UNIFIED_THEME.colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },

  confirmProceedBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },

  paymentFailedCard: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    padding: UNIFIED_THEME.spacing.xl,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: UNIFIED_THEME.colors.accent.primary,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.default,
  },

  paymentFailedIcon: {
    fontSize: 48,
    marginBottom: UNIFIED_THEME.spacing.lg,
  },

  paymentFailedTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: UNIFIED_THEME.spacing.md,
    textAlign: 'center',
  },

  paymentFailedMessage: {
    fontSize: 14,
    marginBottom: UNIFIED_THEME.spacing.lg,
    textAlign: 'center',
    lineHeight: 20,
  },

  paymentFailedBtn: {
    background: 'linear-gradient(135deg, ' + UNIFIED_THEME.colors.accent.primary + ', ' + UNIFIED_THEME.colors.accent.secondary + ')',
    paddingHorizontal: 30,
    paddingVertical: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.round,
    minWidth: 100,
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    shadowColor: UNIFIED_THEME.colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },

  paymentFailedBtnText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
