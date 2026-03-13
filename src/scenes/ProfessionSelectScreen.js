import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { supabase } from '../../supabase';

const PROFESSIONS = [
  { id: 1, name: 'Yoga Profession', icon: '🧘' },
  { id: 2, name: 'Gym Trainer', icon: '💪' },
  { id: 3, name: 'Academic Teacher', icon: '📚' },
  { id: 4, name: 'Business Consultant', icon: '💼' },
  { id: 5, name: 'Astrologers', icon: '🔮' },
];

export default function ProfessionSelectScreen({ navigation, route }) {
  // Get userId from route params (passed from OTP screen) or from auth session
  const routeUserId = route?.params?.userId;
  const [userId, setUserId] = useState(routeUserId || null);

  useEffect(() => {
    // If userId not in route params, get from auth session
    if (!userId) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.id) {
          setUserId(session.user.id);
        }
      });
    }
  }, [userId]);

  const [selectedProfession, setSelectedProfession] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleProfessionSelect = async () => {
    if (!selectedProfession) {
      Alert.alert('Error', 'Please select a profession');
      return;
    }

    setLoading(true);

    try {
      const selectedProf = PROFESSIONS.find(p => p.id === selectedProfession);

      // Update teacher_profiles with profession
      const { error } = await supabase
        .from('teacher_profiles')
        .update({ profession: selectedProf.name })
        .eq('id', userId);

      if (error) throw error;

      console.log('✅ Profession saved:', selectedProf.name);
      Alert.alert('Success', `You selected ${selectedProf.name}`);

      // Navigate to TeacherDashboard
      navigation.reset({
        index: 0,
        routes: [{ name: 'TeacherDashboard' }],
      });
    } catch (error) {
      console.error('❌ Error saving profession:', error);
      Alert.alert('Error', 'Failed to save profession. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Select Your Profession</Text>
      <Text style={styles.subtitle}>
        Help students find you by choosing your area of expertise
      </Text>

      <View style={styles.professionGrid}>
        {PROFESSIONS.map((profession) => (
          <TouchableOpacity
            key={profession.id}
            style={[
              styles.professionCard,
              selectedProfession === profession.id && styles.professionCardSelected,
            ]}
            onPress={() => setSelectedProfession(profession.id)}
            disabled={loading}
          >
            <Text style={styles.professionIcon}>{profession.icon}</Text>
            <Text style={styles.professionName}>{profession.name}</Text>
            {selectedProfession === profession.id && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.continueBtn, !selectedProfession && styles.continueDisabled]}
        onPress={handleProfessionSelect}
        disabled={!selectedProfession || loading}
      >
        <Text style={styles.continueBtnText}>
          {loading ? 'Saving...' : 'Continue to Dashboard'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1b3f',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 10,
  },
  subtitle: {
    color: '#b0b0b0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 20,
  },
  professionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  professionCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 0, 110, 0.3)',
  },
  professionCardSelected: {
    borderColor: '#ff006e',
    backgroundColor: 'rgba(255, 0, 110, 0.15)',
  },
  professionIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  professionName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    color: '#ff006e',
    fontSize: 20,
    fontWeight: 'bold',
  },
  continueBtn: {
    backgroundColor: '#ff006e',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: 'rgba(255, 0, 110, 0.6)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 8,
  },
  continueDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
