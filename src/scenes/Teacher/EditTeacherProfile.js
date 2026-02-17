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
import ChevronRight from '../../assets/icons/ChevronRight';
import User from '../../assets/icons/User';

export default function EditTeacherProfile({ navigation, onSaveSuccess }) {
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

      // Update profiles table (full_name)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', teacherId);

      if (profileError) {
        console.error('🔴 Profile update error:', profileError);
        throw new Error(profileError.message || 'Could not update name');
      }

      // Upsert teacher_profiles so row is created if missing (e.g. old account)
      const teacherPayload = {
        id: teacherId,
        bio: bio || '',
        specializations: specializations || '',
        price_per_call: parseInt(pricePerCall, 10) || 500,
        experience_years: parseInt(experienceYears, 10) || 0,
        rating: 4.8,
        followers: 0,
      };
      const { error: teacherError } = await supabase
        .from('teacher_profiles')
        .upsert(teacherPayload, { onConflict: 'id' });

      if (teacherError) {
        console.error('🔴 Teacher profile upsert error:', teacherError);
        throw new Error(teacherError.message || 'Could not save teacher details');
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
        <ActivityIndicator size="large" color="#1E90FF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButtonContainer} onPress={() => navigation.goBack()}>
            {/* <Text style={styles.backButton}>← Back</Text> */}
            <ChevronRight width={24} height={24} fill="#5568FE" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
        </View>

        <View style={styles.content}>
          {/* Profile Avatar */}
          <View style={styles.avatarSection}>
            {/* <Text style={styles.avatar}>👨‍🏫</Text> */}
            <User width={60} height={60} fill="#5568FE" />
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

          {/* Price Per Hour Call */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>Price Per Hour Call (₹)</Text>
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
            {saving ? 'Saving...' : 'Save Changes'}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomColor: '#1C1F4A',
    borderBottomWidth: 1,
  },

  // backButton: {
  //   color: '#1E90FF',
  //   fontSize: 16,
  //   fontWeight: '600',
  //   marginRight: 10,
  // },
  backButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1C1F4A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  avatarSection: {
    marginBottom: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1F4A',
    borderRadius: 100,
    width: 80,
    height: 80,
    alignSelf: 'center',
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
