import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { supabase } from '../../supabase';
import databaseApi from '../database/databaseApi';
import logger from '../utils/logger';
import { PROFESSIONS } from '../constants/professions';
import UNIFIED_THEME from '../constants/unifiedTheme';
import ThemedText from '../components/ThemedText';
import Icon from '../components/Icon';

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

      // Update profession via backend API
      await databaseApi.updateProfile(userId, { profession: selectedProf.name });

      logger.success('Profession saved:', selectedProf.name);
      Alert.alert('Success', `You selected ${selectedProf.name}`);

      // Navigate to TeacherDashboard
      navigation.reset({
        index: 0,
        routes: [{ name: 'TeacherDashboard' }],
      });
    } catch (error) {
      logger.error('Error saving profession:', error);
      Alert.alert('Error', 'Failed to save profession. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText variant="heading" size="lg" style={styles.title}>Select Your Profession</ThemedText>
        <ThemedText color="muted" size="sm" style={styles.subtitle}>
          Help students find you by choosing your area of expertise
        </ThemedText>

        <View style={styles.professionGrid}>
          {PROFESSIONS.map((profession) => (
            <TouchableOpacity
              key={profession.id}
              style={[
                styles.professionCard,
                selectedProfession === profession.id && styles.professionCardSelected,
                UNIFIED_THEME.shadows.small,
              ]}
              onPress={() => setSelectedProfession(profession.id)}
              disabled={loading}
            >
              {profession.iconName ? (
                <Icon name={profession.iconName} size={40} color="accent.primary" />
              ) : (
                <ThemedText style={styles.professionIcon}>{profession.icon}</ThemedText>
              )}
              <ThemedText size="sm" weight="600" color="primary" style={styles.professionName}>{profession.name}</ThemedText>
              {selectedProfession === profession.id && (
                <Icon name="check" size={20} color="accent.primary" style={styles.checkmark} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.continueBtn, !selectedProfession && styles.continueDisabled, !selectedProfession || loading ? {} : UNIFIED_THEME.shadows.medium]}
          onPress={handleProfessionSelect}
          disabled={!selectedProfession || loading}
        >
          <ThemedText weight="600" color="onAccent">
            {loading ? 'Saving...' : 'Continue to Dashboard'}
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
  },
  content: {
    padding: UNIFIED_THEME.spacing.lg,
    paddingBottom: UNIFIED_THEME.spacing.xxxl,
  },
  title: {
    textAlign: 'center',
    marginTop: UNIFIED_THEME.spacing.xxxl,
    marginBottom: UNIFIED_THEME.spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: UNIFIED_THEME.spacing.xxxl,
    lineHeight: 20,
  },
  professionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: UNIFIED_THEME.spacing.xxxl,
  },
  professionCard: {
    width: '48%',
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    padding: UNIFIED_THEME.spacing.lg,
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.md,
    borderWidth: 2,
    borderColor: UNIFIED_THEME.colors.border.light,
  },
  professionCardSelected: {
    borderColor: UNIFIED_THEME.colors.accent.primary,
    backgroundColor: 'rgba(255, 0, 110, 0.15)',
  },
  professionIcon: {
    fontSize: 40,
    marginBottom: UNIFIED_THEME.spacing.md,
  },
  professionName: {
    textAlign: 'center',
    lineHeight: 18,
  },
  checkmark: {
    position: 'absolute',
    top: UNIFIED_THEME.spacing.xs,
    right: UNIFIED_THEME.spacing.xs,
  },
  continueBtn: {
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    padding: UNIFIED_THEME.spacing.md,
    borderRadius: UNIFIED_THEME.borderRadius.round,
    alignItems: 'center',
    marginTop: UNIFIED_THEME.spacing.lg,
  },
  continueDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
});
