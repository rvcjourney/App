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
import UNIFIED_THEME from '../../constants/unifiedTheme';
import ThemedText from '../../components/ThemedText';
import User from '../../assets/icons/User';
import ChevronRight from '../../assets/icons/ChevronRight';

export default function EditStudentProfile({ navigation, onSaveSuccess }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [subjectsInterested, setSubjectsInterested] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentId, setStudentId] = useState(null);

  // Load profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        logger.info('🔵 [EditStudentProfile] Loading profile...');
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setStudentId(user.id);
          setEmail(user.email || '');

          // Get student profile (limit(1) to avoid single-object coercion errors)
          const { data: profileRows } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .limit(1);
          const profile = Array.isArray(profileRows) && profileRows.length > 0 ? profileRows[0] : profileRows;

          if (profile?.full_name) {
            setFullName(profile.full_name);
          }

          // Get student details (maybeSingle in case row not created yet)
          const { data: studentRows } = await supabase
            .from('student_profiles')
            .select('*')
            .eq('id', user.id)
            .limit(1);
          const studentData = Array.isArray(studentRows) && studentRows.length > 0 ? studentRows[0] : studentRows;

          if (studentData) {
            setGradeLevel(studentData.grade_level || '');
            setSubjectsInterested(studentData.subjects_interested || '');
            setPreferredLanguage(studentData.preferred_language || 'English');
          }
        }
        
      } catch (error) {
        logger.error('🔴 Error loading profile:', error);
        Toast.show(error?.message || 'Error loading profile');
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
      logger.info('🔵 [EditStudentProfile] Saving profile...');

      // Update profiles table (full_name)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', studentId);

      if (profileError) {
        logger.error('🔴 Profile update error:', profileError);
        throw new Error(profileError.message || 'Could not update name');
      }

      // Upsert student_profiles so row is created if missing (e.g. old account)
      const studentPayload = {
        id: studentId,
        grade_level: gradeLevel || '',
        subjects_interested: subjectsInterested || '',
        preferred_language: preferredLanguage || 'English',
      };
      const { error: studentError } = await supabase
        .from('student_profiles')
        .upsert(studentPayload, { onConflict: 'id' });

      if (studentError) {
        logger.error('🔴 Student profile upsert error:', studentError);
        throw new Error(studentError.message || 'Could not save student details');
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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButtonContainer}
            onPress={() => navigation.goBack()}
          >
            <ChevronRight width={24} height={24} fill={UNIFIED_THEME.colors.accent.primary} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <ThemedText variant="heading" size="md">Edit Profile</ThemedText>
          <View style={{ width: 0 }} />
        </View>

        <View style={styles.content}>
          {/* Profile Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <User width={56} height={56} fill={UNIFIED_THEME.colors.accent.primary} />
            </View>
            <ThemedText variant="body" size="sm" color="muted">Profile Information</ThemedText>
          </View>

          {/* Full Name */}
          <View style={styles.fieldSection}>
            <View style={styles.labelContainer}>
              <ThemedText variant="label" size="md" color="primary">Full Name</ThemedText>
              <ThemedText variant="label" size="md" color="primary" style={{ marginLeft: 4 }}>*</ThemedText>
            </View>
            <View style={styles.inputContainer}>
              <User width={18} height={18} fill={UNIFIED_THEME.colors.accent.primary} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={UNIFIED_THEME.colors.text.muted}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldSection}>
            <View style={styles.labelContainer}>
              <ThemedText variant="label" size="md" color="primary">Email Address</ThemedText>
            </View>
            <View style={[styles.inputContainer, styles.disabledInput]}>
              <ThemedText variant="body" size="md" color="muted">{email}</ThemedText>
              <ThemedText variant="body" size="xs" color="muted" style={{ marginLeft: 8 }}>(Cannot be changed)</ThemedText>
            </View>
          </View>

          {/* Grade Level */}
          <View style={styles.fieldSection}>
            <View style={styles.labelContainer}>
              <ThemedText variant="label" size="md" color="primary">Grade Level</ThemedText>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g., Class 10, Grade 8"
                placeholderTextColor={UNIFIED_THEME.colors.text.muted}
                value={gradeLevel}
                onChangeText={setGradeLevel}
              />
            </View>
          </View>

          {/* Subjects Interested */}
          <View style={styles.fieldSection}>
            <View style={styles.labelContainer}>
              <ThemedText variant="label" size="md" color="primary">Subjects Interested</ThemedText>
            </View>
            <View style={[styles.inputContainer, styles.multilineContainer]}>
              <TextInput
                style={styles.multilineInput}
                placeholder="e.g., Math, Physics, Chemistry (comma separated)"
                placeholderTextColor={UNIFIED_THEME.colors.text.muted}
                value={subjectsInterested}
                onChangeText={setSubjectsInterested}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Preferred Language */}
          <View style={styles.fieldSection}>
            <View style={styles.labelContainer}>
              <ThemedText variant="label" size="md" color="primary">Preferred Language</ThemedText>
            </View>
            <View style={styles.languageButtons}>
              {['English', 'Hindi', 'Marathi'].map(lang => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.langBtn,
                    preferredLanguage === lang && styles.langBtnActive,
                  ]}
                  onPress={() => setPreferredLanguage(lang)}
                >
                  <ThemedText
                    variant="label"
                    size="sm"
                    color={preferredLanguage === lang ? 'onAccent' : 'muted'}
                  >
                    {lang}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.cancelButton]}
            onPress={() => navigation.goBack()}
            disabled={saving}
          >
            <ThemedText variant="label" size="md" color="primary">Cancel</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <ThemedText variant="label" size="md" color="onAccent">
              {saving ? 'Saving...' : 'Save Changes'}
            </ThemedText>
          </TouchableOpacity>
        </View>

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
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: UNIFIED_THEME.spacing.md,
  },

  content: {
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.xl,
  },

  avatarSection: {
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.xxxl,
  },

  avatarContainer: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 0, 110, 0.15)',
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    borderWidth: 2,
    borderColor: UNIFIED_THEME.colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.md,
    ...UNIFIED_THEME.shadows.glow,
  },

  fieldSection: {
    marginBottom: UNIFIED_THEME.spacing.xl,
  },

  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: UNIFIED_THEME.spacing.md,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    paddingHorizontal: UNIFIED_THEME.spacing.md,
    paddingVertical: UNIFIED_THEME.spacing.xs,
  },

  input: {
    flex: 1,
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 14,
    paddingVertical: UNIFIED_THEME.spacing.md,
  },

  disabledInput: {
    opacity: 0.6,
  },

  multilineContainer: {
    alignItems: 'flex-start',
    paddingVertical: 0,
    minHeight: 100,
  },

  multilineInput: {
    flex: 1,
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 14,
    paddingVertical: UNIFIED_THEME.spacing.md,
    paddingRight: UNIFIED_THEME.spacing.sm,
    maxHeight: 100,
  },

  languageButtons: {
    flexDirection: 'row',
    gap: UNIFIED_THEME.spacing.md,
  },

  langBtn: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1.5,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    paddingVertical: UNIFIED_THEME.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  langBtnActive: {
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    borderColor: UNIFIED_THEME.colors.accent.primary,
    ...UNIFIED_THEME.shadows.glow,
  },

  buttonContainer: {
    flexDirection: 'row',
    gap: UNIFIED_THEME.spacing.md,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.md,
  },

  cancelButton: {
    flex: 1,
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1.5,
    borderRadius: UNIFIED_THEME.borderRadius.round,
    paddingVertical: UNIFIED_THEME.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: UNIFIED_THEME.colors.component.card,
  },

  saveButton: {
    flex: 1,
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    borderRadius: UNIFIED_THEME.borderRadius.round,
    paddingVertical: UNIFIED_THEME.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...UNIFIED_THEME.shadows.glow,
  },

  saveButtonDisabled: {
    opacity: 0.5,
  },
});
