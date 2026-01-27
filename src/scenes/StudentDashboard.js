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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';
import { SCREEN_NAMES } from '../navigators/screenNames';
import { supabase } from '../../supabase';
import { getAllTeachers, createBooking, getStudentBookings, getAllLectures, getStudentEnrolledLectures, enrollInLecture, unenrollFromLecture } from '../database/database';

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
  
  // Lectures state
  const [availableLectures, setAvailableLectures] = useState([]);
  const [enrolledLectures, setEnrolledLectures] = useState([]);
  const [lecturesLoading, setLecturesLoading] = useState(false);
  
  // Booking state
  const [myBookings, setMyBookings] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [bookingDate, setBookingDate] = useState(new Date());
  const [bookingTime, setBookingTime] = useState('14:00');
  const [bookingSubject, setBookingSubject] = useState('');
  const [bookingInProgress, setBookingInProgress] = useState(false);

  // Fetch user info and teachers on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('🔵 [StudentDashboard] Initializing...');
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setStudentId(user.id);
          
          // Get student profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();
          
          if (profile?.full_name) {
            setStudentName(profile.full_name);
          }
        }
        
        // Fetch all teachers from database
        console.log('🔵 [StudentDashboard] Fetching teachers from database...');
        const teachersData = await getAllTeachers();
        setTeachers(teachersData || []);
        console.log('✅ [StudentDashboard] Teachers loaded:', teachersData?.length);
        
        // Fetch available lectures
        console.log('🔵 [StudentDashboard] Fetching lectures...');
        const lecturesData = await getAllLectures();
        setAvailableLectures(lecturesData || []);
        console.log('✅ [StudentDashboard] Lectures loaded:', lecturesData?.length);
        
      } catch (error) {
        console.error('🔴 [StudentDashboard] Error initializing:', error);
        Toast.show('Error loading teachers');
      } finally {
        setLoading(false);
      }
    };
    
    initialize();
  }, []);

  // Refresh profile data when screen comes into focus (after edit)
  useFocusEffect(
    React.useCallback(() => {
      const refreshProfile = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', user.id)
              .single();
            
            if (profile?.full_name) {
              setStudentName(profile.full_name);
            }
            
            // Also refresh bookings when returning to dashboard
            console.log('🔵 Refreshing bookings...');
            const bookingsData = await getStudentBookings(user.id);
            setMyBookings(bookingsData || []);
            console.log('✅ Bookings loaded:', bookingsData?.length);
            
            // Refresh enrolled lectures
            console.log('🔵 Refreshing enrolled lectures...');
            const enrolledData = await getStudentEnrolledLectures(user.id);
            setEnrolledLectures(enrolledData || []);
            console.log('✅ Enrolled lectures loaded:', enrolledData?.length);
          }
        } catch (error) {
          console.error('🔴 Error refreshing profile:', error);
        }
      };
      
      refreshProfile();
    }, [])
  );

  // Handle booking creation
  const handleBookTeacher = async () => {
    try {
      if (!bookingSubject.trim()) {
        Alert.alert('Error', 'Please enter the subject/topic');
        return;
      }

      setBookingInProgress(true);
      console.log('🔵 Creating booking...');

      // Combine date and time
      const [hours, minutes] = bookingTime.split(':').map(Number);
      const dateTime = new Date(bookingDate);
      dateTime.setHours(hours, minutes, 0);

      // Create booking
      const booking = await createBooking(
        studentId,
        selectedTeacher.id,
        dateTime,
        bookingSubject
      );

      console.log('✅ Booking created:', booking);
      Toast.show('✅ Booking request sent!');
      
      // Reset form
      setShowBookingModal(false);
      setBookingSubject('');
      setBookingTime('14:00');
      setSelectedTeacher(null);

      // Refresh bookings
      const updatedBookings = await getStudentBookings(studentId);
      setMyBookings(updatedBookings || []);

      // Switch to bookings tab
      setActiveTab('bookings');

    } catch (error) {
      console.error('🔴 Error creating booking:', error);
      Alert.alert('Error', 'Failed to create booking');
    } finally {
      setBookingInProgress(false);
    }
  };

  // Handle lecture enrollment
  const handleEnrollLecture = async (lectureId) => {
    try {
      if (!studentId) {
        Alert.alert('Error', 'Please log in first');
        return;
      }

      await enrollInLecture(lectureId, studentId);
      Toast.show('✅ Enrolled in lecture!');
      
      // Refresh lectures
      const updatedLectures = await getAllLectures();
      setAvailableLectures(updatedLectures || []);
      
      const enrolledData = await getStudentEnrolledLectures(studentId);
      setEnrolledLectures(enrolledData || []);
      
      // Switch to enrolled lectures tab
      setActiveTab('lectures');
    } catch (error) {
      console.error('🔴 Error enrolling:', error);
      Alert.alert('Error', error.message || 'Failed to enroll');
    }
  };

  // Handle unenroll from lecture
  const handleUnenrollLecture = async (lectureId) => {
    try {
      Alert.alert(
        'Confirm',
        'Remove from this lecture?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            onPress: async () => {
              await unenrollFromLecture(lectureId, studentId);
              Toast.show('❌ Removed from lecture');
              
              const enrolledData = await getStudentEnrolledLectures(studentId);
              setEnrolledLectures(enrolledData || []);
            },
          },
        ]
      );
    } catch (error) {
      console.error('🔴 Error unenrolling:', error);
    }
  };

  // Refresh profile data when screen comes into focus (after edit)
  useFocusEffect(
    React.useCallback(() => {
      const refreshProfile = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', user.id)
              .single();
            
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

  const renderTeacherCard = ({ item }) => {
    const isFavorite = favoriteTeachers.find(t => t.id === item.id);
    const specializations = typeof item.specializations === 'string' 
      ? item.specializations.split(',')[0].trim()
      : 'Subject';
    
    return (
      <TouchableOpacity
        style={styles.teacherCard}
        onPress={() => navigation.navigate(SCREEN_NAMES.Join)}
      >
        <View style={styles.teacherCardContent}>
          <Text style={styles.teacherImage}>👨‍🏫</Text>
          <Text style={styles.teacherName}>{item.profile?.full_name || 'Teacher'}</Text>
          <Text style={styles.teacherCategory}>{specializations}</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>⭐ {(item.rating || 5.0).toFixed(1)}</Text>
            <Text style={styles.followers}>👥 {item.followers || 0}</Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={styles.bookBtn}
              onPress={() => {
                setSelectedTeacher(item);
                setShowBookingModal(true);
              }}
            >
              <Text style={styles.bookBtnText}>📅 Book</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.favoriteBtn, isFavorite && styles.favoriteBtnActive]}
              onPress={() => toggleFavorite(item)}
            >
              <Text style={styles.favoriteBtnText}>{isFavorite ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // BOOKING MODAL
  if (showBookingModal && selectedTeacher) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setShowBookingModal(false)}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Book Session</Text>
          </View>

          {/* Teacher Info */}
          <View style={styles.teacherInfoCard}>
            <Text style={styles.teacherAvatar}>👨‍🏫</Text>
            <Text style={styles.teacherName}>{selectedTeacher.profile?.full_name}</Text>
            <Text style={styles.teacherSpec}>{selectedTeacher.specializations?.split(',')[0].trim()}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Price: </Text>
              <Text style={styles.priceValue}>₹{selectedTeacher.price_per_call || 500}/60 min</Text>
            </View>
          </View>

          {/* Date Picker */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>📅 Select Date</Text>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => {
                // Simple date selection - you can add a date picker library later
              }}
            >
              <Text style={styles.dateText}>{bookingDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
          </View>

          {/* Time Picker */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>🕐 Select Time</Text>
            <View style={styles.timeButtons}>
              {['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map(time => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeBtn,
                    bookingTime === time && styles.timeBtnActive,
                  ]}
                  onPress={() => setBookingTime(time)}
                >
                  <Text
                    style={[
                      styles.timeBtnText,
                      bookingTime === time && styles.timeBtnTextActive,
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Subject Input */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>📚 Subject/Topic *</Text>
            <TextInput
              style={styles.subjectInput}
              placeholder="e.g., Algebra, Physics Problem Solving"
              placeholderTextColor="#999"
              value={bookingSubject}
              onChangeText={setBookingSubject}
            />
          </View>

          {/* Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Teacher:</Text>
              <Text style={styles.summaryValue}>{selectedTeacher.profile?.full_name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date & Time:</Text>
              <Text style={styles.summaryValue}>{bookingDate.toLocaleDateString()} at {bookingTime}</Text>
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

          <View style={{ marginBottom: 30 }} />
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setShowBookingModal(false)}
            disabled={bookingInProgress}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmBtn, bookingInProgress && styles.confirmBtnDisabled]}
            onPress={handleBookTeacher}
            disabled={bookingInProgress}
          >
            <Text style={styles.confirmBtnText}>
              {bookingInProgress ? 'Booking...' : '✅ Confirm Booking'}
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
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#5568FE" />
            <Text style={{ color: '#ccc', marginTop: 10 }}>Loading teachers...</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
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
              <Text style={styles.searchIcon}>🔍</Text>
            </View>

            {/* Categories */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
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
        )}

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={[styles.navItem, activeTab === 'home' && styles.navItemActive]}
            onPress={() => setActiveTab('home')}
          >
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeTab === 'bookings' && styles.navItemActive]}
            onPress={() => setActiveTab('bookings')}
          >
            <Text style={styles.navIcon}>📅</Text>
            <Text style={styles.navLabel}>Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeTab === 'lectures' && styles.navItemActive]}
            onPress={() => setActiveTab('lectures')}
          >
            <Text style={styles.navIcon}>📚</Text>
            <Text style={styles.navLabel}>Lectures</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeTab === 'profile' && styles.navItemActive]}
            onPress={() => setActiveTab('profile')}
          >
            <Text style={styles.navIcon}>👤</Text>
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
        <ScrollView>
          <View style={styles.header}>
            <Text style={styles.welcome}>My Bookings 📅</Text>
          </View>

          {myBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No bookings yet</Text>
              <Text style={styles.emptySubtext}>Browse teachers and book your first session</Text>
            </View>
          ) : (
            <>
              {/* Confirmed Bookings */}
              {confirmedBookings.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>✅ Confirmed Sessions</Text>
                  </View>
                  {confirmedBookings.map(booking => (
                    <View key={booking.id} style={styles.bookingCard}>
                      <View style={styles.bookingLeft}>
                        <Text style={styles.bookingTeacher}>{booking.teacher_profile?.profiles?.full_name || 'Teacher'}</Text>
                        <Text style={styles.bookingSubject}>{booking.subject}</Text>
                        <Text style={styles.bookingDate}>📅 {new Date(booking.booked_date).toLocaleString()}</Text>
                      </View>
                      <TouchableOpacity style={styles.joinBtn}>
                        <Text style={styles.joinBtnText}>📹 Join</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              )}

              {/* Pending Bookings */}
              {pendingBookings.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>⏳ Waiting for Confirmation</Text>
                  </View>
                  {pendingBookings.map(booking => (
                    <View key={booking.id} style={styles.bookingCard}>
                      <View style={styles.bookingLeft}>
                        <Text style={styles.bookingTeacher}>{booking.teacher_profile?.profiles?.full_name || 'Teacher'}</Text>
                        <Text style={styles.bookingSubject}>{booking.subject}</Text>
                        <Text style={styles.bookingDate}>📅 {new Date(booking.booked_date).toLocaleString()}</Text>
                      </View>
                      <Text style={styles.pendingBadge}>Pending</Text>
                    </View>
                  ))}
                </>
              )}

              {/* Completed Bookings */}
              {completedBookings.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>📋 Completed</Text>
                  </View>
                  {completedBookings.map(booking => (
                    <View key={booking.id} style={[styles.bookingCard, styles.completedCard]}>
                      <View style={styles.bookingLeft}>
                        <Text style={styles.bookingTeacher}>{booking.teacher_profile?.profiles?.full_name || 'Teacher'}</Text>
                        <Text style={styles.bookingSubject}>{booking.subject}</Text>
                        <Text style={styles.bookingDate}>📅 {new Date(booking.booked_date).toLocaleString()}</Text>
                      </View>
                      <Text style={styles.completedBadge}>✓ Done</Text>
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
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navItem, styles.navItemActive]}
            onPress={() => setActiveTab('bookings')}
          >
            <Text style={styles.navIcon}>📅</Text>
            <Text style={styles.navLabel}>Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('lectures')}
          >
            <Text style={styles.navIcon}>📚</Text>
            <Text style={styles.navLabel}>Lectures</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('profile')}
          >
            <Text style={styles.navIcon}>👤</Text>
            <Text style={styles.navLabel}>Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // LECTURES TAB
  if (activeTab === 'lectures') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView>
          <View style={styles.header}>
            <Text style={styles.welcome}>📚 Available Lectures</Text>
          </View>

          {lecturesLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
              <ActivityIndicator size="large" color="#5568FE" />
            </View>
          ) : availableLectures.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No lectures available</Text>
              <Text style={styles.emptySubtext}>Check back later</Text>
            </View>
          ) : (
            <View style={styles.lecturesList}>
              {availableLectures.map(lecture => (
                <View key={lecture.id} style={styles.lectureCard}>
                  <View style={styles.lectureHeader}>
                    <Text style={styles.lectureSubject}>{lecture.subject}</Text>
                    <Text style={styles.lectureTeacher}>
                      by {lecture.teacher_profiles?.full_name || 'Teacher'}
                    </Text>
                  </View>
                  
                  <Text style={styles.lectureDescription}>{lecture.description || 'No description'}</Text>
                  
                  <View style={styles.lectureDetails}>
                    <Text style={styles.lectureDetail}>📅 {new Date(lecture.scheduled_date).toLocaleDateString()}</Text>
                    <Text style={styles.lectureDetail}>🕐 {new Date(lecture.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    <Text style={styles.lectureDetail}>⏱️ {lecture.duration_minutes} min</Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.enrollBtn}
                    onPress={() => handleEnrollLecture(lecture.id)}
                  >
                    <Text style={styles.enrollBtnText}>✅ Enroll Now</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {enrolledLectures.length > 0 && (
            <>
              <View style={[styles.header, { marginTop: 30 }]}>
                <Text style={styles.welcome}>✅ My Enrolled Lectures</Text>
              </View>
              
              {enrolledLectures.map(enrollment => (
                <View key={enrollment.id} style={styles.enrolledLectureCard}>
                  <View style={styles.lectureHeader}>
                    <Text style={styles.lectureSubject}>{enrollment.lecture?.subject}</Text>
                    <Text style={styles.lectureTeacher}>
                      by {enrollment.lecture?.teacher_profiles?.full_name || 'Teacher'}
                    </Text>
                  </View>
                  
                  <View style={styles.lectureDetails}>
                    <Text style={styles.lectureDetail}>📅 {new Date(enrollment.lecture?.scheduled_date).toLocaleDateString()}</Text>
                    <Text style={styles.lectureDetail}>🕐 {new Date(enrollment.lecture?.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>

                  <View style={styles.enrolledActions}>
                    <TouchableOpacity style={styles.joinLectureBtn}>
                      <Text style={styles.joinLectureBtnText}>📹 Join Lecture</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.removeBtn}
                      onPress={() => handleUnenrollLecture(enrollment.lecture?.id)}
                    >
                      <Text style={styles.removeBtnText}>❌ Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}

          <View style={{ marginBottom: 80 }} />
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('home')}
          >
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('bookings')}
          >
            <Text style={styles.navIcon}>📅</Text>
            <Text style={styles.navLabel}>Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navItem, styles.navItemActive]}
            onPress={() => setActiveTab('lectures')}
          >
            <Text style={styles.navIcon}>📚</Text>
            <Text style={styles.navLabel}>Lectures</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('profile')}
          >
            <Text style={styles.navIcon}>👤</Text>
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
            <Text style={styles.welcome}>My Profile 👤</Text>
          </View>

          <View style={styles.profileCard}>
            <Text style={styles.profileImage}>👤</Text>
            <Text style={styles.profileName}>{studentName}</Text>
            <Text style={styles.profileEmail}>Student ID: {studentId?.substring(0, 8)}...</Text>
          </View>

          {/* Favorite Teachers */}
          {favoriteTeachers.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>My Favorite Teachers ❤️</Text>
              </View>
              {favoriteTeachers.map(teacher => (
                <View key={teacher.id} style={styles.favTeacherCard}>
                  <Text style={styles.favTeacherImage}>👨‍🏫</Text>
                  <View style={styles.favTeacherInfo}>
                    <Text style={styles.favTeacherName}>{teacher.profile?.full_name || 'Teacher'}</Text>
                    <Text style={styles.favTeacherCategory}>
                      {typeof teacher.specializations === 'string' 
                        ? teacher.specializations.split(',')[0].trim()
                        : 'Subject'}
                    </Text>
                    <Text style={styles.favTeacherPrice}>₹{teacher.price_per_call || 500}/call</Text>
                  </View>
                  <TouchableOpacity onPress={() => toggleFavorite(teacher)}>
                    <Text style={styles.removeFavBtn}>❌</Text>
                  </TouchableOpacity>
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
              <Text style={styles.settingIcon}>✏️</Text>
              <Text style={styles.settingText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Notifications')}>
              <Text style={styles.settingIcon}>🔔</Text>
              <Text style={styles.settingText}>Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Payment History')}>
              <Text style={styles.settingIcon}>💳</Text>
              <Text style={styles.settingText}>Payment History</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Privacy & Security')}>
              <Text style={styles.settingIcon}>🔒</Text>
              <Text style={styles.settingText}>Privacy & Security</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Help & Support')}>
              <Text style={styles.settingIcon}>❓</Text>
              <Text style={styles.settingText}>Help & Support</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, styles.logoutItem]}
              onPress={() => Alert.alert('Logout', 'Are you sure?')}
            >
              <Text style={styles.settingIcon}>🚪</Text>
              <Text style={styles.settingText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('home')}
          >
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('bookings')}
          >
            <Text style={styles.navIcon}>📅</Text>
            <Text style={styles.navLabel}>Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('lectures')}
          >
            <Text style={styles.navIcon}>📚</Text>
            <Text style={styles.navLabel}>Lectures</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navItem, styles.navItemActive]}
            onPress={() => setActiveTab('profile')}
          >
            <Text style={styles.navIcon}>👤</Text>
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

  welcome: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 5,
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
    right: 30,
    top: 22,
    fontSize: 18,
  },

  categoryScroll: {
    paddingHorizontal: 20,
    marginBottom: 20,
    maxHeight: 45,
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

  teacherCard: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  teacherCardContent: {
    flex: 1,
    marginLeft: 12,
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
    paddingVertical: 12,
    paddingBottom: 20,
  },

  navItem: {
    alignItems: 'center',
    paddingVertical: 8,
    flex: 1,
  },

  navItemActive: {
    opacity: 1,
  },

  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },

  navLabel: {
    color: '#999',
    fontSize: 11,
    fontWeight: '500',
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
    fontSize: 13,
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
    flex: 1,
    textAlign: 'center',
  },

  backButton: {
    color: '#1E90FF',
    fontSize: 16,
    fontWeight: '600',
  },

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

  confirmBtn: {
    flex: 1,
    backgroundColor: '#1E90FF',
    paddingVertical: 12,
    borderRadius: 10,
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

  // BOOKING CARD STYLES
  bookingCard: {
    backgroundColor: '#1C1F4A',
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  completedCard: {
    opacity: 0.7,
  },

  bookingLeft: {
    flex: 1,
  },

  bookingTeacher: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },

  bookingSubject: {
    color: '#999',
    fontSize: 12,
    marginBottom: 4,
  },

  bookingDate: {
    color: '#6CA0FF',
    fontSize: 11,
  },

  joinBtn: {
    backgroundColor: '#1E90FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },

  joinBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
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
    backgroundColor: '#4CAF50',
    color: '#fff',
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
});
