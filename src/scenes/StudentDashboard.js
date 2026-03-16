import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';
import { SCREEN_NAMES } from '../navigators/screenNames';
import { supabase } from '../../supabase';
import { createBooking } from '../database/database';
import UNIFIED_THEME from '../constants/unifiedTheme';
import ThemedText from '../components/ThemedText';
import Icon from '../components/Icon';
import logger from '../utils/logger';
import { useStudentTeachers } from '../hooks/useStudentTeachers';
import { useStudentProfile } from '../hooks/useStudentProfile';
import { useStudentBooking } from '../hooks/useStudentBooking';

const categories = ['All', 'Math', 'Physics', 'Chemistry', 'English', 'Science'];

export default function StudentDashboard({ navigation }) {
  // Custom hooks manage all complex state logic
  const studentTeachers = useStudentTeachers();
  const studentProfile = useStudentProfile();
  const studentBooking = useStudentBooking();

  // UI state only
  const [activeTab, setActiveTab] = useState('home');
  const [refreshing, setRefreshing] = useState(false);

  // Convenience aliases for hook properties (maintains compatibility with rest of component)
  const teachers = studentTeachers.teachers;
  const groupedTeachers = studentTeachers.groupedTeachers;
  const searchQuery = studentTeachers.searchQuery;
  const selectedCategory = studentTeachers.selectedCategory;
  const favoriteTeachers = studentTeachers.favoriteTeachers;
  const loading = studentTeachers.loading;

  const studentId = studentProfile.studentId;
  const studentName = studentProfile.studentName;
  const profileIncomplete = studentProfile.profileIncomplete;
  const myBookings = studentProfile.myBookings;
  const unreadNotificationCount = studentProfile.unreadNotificationCount;

  const showBookingModal = studentBooking.showBookingModal;
  const selectedTeacher = studentBooking.selectedTeacher;
  const availableSlots = studentBooking.availableSlots;
  const slotsLoading = studentBooking.slotsLoading;
  const selectedSlot = studentBooking.selectedSlot;
  const bookingSubject = studentBooking.bookingSubject;
  const bookingInProgress = studentBooking.bookingInProgress;

  // Initialize on focus: Fetch student profile and teachers
  useFocusEffect(
    React.useCallback(() => {
      const initialize = async () => {
        try {
          logger.info('Initializing StudentDashboard...');

          // Fetch student profile and bookings
          const userId = await studentProfile.fetchStudentProfile();
          if (userId) {
            await studentProfile.fetchStudentBookings(userId);
          }

          // Fetch all teachers grouped by profession
          await studentTeachers.fetchTeachers();

        } catch (error) {
          logger.error('Error initializing StudentDashboard:', error);
          Toast.show(error?.message || 'Something went wrong');
        }
      };

      initialize();
    }, [])
  );

  // Refresh bookings – used by pull-to-refresh
  const onRefreshBookings = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await studentProfile.fetchStudentBookings(studentProfile.studentId);
    } catch (e) {
      logger.error('Error refreshing bookings:', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Refresh home tab - reload teachers and profile
  const onRefreshHome = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // Refresh teachers list
      await studentTeachers.fetchTeachers();
      // Refresh profile
      await studentProfile.refreshProfile();
      logger.success('Home tab refreshed');
    } catch (e) {
      logger.error('Error refreshing home tab:', e);
      Toast.show('Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Load available slots for selected teacher
  const loadAvailableSlots = async (teacher) => {
    try {
      logger.info('Loading available slots for teacher:', teacher.id);

      // Get slots for next 30 days
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      await studentBooking.fetchAvailableSlots(teacher.id, { startDate, endDate });
      logger.success('Slots loaded');
    } catch (error) {
      logger.error('Error loading slots:', error);
      Toast.show('Error loading availability');
    }
  };

  // Handle booking creation from availability slot
  // Returns booking object for checkout, or null on error
  const handleBookSlot = async (slot) => {
    try {
      // Prevent booking of already booked slots
      if (slot.slot_status === 'booked') {
        Alert.alert('Slot Unavailable', 'This time slot is already booked. Please select another slot.');
        // Refresh slots to show updated status
        if (studentBooking.selectedTeacher) {
          loadAvailableSlots(studentBooking.selectedTeacher);
        }
        return null;
      }

      if (!studentBooking.bookingSubject.trim()) {
        Alert.alert('Error', 'Please enter the subject/topic');
        return null;
      }

      logger.info('Creating booking for slot:', slot.id);

      // Create booking with pending status (will be confirmed after payment)
      const booking = await studentBooking.bookSlot(
        studentProfile.studentId,
        studentBooking.selectedTeacher.id,
        slot.id,
        studentBooking.bookingSubject
      );

      logger.success('Booking created');

      // Refresh slots immediately to show updated availability
      if (studentBooking.selectedTeacher) {
        loadAvailableSlots(studentBooking.selectedTeacher);
      }

      return booking; // Return booking object for checkout

    } catch (error) {
      logger.error('Error booking slot:', error);

      // Refresh slots on error to get latest status
      if (studentBooking.selectedTeacher) {
        loadAvailableSlots(studentBooking.selectedTeacher);
      }

      // Show specific error messages
      if (error.message?.includes('just booked') || error.message?.includes('no longer available')) {
        Alert.alert(
          'Slot Unavailable',
          error.message || 'This slot was just booked by another student. Please select a different time.',
          [
            {
              text: 'OK', onPress: () => {
                // Refresh slots after alert
                if (studentBooking.selectedTeacher) {
                  loadAvailableSlots(studentBooking.selectedTeacher);
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to create booking');
      }
      return null;
    }
  };

  // Copy meeting ID to clipboard
  const copyMeetingIdToClipboard = (meetingId) => {
    if (meetingId) {
      // Copy to clipboard (requires react-native-clipboard or similar)
      Alert.alert(
        'Meeting ID',
        `${meetingId}`,
        [
          { text: 'Close', style: 'cancel' },
          {
            text: 'Copy',
            onPress: () => {
              // In React Native, you would use a clipboard library
              // For now, just show the ID
              Toast.show('Meeting ID: ' + meetingId);
            }
          }
        ]
      );
    } else {
      Alert.alert('No Meeting ID', 'The teacher has not started the call yet');
    }
  };

  // Handle joining a meeting
  const handleJoinMeeting = async (booking) => {
    try {
      if (!booking.meeting_id) {
        Alert.alert('Not Ready', 'The teacher has not started the meeting yet. Please wait...');
        return;
      }

      logger.info('🔵 Student attempting to join meeting:', booking.meeting_id);

      // Navigate to Join screen with booking data
      navigation.navigate(SCREEN_NAMES.Join, {
        meetingId: booking.meeting_id,
        bookingId: booking.id,
        isTeacher: false,
        studentId: studentId,
        name: studentName,
      });
    } catch (error) {
      logger.error('🔴 Error joining meeting:', error);
      Alert.alert('Error', 'Failed to join meeting');
    }
  };

  // Filter teachers based on search and category
  const filteredTeachers = teachers.filter(teacher => {
    // Parse specializations if it's a string
    const specializations = typeof teacher.specializations === 'string'
      ? teacher.specializations.split(',').map(s => s.trim())
      : [];

    const teacherName = teacher.profile?.full_name || '';
    const matchesSearch = teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      specializations.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' ||
      specializations.includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  const toggleFavorite = (teacher) => {
    const isFavorite = studentTeachers.isFavorite(teacher.id);
    if (isFavorite) {
      Toast.show('❤️ Removed from favorites');
      studentTeachers.toggleFavorite(teacher.id);
    } else {
      Toast.show('❤️ Added to favorites');
      studentTeachers.toggleFavorite(teacher.id);
    }
  };

  // Teacher status colors (online / away / offline) – same as teacher dashboard
  const teacherStatusColor = (status) => {
    const s = (status || 'offline').toLowerCase();
    if (s === 'online') return UNIFIED_THEME.colors.accent.success;
    if (s === 'away') return UNIFIED_THEME.colors.status.pending;
    return UNIFIED_THEME.colors.text.muted;
  };

  const renderTeacherCard = ({ item }) => {
    const isFavorite = favoriteTeachers.find(t => t.id === item.id);
    const specializations = typeof item.specializations === 'string'
      ? item.specializations.split(',')[0].trim()
      : 'Subject';
    const status = item.availability_status || 'offline';

    return (
      <TouchableOpacity
        style={styles.teacherCard}
        // Disabled direct video join from teacher card on home.
        // Students should use bookings to join sessions.
        activeOpacity={0.9}
        onPress={() => {
          studentBooking.openBookingModal(item);
        }}
      >
        <View style={styles.teacherCardContent}>
          {/* Profile Photo */}
          <View style={styles.teacherAvatarWrapper}>
            <Icon name="user" size={48} color="primary" style={{ marginBottom: UNIFIED_THEME.spacing.sm }} />
            <View style={[styles.teacherStatusDot, { backgroundColor: teacherStatusColor(status) }]} />
          </View>

          {/* Name */}
          <ThemedText style={styles.teacherName}>{item.profile?.full_name || 'Teacher'}</ThemedText>

          {/* Specialization */}
          <ThemedText style={styles.teacherCategory}>{(item.specializations)}</ThemedText>

          {/* Rating, Followers, Favorite - Bottom Row */}
          <View style={styles.cardBottomRow}>
            {/* Rating */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <Icon name="star" size={16} color="primary" />
              <ThemedText style={styles.rating}>{(item.rating || 5.0).toFixed(1)}</ThemedText>
            </View>

            {/* Followers */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <Icon name="users" size={16} color="muted" style={{ marginRight: 4 }} />
              <ThemedText style={styles.followers}>{item.followers || 0}</ThemedText>
            </View>

            {/* Favorite */}
            <TouchableOpacity
              style={{ marginLeft: 'auto' }}
              onPress={() => toggleFavorite(item)}
            >
              {isFavorite ? (
                <Icon name="heart" size={20} color="error" />
              ) : (
                <Icon name="heart-outline" size={20} color="error" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Full-screen loading until profile and teachers are fetched
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={UNIFIED_THEME.colors.accent.primary} />
          <ThemedText style={styles.loadingText}>Loading your info...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // BOOKING MODAL
  if (showBookingModal && selectedTeacher) {
    // Load slots if not loaded yet
    if (availableSlots.length === 0 && !slotsLoading) {
      loadAvailableSlots(selectedTeacher);
    }

    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView style={{ flex: 1 }}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => {
              studentBooking.closeBookingModal();
            }}>
              {/* <ThemedText style={styles.backButton}>← Back</ThemedText> */}
              
              <View style={styles.backButton}>
                <Icon name="chevronRight" size={24} color="primary" style={{ transform: [{ rotate: '180deg' }] }} />
              </View>
            </TouchableOpacity>
            <ThemedText style={styles.modalTitle}>Select Available Slot</ThemedText>
          </View>

          {/* Teacher Info */}
          <View style={styles.teacherInfoCard}>
            <View style={styles.teacherModalAvatarWrapper}>
              <Icon name="user" size={56} color="primary" style={{ marginBottom: UNIFIED_THEME.spacing.md }} />
              <View style={[styles.teacherStatusDotModal, { backgroundColor: teacherStatusColor(selectedTeacher.availability_status) }]} />
            </View>
            <ThemedText style={styles.teacherName}>{selectedTeacher.profile?.full_name}</ThemedText>
            <ThemedText style={styles.teacherSpec}>{selectedTeacher.specializations}</ThemedText>
            <ThemedText style={styles.teacherSpec}>{selectedTeacher.bio}</ThemedText>
            
            <View style={styles.priceRow}>
              <ThemedText style={styles.priceLabel}>Price: </ThemedText>
              <ThemedText style={styles.priceValue}>₹{selectedTeacher.price_per_call || 500}/60 min</ThemedText>
            </View>
            {/* <ThemedText style={styles.teacherStatusLabel}>
              {((selectedTeacher.availability_status || 'offline') === 'online' && 'Online') ||
                ((selectedTeacher.availability_status || 'offline') === 'away' && 'Away') ||
                'Offline'}
            </ThemedText> */}
          </View>

          {/* Subject/Topic - show first so it's always visible before selecting slot */}
          {availableSlots.length > 0 && (
            <View style={styles.fieldSection}>
              <ThemedText style={styles.label}>Subject/Topic *</ThemedText>
              <TextInput
                style={styles.subjectInput}
                placeholder="e.g., Algebra, Physics Problem Solving"
                placeholderTextColor={UNIFIED_THEME.colors.text.muted}
                value={bookingSubject}
                onChangeText={studentBooking.setBookingSubject}
              />
            </View>
          )}

          {/* Available Slots */}
          <View style={styles.fieldSection}>
            <ThemedText style={styles.label}>Available Slots (Next 30 Days)</ThemedText>

            {slotsLoading ? (
              <View style={{ paddingVertical: UNIFIED_THEME.spacing.xl, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={UNIFIED_THEME.colors.accent.primary} />
                <ThemedText style={styles.loadingText}>Loading available slots...</ThemedText>
              </View>
            ) : availableSlots.length === 0 ? (
              <View style={styles.noSlotsContainer}>
                <ThemedText style={styles.noSlotsText}>😔 No available slots found</ThemedText>
                <ThemedText style={styles.noSlotsSubtext}>Teacher hasn't set their availability yet</ThemedText>
              </View>
            ) : (
              <View style={styles.slotsList}>
                {availableSlots.map(slot => {
                  const slotDateTime = new Date(slot.start_time);
                  const dateStr = slotDateTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const timeStr = slotDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                  const dayStr = slotDateTime.toLocaleDateString('en-US', { weekday: 'short' });
                  const isSelected = selectedSlot?.id === slot.id;
                  const isBooked = slot.slot_status === 'booked';

                  return (
                    <TouchableOpacity
                      key={slot.id}
                      style={[
                        styles.slotCard,
                        isBooked && styles.slotCardBooked,
                        isSelected && !isBooked && styles.slotCardSelected
                      ]}
                      onPress={() => !isBooked && studentBooking.setSelectedSlot(slot)}
                      disabled={isBooked}
                    >
                      <View style={styles.slotContent}>
                        <ThemedText style={[styles.slotDateTime, isBooked && styles.slotDateTimeBooked]}>
                          {dayStr}, {dateStr} • {timeStr}
                        </ThemedText>
                        <ThemedText style={[styles.slotDuration, isBooked && styles.slotDurationBooked]}>
                          {isBooked ? 'Already booked' : '60 minutes session'}
                        </ThemedText>
                      </View>
                      {isBooked ? (
                        <ThemedText style={styles.slotBookedBadge}>🔒 Booked</ThemedText>
                      ) : (
                        isSelected && <ThemedText style={styles.slotCheckmark}>✓</ThemedText>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Summary */}
          {selectedSlot && (
            <View style={styles.summaryCard}>
              <ThemedText style={styles.summaryTitle}>Booking Summary</ThemedText>
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Teacher:</ThemedText>
                <ThemedText style={styles.summaryValue}>{selectedTeacher.profile?.full_name}</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Subject/Topic:</ThemedText>
                <ThemedText style={styles.summaryValue}>{bookingSubject || '— Not entered —'}</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Date & Time:</ThemedText>
                <ThemedText style={styles.summaryValue}>{new Date(selectedSlot.start_time).toLocaleString()}</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Duration:</ThemedText>
                <ThemedText style={styles.summaryValue}>60 minutes</ThemedText>
              </View>
              <View style={[styles.summaryRow, styles.summaryRowTotal]}>
                <ThemedText style={styles.summaryLabel}>Total:</ThemedText>
                <ThemedText style={styles.summaryValueTotal}>₹{selectedTeacher.price_per_call || 500}</ThemedText>
              </View>
            </View>
          )}

          <View style={{ marginBottom: 30 }} />
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => {
              studentBooking.closeBookingModal();
            }}
            disabled={bookingInProgress}
          >
            <ThemedText style={styles.cancelBtnText}>Cancel</ThemedText>
          </TouchableOpacity>
          {/* <TouchableOpacity
            style={[styles.confirmBtn, (bookingInProgress || !selectedSlot) && styles.confirmBtnDisabled]}
            onPress={() => {
              handleBookSlot(selectedSlot);

              navigation.navigate('StudentCheckout', {
                booking: bookingObject,
                teacher: selectedTeacher,
                slot: slot,
                onPaymentSuccess: (paymentData) => {
                  Toast.show('Booking confirmed!');
                  loadBookings();
                }
              });
            }}
            disabled={bookingInProgress || !selectedSlot}
          >
            <ThemedText style={styles.confirmBtnText}>
              {bookingInProgress ? 'Booking...' : '✅ Confirm Booking'}
            </ThemedText>
          </TouchableOpacity> */}
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              (bookingInProgress || !selectedSlot) && styles.confirmBtnDisabled
            ]}
            onPress={async () => {
              try {
                const booking = await handleBookSlot(selectedSlot);

                if (!booking) return;

                // Don't pass functions through navigation - use goBack with callback instead
                navigation.navigate('StudentCheckout', {
                  booking: booking,
                  teacher: selectedTeacher,
                  slot: selectedSlot,
                });
              } catch (err) {
                logger.error(err);
                Toast.show('Booking failed');
              }
            }}
            disabled={bookingInProgress || !selectedSlot}
          >
            <ThemedText style={styles.confirmBtnText}>
              {bookingInProgress ? 'Booking...' : 'Book Now'}
            </ThemedText>
          </TouchableOpacity>

        </View>
      </SafeAreaView>
    );
  }

  // HOME TAB
  if (activeTab === 'home') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {profileIncomplete && (
          <View style={styles.snackbar}>
            <ThemedText style={styles.snackbarText}>Complete your profile for a better experience.</ThemedText>
            <TouchableOpacity
              style={styles.snackbarBtn}
              onPress={() => {
                setProfileIncomplete(false);
                navigation.navigate(SCREEN_NAMES.EditStudentProfile);
              }}
            >
              <ThemedText style={styles.snackbarBtnText}>Go to edit profile</ThemedText>
            </TouchableOpacity>
          </View>
        )}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefreshHome} colors={[UNIFIED_THEME.colors.accent.primary]} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <ThemedText style={styles.welcome}>Welcome 👋</ThemedText>
              <ThemedText style={styles.studentName}>{studentName}</ThemedText>
            </View>
            <TouchableOpacity
              style={styles.notificationBellWrap}
              onPress={() => navigation.navigate(SCREEN_NAMES.Notifications)}
              activeOpacity={0.7}
            >
              <View style={styles.notificationBell}>
                <ThemedText style={styles.notificationBellIcon}>🔔</ThemedText>
                {unreadNotificationCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <ThemedText style={styles.notificationBadgeText}>
                      {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                    </ThemedText>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search teachers..."
              placeholderTextColor={UNIFIED_THEME.colors.text.muted}
              value={searchQuery}
              onChangeText={studentTeachers.handleSearch}
            />
            <Icon name="search" size={25} color="secondary" style={styles.searchIcon} />

          </View>

          {/* Categories */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: UNIFIED_THEME.spacing.xl }} style={styles.categoryScroll}>
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryBtn,
                  selectedCategory === category && styles.categoryBtnActive,
                ]}
                onPress={() => studentTeachers.handleCategoryChange(category)}
              >
                <ThemedText
                  style={[
                    styles.categoryText,
                    selectedCategory === category && styles.categoryTextActive,
                  ]}
                >
                  {category}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Teachers Grouped by Profession */}
          {Object.keys(groupedTeachers).length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyIcon}>🔍</ThemedText>
              <ThemedText style={styles.emptyText}>No teachers found</ThemedText>
              <ThemedText style={styles.emptySubtext}>Try searching with different keywords</ThemedText>
            </View>
          ) : (
            Object.entries(groupedTeachers).map(([profession, teacherList]) => {
              // Filter teachers in this profession by search query
              const filteredProfessionTeachers = teacherList.filter(teacher => {
                const specializations = typeof teacher.specializations === 'string'
                  ? teacher.specializations.split(',').map(s => s.trim())
                  : [];
                const teacherName = teacher.profile?.full_name || '';
                return (
                  teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  specializations.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  profession.toLowerCase().includes(searchQuery.toLowerCase())
                );
              });

              if (filteredProfessionTeachers.length === 0) return null;

              return (
                <View key={profession} style={styles.professionSection}>
                  <View style={styles.professionHeader}>
                    <ThemedText style={styles.professionTitle}>{profession}</ThemedText>
                    <ThemedText style={styles.professionCount}>
                      {filteredProfessionTeachers.length}
                    </ThemedText>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.professionTeachersList}
                  >
                    {filteredProfessionTeachers.map(teacher => (
                      <View key={teacher.id} style={styles.horizontalTeacherCard}>
                        {renderTeacherCard({ item: teacher })}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={[styles.navItem, activeTab === 'home' && styles.navItemActive]}
            onPress={() => setActiveTab('home')}
          >
            <Icon name="home" size={24} color={activeTab === 'home' ? 'primary' : 'muted'} />
            <ThemedText style={styles.navLabel}>Home</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeTab === 'bookings' && styles.navItemActive]}
            onPress={() => setActiveTab('bookings')}
          >
            <Icon name="calendar" size={24} color={activeTab === 'bookings' ? 'primary' : 'muted'} />
            <ThemedText style={styles.navLabel}>Bookings</ThemedText>
          </TouchableOpacity>

          {/* Lectures tab hidden for students
          <TouchableOpacity
            style={[styles.navItem, activeTab === 'lectures' && styles.navItemActive]}
            onPress={() => setActiveTab('lectures')}
          >
            <Icon name="book" size={24} color={activeTab === 'lectures' ? 'primary' : 'muted'} />
            <ThemedText style={styles.navLabel}>Lectures</ThemedText>
          </TouchableOpacity>
          */}

          <TouchableOpacity
            style={[styles.navItem, activeTab === 'profile' && styles.navItemActive]}
            onPress={() => setActiveTab('profile')}
          >
            <Icon name="user" size={24} color={activeTab === 'profile' ? 'primary' : 'muted'} />
            <ThemedText style={styles.navLabel}>Profile</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // BOOKINGS TAB
  if (activeTab === 'bookings') {
    const pendingBookings = myBookings.filter(b => b.status === 'pending');
    const confirmedBookings = myBookings.filter(b => b.status === 'confirmed');
    const completedBookings = myBookings.filter(b => b.status === 'completed');

    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefreshBookings} colors={[UNIFIED_THEME.colors.accent.primary]} />
          }
        >
          <View style={styles.bookingsHeader}>
            <View style={styles.headerContent}>
              <View style={styles.headerIconContainer}>
                <Icon name="calendar" size={20} color="primary" />
              </View>
              <View>
                <ThemedText style={styles.headerTitle}>My Bookings</ThemedText>
                <ThemedText style={styles.headerSubtitle}>{myBookings.length} total sessions</ThemedText>
              </View>
            </View>
          </View>

          {myBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Icon name="calendar" size={56} color="primary" />
              </View>
              <ThemedText style={styles.emptyText}>No bookings yet</ThemedText>
              <ThemedText style={styles.emptySubtext}>Browse teachers and book your first session</ThemedText>
              <TouchableOpacity
                style={styles.browseBtn}
                onPress={() => setActiveTab('home')}
              >
                <ThemedText style={styles.browseBtnText}>Browse Teachers</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Pending Payment Bookings */}
              {pendingBookings.length > 0 && (
                <>
                  <View style={styles.bookingSectionHeader}>
                    <View style={styles.sectionBadge}>
                      <Icon name="clock" size={16} color="error" />
                      <ThemedText style={styles.sectionBadgeText}>Payment Pending</ThemedText>
                    </View>
                    <ThemedText style={styles.sectionCount}>{pendingBookings.length}</ThemedText>
                  </View>
                  {pendingBookings.map(booking => (
                    <TouchableOpacity
                      key={booking.id}
                      style={[styles.bookingCard, styles.pendingCard]}
                      activeOpacity={0.7}
                      onPress={() => {
                        // Navigate to checkout to complete payment
                        const teacher = teachers.find(t => t.id === booking.teacher_id);
                        if (teacher) {
                          navigation.navigate('StudentCheckout', {
                            booking: booking,
                            teacher: teacher,
                            slot: null, // No slot for pending bookings
                          });
                        }
                      }}
                    >
                      <View style={styles.bookingCardLeft}>
                        <View style={styles.bookingTeacherIcon}>
                          <Icon name="user" size={24} color="error" />
                        </View>
                        <View style={styles.bookingInfo}>
                          <ThemedText style={styles.bookingTeacher}>{booking.teacher_profile?.full_name || 'Teacher'}</ThemedText>
                          <ThemedText style={styles.bookingSubject}>{booking.subject}</ThemedText>
                          <View style={styles.bookingMeta}>
                            <Icon name="calendar" size={12} color="muted" style={{ marginRight: 4 }} />
                            <ThemedText style={styles.bookingDate}>{new Date(booking.booked_date).toLocaleDateString()}</ThemedText>
                            <Icon name="clock" size={12} color="muted" style={{ marginLeft: 12, marginRight: 4 }} />
                            <ThemedText style={styles.bookingDate}>{new Date(booking.booked_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</ThemedText>
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: UNIFIED_THEME.colors.accent.error }]}>
                            <ThemedText style={{ color: UNIFIED_THEME.colors.accent.error, fontSize: 12, fontWeight: '600' }}>💳 Payment Pending - Tap to Pay</ThemedText>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {/* Confirmed Bookings */}
              {confirmedBookings.length > 0 && (
                <>
                  <View style={styles.bookingSectionHeader}>
                    <View style={styles.sectionBadge}>
                      <Icon name="check-circle" size={16} color="success" />
                      <ThemedText style={styles.sectionBadgeText}>Confirmed</ThemedText>
                    </View>
                    <ThemedText style={styles.sectionCount}>{confirmedBookings.length}</ThemedText>
                  </View>
                  {confirmedBookings.map(booking => {
                    const CardWrapper = booking.meeting_id ? TouchableOpacity : View;
                    const cardProps = booking.meeting_id ? { activeOpacity: 0.8, onPress: () => handleJoinMeeting(booking) } : {};
                    return (
                      <CardWrapper key={booking.id} style={[styles.bookingCard, styles.confirmedCard]} {...cardProps}>
                        <View style={styles.bookingCardLeft}>
                          <View style={styles.bookingTeacherIcon}>
                            <Icon name="user" size={24} color="success" />
                          </View>
                          <View style={styles.bookingInfo}>
                            <ThemedText style={styles.bookingTeacher}>{booking.teacher_profile?.full_name || 'Teacher'}</ThemedText>
                            <ThemedText style={styles.bookingSubject}>{booking.subject}</ThemedText>
                            <View style={styles.bookingMeta}>
                              <Icon name="calendar" size={12} color="muted" style={{ marginRight: 4 }} />
                              <ThemedText style={styles.bookingDate}>{new Date(booking.booked_date).toLocaleDateString()}</ThemedText>
                              <Icon name="clock" size={12} color="muted" style={{ marginLeft: 12, marginRight: 4 }} />
                              <ThemedText style={styles.bookingDate}>{new Date(booking.booked_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</ThemedText>
                            </View>
                            {booking.meeting_id && (
                              <TouchableOpacity
                                style={styles.meetingIdContainer}
                                onPress={(e) => { e?.stopPropagation?.(); copyMeetingIdToClipboard(booking.meeting_id); }}
                              >
                                <Icon name="video" size={12} color="primary" style={{ marginRight: 6 }} />
                                <ThemedText style={styles.meetingIdLabel}>Meeting ID: {booking.meeting_id}</ThemedText>
                                <ThemedText style={styles.meetingIdCopy}>Copy</ThemedText>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                        {booking.meeting_id ? (
                          <View style={styles.joinBtn}>
                            <Icon name="video" size={16} color="primary" />
                            <ThemedText style={styles.joinBtnText}>Join</ThemedText>
                          </View>
                        ) : (
                          <View style={styles.waitingBadge}>
                            <ThemedText style={styles.waitingText}>Booked</ThemedText>
                          </View>
                        )}
                      </CardWrapper>
                    );
                  })}
                </>
              )}

              {/* Completed Bookings */}
              {completedBookings.length > 0 && (
                <>
                  <View style={styles.bookingSectionHeader}>
                    <View style={styles.sectionBadge}>
                      <Icon name="check-circle" size={16} color="muted" />
                      <ThemedText style={styles.sectionBadgeText}>Completed</ThemedText>
                    </View>
                    <ThemedText style={styles.sectionCount}>{completedBookings.length}</ThemedText>
                  </View>
                  {completedBookings.map(booking => (
                    <View key={booking.id} style={[styles.bookingCard, styles.completedCard]}>
                      <View style={styles.bookingCardLeft}>
                        <View style={styles.bookingTeacherIcon}>
                          <Icon name="check-circle" size={24} color="muted" />
                        </View>
                        <View style={styles.bookingInfo}>
                          <ThemedText style={styles.bookingTeacher}>{booking.teacher_profile?.full_name || 'Teacher'}</ThemedText>
                          <ThemedText style={styles.bookingSubject}>Topics:{booking.subject}</ThemedText>
                          <View style={styles.bookingMeta}>
                            <Icon name="calendar" size={12} color="muted" style={{ marginRight: 4 }} />
                            <ThemedText style={styles.bookingDate}>{new Date(booking.booked_date).toLocaleDateString()}</ThemedText>
                          </View>
                        </View>
                      </View>
                      <View style={styles.completedBadge}>
                        <Icon name="check-circle" size={20} color="muted" />
                      </View>
                    </View>
                  ))}
                </>
              )}
            </>
          )}
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('home')}
          >
            <Icon name="home" size={22} color={activeTab === 'home' ? 'primary' : 'muted'} />
            <ThemedText style={styles.navLabel}>Home</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navItem, styles.navItemActive]}
            onPress={() => setActiveTab('bookings')}
          >
            <Icon name="calendar" size={22} color={activeTab === 'bookings' ? 'primary' : 'muted'} />
            <ThemedText style={styles.navLabel}>Bookings</ThemedText>
          </TouchableOpacity>
          {/* Lectures tab hidden for students
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('lectures')}
          >
            <Icon name="book" size={22} color={activeTab === 'lectures' ? 'primary' : 'muted'} />
            <ThemedText style={styles.navLabel}>Lectures</ThemedText>
          </TouchableOpacity>
          */}
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('profile')}
          >
            <Icon name="user" size={22} color={activeTab === 'profile' ? 'primary' : 'muted'} />
            <ThemedText style={styles.navLabel}>Profile</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // PROFILE TAB
  if (activeTab === 'profile') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={{ paddingBottom: UNIFIED_THEME.spacing.xl }}>
          <View style={styles.header}>
            <View style={styles.welcomeContainer}>
              <View style={styles.headerContent}>
                <View style={styles.headerIconContainer}>
                  <Icon name="user" size={20} color="primary" />
                </View>
                <ThemedText style={styles.welcometab}>My Profile</ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.profileImageContainer}>
              <Icon name="user" size={56} color="primary" />
            </View>
            <ThemedText style={styles.profileName}>{studentName}</ThemedText>
            <ThemedText style={styles.profileEmail}>Student ID: {studentId?.substring(0, 8)}...</ThemedText>
          </View>

          {/* Favorite Teachers */}
          {favoriteTeachers.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>My Favorite Teachers</ThemedText>
                <Icon name="heart" size={18} color="error" />
              </View>
              {favoriteTeachers.map(teacher => (
                <View key={teacher.id} style={styles.favTeacherCard}>
                  <View style={styles.favTeacherImageContainer}>
                    <View style={styles.favTeacherAvatarWrapper}>
                      <Icon name="user" size={40} color="primary" />
                      <View style={[styles.favTeacherStatusDot, { backgroundColor: teacherStatusColor(teacher.availability_status) }]} />
                    </View>
                  </View>
                  <View style={styles.favTeacherInfo}>
                    <ThemedText style={styles.favTeacherName}>{teacher.profile?.full_name || 'Teacher'}</ThemedText>
                    <ThemedText style={styles.favTeacherCategory}>
                      {typeof teacher.specializations === 'string'
                        ? teacher.specializations.split(',')[0].trim()
                        : 'Subject'}
                    </ThemedText>
                    <ThemedText style={styles.favTeacherPrice}>₹{teacher.price_per_call || 500}/call</ThemedText>
                  </View>
                  <View style={styles.favTeacherActions}>
                    <TouchableOpacity
                      onPress={() => {
                        studentBooking.openBookingModal(teacher);
                      }}
                    >
                      <Icon name="calendar" size={20} color="primary" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => toggleFavorite(teacher)} style={{ marginLeft: 12 }}>
                      <Icon name="heart" size={20} color="error" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Settings Options */}
          <View style={styles.settingsSection}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate(SCREEN_NAMES.EditStudentProfile)}
            >
              <View style={styles.settingIconContainer}>
                <Icon name="user" size={18} color="primary" />
              </View>
              <ThemedText style={styles.settingText}>Edit Profile</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate(SCREEN_NAMES.Notifications)}>
              <View style={styles.settingIconContainer}>
                <Icon name="clock" size={18} color="primary" />
              </View>
              <ThemedText style={styles.settingText}>Notifications</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={async () => {
                try {
                  const { data: { user } } = await supabase.auth.getUser();
                  const email = user?.email;
                  if (!email) {
                    Alert.alert('Error', 'Could not get your email.');
                    return;
                  }
                  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
                  if (error) {
                    if (error.message?.toLowerCase().includes('rate limit')) {
                      Toast.show('Too many requests. Try again in a few minutes.');
                    } else {
                      Toast.show('Could not send reset email. Try again.');
                    }
                    return;
                  }
                  Alert.alert('Check your email', `A password reset link has been sent to ${email}. Open the link to set a new password.`);
                } catch (e) {
                  Toast.show('Something went wrong. Try again.');
                }
              }}
            >
              <View style={styles.settingIconContainer}>
                <ThemedText style={{ fontSize: 16 }}>🔒</ThemedText>
              </View>
              <ThemedText style={styles.settingText}>Reset Password</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Payment History')}>
              <View style={styles.settingIconContainer}>
                <Icon name="user" size={18} color="primary" />
              </View>
              <ThemedText style={styles.settingText}>Payment History</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Privacy & Security')}>
              <View style={styles.settingIconContainer}>
                <Icon name="user" size={18} color="primary" />
              </View>
              <ThemedText style={styles.settingText}>Privacy & Security</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Help & Support')}>
              <View style={styles.settingIconContainer}>
                <Icon name="phone" size={18} color="primary" />
              </View>
              <ThemedText style={styles.settingText}>Help & Support</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, styles.logoutItem]}
              onPress={() =>
                Alert.alert(
                  'Logout',
                  'Are you sure you want to log out?',
                  [
                    { text: 'No', style: 'cancel', onPress: () => { } },
                    { text: 'Yes', onPress: async () => { await supabase.auth.signOut(); } },
                  ]
                )
              }
            >
              <View style={styles.settingIconContainer}>
                <Icon name="user" size={18} color="error" />
              </View>
              <ThemedText style={styles.settingText}>Logout</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('home')}
          >
            <Icon name="home" size={22} color={activeTab === 'home' ? 'primary' : 'muted'} />
            <ThemedText style={styles.navLabel}>Home</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('bookings')}
          >
            <Icon name="calendar" size={22} color={activeTab === 'bookings' ? 'primary' : 'muted'} />
            <ThemedText style={styles.navLabel}>Bookings</ThemedText>
          </TouchableOpacity>
          {/* Lectures tab hidden for students
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('lectures')}
          >
            <Icon name="book" size={22} color={activeTab === 'lectures' ? 'primary' : 'muted'} />
            <ThemedText style={styles.navLabel}>Lectures</ThemedText>
          </TouchableOpacity>
          */}
          <TouchableOpacity
            style={[styles.navItem, styles.navItemActive]}
            onPress={() => setActiveTab('profile')}
          >
            <Icon name="user" size={22} color={activeTab === 'profile' ? 'primary' : 'muted'} />
            <ThemedText style={styles.navLabel}>Profile</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: UNIFIED_THEME.spacing.xl,
    paddingVertical: UNIFIED_THEME.spacing.xl,
    marginBottom: UNIFIED_THEME.spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  notificationBellWrap: {
    alignSelf: 'flex-start',
  },
  notificationBell: {
    width: 44,
    height: 44,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBellIcon: {
    fontSize: 22,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    backgroundColor: UNIFIED_THEME.colors.accent.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: UNIFIED_THEME.spacing.xs,
  },
  notificationBadgeText: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 10,
    fontWeight: '700',
  },

  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.sm,
  },

  welcome: {
    color: UNIFIED_THEME.colors.text.secondary,
    fontSize: 14,
  },

  welcometab: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },

  studentName: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },

  searchContainer: {
    paddingHorizontal: UNIFIED_THEME.spacing.xl,
    paddingVertical: UNIFIED_THEME.spacing.md,
    marginBottom: UNIFIED_THEME.spacing.lg,
    position: 'relative',
  },

  searchInput: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 14,
    paddingVertical: UNIFIED_THEME.spacing.md,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    paddingRight: 45,
  },

  searchIcon: {
    position: 'absolute',
    right: 32,
    top: 20,
  },

  categoryScroll: {
    paddingHorizontal: UNIFIED_THEME.spacing.xl,
    marginBottom: UNIFIED_THEME.spacing.xl,
    maxHeight: 45,
    marginLeft: -UNIFIED_THEME.spacing.xl,
  },

  categoryBtn: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    marginRight: UNIFIED_THEME.spacing.md,
    minWidth: 70,
    alignItems: 'center',
  },

  categoryBtnActive: {
    backgroundColor: UNIFIED_THEME.colors.info,
  },

  categoryText: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 13,
    fontWeight: '500',
  },

  categoryTextActive: {
    color: UNIFIED_THEME.colors.text.primary,
  },

  sectionHeader: {
    paddingHorizontal: UNIFIED_THEME.spacing.xl,
    marginVertical: 15,
  },

  sectionTitle: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },

  teacherGrid: {
    paddingHorizontal: UNIFIED_THEME.spacing.xl,
    marginBottom: UNIFIED_THEME.spacing.md0,
  },

  gridItem: {
    marginBottom: UNIFIED_THEME.spacing.lg,
  },

  professionSection: {
    marginBottom: 28,
  },

  professionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: UNIFIED_THEME.spacing.xl,
    marginBottom: UNIFIED_THEME.spacing.md,
  },

  professionTitle: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },

  professionCount: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 14,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
    paddingHorizontal: UNIFIED_THEME.spacing.sm,
    paddingVertical: 4,
    borderRadius: UNIFIED_THEME.borderRadius.md,
  },

  professionTeachersList: {
    paddingHorizontal: UNIFIED_THEME.spacing.xl,
    gap: 12,
  },

  horizontalTeacherCard: {
    width: 280,
    marginRight: 0,
  },

  // teacherCard: {
  //   backgroundColor: '#1C1F4A',
  //   borderRadius: UNIFIED_THEME.borderRadius.md,
  //   padding: 15,
  //   flexDirection: 'row',
  //   alignItems: 'center',
  // },

  teacherCard: {
  backgroundColor: UNIFIED_THEME.colors.component.card,
  borderColor: UNIFIED_THEME.colors.border.default,
  borderWidth: 1,
  borderRadius: UNIFIED_THEME.borderRadius.lg,  // softer corners
  padding: 16,
  flexDirection: 'row',
  alignItems: 'center',
  shadowColor: UNIFIED_THEME.shadows.medium.shadowColor,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 6,
  elevation: 3,
},


  teacherCardContent: {
    flex: 1,
    marginLeft: 12,
  },

  teacherAvatarWrapper: {
    position: 'relative',
    alignSelf: 'flex-start',
  },

  teacherStatusDot: {
    position: 'absolute',
    bottom: 4,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    borderWidth: 2,
    borderColor: UNIFIED_THEME.colors.border.default,
  },

  teacherModalAvatarWrapper: {
    position: 'relative',
    // flexDirection: 'row',
    alignSelf: 'center',
  },

  teacherStatusDotModal: {
    position: 'absolute',
    bottom: 8,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    borderWidth: 2,
    borderColor: UNIFIED_THEME.colors.primary.light,
  },

  teacherStatusLabel: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 12,
    marginBottom: UNIFIED_THEME.spacing.sm,
    textAlign: 'center',
  },

  favTeacherAvatarWrapper: {
    position: 'relative',
  },

  favTeacherStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    borderWidth: 2,
    borderColor: UNIFIED_THEME.colors.border.default,
  },

  favTeacherActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  teacherName: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },

  teacherCategory: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 12,
    marginBottom: 4,
  },

  teacherStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  stat: {
    color: UNIFIED_THEME.colors.info,
    fontSize: 12,
    fontWeight: '600',
    marginRight: UNIFIED_THEME.spacing.md,
  },

  statSeparator: {
    color: UNIFIED_THEME.colors.text.muted,
    marginRight: UNIFIED_THEME.spacing.md,
  },

  favoriteBtn: {
    fontSize: 20,
    paddingLeft: 10,
  },

  emptyState: {
    paddingHorizontal: UNIFIED_THEME.spacing.xl,
    paddingVertical: 40,
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: UNIFIED_THEME.spacing.md,
  },

  emptyText: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },

  emptySubtext: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 13,
  },

  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: UNIFIED_THEME.colors.primary.light,
    borderTopColor: 'rgba(255, 0, 110, 0.2)',
    borderTopWidth: 1,
    justifyContent: 'space-around',
    paddingVertical: 5,
    paddingBottom: 2,
  },

  navItem: {
    alignItems: 'center',
    paddingVertical: UNIFIED_THEME.spacing.sm,
    flex: 1,
    justifyContent: 'center',
  },

  navItemActive: {
    opacity: 1,
  },

  navLabel: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },

  card: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
    padding: 18,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    marginBottom: UNIFIED_THEME.spacing.lg,
    marginHorizontal: 20,
  },

  primaryCard: {
    backgroundColor: UNIFIED_THEME.colors.info,
  },

  logoutCard: {
    backgroundColor: UNIFIED_THEME.colors.accent.error,
  },

  cardText: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },

  profileCard: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: UNIFIED_THEME.spacing.xl,
  },

  profileImageContainer: {
    width: 70,
    height: 70,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.md,
  },

  profileImage: {
    fontSize: 48,
    marginBottom: UNIFIED_THEME.spacing.md,
  },

  profileName: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  profileEmail: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 13,
  },

  favTeacherCard: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: UNIFIED_THEME.spacing.md,
  },

  favTeacherImageContainer: {
    width: 48,
    height: 48,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: UNIFIED_THEME.spacing.md,
  },

  favTeacherImage: {
    fontSize: 32,
    marginRight: UNIFIED_THEME.spacing.md,
  },

  favTeacherInfo: {
    flex: 1,
  },

  favTeacherName: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },

  favTeacherCategory: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 11,
    marginBottom: 4,
  },

  favTeacherPrice: {
    color: UNIFIED_THEME.colors.info,
    fontSize: 12,
    fontWeight: '600',
  },

  removeFavBtn: {
    fontSize: 18,
    paddingLeft: 8,
  },

  settingsSection: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: UNIFIED_THEME.spacing.md0,
  },

  settingItem: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.md,
  },

  settingIconContainer: {
    width: 36,
    height: 36,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: UNIFIED_THEME.spacing.md,
  },

  settingIcon: {
    fontSize: 20,
    marginRight: UNIFIED_THEME.spacing.md,
  },

  settingText: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 15,
    fontWeight: '500',
  },

  logoutItem: {
    backgroundColor: UNIFIED_THEME.colors.accent.error,
    marginTop: 10,
  },

  // TEACHER CARD STYLES
  teacherImage: {
    fontSize: 32,
    marginBottom: UNIFIED_THEME.spacing.sm,
  },

  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: UNIFIED_THEME.colors.border.default,
  },

  rating: {
    color: UNIFIED_THEME.colors.accent.primary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: UNIFIED_THEME.spacing.xs,
  },

  followers: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 12,
    marginLeft: 2,
  },

  favoriteBtnText: {
    fontSize: 18,
  },

  // BOOKING MODAL STYLES
  modalTitle: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },

  // backButton: {
  //   color: UNIFIED_THEME.colors.info,
  //   fontSize: 16,
  //   fontWeight: '600',
  // },

  teacherInfoCard: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
    marginHorizontal: 20,
    marginVertical: 15,
    padding: 15,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    alignItems: 'center',
  },

  teacherAvatar: {
    fontSize: 40,
    marginBottom: UNIFIED_THEME.spacing.md,
  },

  teacherSpec: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 13,
    marginBottom: UNIFIED_THEME.spacing.md,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  priceLabel: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 12,
  },

  priceValue: {
    color: UNIFIED_THEME.colors.accent.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },

  fieldSection: {
    marginHorizontal: 20,
    marginVertical: 12,
  },

  label: {
    color: UNIFIED_THEME.colors.text.secondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: UNIFIED_THEME.spacing.md,
  },

  dateInput: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
    paddingVertical: UNIFIED_THEME.spacing.md,
    paddingHorizontal: 15,
    borderRadius: UNIFIED_THEME.borderRadius.md,
  },

  dateText: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 14,
  },

  timeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  timeBtn: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingVertical: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    flex: 0.31,
  },

  timeBtnActive: {
    backgroundColor: UNIFIED_THEME.colors.info,
  },

  timeBtnText: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  timeBtnTextActive: {
    color: UNIFIED_THEME.colors.text.primary,
  },

  subjectInput: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
    color: UNIFIED_THEME.colors.text.primary,
    paddingVertical: UNIFIED_THEME.spacing.md,
    paddingHorizontal: 15,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    fontSize: 14,
  },

  // Slot Selection Styles
  slotsList: {
    marginVertical: 10,
  },

  slotCard: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    padding: 15,
    marginBottom: UNIFIED_THEME.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  // slotCardSelected: {
  //   borderColor: UNIFIED_THEME.colors.info,
  //   backgroundColor: '#252965',
  // },

  slotCardSelected: {
  borderColor: UNIFIED_THEME.colors.accent.primary,
  backgroundColor: UNIFIED_THEME.colors.border.light,
  transform: [{ scale: 1.02 }],
},


  slotCardBooked: {
    backgroundColor: UNIFIED_THEME.colors.component.disabled,
    borderColor: UNIFIED_THEME.colors.border.strong,
    opacity: 0.7,
  },

  slotContent: {
    flex: 1,
  },

  slotDateTime: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },

  slotDateTimeBooked: {
    color: UNIFIED_THEME.colors.text.muted,
  },

  slotDuration: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 12,
  },

  slotDurationBooked: {
    color: UNIFIED_THEME.colors.text.muted,
  },

  slotBookedBadge: {
    color: UNIFIED_THEME.colors.accent.error,
    fontSize: 12,
    fontWeight: '600',
  },

  slotCheckmark: {
    color: UNIFIED_THEME.colors.info,
    fontSize: 20,
    fontWeight: 'bold',
  },

  noSlotsContainer: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    padding: 30,
    alignItems: 'center',
    marginVertical: 10,
  },

  noSlotsText: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: UNIFIED_THEME.spacing.sm,
  },

  noSlotsSubtext: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 13,
  },

  loadingText: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 12,
    marginTop: 10,
  },

  summaryCard: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
    marginHorizontal: 20,
    marginVertical: 15,
    padding: 15,
    borderRadius: UNIFIED_THEME.borderRadius.md,
  },

  summaryTitle: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: UNIFIED_THEME.spacing.md,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: UNIFIED_THEME.spacing.sm,
    borderBottomColor: UNIFIED_THEME.colors.primary.light,
    borderBottomWidth: 1,
  },

  summaryRowTotal: {
    borderBottomWidth: 0,
    paddingTop: 12,
    paddingBottom: 0,
  },

  summaryLabel: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 12,
  },

  summaryValue: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },

  summaryValueTotal: {
    color: UNIFIED_THEME.colors.accent.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },

  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: UNIFIED_THEME.spacing.xl,
    paddingVertical: 15,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
  },

  cancelBtn: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
    paddingVertical: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.md,
  },

  cancelBtnText: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // confirmBtn: {
  //   flex: 1,
  //   backgroundColor: UNIFIED_THEME.colors.info,
  //   paddingVertical: UNIFIED_THEME.spacing.md,
  //   borderRadius: UNIFIED_THEME.borderRadius.md,
  // },

confirmBtn: {
  flex: 1,
  backgroundColor: 'transparent',   // Use LinearGradient wrapper for gradient
  paddingVertical: 14,
  borderRadius: UNIFIED_THEME.borderRadius.md,
  alignItems: 'center',
  elevation: 5,                 // Android shadow
  shadowColor: 'rgba(255, 0, 110, 0.6)',        // iOS shadow
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 15,
},


  confirmBtnDisabled: {
    opacity: 0.6,
  },

  confirmBtnText: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // BOOKINGS PAGE STYLES
  bookingsHeader: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
    paddingHorizontal: UNIFIED_THEME.spacing.xl,
    paddingVertical: UNIFIED_THEME.spacing.xl,
    marginBottom: UNIFIED_THEME.spacing.xl,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerIconContainer: {
    width: 30,
    height: 30,
    backgroundColor: 'rgba(255, 0, 110, 0.2)',
    borderColor: UNIFIED_THEME.colors.border.strong,
    borderWidth: 1,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  headerTitle: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },

  headerSubtitle: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 12,
    marginTop: 2,
  },

  bookingSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: UNIFIED_THEME.spacing.xl,
    marginTop: 24,
    marginBottom: UNIFIED_THEME.spacing.md,
  },

  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingVertical: 6,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
  },

  sectionBadgeText: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },

  sectionCount: {
    color: UNIFIED_THEME.colors.accent.primary,
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 0, 110, 0.1)',
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingVertical: 4,
    borderRadius: UNIFIED_THEME.borderRadius.md,
  },

  // BOOKING CARD STYLES
  bookingCard: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 14,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: UNIFIED_THEME.colors.accent.primary,
  },

  pendingCard: {
    borderLeftColor: UNIFIED_THEME.colors.accent.error,
    backgroundColor: UNIFIED_THEME.colors.component.card,
  },

  confirmedCard: {
    borderLeftColor: UNIFIED_THEME.colors.accent.success,
    backgroundColor: UNIFIED_THEME.colors.component.card,
  },

  completedCard: {
    borderLeftColor: UNIFIED_THEME.colors.border.default,
    backgroundColor: UNIFIED_THEME.colors.component.card,
  },

  bookingCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  bookingTeacherIcon: {
    width: 44,
    height: 44,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: UNIFIED_THEME.spacing.md,
    marginTop: 2,
  },

  bookingInfo: {
    flex: 1,
  },

  bookingLeft: {
    flex: 1,
  },

  bookingTeacher: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },

  bookingSubject: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 13,
    marginBottom: 6,
  },

  bookingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.sm,
  },

  bookingDate: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 11,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UNIFIED_THEME.colors.component.card,
    paddingHorizontal: UNIFIED_THEME.spacing.sm,
    paddingVertical: 4,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    alignSelf: 'flex-start',
  },

  statusText: {
    color: UNIFIED_THEME.colors.status.pending,
    fontSize: 11,
    fontWeight: '500',
  },

  // meetingIdContainer: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   backgroundColor: UNIFIED_THEME.colors.component.card,
  //   paddingHorizontal: UNIFIED_THEME.spacing.md,
  //   paddingVertical: 6,
  //   borderRadius: UNIFIED_THEME.borderRadius.sm,
  //   marginTop: 6,
  // },

  // meetingIdLabel: {
  //   color: UNIFIED_THEME.colors.info,
  //   fontSize: 11,
  //   fontWeight: '600',
  //   flex: 1,
  // },

  meetingIdCopy: {
    color: UNIFIED_THEME.colors.info,
    fontSize: 10,
    marginLeft: 8,
  },

  joinBtn: {
    backgroundColor: UNIFIED_THEME.colors.accent.success,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingVertical: UNIFIED_THEME.spacing.sm,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 56,
    flexDirection: 'row',
    gap: 2,
  },

  joinBtnText: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },

  waitingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UNIFIED_THEME.colors.component.card,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingVertical: UNIFIED_THEME.spacing.sm,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
  },

  waitingText: {
    color: UNIFIED_THEME.colors.status.pending,
    fontSize: 12,
    fontWeight: '500',
  },

  completedBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 4,
  },

  emptyIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: UNIFIED_THEME.spacing.lg,
  },

  browseBtn: {
    backgroundColor: 'transparent',   // Use LinearGradient wrapper for gradient
    paddingHorizontal: 24,
    paddingVertical: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    marginTop: 16,
    alignSelf: 'center',
  },

  browseBtnText: {
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '600',
    fontSize: 14,
  },

  // joinBtn: {
  //   backgroundColor: UNIFIED_THEME.colors.accent.success,
  //   paddingHorizontal: UNIFIED_THEME.spacing.md,
  //   paddingVertical: UNIFIED_THEME.spacing.sm,
  //   borderRadius: UNIFIED_THEME.borderRadius.sm,
  // },

  joinBtnText: {
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '600',
    fontSize: 12,
  },

  meetingIdContainer: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    // borderLeftWidth: 3,
    borderLeftColor: UNIFIED_THEME.colors.accent.success,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingVertical: UNIFIED_THEME.spacing.sm,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    marginTop: 8,
    marginLeft: -UNIFIED_THEME.spacing.md,
  },

  meetingIdLabel: {
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '400',
    fontSize: 12,
    fontFamily: 'Arial',
  },

  meetingIdCopy: {
    color: UNIFIED_THEME.colors.text.secondary,
    fontSize: 9,
    marginTop: 4,
    fontStyle: 'italic',
  },

  waitingBadge: {
    backgroundColor: UNIFIED_THEME.colors.accent.secondary92,
    color: UNIFIED_THEME.colors.text.primary,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingVertical: 4,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    fontSize: 11,
    fontWeight: '600',
  },

  pendingBadge: {
    backgroundColor: UNIFIED_THEME.colors.status.pending,
    color: UNIFIED_THEME.colors.text.primary,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingVertical: 4,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    fontSize: 11,
    fontWeight: '600',
  },

  completedBadge: {
    backgroundColor: UNIFIED_THEME.colors.info,
    color: UNIFIED_THEME.colors.text.primary,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingVertical: 4,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    fontSize: 11,
    fontWeight: '600',
  },

  // LECTURE STYLES
  lecturesList: {
    paddingHorizontal: UNIFIED_THEME.spacing.xl,
    marginBottom: UNIFIED_THEME.spacing.md0,
  },

  lectureCard: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    padding: 15,
    marginBottom: UNIFIED_THEME.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: UNIFIED_THEME.colors.info,
  },

  lectureHeader: {
    marginBottom: UNIFIED_THEME.spacing.md,
  },

  lectureSubject: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  lectureTeacher: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 12,
  },

  lectureDescription: {
    color: UNIFIED_THEME.colors.text.secondary,
    fontSize: 13,
    marginBottom: UNIFIED_THEME.spacing.md,
    lineHeight: 18,
  },

  lectureDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: UNIFIED_THEME.spacing.md,
  },

  lectureDetail: {
    color: UNIFIED_THEME.colors.info,
    fontSize: 12,
    fontWeight: '500',
  },

  enrollBtn: {
    backgroundColor: UNIFIED_THEME.colors.info,
    paddingVertical: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    alignItems: 'center',
  },

  enrollBtnText: {
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },

  enrolledLectureCard: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: UNIFIED_THEME.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: UNIFIED_THEME.colors.accent.success,
  },

  enrolledActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },

  joinLectureBtn: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.info,
    paddingVertical: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    alignItems: 'center',
  },

  joinLectureBtnText: {
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '600',
    fontSize: 12,
  },

  removeBtn: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.accent.error,
    paddingVertical: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    alignItems: 'center',
  },

  removeBtnText: {
    color: UNIFIED_THEME.colors.text.primary,
    fontWeight: '600',
    fontSize: 12,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: UNIFIED_THEME.colors.text.secondary,
    marginTop: 10,
  },

  snackbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: UNIFIED_THEME.colors.status.pending,
    paddingVertical: UNIFIED_THEME.spacing.md,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    gap: 12,
  },
  snackbarText: {
    flex: 1,
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 13,
  },
  snackbarBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: UNIFIED_THEME.spacing.sm,
    paddingHorizontal: 14,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
  },
  snackbarBtnText: { color: UNIFIED_THEME.colors.text.primary, fontSize: 13, fontWeight: '600', },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: UNIFIED_THEME.spacing.md,
  },

   headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: UNIFIED_THEME.spacing.xl,
    paddingVertical: UNIFIED_THEME.spacing.xl,
    // marginBottom: UNIFIED_THEME.spacing.md,
  },
});

