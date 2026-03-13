import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';
import { supabase } from '../../../supabase';
import { getTeacherWeeklyAvailability, setTeacherWeeklyAvailability, generateAvailabilitySlots } from '../../database/database';
import ChevronRight from '../../assets/icons/ChevronRight';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

export default function TeacherAvailability({ navigation }) {
  const [teacherId, setTeacherId] = useState(null);
  const [availability, setAvailability] = useState({
    0: { isActive: false, startTime: '10:00', endTime: '17:00' },
    1: { isActive: true, startTime: '10:00', endTime: '17:00' },
    2: { isActive: true, startTime: '10:00', endTime: '17:00' },
    3: { isActive: true, startTime: '10:00', endTime: '17:00' },
    4: { isActive: true, startTime: '10:00', endTime: '17:00' },
    5: { isActive: true, startTime: '10:00', endTime: '17:00' },
    6: { isActive: false, startTime: '10:00', endTime: '17:00' },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showTimePickerStart, setShowTimePickerStart] = useState(false);
  const [showTimePickerEnd, setShowTimePickerEnd] = useState(false);

  // Load teacher availability on mount
  useEffect(() => {
    const loadAvailability = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setTeacherId(user.id);
          
          // Load schedule
          const schedule = await getTeacherWeeklyAvailability(user.id);
          
          // Map schedule to state
          const newAvailability = { ...availability };
          schedule.forEach(item => {
            newAvailability[item.day_of_week] = {
              isActive: item.is_active,
              startTime: item.start_time.substring(0, 5), // HH:mm
              endTime: item.end_time.substring(0, 5),
            };
          });
          
          setAvailability(newAvailability);
        }
      } catch (error) {
        console.error('Error loading availability:', error);
        Alert.alert('Error', 'Failed to load availability');
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, []);

  // Save availability
  const handleSaveAvailability = async () => {
    try {
      setSaving(true);
      
      if (!teacherId) {
        Alert.alert('Error', 'Teacher ID not found');
        return;
      }

      // Save each day's availability
      for (let day = 0; day < 7; day++) {
        await setTeacherWeeklyAvailability(
          teacherId,
          day,
          availability[day].startTime,
          availability[day].endTime,
          availability[day].isActive
        );
      }

      // Generate slots for next 30 days
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      await generateAvailabilitySlots(
        teacherId,
        today.toISOString().split('T')[0],
        futureDate.toISOString().split('T')[0],
        60 // 60 minute slots
      );

      Toast.show('✅ Availability updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving availability:', error);
      Alert.alert('Error', 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  // Toggle day active/inactive
  const toggleDay = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isActive: !prev[day].isActive
      }
    }));
  };

  // Update time
  const updateTime = (day, timeType, time) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [timeType]: time
      }
    }));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#ff006e" />
          <Text style={styles.loadingText}>Loading availability...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            {/* <Text style={styles.backButton}>← Back</Text> */}
            <ChevronRight width={24} height={24} color="#ff006e" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <Text style={styles.title}>Set Your Availability</Text>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            Set your weekly availability schedule. Students can only book you during these times.
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.infoTitle}>Tip: </Text>Availability slots are generated automatically for 30 days from today.
          </Text>
        </View>

        {/* Days List */}
        {DAYS.map((dayName, dayIndex) => {
          const dayAvail = availability[dayIndex];
          
          return (
            <View key={dayIndex} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>{dayName}</Text>
                <Switch
                  value={dayAvail.isActive}
                  onValueChange={() => toggleDay(dayIndex)}
                  trackColor={{ false: '#3a3a3a', true: '#ff006e' }}
                  thumbColor={dayAvail.isActive ? '#fff' : '#b0b0b0'}
                />
              </View>

              {dayAvail.isActive && (
                <View style={styles.timeContainer}>
                  {/* Start Time */}
                  <View style={styles.timeSection}>
                    <Text style={styles.timeLabel}>From</Text>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => {
                        setSelectedDay(dayIndex);
                        setShowTimePickerStart(true);
                      }}
                    >
                      <Text style={styles.timeButtonText}>{dayAvail.startTime}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* End Time */}
                  <View style={styles.timeSection}>
                    <Text style={styles.timeLabel}>To</Text>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => {
                        setSelectedDay(dayIndex);
                        setShowTimePickerEnd(true);
                      }}
                    >
                      <Text style={styles.timeButtonText}>{dayAvail.endTime}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {!dayAvail.isActive && (
                <Text style={styles.unavailableText}>Not available</Text>
              )}
            </View>
          );
        })}

        {/* Time Picker Modal for Start Time */}
        {showTimePickerStart && selectedDay !== null && (
          <View style={styles.timePickerModal}>
            <View style={styles.timePickerContent}>
              <Text style={styles.timePickerTitle}>Select Start Time</Text>
              <ScrollView style={styles.timePickerScroll}>
                {TIME_SLOTS.map(time => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timePickerOption,
                      availability[selectedDay].startTime === time && styles.timePickerOptionSelected
                    ]}
                    onPress={() => {
                      updateTime(selectedDay, 'startTime', time);
                      setShowTimePickerStart(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.timePickerOptionText,
                        availability[selectedDay].startTime === time && styles.timePickerOptionTextSelected
                      ]}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.timePickerClose}
                onPress={() => setShowTimePickerStart(false)}
              >
                <Text style={styles.timePickerCloseText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Time Picker Modal for End Time */}
        {showTimePickerEnd && selectedDay !== null && (
          <View style={styles.timePickerModal}>
            <View style={styles.timePickerContent}>
              <Text style={styles.timePickerTitle}>Select End Time</Text>
              <ScrollView style={styles.timePickerScroll}>
                {TIME_SLOTS.map(time => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timePickerOption,
                      availability[selectedDay].endTime === time && styles.timePickerOptionSelected
                    ]}
                    onPress={() => {
                      updateTime(selectedDay, 'endTime', time);
                      setShowTimePickerEnd(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.timePickerOptionText,
                        availability[selectedDay].endTime === time && styles.timePickerOptionTextSelected
                      ]}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.timePickerClose}
                onPress={() => setShowTimePickerEnd(false)}
              >
                <Text style={styles.timePickerCloseText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveAvailability}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Availability'}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1b3f',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#e0e0e0',
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    color: '#ff006e',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 15,
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff006e',
  },
  infoTitle: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 14,
  },
  infoText: {
    color: '#b0b0b0',
    fontSize: 12,
    marginBottom: 6,
    lineHeight: 18,
  },
  dayCard: {
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  timeSection: {
    flex: 1,
  },
  timeLabel: {
    color: '#b0b0b0',
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '500',
  },
  timeButton: {
    padding: 10,
    backgroundColor: '#0f1b3f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff006e',
  },
  timeButtonText: {
    color: '#ff006e',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  unavailableText: {
    color: '#b0b0b0',
    fontSize: 12,
    fontStyle: 'italic',
  },
  timePickerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  timePickerContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  timePickerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  timePickerScroll: {
    maxHeight: 300,
  },
  timePickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 0, 110, 0.2)',
  },
  timePickerOptionSelected: {
    backgroundColor: 'rgba(255, 0, 110, 0.3)',
  },
  timePickerOptionText: {
    color: '#b0b0b0',
    fontSize: 14,
  },
  timePickerOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  timePickerClose: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: 'transparent',   // Use LinearGradient wrapper for gradient
    borderRadius: 8,
  },
  timePickerCloseText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButton: {
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    background: 'linear-gradient(135deg, #ff006e, #00d4ff)',
    backgroundColor: 'transparent',   // Use LinearGradient wrapper for gradient
    borderRadius: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 20,
  },
});
