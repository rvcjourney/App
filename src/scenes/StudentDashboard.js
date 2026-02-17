import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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
import { getAllTeachers, createBooking, getStudentBookings, getTeacherSlotsByDateRange, bookAvailabilitySlot, isProfileComplete } from '../database/database';
import Home from '../assets/icons/Home';
import Calendar from '../assets/icons/Calendar';
import BookOpen from '../assets/icons/BookOpen';
import User from '../assets/icons/User';
import Heart from '../assets/icons/Heart';
import HeartFilled from '../assets/icons/HeartFilled';
import HeartOutline from '../assets/icons/HeartOutline';
import Star from '../assets/icons/Star';
import Video from '../assets/icons/Video';
import Clock from '../assets/icons/Clock';
import ChevronRight from '../assets/icons/ChevronRight';
import Phone from '../assets/icons/Phone';
import Users from '../assets/icons/Users';
import CheckCircle from '../assets/icons/CheckCircle';
import SearchIcon from '../assets/icons/SearchIcon';

const categories = ['All', 'Math', 'Physics', 'Chemistry', 'English', 'Science'];

export default function StudentDashboard({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favoriteTeachers, setFavoriteTeachers] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState(null);
  const [studentName, setStudentName] = useState('Student');
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  // Booking state
  const [myBookings, setMyBookings] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingSubject, setBookingSubject] = useState('');
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch user info and teachers on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('🔵 [StudentDashboard] Initializing...');

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setStudentId(user.id);

          // Get student profile (limit(1) to avoid single-object coercion errors)
          const { data: profileRows } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .limit(1);
          const profile = Array.isArray(profileRows) && profileRows.length > 0 ? profileRows[0] : profileRows;

          if (profile?.full_name) {
            setStudentName(profile.full_name);
          }
          try {
            const complete = await isProfileComplete('student', user.id);
            setProfileIncomplete(!complete);
          } catch (e) {
            setProfileIncomplete(true);
          }
        }

        // Fetch all teachers from database (don't block dashboard if this fails, e.g. RLS)
        console.log('🔵 [StudentDashboard] Fetching teachers from database...');
        try {
          const teachersData = await getAllTeachers();
          setTeachers(teachersData || []);
          console.log('✅ [StudentDashboard] Teachers loaded:', teachersData?.length);
        } catch (teacherErr) {
          console.error('🔴 [StudentDashboard] Error fetching teachers:', teacherErr);
          setTeachers([]);
          Toast.show(teacherErr?.message || 'Could not load teachers. Try again.');
        }

      } catch (error) {
        console.error('🔴 [StudentDashboard] Error initializing:', error);
        Toast.show(error?.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Refresh bookings – used by pull-to-refresh
  const onRefreshBookings = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const bookingsData = await getStudentBookings(user.id);
      setMyBookings(bookingsData || []);
    } catch (e) {
      console.error('🔴 Error refreshing bookings:', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Refresh home tab - reload teachers and profile
  const onRefreshHome = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Refresh profile
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .limit(1);
        const profile = Array.isArray(profileRows) && profileRows.length > 0 ? profileRows[0] : profileRows;
        if (profile?.full_name) {
          setStudentName(profile.full_name);
        }

        // Refresh teachers list
        const teachersData = await getAllTeachers();
        setTeachers(teachersData || []);
        console.log('✅ Home tab refreshed:', teachersData?.length, 'teachers');
      }
    } catch (e) {
      console.error('🔴 Error refreshing home tab:', e);
      Toast.show('Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Real-time: bookings (INSERT + UPDATE) so new bookings and teacher-go-live show quickly
  useEffect(() => {
    let bookingsChannel;
    let notificationsChannel;

    const setupSubscriptions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        console.log('🔵 Setting up real-time subscriptions for student...');

        const refreshBookingsForUser = () => {
          getStudentBookings(user.id).then(updatedBookings => {
            setMyBookings(updatedBookings || []);
            console.log('📝 Bookings updated in real-time');
          });
        };

        bookingsChannel = supabase
          .channel(`bookings:student_${user.id}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'bookings', filter: `student_id=eq.${user.id}` },
            () => {
              console.log('📡 New booking (INSERT)');
              Toast.show('📅 Your booking was confirmed.');
              refreshBookingsForUser();
            }
          )
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `student_id=eq.${user.id}` },
            (payload) => {
              console.log('📡 Real-time update received:', payload);
              if (payload.new) {
                if (payload.new.meeting_id && !payload.old?.meeting_id) {
                  Toast.show('📞 Class is starting! You can now join!');
                }
                refreshBookingsForUser();
              }
            }
          )
          .subscribe((status) => console.log('📡 Bookings channel:', status));

        notificationsChannel = supabase
          .channel(`notifications:student_${user.id}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
            (payload) => {
              const n = payload?.new;
              if (n?.title || n?.message) Toast.show(n.title ? `${n.title}\n${n.message || ''}` : n.message);
            }
          )
          .subscribe((status) => console.log('📡 Notifications channel:', status));

        console.log('✅ Real-time subscriptions started');
      } catch (error) {
        console.error('🔴 Error setting up subscriptions:', error);
      }
    };

    setupSubscriptions();
    return () => {
      if (bookingsChannel) supabase.removeChannel(bookingsChannel);
      if (notificationsChannel) supabase.removeChannel(notificationsChannel);
    };
  }, [studentId]);

  // Refresh profile data when screen comes into focus (after edit)
  useFocusEffect(
    React.useCallback(() => {
      const refreshProfile = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profileRows } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', user.id)
              .limit(1);
            const profile = Array.isArray(profileRows) && profileRows.length > 0 ? profileRows[0] : profileRows;

            if (profile?.full_name) {
              setStudentName(profile.full_name);
            }

            // Also refresh bookings when returning to dashboard
            console.log('🔵 Refreshing bookings...');
            const bookingsData = await getStudentBookings(user.id);
            setMyBookings(bookingsData || []);
            console.log('✅ Bookings loaded:', bookingsData?.length);

          }
        } catch (error) {
          console.error('🔴 Error refreshing profile:', error);
        }
      };

      refreshProfile();
    }, [])
  );

  // Load available slots for selected teacher
  const loadAvailableSlots = async (teacher) => {
    try {
      setSlotsLoading(true);
      console.log('🔵 Loading available slots for teacher:', teacher.id);

      // Get slots for next 30 days
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const slots = await getTeacherSlotsByDateRange(teacher.id, startDate, endDate);

      console.log('✅ Slots loaded:', slots?.length);
      setAvailableSlots(slots || []);
      // Note: Empty slots are handled by UI display, no need for toast
    } catch (error) {
      console.error('🔴 Error loading slots:', error);
      Toast.show('Error loading availability');
    } finally {
      setSlotsLoading(false);
    }
  };

  // Handle booking creation from availability slot
  // Returns booking object for checkout, or null on error
  const handleBookSlot = async (slot) => {
    try {
      // Prevent booking of already booked slots
      if (slot.slot_status === 'booked') {
        Alert.alert('Slot Unavailable', 'This time slot is already booked. Please select another slot.');
        return null;
      }

      if (!bookingSubject.trim()) {
        Alert.alert('Error', 'Please enter the subject/topic');
        return null;
      }

      setBookingInProgress(true);
      console.log('🔵 Creating booking for slot:', slot.id);

      // Create booking with pending status (will be confirmed after payment)
      const booking = await bookAvailabilitySlot(
        studentId,
        selectedTeacher.id,
        slot.id,
        bookingSubject
      );

      console.log('✅ Booking created:', booking);
      return booking; // Return booking object for checkout

    } catch (error) {
      console.error('🔴 Error booking slot:', error);
      Alert.alert('Error', error.message || 'Failed to create booking');
      return null;
    } finally {
      setBookingInProgress(false);
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

      console.log('🔵 Student attempting to join meeting:', booking.meeting_id);

      // Navigate to Join screen with booking data
      navigation.navigate(SCREEN_NAMES.Join, {
        meetingId: booking.meeting_id,
        bookingId: booking.id,
        isTeacher: false,
        studentId: studentId,
        name: studentName,
      });
    } catch (error) {
      console.error('🔴 Error joining meeting:', error);
      Alert.alert('Error', 'Failed to join meeting');
    }
  };

  // Refresh profile data when screen comes into focus (after edit)
  useFocusEffect(
    React.useCallback(() => {
      const refreshProfile = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profileRows } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', user.id)
              .limit(1);
            const profile = Array.isArray(profileRows) && profileRows.length > 0 ? profileRows[0] : profileRows;

            if (profile?.full_name) {
              setStudentName(profile.full_name);
            }
          }
        } catch (error) {
          console.error('🔴 Error refreshing profile:', error);
        }
      };

      refreshProfile();
    }, [])
  );

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
    setFavoriteTeachers(prev => {
      const isFavorite = prev.find(t => t.id === teacher.id);
      if (isFavorite) {
        Toast.show('❤️ Removed from favorites');
        return prev.filter(t => t.id !== teacher.id);
      } else {
        Toast.show('❤️ Added to favorites');
        return [...prev, teacher];
      }
    });
  };

  // Teacher status colors (online / away / offline) – same as teacher dashboard
  const teacherStatusColor = (status) => {
    const s = (status || 'offline').toLowerCase();
    if (s === 'online') return '#22c55e';
    if (s === 'away') return '#eab308';
    return '#6b7280';
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
          setSelectedTeacher(item);
          setShowBookingModal(true);
        }}
      >
        <View style={styles.teacherCardContent}>
          <View style={styles.teacherAvatarWrapper}>
            <User width={48} height={48} fill="#5568FE" style={{ marginBottom: 8 }} />
            <View style={[styles.teacherStatusDot, { backgroundColor: teacherStatusColor(status) }]} />
          </View>
          <Text style={styles.teacherName}>{item.profile?.full_name || 'Teacher'}</Text>
          <Text style={styles.teacherCategory}>{(item.specializations)}</Text>
          <View style={styles.ratingContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
              <Star width={16} height={16} fill="#FFD700" />
              <Text style={styles.rating}>{(item.rating || 5.0).toFixed(1)}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Users width={16} height={16} fill="#666" style={{ marginRight: 4 }} />
              <Text style={styles.followers}>{item.followers || 0}</Text>
            </View>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.bookBtn}
              onPress={() => {
                setSelectedTeacher(item);
                setShowBookingModal(true);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Calendar width={18} height={18} fill="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.bookBtnText}>Schedule</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.favoriteBtn, isFavorite && styles.favoriteBtnActive]}
              onPress={() => toggleFavorite(item)}
            >
              {isFavorite ? (
                <HeartFilled width={20} height={20} fill="#FF6B6B" />
              ) : (
                <HeartOutline width={20} height={20} stroke="#FF6B6B" />
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
          <ActivityIndicator size="large" color="#5568FE" />
          <Text style={styles.loadingText}>Loading your info...</Text>
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
              setShowBookingModal(false);
              setSelectedTeacher(null);
              setAvailableSlots([]);
              setSelectedSlot(null);
            }}>
              {/* <Text style={styles.backButton}>← Back</Text> */}
              
              <View style={styles.backButton}>
                <ChevronRight width={24} height={24} color="#5568FE" style={{ transform: [{ rotate: '180deg' }] }} />
              </View>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Available Slot</Text>
          </View>

          {/* Teacher Info */}
          <View style={styles.teacherInfoCard}>
            <View style={styles.teacherModalAvatarWrapper}>
              <User width={56} height={56} fill="#5568FE" style={{ marginBottom: 12 }} />
              <View style={[styles.teacherStatusDotModal, { backgroundColor: teacherStatusColor(selectedTeacher.availability_status) }]} />
            </View>
            <Text style={styles.teacherName}>{selectedTeacher.profile?.full_name}</Text>
            <Text style={styles.teacherSpec}>{selectedTeacher.specializations}</Text>
            <Text style={styles.teacherSpec}>{selectedTeacher.bio}</Text>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Price: </Text>
              <Text style={styles.priceValue}>₹{selectedTeacher.price_per_call || 500}/60 min</Text>
            </View>
            {/* <Text style={styles.teacherStatusLabel}>
              {((selectedTeacher.availability_status || 'offline') === 'online' && 'Online') ||
                ((selectedTeacher.availability_status || 'offline') === 'away' && 'Away') ||
                'Offline'}
            </Text> */}
          </View>

          {/* Subject/Topic - show first so it's always visible before selecting slot */}
          {availableSlots.length > 0 && (
            <View style={styles.fieldSection}>
              <Text style={styles.label}>Subject/Topic *</Text>
              <TextInput
                style={styles.subjectInput}
                placeholder="e.g., Algebra, Physics Problem Solving"
                placeholderTextColor="#999"
                value={bookingSubject}
                onChangeText={setBookingSubject}
              />
            </View>
          )}

          {/* Available Slots */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>Available Slots (Next 30 Days)</Text>

            {slotsLoading ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#5568FE" />
                <Text style={styles.loadingText}>Loading available slots...</Text>
              </View>
            ) : availableSlots.length === 0 ? (
              <View style={styles.noSlotsContainer}>
                <Text style={styles.noSlotsText}>😔 No available slots found</Text>
                <Text style={styles.noSlotsSubtext}>Teacher hasn't set their availability yet</Text>
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
                      onPress={() => !isBooked && setSelectedSlot(slot)}
                      disabled={isBooked}
                    >
                      <View style={styles.slotContent}>
                        <Text style={[styles.slotDateTime, isBooked && styles.slotDateTimeBooked]}>
                          {dayStr}, {dateStr} • {timeStr}
                        </Text>
                        <Text style={[styles.slotDuration, isBooked && styles.slotDurationBooked]}>
                          {isBooked ? 'Already booked' : '60 minutes session'}
                        </Text>
                      </View>
                      {isBooked ? (
                        <Text style={styles.slotBookedBadge}>🔒 Booked</Text>
                      ) : (
                        isSelected && <Text style={styles.slotCheckmark}>✓</Text>
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
              <Text style={styles.summaryTitle}>Booking Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Teacher:</Text>
                <Text style={styles.summaryValue}>{selectedTeacher.profile?.full_name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subject/Topic:</Text>
                <Text style={styles.summaryValue}>{bookingSubject || '— Not entered —'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date & Time:</Text>
                <Text style={styles.summaryValue}>{new Date(selectedSlot.start_time).toLocaleString()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration:</Text>
                <Text style={styles.summaryValue}>60 minutes</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryRowTotal]}>
                <Text style={styles.summaryLabel}>Total:</Text>
                <Text style={styles.summaryValueTotal}>₹{selectedTeacher.price_per_call || 500}</Text>
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
              setShowBookingModal(false);
              setSelectedTeacher(null);
              setAvailableSlots([]);
              setSelectedSlot(null);
            }}
            disabled={bookingInProgress}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
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
            <Text style={styles.confirmBtnText}>
              {bookingInProgress ? 'Booking...' : '✅ Confirm Booking'}
            </Text>
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
                console.error(err);
                Toast.show('Booking failed');
              }
            }}
            disabled={bookingInProgress || !selectedSlot}
          >
            <Text style={styles.confirmBtnText}>
              {bookingInProgress ? 'Booking...' : 'Book Now'}
            </Text>
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
            <Text style={styles.snackbarText}>Complete your profile for a better experience.</Text>
            <TouchableOpacity
              style={styles.snackbarBtn}
              onPress={() => {
                setProfileIncomplete(false);
                navigation.navigate(SCREEN_NAMES.EditStudentProfile);
              }}
            >
              <Text style={styles.snackbarBtnText}>Go to edit profile</Text>
            </TouchableOpacity>
          </View>
        )}
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefreshHome} colors={['#5568FE']} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.welcome}>Welcome 👋</Text>
            <Text style={styles.studentName}>{studentName}</Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search teachers..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {/* <Text style={styles.searchIcon}>🔍</Text> */}
            <View style={styles.searchIcon}>
              <SearchIcon width={25} height={25} fill="#f5f1f1" />
            </View>

          </View>

          {/* Categories */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }} style={styles.categoryScroll}>
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryBtn,
                  selectedCategory === category && styles.categoryBtnActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category && styles.categoryTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Featured Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Teachers</Text>
          </View>

          {/* Teacher Grid */}
          {filteredTeachers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No teachers found</Text>
              <Text style={styles.emptySubtext}>Try searching with different keywords</Text>
            </View>
          ) : (
            <View style={styles.teacherGrid}>
              {filteredTeachers.map(teacher => (
                <View key={teacher.id} style={styles.gridItem}>
                  {renderTeacherCard({ item: teacher })}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={[styles.navItem, activeTab === 'home' && styles.navItemActive]}
            onPress={() => setActiveTab('home')}
          >
            <Home width={24} height={24} fill={activeTab === 'home' ? '#5568FE' : '#999'} />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeTab === 'bookings' && styles.navItemActive]}
            onPress={() => setActiveTab('bookings')}
          >
            <Calendar width={24} height={24} fill={activeTab === 'bookings' ? '#5568FE' : '#999'} />
            <Text style={styles.navLabel}>Bookings</Text>
          </TouchableOpacity>

          {/* Lectures tab hidden for students
          <TouchableOpacity
            style={[styles.navItem, activeTab === 'lectures' && styles.navItemActive]}
            onPress={() => setActiveTab('lectures')}
          >
            <BookOpen width={24} height={24} fill={activeTab === 'lectures' ? '#5568FE' : '#999'} />
            <Text style={styles.navLabel}>Lectures</Text>
          </TouchableOpacity>
          */}

          <TouchableOpacity
            style={[styles.navItem, activeTab === 'profile' && styles.navItemActive]}
            onPress={() => setActiveTab('profile')}
          >
            <User width={24} height={24} fill={activeTab === 'profile' ? '#5568FE' : '#999'} />
            <Text style={styles.navLabel}>Profile</Text>
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefreshBookings} colors={['#5568FE']} />
          }
        >
          <View style={styles.bookingsHeader}>
            <View style={styles.headerContent}>
              <View style={styles.headerIconContainer}>
                <Calendar width={20} height={20} fill="#fff" />
              </View>
              <View>
                <Text style={styles.headerTitle}>My Bookings</Text>
                <Text style={styles.headerSubtitle}>{myBookings.length} total sessions</Text>
              </View>
            </View>
          </View>

          {myBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Calendar width={56} height={56} fill="#5568FE" />
              </View>
              <Text style={styles.emptyText}>No bookings yet</Text>
              <Text style={styles.emptySubtext}>Browse teachers and book your first session</Text>
              <TouchableOpacity
                style={styles.browseBtn}
                onPress={() => setActiveTab('home')}
              >
                <Text style={styles.browseBtnText}>Browse Teachers</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Pending Payment Bookings */}
              {pendingBookings.length > 0 && (
                <>
                  <View style={styles.bookingSectionHeader}>
                    <View style={styles.sectionBadge}>
                      <Clock width={16} height={16} fill="#FF6B6B" />
                      <Text style={styles.sectionBadgeText}>Payment Pending</Text>
                    </View>
                    <Text style={styles.sectionCount}>{pendingBookings.length}</Text>
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
                          <User width={24} height={24} fill="#FF6B6B" />
                        </View>
                        <View style={styles.bookingInfo}>
                          <Text style={styles.bookingTeacher}>{booking.teacher_profile?.full_name || 'Teacher'}</Text>
                          <Text style={styles.bookingSubject}>{booking.subject}</Text>
                          <View style={styles.bookingMeta}>
                            <Calendar width={12} height={12} fill="#999" style={{ marginRight: 4 }} />
                            <Text style={styles.bookingDate}>{new Date(booking.booked_date).toLocaleDateString()}</Text>
                            <Clock width={12} height={12} fill="#999" style={{ marginLeft: 12, marginRight: 4 }} />
                            <Text style={styles.bookingDate}>{new Date(booking.booked_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: '#FFE5E5', borderColor: '#FF6B6B' }]}>
                            <Text style={{ color: '#FF6B6B', fontSize: 12, fontWeight: '600' }}>💳 Payment Pending - Tap to Pay</Text>
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
                      <CheckCircle width={16} height={16} fill="#2ECC71" />
                      <Text style={styles.sectionBadgeText}>Confirmed</Text>
                    </View>
                    <Text style={styles.sectionCount}>{confirmedBookings.length}</Text>
                  </View>
                  {confirmedBookings.map(booking => {
                    const CardWrapper = booking.meeting_id ? TouchableOpacity : View;
                    const cardProps = booking.meeting_id ? { activeOpacity: 0.8, onPress: () => handleJoinMeeting(booking) } : {};
                    return (
                      <CardWrapper key={booking.id} style={[styles.bookingCard, styles.confirmedCard]} {...cardProps}>
                        <View style={styles.bookingCardLeft}>
                          <View style={styles.bookingTeacherIcon}>
                            <User width={24} height={24} fill="#2ECC71" />
                          </View>
                          <View style={styles.bookingInfo}>
                            <Text style={styles.bookingTeacher}>{booking.teacher_profile?.full_name || 'Teacher'}</Text>
                            <Text style={styles.bookingSubject}>{booking.subject}</Text>
                            <View style={styles.bookingMeta}>
                              <Calendar width={12} height={12} fill="#999" style={{ marginRight: 4 }} />
                              <Text style={styles.bookingDate}>{new Date(booking.booked_date).toLocaleDateString()}</Text>
                              <Clock width={12} height={12} fill="#999" style={{ marginLeft: 12, marginRight: 4 }} />
                              <Text style={styles.bookingDate}>{new Date(booking.booked_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                            </View>
                            {booking.meeting_id && (
                              <TouchableOpacity
                                style={styles.meetingIdContainer}
                                onPress={(e) => { e?.stopPropagation?.(); copyMeetingIdToClipboard(booking.meeting_id); }}
                              >
                                <Video width={12} height={12} fill="#f9fafb" style={{ marginRight: 6 }} />
                                <Text style={styles.meetingIdLabel}>Meeting ID: {booking.meeting_id}</Text>
                                <Text style={styles.meetingIdCopy}>Copy</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                        {booking.meeting_id ? (
                          <View style={styles.joinBtn}>
                            <Video width={16} height={16} fill="#fff" />
                            <Text style={styles.joinBtnText}>Join</Text>
                          </View>
                        ) : (
                          <View style={styles.waitingBadge}>
                            <Text style={styles.waitingText}>Booked</Text>
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
                      <CheckCircle width={16} height={16} fill="#999" />
                      <Text style={styles.sectionBadgeText}>Completed</Text>
                    </View>
                    <Text style={styles.sectionCount}>{completedBookings.length}</Text>
                  </View>
                  {completedBookings.map(booking => (
                    <View key={booking.id} style={[styles.bookingCard, styles.completedCard]}>
                      <View style={styles.bookingCardLeft}>
                        <View style={styles.bookingTeacherIcon}>
                          <CheckCircle width={24} height={24} fill="#999" />
                        </View>
                        <View style={styles.bookingInfo}>
                          <Text style={styles.bookingTeacher}>{booking.teacher_profile?.full_name || 'Teacher'}</Text>
                          <Text style={styles.bookingSubject}>Topics:{booking.subject}</Text>
                          <View style={styles.bookingMeta}>
                            <Calendar width={12} height={12} fill="#999" style={{ marginRight: 4 }} />
                            <Text style={styles.bookingDate}>{new Date(booking.booked_date).toLocaleDateString()}</Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.completedBadge}>
                        <CheckCircle width={20} height={20} fill="#999" />
                      </View>
                    </View>
                  ))}
                </>
              )}
            </>
          )}

          <View style={{ marginBottom: 80 }} />
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('home')}
          >
            <Home width={22} height={22} fill={activeTab === 'home' ? '#5568FE' : '#999'} />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navItem, styles.navItemActive]}
            onPress={() => setActiveTab('bookings')}
          >
            <Calendar width={22} height={22} fill={activeTab === 'bookings' ? '#5568FE' : '#999'} />
            <Text style={styles.navLabel}>Bookings</Text>
          </TouchableOpacity>
          {/* Lectures tab hidden for students
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('lectures')}
          >
            <BookOpen width={22} height={22} fill={activeTab === 'lectures' ? '#5568FE' : '#999'} />
            <Text style={styles.navLabel}>Lectures</Text>
          </TouchableOpacity>
          */}
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('profile')}
          >
            <User width={22} height={22} fill={activeTab === 'profile' ? '#5568FE' : '#999'} />
            <Text style={styles.navLabel}>Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // PROFILE TAB
  if (activeTab === 'profile') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView>
          <View style={styles.header}>
            <View style={styles.welcomeContainer}>
              <View style={styles.headerContent}>
                <View style={styles.headerIconContainer}>
                  <User width={20} height={20} fill="#ffffff" />
                </View>
                <Text style={styles.welcometab}>My Profile</Text>
              </View>
            </View>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.profileImageContainer}>
              <User width={56} height={56} fill="#5568FE" />
            </View>
            <Text style={styles.profileName}>{studentName}</Text>
            <Text style={styles.profileEmail}>Student ID: {studentId?.substring(0, 8)}...</Text>
          </View>

          {/* Favorite Teachers */}
          {favoriteTeachers.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>My Favorite Teachers</Text>
                <Heart width={18} height={18} fill="#FF6B6B" />
              </View>
              {favoriteTeachers.map(teacher => (
                <View key={teacher.id} style={styles.favTeacherCard}>
                  <View style={styles.favTeacherImageContainer}>
                    <View style={styles.favTeacherAvatarWrapper}>
                      <User width={40} height={40} fill="#5568FE" />
                      <View style={[styles.favTeacherStatusDot, { backgroundColor: teacherStatusColor(teacher.availability_status) }]} />
                    </View>
                  </View>
                  <View style={styles.favTeacherInfo}>
                    <Text style={styles.favTeacherName}>{teacher.profile?.full_name || 'Teacher'}</Text>
                    <Text style={styles.favTeacherCategory}>
                      {typeof teacher.specializations === 'string'
                        ? teacher.specializations.split(',')[0].trim()
                        : 'Subject'}
                    </Text>
                    <Text style={styles.favTeacherPrice}>₹{teacher.price_per_call || 500}/call</Text>
                  </View>
                  <View style={styles.favTeacherActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedTeacher(teacher);
                        setShowBookingModal(true);
                      }}
                    >
                      <Calendar width={20} height={20} fill="#5568FE" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => toggleFavorite(teacher)} style={{ marginLeft: 12 }}>
                      <HeartFilled width={20} height={20} fill="#FF6B6B" />
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
                <User width={18} height={18} fill="#5568FE" />
              </View>
              <Text style={styles.settingText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Notifications')}>
              <View style={styles.settingIconContainer}>
                <Clock width={18} height={18} fill="#5568FE" />
              </View>
              <Text style={styles.settingText}>Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Payment History')}>
              <View style={styles.settingIconContainer}>
                <User width={18} height={18} fill="#5568FE" />
              </View>
              <Text style={styles.settingText}>Payment History</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Privacy & Security')}>
              <View style={styles.settingIconContainer}>
                <User width={18} height={18} fill="#5568FE" />
              </View>
              <Text style={styles.settingText}>Privacy & Security</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Help & Support')}>
              <View style={styles.settingIconContainer}>
                <Phone width={18} height={18} fill="#5568FE" />
              </View>
              <Text style={styles.settingText}>Help & Support</Text>
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
                <User width={18} height={18} fill="#FF6B6B" />
              </View>
              <Text style={styles.settingText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('home')}
          >
            <Home width={22} height={22} fill={activeTab === 'home' ? '#5568FE' : '#999'} />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('bookings')}
          >
            <Calendar width={22} height={22} fill={activeTab === 'bookings' ? '#5568FE' : '#999'} />
            <Text style={styles.navLabel}>Bookings</Text>
          </TouchableOpacity>
          {/* Lectures tab hidden for students
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('lectures')}
          >
            <BookOpen width={22} height={22} fill={activeTab === 'lectures' ? '#5568FE' : '#999'} />
            <Text style={styles.navLabel}>Lectures</Text>
          </TouchableOpacity>
          */}
          <TouchableOpacity
            style={[styles.navItem, styles.navItemActive]}
            onPress={() => setActiveTab('profile')}
          >
            <User width={22} height={22} fill={activeTab === 'profile' ? '#5568FE' : '#999'} />
            <Text style={styles.navLabel}>Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D2A',
  },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 10,
  },

  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  welcome: {
    color: '#ccc',
    fontSize: 14,
  },

  welcometab: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  studentName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },

  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 15,
    position: 'relative',
  },

  searchInput: {
    backgroundColor: '#1C1F4A',
    color: '#fff',
    fontSize: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    paddingRight: 45,
  },

  searchIcon: {
    position: 'absolute',
    right: 32,
    top: 20,
  },

  categoryScroll: {
    paddingHorizontal: 20,
    marginBottom: 20,
    maxHeight: 45,
    marginLeft: -20,
  },

  categoryBtn: {
    backgroundColor: '#1C1F4A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    minWidth: 70,
    alignItems: 'center',
  },

  categoryBtnActive: {
    backgroundColor: '#1E90FF',
  },

  categoryText: {
    color: '#999',
    fontSize: 13,
    fontWeight: '500',
  },

  categoryTextActive: {
    color: '#fff',
  },

  sectionHeader: {
    paddingHorizontal: 20,
    marginVertical: 15,
  },

  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  teacherGrid: {
    paddingHorizontal: 20,
    marginBottom: 100,
  },

  gridItem: {
    marginBottom: 15,
  },

  // teacherCard: {
  //   backgroundColor: '#1C1F4A',
  //   borderRadius: 12,
  //   padding: 15,
  //   flexDirection: 'row',
  //   alignItems: 'center',
  // },

  teacherCard: {
  backgroundColor: '#1C1F4A',
  borderRadius: 16,  // softer corners
  padding: 16,
  flexDirection: 'row',
  alignItems: 'center',
  shadowColor: '#000',
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
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#1C1F4A',
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
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0B0D2A',
  },

  teacherStatusLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 8,
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
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1C1F4A',
  },

  favTeacherActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  teacherName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },

  teacherCategory: {
    color: '#999',
    fontSize: 12,
    marginBottom: 4,
  },

  teacherStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  stat: {
    color: '#6CA0FF',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 12,
  },

  statSeparator: {
    color: '#999',
    marginRight: 12,
  },

  favoriteBtn: {
    fontSize: 20,
    paddingLeft: 10,
  },

  emptyState: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },

  emptyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },

  emptySubtext: {
    color: '#999',
    fontSize: 13,
  },

  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#0B0D2A',
    borderTopColor: '#1C1F4A',
    borderTopWidth: 1,
    justifyContent: 'space-around',
    paddingVertical: 5,
    paddingBottom: 2,
  },

  navItem: {
    alignItems: 'center',
    paddingVertical: 8,
    flex: 1,
    justifyContent: 'center',
  },

  navItemActive: {
    opacity: 1,
  },

  navLabel: {
    color: '#999',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },

  card: {
    backgroundColor: '#1C1F4A',
    padding: 18,
    borderRadius: 14,
    marginBottom: 15,
    marginHorizontal: 20,
  },

  primaryCard: {
    backgroundColor: '#1E90FF',
  },

  logoutCard: {
    backgroundColor: '#E74C3C',
  },

  cardText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },

  profileCard: {
    backgroundColor: '#1C1F4A',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },

  profileImageContainer: {
    width: 70,
    height: 70,
    backgroundColor: '#2E2E5E',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  profileImage: {
    fontSize: 48,
    marginBottom: 12,
  },

  profileName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  profileEmail: {
    color: '#999',
    fontSize: 13,
  },

  favTeacherCard: {
    backgroundColor: '#1C1F4A',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
  },

  favTeacherImageContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#2E2E5E',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  favTeacherImage: {
    fontSize: 32,
    marginRight: 12,
  },

  favTeacherInfo: {
    flex: 1,
  },

  favTeacherName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },

  favTeacherCategory: {
    color: '#999',
    fontSize: 11,
    marginBottom: 4,
  },

  favTeacherPrice: {
    color: '#1E90FF',
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
    marginBottom: 100,
  },

  settingItem: {
    backgroundColor: '#1C1F4A',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  settingIconContainer: {
    width: 36,
    height: 36,
    backgroundColor: '#2E2E5E',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },

  settingText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },

  logoutItem: {
    backgroundColor: '#E74C3C',
    marginTop: 10,
  },

  // TEACHER CARD STYLES
  teacherImage: {
    fontSize: 32,
    marginBottom: 8,
  },

  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },

  rating: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 12,
  },

  followers: {
    color: '#999',
    fontSize: 12,
  },

  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },

  bookBtn: {
    flex: 1,
    backgroundColor: '#1E90FF',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },

  bookBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    paddingVertical: 4,
  },

  favoriteBtn: {
    paddingHorizontal: 10,
    justifyContent: 'center',
  },

  favoriteBtnActive: {
    opacity: 1,
  },

  favoriteBtnText: {
    fontSize: 18,
  },

  // BOOKING MODAL STYLES
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // backButton: {
  //   color: '#1E90FF',
  //   fontSize: 16,
  //   fontWeight: '600',
  // },

  teacherInfoCard: {
    backgroundColor: '#1C1F4A',
    marginHorizontal: 20,
    marginVertical: 15,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },

  teacherAvatar: {
    fontSize: 40,
    marginBottom: 10,
  },

  teacherSpec: {
    color: '#999',
    fontSize: 13,
    marginBottom: 10,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  priceLabel: {
    color: '#999',
    fontSize: 12,
  },

  priceValue: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },

  fieldSection: {
    marginHorizontal: 20,
    marginVertical: 12,
  },

  label: {
    color: '#ccc',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },

  dateInput: {
    backgroundColor: '#1C1F4A',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
  },

  dateText: {
    color: '#fff',
    fontSize: 14,
  },

  timeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  timeBtn: {
    backgroundColor: '#1C1F4A',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 0.31,
  },

  timeBtnActive: {
    backgroundColor: '#1E90FF',
  },

  timeBtnText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  timeBtnTextActive: {
    color: '#fff',
  },

  subjectInput: {
    backgroundColor: '#1C1F4A',
    color: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    fontSize: 14,
  },

  // Slot Selection Styles
  slotsList: {
    marginVertical: 10,
  },

  slotCard: {
    backgroundColor: '#1C1F4A',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  // slotCardSelected: {
  //   borderColor: '#1E90FF',
  //   backgroundColor: '#252965',
  // },

  slotCardSelected: {
  borderColor: '#5568FE',
  backgroundColor: '#2A2F6B',
  transform: [{ scale: 1.02 }],
},


  slotCardBooked: {
    backgroundColor: '#3A3A3A',
    borderColor: '#5A5A5A',
    opacity: 0.7,
  },

  slotContent: {
    flex: 1,
  },

  slotDateTime: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },

  slotDateTimeBooked: {
    color: '#999',
  },

  slotDuration: {
    color: '#999',
    fontSize: 12,
  },

  slotDurationBooked: {
    color: '#777',
  },

  slotBookedBadge: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '600',
  },

  slotCheckmark: {
    color: '#1E90FF',
    fontSize: 20,
    fontWeight: 'bold',
  },

  noSlotsContainer: {
    backgroundColor: '#1C1F4A',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    marginVertical: 10,
  },

  noSlotsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },

  noSlotsSubtext: {
    color: '#999',
    fontSize: 13,
  },

  loadingText: {
    color: '#999',
    fontSize: 12,
    marginTop: 10,
  },

  summaryCard: {
    backgroundColor: '#1C1F4A',
    marginHorizontal: 20,
    marginVertical: 15,
    padding: 15,
    borderRadius: 12,
  },

  summaryTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomColor: '#0B0D2A',
    borderBottomWidth: 1,
  },

  summaryRowTotal: {
    borderBottomWidth: 0,
    paddingTop: 12,
    paddingBottom: 0,
  },

  summaryLabel: {
    color: '#999',
    fontSize: 12,
  },

  summaryValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  summaryValueTotal: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },

  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#0B0D2A',
  },

  cancelBtn: {
    flex: 1,
    backgroundColor: '#1C1F4A',
    paddingVertical: 12,
    borderRadius: 10,
  },

  cancelBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // confirmBtn: {
  //   flex: 1,
  //   backgroundColor: '#1E90FF',
  //   paddingVertical: 12,
  //   borderRadius: 10,
  // },

confirmBtn: {
  flex: 1,
  backgroundColor: '#5568FE',   // softer premium blue
  paddingVertical: 14,
  borderRadius: 12,
  alignItems: 'center',
  elevation: 5,                 // Android shadow
  shadowColor: '#5568FE',        // iOS shadow
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 6,
},


  confirmBtnDisabled: {
    opacity: 0.6,
  },

  confirmBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // BOOKINGS PAGE STYLES
  bookingsHeader: {
    backgroundColor: '#1C1F4A',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 20,
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
    backgroundColor: '#5568FE',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  headerSubtitle: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },

  bookingSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },

  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1F4A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  sectionBadgeText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },

  sectionCount: {
    color: '#5568FE',
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: '#2E2E5E',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },

  // BOOKING CARD STYLES
  bookingCard: {
    backgroundColor: '#1C1F4A',
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#5568FE',
  },

  pendingCard: {
    borderLeftColor: '#FF6B6B',
    backgroundColor: '#2a1f1f',
  },

  confirmedCard: {
    borderLeftColor: '#2ECC71',
    backgroundColor: '#1a2a1f',
  },

  completedCard: {
    borderLeftColor: '#999',
    backgroundColor: '#1a1a1f',
  },

  bookingCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  bookingTeacherIcon: {
    width: 44,
    height: 44,
    backgroundColor: '#2E2E5E',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },

  bookingInfo: {
    flex: 1,
  },

  bookingLeft: {
    flex: 1,
  },

  bookingTeacher: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },

  bookingSubject: {
    color: '#999',
    fontSize: 13,
    marginBottom: 6,
  },

  bookingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  bookingDate: {
    color: '#999',
    fontSize: 11,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E2E5E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },

  statusText: {
    color: '#FFA500',
    fontSize: 11,
    fontWeight: '500',
  },

  // meetingIdContainer: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   backgroundColor: '#2E2E5E',
  //   paddingHorizontal: 10,
  //   paddingVertical: 6,
  //   borderRadius: 8,
  //   marginTop: 6,
  // },

  // meetingIdLabel: {
  //   color: '#5568FE',
  //   fontSize: 11,
  //   fontWeight: '600',
  //   flex: 1,
  // },

  meetingIdCopy: {
    color: '#6CA0FF',
    fontSize: 10,
    marginLeft: 8,
  },

  joinBtn: {
    backgroundColor: '#2ECC71',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 56,
    flexDirection: 'row',
    gap: 2,
  },

  joinBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  waitingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E2E5E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },

  waitingText: {
    color: '#FFA500',
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
    backgroundColor: '#2E2E5E',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },

  browseBtn: {
    backgroundColor: '#5568FE',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    alignSelf: 'center',
  },

  browseBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // joinBtn: {
  //   backgroundColor: '#2ECC71',
  //   paddingHorizontal: 12,
  //   paddingVertical: 8,
  //   borderRadius: 8,
  // },

  joinBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },

  meetingIdContainer: {
    backgroundColor: '#2D5A3D',
    // borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
    marginLeft: -10,
  },

  meetingIdLabel: {
    color: '#fbfbfd',
    fontWeight: '400',
    fontSize: 12,
    fontFamily: 'Arial',
  },

  meetingIdCopy: {
    color: '#f8f7fb',
    fontSize: 9,
    marginTop: 4,
    fontStyle: 'italic',
  },

  waitingBadge: {
    backgroundColor: '#0cb2ff92',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '600',
  },

  pendingBadge: {
    backgroundColor: '#FFA500',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '600',
  },

  completedBadge: {
    backgroundColor: '#4c56af',
    color: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '600',
  },

  // LECTURE STYLES
  lecturesList: {
    paddingHorizontal: 20,
    marginBottom: 100,
  },

  lectureCard: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1E90FF',
  },

  lectureHeader: {
    marginBottom: 10,
  },

  lectureSubject: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  lectureTeacher: {
    color: '#999',
    fontSize: 12,
  },

  lectureDescription: {
    color: '#ccc',
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 18,
  },

  lectureDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },

  lectureDetail: {
    color: '#6CA0FF',
    fontSize: 12,
    fontWeight: '500',
  },

  enrollBtn: {
    backgroundColor: '#1E90FF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  enrollBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  enrolledLectureCard: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },

  enrolledActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },

  joinLectureBtn: {
    flex: 1,
    backgroundColor: '#1E90FF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  joinLectureBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },

  removeBtn: {
    flex: 1,
    backgroundColor: '#E74C3C',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  removeBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ccc',
    marginTop: 10,
  },

  snackbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#B45309',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  snackbarText: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
  },
  snackbarBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  snackbarBtnText: { color: '#fff', fontSize: 13, fontWeight: '600', },

  backButton: {
    width: 40, 
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1C1F4A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

   headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    // marginBottom: 10,
  },
});

