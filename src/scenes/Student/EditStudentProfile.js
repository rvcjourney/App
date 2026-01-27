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
import { updateStudentProfile } from '../../../database/database';

export default function EditStudentProfile({ navigation }) {
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

          // Get student profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

          if (profile?.full_name) {
            setFullName(profile.full_name);
          }

          // Get student details
          const { data: studentData } = await supabase
            .from('student_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (studentData) {
            setGradeLevel(studentData.grade_level || '');
            setSubjectsInterested(studentData.subjects_interested || '');
            setPreferredLanguage(studentData.preferred_language || 'English');
          }
        }
        
      } catch (error) {
        console.error('🔴 Error loading profile:', error);
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
      console.log('🔵 [EditStudentProfile] Saving profile...');

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', studentId);

      if (profileError) throw profileError;

      // Update student_profiles table
      const { error: studentError } = await supabase
        .from('student_profiles')
        .update({
          grade_level: gradeLevel,
          subjects_interested: subjectsInterested,
          preferred_language: preferredLanguage,
        })
        .eq('id', studentId);

      if (studentError) throw studentError;

      console.log('✅ Profile updated successfully');
      Toast.show('✅ Profile updated successfully');
      setTimeout(() => navigation.goBack(), 1000);

    } catch (error) {
      console.error('🔴 Save error:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#1E90FF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
        </View>

        <View style={styles.content}>
          {/* Profile Avatar */}
          <View style={styles.avatarSection}>
            <Text style={styles.avatar}>👤</Text>
          </View>

          {/* Full Name */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#999"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          {/* Email */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.input, styles.readonlyInput]}>
              <Text style={styles.readonlyText}>{email}</Text>
            </View>
          </View>

          {/* Grade Level */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>Grade Level</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Class 10, Grade 8"
              placeholderTextColor="#999"
              value={gradeLevel}
              onChangeText={setGradeLevel}
            />
          </View>

          {/* Subjects Interested */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>Subjects Interested</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="e.g., Math, Physics, Chemistry (comma separated)"
              placeholderTextColor="#999"
              value={subjectsInterested}
              onChangeText={setSubjectsInterested}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Preferred Language */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>Preferred Language</Text>
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
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : '💾 Save Changes'}
          </Text>
        </TouchableOpacity>

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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomColor: '#1C1F4A',
    borderBottomWidth: 1,
  },

  backButton: {
    color: '#1E90FF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },

  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },

  avatar: {
    fontSize: 64,
  },

  fieldSection: {
    marginBottom: 20,
  },

  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },

  input: {
    backgroundColor: '#1C1F4A',
    borderColor: '#2A2D5A',
    borderWidth: 1,
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  readonlyInput: {
    justifyContent: 'center',
    opacity: 0.6,
  },

  readonlyText: {
    color: '#999',
    fontSize: 14,
  },

  multilineInput: {
    paddingVertical: 12,
    paddingTop: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  languageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  langBtn: {
    flex: 1,
    backgroundColor: '#1C1F4A',
    borderColor: '#2A2D5A',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },

  langBtnActive: {
    backgroundColor: '#1E90FF',
    borderColor: '#1E90FF',
  },

  langBtnText: {
    color: '#999',
    fontSize: 13,
    fontWeight: '500',
  },

  langBtnTextActive: {
    color: '#fff',
  },

  saveButton: {
    marginHorizontal: 20,
    marginVertical: 20,
    backgroundColor: '#1E90FF',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },

  saveButtonDisabled: {
    opacity: 0.5,
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
