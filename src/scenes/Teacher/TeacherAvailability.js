import React, { useState, useEffect } from 'react';
import {
  View,
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
import databaseApi from '../../database/databaseApi';
import UNIFIED_THEME from '../../constants/unifiedTheme';
import ThemedText from '../../components/ThemedText';
import ChevronRight from '../../assets/icons/ChevronRight';
import logger from '../../utils/logger';

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
          const schedule = await databaseApi.getTeacherWeeklyAvailability(user.id);
          
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
        logger.error('Error loading availability:', error);
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
        await databaseApi.setTeacherWeeklyAvailability(
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

      await databaseApi.generateAvailabilitySlots(
        teacherId,
        today.toISOString().split('T')[0],
        futureDate.toISOString().split('T')[0],
        60 // 60 minute slots
      );

      Toast.show('✅ Availability updated successfully!');
      navigation.goBack();
    } catch (error) {
      logger.error('Error saving availability:', error);
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
          <ActivityIndicator size="large" color={UNIFIED_THEME.colors.accent.primary} />
          <ThemedText variant="body" size="md" color="muted" style={styles.loadingText}>Loading availability...</ThemedText>
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
            {/* <Text style={styles.backButton}>← Back</ThemedText> */}
            <ChevronRight width={24} height={24} color={UNIFIED_THEME.colors.accent.primary} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <ThemedText variant="heading" size="md" style={styles.title}>Set Your Availability</ThemedText>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <ThemedText variant="label" size="md" color="primary" style={styles.infoTitle}>How it works</ThemedText>
          <ThemedText variant="body" size="sm" color="muted" style={styles.infoText}>
            Set your weekly availability schedule. Students can only book you during these times.
          </ThemedText>
          <ThemedText variant="body" size="sm" color="muted" style={styles.infoText}>
            <ThemedText variant="label" size="md" color="primary" style={styles.infoTitle}>Tip: </ThemedText>Availability slots are generated automatically for 30 days from today.
          </ThemedText>
        </View>

        {/* Days List */}
        {DAYS.map((dayName, dayIndex) => {
          const dayAvail = availability[dayIndex];
          
          return (
            <View key={dayIndex} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <ThemedText variant="label" size="md" color="primary" style={styles.dayName}>{dayName}</ThemedText>
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
                    <ThemedText variant="body" size="sm" color="muted" style={styles.timeLabel}>From</ThemedText>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => {
                        setSelectedDay(dayIndex);
                        setShowTimePickerStart(true);
                      }}
                    >
                      <ThemedText variant="label" size="md" color="primary" style={styles.timeButtonText}>{dayAvail.startTime}</ThemedText>
                    </TouchableOpacity>
                  </View>

                  {/* End Time */}
                  <View style={styles.timeSection}>
                    <ThemedText variant="body" size="sm" color="muted" style={styles.timeLabel}>To</ThemedText>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => {
                        setSelectedDay(dayIndex);
                        setShowTimePickerEnd(true);
                      }}
                    >
                      <ThemedText variant="label" size="md" color="primary" style={styles.timeButtonText}>{dayAvail.endTime}</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {!dayAvail.isActive && (
                <ThemedText variant="body" size="sm" color="muted" style={styles.unavailableText}>Not available</ThemedText>
              )}
            </View>
          );
        })}

        {/* Time Picker Modal for Start Time */}
        {showTimePickerStart && selectedDay !== null && (
          <View style={styles.timePickerModal}>
            <View style={styles.timePickerContent}>
              <ThemedText variant="label" size="md" color="primary" style={styles.timePickerTitle}>Select Start Time</ThemedText>
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
                    <ThemedText
                      variant="body"
                      size="md"
                      color={availability[selectedDay].startTime === time ? 'primary' : 'muted'}
                      style={[
                        styles.timePickerOptionText,
                        availability[selectedDay].startTime === time && styles.timePickerOptionTextSelected
                      ]}
                    >
                      {time}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.timePickerClose}
                onPress={() => setShowTimePickerStart(false)}
              >
                <ThemedText variant="label" size="md" color="primary" style={styles.timePickerCloseText}>Done</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Time Picker Modal for End Time */}
        {showTimePickerEnd && selectedDay !== null && (
          <View style={styles.timePickerModal}>
            <View style={styles.timePickerContent}>
              <ThemedText variant="label" size="md" color="primary" style={styles.timePickerTitle}>Select End Time</ThemedText>
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
                    <ThemedText
                      variant="body"
                      size="md"
                      color={availability[selectedDay].endTime === time ? 'primary' : 'muted'}
                      style={[
                        styles.timePickerOptionText,
                        availability[selectedDay].endTime === time && styles.timePickerOptionTextSelected
                      ]}
                    >
                      {time}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.timePickerClose}
                onPress={() => setShowTimePickerEnd(false)}
              >
                <ThemedText variant="label" size="md" color="primary" style={styles.timePickerCloseText}>Done</ThemedText>
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
          <ThemedText variant="label" size="lg" color="onAccent" style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Availability'}
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: UNIFIED_THEME.spacing.md,
  },
  header: {
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: UNIFIED_THEME.spacing.md,
  },
  title: {
    flex: 1,
  },
  infoCard: {
    marginHorizontal: UNIFIED_THEME.spacing.lg,
    marginBottom: UNIFIED_THEME.spacing.lg,
    padding: UNIFIED_THEME.spacing.md,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: UNIFIED_THEME.colors.accent.primary,
  },
  infoTitle: {
    marginBottom: UNIFIED_THEME.spacing.md,
  },
  infoText: {
    marginBottom: UNIFIED_THEME.spacing.sm,
    lineHeight: 18,
  },
  dayCard: {
    marginHorizontal: UNIFIED_THEME.spacing.lg,
    marginBottom: UNIFIED_THEME.spacing.md,
    padding: UNIFIED_THEME.spacing.md,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.md,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.md,
  },
  dayName: {},
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: UNIFIED_THEME.spacing.sm,
  },
  timeSection: {
    flex: 1,
  },
  timeLabel: {
    marginBottom: UNIFIED_THEME.spacing.md,
  },
  timeButton: {
    padding: UNIFIED_THEME.spacing.sm,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.accent.primary,
  },
  timeButtonText: {
    textAlign: 'center',
  },
  unavailableText: {
    fontStyle: 'italic',
  },
  timePickerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: UNIFIED_THEME.colors.component.overlay,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  timePickerContent: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderTopLeftRadius: UNIFIED_THEME.borderRadius.xl,
    borderTopRightRadius: UNIFIED_THEME.borderRadius.xl,
    padding: UNIFIED_THEME.spacing.lg,
    maxHeight: '80%',
  },
  timePickerTitle: {
    marginBottom: UNIFIED_THEME.spacing.lg,
    textAlign: 'center',
  },
  timePickerScroll: {
    maxHeight: 300,
  },
  timePickerOption: {
    paddingVertical: UNIFIED_THEME.spacing.md,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: UNIFIED_THEME.colors.border.light,
  },
  timePickerOptionSelected: {
    backgroundColor: UNIFIED_THEME.colors.border.default,
  },
  timePickerOptionText: {},
  timePickerOptionTextSelected: {},
  timePickerClose: {
    marginTop: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.md,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    backgroundColor: 'transparent',
    borderRadius: UNIFIED_THEME.borderRadius.sm,
  },
  timePickerCloseText: {
    textAlign: 'center',
  },
  saveButton: {
    marginHorizontal: UNIFIED_THEME.spacing.lg,
    marginVertical: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.lg,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    ...UNIFIED_THEME.shadows.medium,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    textAlign: 'center',
  },
  bottomPadding: {
    height: UNIFIED_THEME.spacing.lg,
  },
});
