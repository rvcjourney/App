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

export default function EditTeacherProfile({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [specializations, setSpecializations] = useState('');
  const [pricePerCall, setPricePerCall] = useState('500');
  const [experienceYears, setExperienceYears] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teacherId, setTeacherId] = useState(null);

  // Load profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        console.log('🔵 [EditTeacherProfile] Loading profile...');
        
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

          // Get teacher details
          const { data: teacherData } = await supabase
            .from('teacher_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (teacherData) {
            setBio(teacherData.bio || '');
            setSpecializations(teacherData.specializations || '');
            setPricePerCall(String(teacherData.price_per_call || 500));
            setExperienceYears(String(teacherData.experience_years || ''));
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
      console.log('🔵 [EditTeacherProfile] Saving profile...');

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', teacherId);

      if (profileError) throw profileError;

      // Update teacher_profiles table
      const { error: teacherError } = await supabase
        .from('teacher_profiles')
        .update({
          bio,
          specializations,
          price_per_call: parseInt(pricePerCall) || 500,
          experience_years: parseInt(experienceYears) || 0,
        })
        .eq('id', teacherId);

      if (teacherError) throw teacherError;

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
            <Text style={styles.avatar}>👨‍🏫</Text>
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

          {/* Bio */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Write a brief bio about yourself..."
              placeholderTextColor="#999"
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Specializations */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>Specializations</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="e.g., Math, Physics, Chemistry (comma separated)"
              placeholderTextColor="#999"
              value={specializations}
              onChangeText={setSpecializations}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Price Per Call */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>Price Per Call (₹)</Text>
            <View style={styles.priceRow}>
              <TouchableOpacity
                style={styles.priceAdjustBtn}
                onPress={() => setPricePerCall(String(Math.max(100, parseInt(pricePerCall) - 50)))}
              >
                <Text style={styles.priceAdjustText}>-</Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.input, styles.priceInput]}
                placeholder="500"
                placeholderTextColor="#999"
                value={pricePerCall}
                onChangeText={setPricePerCall}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.priceAdjustBtn}
                onPress={() => setPricePerCall(String(parseInt(pricePerCall) + 50 || 550))}
              >
                <Text style={styles.priceAdjustText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Experience Years */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>Years of Experience</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 5"
              placeholderTextColor="#999"
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

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  priceAdjustBtn: {
    width: 45,
    height: 45,
    backgroundColor: '#1C1F4A',
    borderColor: '#2A2D5A',
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  priceAdjustText: {
    color: '#1E90FF',
    fontSize: 18,
    fontWeight: '600',
  },

  priceInput: {
    flex: 1,
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
