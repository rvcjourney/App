import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';
import { supabase } from '../../../supabase';


export default function ScheduleLecture({ navigation, route }) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [duration, setDuration] = useState('60');
  const [capacity, setCapacity] = useState('30');
  const [teacherId, setTeacherId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getTeacherId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Get teacher_profiles entry
          const { data: teacher } = await supabase
            .from('teacher_profiles')
            .select('id')
            .eq('id', user.id)
            .single();
          
          if (teacher) {
            setTeacherId(teacher.id);
          } else {
            Alert.alert('Error', 'Teacher profile not found');
          }
        }
      } catch (error) {
        console.error('Error getting teacher ID:', error);
      }
    };

    getTeacherId();
  }, []);

  const handleScheduleLecture = async () => {
    try {
      // Validate inputs
      if (!subject.trim()) {
        Alert.alert('Error', 'Please enter subject');
        return;
      }
      if (!description.trim()) {
        Alert.alert('Error', 'Please enter description');
        return;
      }

      setLoading(true);

      // Combine date and time
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const lectureDateTime = new Date(selectedDate);
      lectureDateTime.setHours(hours, minutes, 0);

      // Create lecture was removed  (lectures table no longer in use)
      // This functionality is no longer available

      Toast.show('❌ Lecture scheduling is no longer available');
      
      // Reset form
      setSubject('');
      setDescription('');
      setSelectedDate(new Date());
      setSelectedTime('10:00');
      setDuration('60');
      setCapacity('30');

      // Go back
      navigation.goBack();
    } catch (error) {
      console.error('Error scheduling lecture:', error);
      Alert.alert('Error', 'Failed to schedule lecture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Schedule a Lecture</Text>
        </View>

        {/* Subject */}
        <View style={styles.section}>
          <Text style={styles.label}>📚 Subject *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Mathematics, Physics, Chemistry"
            placeholderTextColor="#666"
            value={subject}
            onChangeText={setSubject}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>📝 Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell students what they will learn..."
            placeholderTextColor="#666"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Date */}
        <View style={styles.section}>
          <Text style={styles.label}>📅 Date</Text>
          <TouchableOpacity style={styles.dateInput}>
            <Text style={styles.dateText}>{selectedDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
        </View>

        {/* Time */}
        <View style={styles.section}>
          <Text style={styles.label}>🕐 Time</Text>
          <View style={styles.timeButtons}>
            {['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map(time => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeBtn,
                  selectedTime === time && styles.timeBtnActive,
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text
                  style={[
                    styles.timeBtnText,
                    selectedTime === time && styles.timeBtnTextActive,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={styles.label}>⏱️ Duration (minutes)</Text>
          <TextInput
            style={styles.input}
            placeholder="60"
            placeholderTextColor="#666"
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
          />
        </View>

        {/* Capacity */}
        <View style={styles.section}>
          <Text style={styles.label}>👥 Capacity (max students)</Text>
          <TextInput
            style={styles.input}
            placeholder="30"
            placeholderTextColor="#666"
            value={capacity}
            onChangeText={setCapacity}
            keyboardType="numeric"
          />
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📋 Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subject:</Text>
            <Text style={styles.summaryValue}>{subject || 'Not selected'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date & Time:</Text>
            <Text style={styles.summaryValue}>
              {selectedDate.toLocaleDateString()} at {selectedTime}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration:</Text>
            <Text style={styles.summaryValue}>{duration} minutes</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Capacity:</Text>
            <Text style={styles.summaryValue}>{capacity} students</Text>
          </View>
        </View>

        <View style={{ marginBottom: 30 }} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.scheduleBtn, loading && styles.scheduleBtnDisabled]}
          onPress={handleScheduleLecture}
          disabled={loading}
        >
          <Text style={styles.scheduleBtnText}>
            {loading ? 'Scheduling...' : '✅ Schedule Lecture'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1b3f',
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
  },

  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 20,
    flex: 1,
  },

  section: {
    marginHorizontal: 20,
    marginVertical: 12,
  },

  label: {
    color: '#e0e0e0',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },

  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    fontSize: 14,
    borderColor: 'rgba(255, 0, 110, 0.3)',
    borderWidth: 1,
  },

  textArea: {
    textAlignVertical: 'top',
    paddingVertical: 15,
    minHeight: 100,
  },

  dateInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderColor: 'rgba(255, 0, 110, 0.3)',
    borderWidth: 1,
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 0.31,
    alignItems: 'center',
  },

  timeBtnActive: {
    backgroundColor: '#ff006e',
  },

  timeBtnText: {
    color: '#b0b0b0',
    fontSize: 12,
    fontWeight: '600',
  },

  timeBtnTextActive: {
    color: '#fff',
  },

  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
    borderBottomColor: '#0f1b3f',
    borderBottomWidth: 1,
  },

  summaryLabel: {
    color: '#e0e0e0',
    fontSize: 12,
  },

  summaryValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#0f1b3f',
  },

  cancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    borderRadius: 10,
  },

  cancelBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  scheduleBtn: {
    flex: 1,
    background: 'linear-gradient(135deg, #ff006e, #00d4ff)',
    backgroundColor: 'transparent',   // Use LinearGradient wrapper for gradient
    paddingVertical: 12,
    borderRadius: 10,
  },

  scheduleBtnDisabled: {
    opacity: 0.6,
  },

  scheduleBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
