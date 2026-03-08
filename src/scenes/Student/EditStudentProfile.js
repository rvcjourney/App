import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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
        console.log('🔵 [EditStudentProfile] Loading profile...');
        
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
        console.error('🔴 Error loading profile:', error);
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
      console.log('🔵 [EditStudentProfile] Saving profile...');

      // Update profiles table (full_name)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', studentId);

      if (profileError) {
        console.error('🔴 Profile update error:', profileError);
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
        console.error('🔴 Student profile upsert error:', studentError);
        throw new Error(studentError.message || 'Could not save student details');
      }

      console.log('✅ Profile updated successfully');
      Toast.show('✅ Profile updated successfully');
      if (onSaveSuccess) {
        onSaveSuccess();
      } else {
        setTimeout(() => navigation.goBack(), 1000);
      }

    } catch (error) {
      console.error('🔴 Save error:', error);
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
          <ActivityIndicator size="large" color="#1E90FF" />
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
            <ChevronRight width={24} height={24} fill="#5568FE" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <View style={{ width: 0 }} />
        </View>

        <View style={styles.content}>
          {/* Profile Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <User width={56} height={56} fill="#5568FE" />
            </View>
            <Text style={styles.profileHint}>Profile Information</Text>
          </View>

          {/* Full Name */}
          <View style={styles.fieldSection}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Full Name</Text>
              <Text style={styles.required}>*</Text>
            </View>
            <View style={styles.inputContainer}>
              <User width={18} height={18} fill="#5568FE" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#666"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldSection}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Email Address</Text>
            </View>
            <View style={[styles.inputContainer, styles.disabledInput]}>
              <Text style={styles.readonlyText}>{email}</Text>
              <Text style={styles.emailHint}>(Cannot be changed)</Text>
            </View>
          </View>

          {/* Grade Level */}
          <View style={styles.fieldSection}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Grade Level</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g., Class 10, Grade 8"
                placeholderTextColor="#666"
                value={gradeLevel}
                onChangeText={setGradeLevel}
              />
            </View>
          </View>

          {/* Subjects Interested */}
          <View style={styles.fieldSection}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Subjects Interested</Text>
            </View>
            <View style={[styles.inputContainer, styles.multilineContainer]}>
              <TextInput
                style={styles.multilineInput}
                placeholder="e.g., Math, Physics, Chemistry (comma separated)"
                placeholderTextColor="#666"
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
              <Text style={styles.label}>Preferred Language</Text>
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
                  <Text
                    style={[
                      styles.langBtnText,
                      preferredLanguage === lang && styles.langBtnTextActive,
                    ]}
                  >
                    {lang}
                  </Text>
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
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Text>
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
    backgroundColor: '#0B0D2A',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomColor: '#1C1F4A',
    borderBottomWidth: 1,
  },

  backButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1C1F4A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '10',
  },

  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },

  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },

  avatarContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#1C1F4A',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  profileHint: {
    color: '#999',
    fontSize: 13,
    fontWeight: '500',
  },

  fieldSection: {
    marginBottom: 22,
  },

  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  required: {
    color: '#FF6B6B',
    marginLeft: 4,
    fontWeight: 'bold',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1F4A',
    borderColor: '#2A2D5A',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },

  input: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    paddingVertical: 12,
  },

  disabledInput: {
    opacity: 0.6,
  },

  readonlyText: {
    color: '#999',
    fontSize: 14,
    flex: 1,
  },

  emailHint: {
    color: '#666',
    fontSize: 11,
    marginLeft: 8,
  },

  multilineContainer: {
    alignItems: 'flex-start',
    paddingVertical: 0,
    minHeight: 100,
  },

  multilineInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    paddingVertical: 12,
    paddingRight: 8,
    maxHeight: 100,
  },

  languageButtons: {
    flexDirection: 'row',
    gap: 10,
  },

  langBtn: {
    flex: 1,
    backgroundColor: '#1C1F4A',
    borderColor: '#2A2D5A',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  langBtnActive: {
    backgroundColor: '#5568FE',
    borderColor: '#5568FE',
  },

  langBtnText: {
    color: '#999',
    fontSize: 13,
    fontWeight: '500',
  },

  langBtnTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  cancelButton: {
    flex: 1,
    borderColor: '#2A2D5A',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: '#5568FE',
    fontSize: 15,
    fontWeight: '600',
  },

  saveButton: {
    flex: 1,
    backgroundColor: '#5568FE',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5568FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  saveButtonDisabled: {
    opacity: 0.5,
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
