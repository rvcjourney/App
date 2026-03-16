import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';
import { supabase } from '../../../supabase';
import logger from '../../utils/logger';
import { PROFESSIONS } from '../../constants/professions';
import UNIFIED_THEME from '../../constants/unifiedTheme';
import ThemedText from '../../components/ThemedText';
import ChevronRight from '../../assets/icons/ChevronRight';
import User from '../../assets/icons/User';

export default function EditTeacherProfile({ navigation, onSaveSuccess }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [specializations, setSpecializations] = useState('');
  const [pricePerCall, setPricePerCall] = useState('500');
  const [experienceYears, setExperienceYears] = useState('');
  const [profession, setProfession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teacherId, setTeacherId] = useState(null);

  // Load profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        logger.info('EditTeacherProfile: Loading profile...');

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setTeacherId(user.id);
          setEmail(user.email || '');

          // Get teacher profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

          if (profile?.full_name) {
            setFullName(profile.full_name);
          }

          // Get teacher details (maybeSingle in case row not created yet)
          const { data: teacherRows } = await supabase
            .from('teacher_profiles')
            .select('*')
            .eq('id', user.id)
            .limit(1);
          const teacherData = Array.isArray(teacherRows) && teacherRows.length > 0 ? teacherRows[0] : teacherRows;

          if (teacherData) {
            setBio(teacherData.bio || '');
            setSpecializations(teacherData.specializations || '');
            setPricePerCall(String(teacherData.price_per_call || 500));
            setExperienceYears(String(teacherData.experience_years || ''));
            setProfession(teacherData.profession || null);
          }
        }

      } catch (error) {
        logger.error('EditTeacherProfile: Error loading profile:', error);
        Toast.show('Error loading profile');
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, []);

  const handleSave = async () => {
    try {
      if (!fullName.trim()) {
        Alert.alert('Error', 'Name is required');
        return;
      }

      setSaving(true);
      logger.info('🔵 [EditTeacherProfile] Saving profile...');

      // Update profiles table (full_name)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', teacherId);

      if (profileError) {
        logger.error('🔴 Profile update error:', profileError);
        throw new Error(profileError.message || 'Could not update name');
      }

      // Upsert teacher_profiles so row is created if missing (e.g. old account)
      const teacherPayload = {
        id: teacherId,
        bio: bio || '',
        specializations: specializations || '',
        price_per_call: parseInt(pricePerCall, 10) || 500,
        experience_years: parseInt(experienceYears, 10) || 0,
        profession: profession || null,
        rating: 4.8,
        followers: 0,
      };
      const { error: teacherError } = await supabase
        .from('teacher_profiles')
        .upsert(teacherPayload, { onConflict: 'id' });

      if (teacherError) {
        logger.error('🔴 Teacher profile upsert error:', teacherError);
        throw new Error(teacherError.message || 'Could not save teacher details');
      }

      logger.info('✅ Profile updated successfully');
      Toast.show('✅ Profile updated successfully');
      if (onSaveSuccess) {
        onSaveSuccess();
      } else {
        setTimeout(() => navigation.goBack(), 1000);
      }

    } catch (error) {
      logger.error('🔴 Save error:', error);
      const msg = error?.message || 'Failed to save profile';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={UNIFIED_THEME.colors.accent.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButtonContainer} onPress={() => navigation.goBack()}>
            {/* <ThemedText style={styles.backButton}>← Back</ThemedText> */}
            <ChevronRight width={24} height={24} fill={UNIFIED_THEME.colors.accent.primary} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <ThemedText variant="heading" size="md" style={{ flex: 1 }}>Edit Profile</ThemedText>
        </View>

        <View style={styles.content}>
          {/* Profile Avatar */}
          <View style={styles.avatarSection}>
            {/* <Text style={styles.avatar}>👨‍🏫</Text> */}
            <User width={60} height={60} fill="#ff006e" />
          </View>

          {/* Full Name */}
          <View style={styles.fieldSection}>
            <ThemedText variant="label" size="md" color="primary">Full Name *</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor={UNIFIED_THEME.colors.text.muted}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          {/* Email */}
          <View style={styles.fieldSection}>
            <ThemedText variant="label" size="md" color="primary">Email</ThemedText>
            <View style={[styles.input, styles.readonlyInput]}>
              <ThemedText variant="body" size="md" color="muted">{email}</ThemedText>
            </View>
          </View>

          {/* Profession */}
          <View style={styles.fieldSection}>
            <ThemedText variant="label" size="md" color="primary">Profession (Optional)</ThemedText>
            <View style={styles.professionGrid}>
              {PROFESSIONS.map((prof) => (
                <TouchableOpacity
                  key={prof.id}
                  style={[
                    styles.professionCard,
                    profession === prof.name && styles.professionCardSelected,
                  ]}
                  onPress={() => setProfession(prof.name)}
                >
                  <ThemedText style={styles.professionIcon}>{prof.icon}</ThemedText>
                  <ThemedText variant="label" size="sm" color="primary" style={{ textAlign: 'center' }}>{prof.name}</ThemedText>
                  {profession === prof.name && (
                    <ThemedText style={styles.professionCheckmark}>✓</ThemedText>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bio */}
          <View style={styles.fieldSection}>
            <ThemedText variant="label" size="md" color="primary">Bio</ThemedText>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Write a brief bio about yourself..."
              placeholderTextColor={UNIFIED_THEME.colors.text.muted}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Specializations */}
          <View style={styles.fieldSection}>
            <ThemedText variant="label" size="md" color="primary">Specializations</ThemedText>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="e.g., Math, Physics, Chemistry (comma separated)"
              placeholderTextColor={UNIFIED_THEME.colors.text.muted}
              value={specializations}
              onChangeText={setSpecializations}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Price Per Hour Call */}
          <View style={styles.fieldSection}>
            <ThemedText variant="label" size="md" color="primary">Price Per Hour Call (₹)</ThemedText>
            <View style={styles.priceRow}>
              <TouchableOpacity
                style={styles.priceAdjustBtn}
                onPress={() => setPricePerCall(String(Math.max(100, parseInt(pricePerCall) - 50)))}
              >
                <ThemedText variant="heading" size="md" color="primary">-</ThemedText>
              </TouchableOpacity>
              <TextInput
                style={[styles.input, styles.priceInput]}
                placeholder="500"
                placeholderTextColor={UNIFIED_THEME.colors.text.muted}
                value={pricePerCall}
                onChangeText={setPricePerCall}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.priceAdjustBtn}
                onPress={() => setPricePerCall(String(parseInt(pricePerCall) + 50 || 550))}
              >
                <ThemedText variant="heading" size="md" color="primary">+</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Experience Years */}
          <View style={styles.fieldSection}>
            <ThemedText variant="label" size="md" color="primary">Years of Experience</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="e.g., 5"
              placeholderTextColor={UNIFIED_THEME.colors.text.muted}
              value={experienceYears}
              onChangeText={setExperienceYears}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <ThemedText variant="label" size="lg" color="onAccent">
            {saving ? 'Saving...' : 'Save Changes'}
          </ThemedText>
        </TouchableOpacity>

        <View style={{ marginBottom: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.primary.light,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingVertical: UNIFIED_THEME.spacing.lg,
    borderBottomColor: UNIFIED_THEME.colors.border.light,
    borderBottomWidth: 1,
  },

  backButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: UNIFIED_THEME.spacing.md,
  },

  content: {
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.lg,
  },

  avatarSection: {
    marginBottom: UNIFIED_THEME.spacing.xxxl,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.round,
    width: 80,
    height: 80,
    alignSelf: 'center',
  },

  avatar: {
    fontSize: 64,
  },

  fieldSection: {
    marginBottom: UNIFIED_THEME.spacing.xl,
  },

  input: {
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 14,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingVertical: UNIFIED_THEME.spacing.md,
  },

  readonlyInput: {
    justifyContent: 'center',
    opacity: 0.6,
  },

  multilineInput: {
    paddingVertical: UNIFIED_THEME.spacing.md,
    paddingTop: UNIFIED_THEME.spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UNIFIED_THEME.spacing.sm,
  },

  priceAdjustBtn: {
    width: 45,
    height: 45,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },

  priceInput: {
    flex: 1,
  },

  professionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: UNIFIED_THEME.spacing.sm,
  },

  professionCard: {
    width: '48%',
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    padding: UNIFIED_THEME.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: UNIFIED_THEME.colors.border.default,
  },

  professionCardSelected: {
    borderColor: UNIFIED_THEME.colors.accent.primary,
    backgroundColor: 'rgba(255, 0, 110, 0.15)',
  },

  professionIcon: {
    fontSize: 32,
    marginBottom: UNIFIED_THEME.spacing.md,
  },

  professionCheckmark: {
    position: 'absolute',
    top: UNIFIED_THEME.spacing.sm,
    right: UNIFIED_THEME.spacing.sm,
    fontSize: 16,
    fontWeight: 'bold',
  },

  saveButton: {
    marginHorizontal: UNIFIED_THEME.spacing.lg,
    marginVertical: UNIFIED_THEME.spacing.lg,
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    paddingVertical: UNIFIED_THEME.spacing.lg,
    alignItems: 'center',
    ...UNIFIED_THEME.shadows.medium,
  },

  saveButtonDisabled: {
    opacity: 0.5,
  },
});
