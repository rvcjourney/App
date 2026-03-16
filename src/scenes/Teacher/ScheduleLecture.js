import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';
import { supabase } from '../../../supabase';
import UNIFIED_THEME from '../../constants/unifiedTheme';
import ThemedText from '../../components/ThemedText';


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
        logger.error('Error getting teacher ID:', error);
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
      logger.error('Error scheduling lecture:', error);
      Alert.alert('Error', 'Failed to schedule lecture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ThemedText variant="labelLg" color={UNIFIED_THEME.colors.accent.primary}>← Back</ThemedText>
        </TouchableOpacity>
        <ThemedText variant="headingXs" color={UNIFIED_THEME.colors.text.primary} style={styles.title}>Schedule a Lecture</ThemedText>
      </View>

      <View style={styles.comingSoonContainer}>
        <ThemedText style={styles.comingSoonIcon}>🚀</ThemedText>
        <ThemedText variant="headingMd" color={UNIFIED_THEME.colors.accent.primary} style={styles.comingSoonTitle}>Coming Soon</ThemedText>
        <ThemedText variant="bodyMd" color={UNIFIED_THEME.colors.text.muted} style={styles.comingSoonText}>Lecture scheduling feature will be available soon</ThemedText>
        <TouchableOpacity
          style={styles.scheduleBtn}
          onPress={() => navigation.goBack()}
        >
          <ThemedText variant="labelLg" color={UNIFIED_THEME.colors.text.primary}>Go Back</ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
  },

  header: {
    paddingHorizontal: UNIFIED_THEME.spacing.xl,
    paddingVertical: UNIFIED_THEME.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },

  title: {
    marginLeft: UNIFIED_THEME.spacing.lg,
    flex: 1,
  },

  section: {
    marginHorizontal: UNIFIED_THEME.spacing.xl,
    marginVertical: UNIFIED_THEME.spacing.md,
  },

  label: {
    marginBottom: UNIFIED_THEME.spacing.lg,
  },

  input: {
    backgroundColor: UNIFIED_THEME.colors.component.input,
    color: UNIFIED_THEME.colors.text.primary,
    paddingVertical: UNIFIED_THEME.spacing.md,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    fontSize: 14,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
  },

  textArea: {
    textAlignVertical: 'top',
    paddingVertical: UNIFIED_THEME.spacing.lg,
    minHeight: 100,
  },

  dateInput: {
    backgroundColor: UNIFIED_THEME.colors.component.input,
    paddingVertical: UNIFIED_THEME.spacing.md,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
  },

  dateText: {
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 14,
  },

  timeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: UNIFIED_THEME.spacing.sm,
  },

  timeBtn: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingVertical: UNIFIED_THEME.spacing.sm,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    flex: 0.31,
    alignItems: 'center',
  },

  timeBtnActive: {
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
  },

  timeBtnText: {
    color: UNIFIED_THEME.colors.text.muted,
    fontSize: 12,
    fontWeight: '600',
  },

  timeBtnTextActive: {
    color: UNIFIED_THEME.colors.text.primary,
  },

  summaryCard: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    marginHorizontal: UNIFIED_THEME.spacing.xl,
    marginVertical: UNIFIED_THEME.spacing.lg,
    padding: UNIFIED_THEME.spacing.lg,
    borderRadius: UNIFIED_THEME.borderRadius.md,
  },

  summaryTitle: {
    marginBottom: UNIFIED_THEME.spacing.lg,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: UNIFIED_THEME.spacing.sm,
    borderBottomColor: UNIFIED_THEME.colors.primary.light,
    borderBottomWidth: 1,
  },

  buttonContainer: {
    flexDirection: 'row',
    gap: UNIFIED_THEME.spacing.sm,
    paddingHorizontal: UNIFIED_THEME.spacing.xl,
    paddingVertical: UNIFIED_THEME.spacing.lg,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
  },

  cancelBtn: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    paddingVertical: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
  },

  scheduleBtn: {
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    paddingVertical: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.sm,
    paddingHorizontal: UNIFIED_THEME.spacing.xl,
  },

  scheduleBtnDisabled: {
    opacity: 0.6,
  },

  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: UNIFIED_THEME.spacing.xl,
  },

  comingSoonIcon: {
    fontSize: 60,
    marginBottom: UNIFIED_THEME.spacing.xl,
  },

  comingSoonTitle: {
    marginBottom: UNIFIED_THEME.spacing.md,
    textAlign: 'center',
  },

  comingSoonText: {
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
});
