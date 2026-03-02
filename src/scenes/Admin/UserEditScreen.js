import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';
import { SCREEN_NAMES } from '../../navigators/screenNames';
import {
  updateUserProfileForAdmin,
  getTeacherProfileForAdmin,
  getStudentProfileForAdmin,
  updateTeacherProfileForAdmin,
  updateStudentProfileForAdmin,
  createTeacherProfile,
  createStudentProfile,
} from '../../database/database';

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'super_admin', label: 'Super Admin' },
];

const STATUS_OPTIONS = [
  { value: 'online', label: 'Online' },
  { value: 'away', label: 'Away' },
  { value: 'offline', label: 'Offline' },
];

export default function UserEditScreen({ route, navigation }) {
  const { user } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile (all users)
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [role, setRole] = useState((user?.role || 'student').toLowerCase());

  // Teacher-only
  const [bio, setBio] = useState('');
  const [specializations, setSpecializations] = useState('');
  const [pricePerCall, setPricePerCall] = useState('500');
  const [experienceYears, setExperienceYears] = useState('');
  const [rating, setRating] = useState('4.8');
  const [followers, setFollowers] = useState('0');
  const [availabilityStatus, setAvailabilityStatus] = useState('offline');

  // Student-only
  const [gradeLevel, setGradeLevel] = useState('');
  const [subjectsInterested, setSubjectsInterested] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('English');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const [teacher, student] = await Promise.all([
          getTeacherProfileForAdmin(user.id),
          getStudentProfileForAdmin(user.id),
        ]);
        if (teacher) {
          setBio(teacher.bio || '');
          setSpecializations(teacher.specializations || '');
          setPricePerCall(String(teacher.price_per_call ?? 500));
          setExperienceYears(String(teacher.experience_years ?? ''));
          setRating(String(teacher.rating ?? 4.8));
          setFollowers(String(teacher.followers ?? 0));
          setAvailabilityStatus(teacher.availability_status || 'offline');
        }
        if (student) {
          setGradeLevel(student.grade_level || '');
          setSubjectsInterested(student.subjects_interested || '');
          setPreferredLanguage(student.preferred_language || 'English');
        }
      } catch (e) {
        console.error('🔴 UserEdit load:', e);
      }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    const name = fullName.trim();
    if (!name) {
      Toast.show('Name is required');
      return;
    }
    setSaving(true);
    try {
      await updateUserProfileForAdmin(user.id, { full_name: name, role });

      if (role === 'teacher') {
        const existingTeacher = await getTeacherProfileForAdmin(user.id);
        if (!existingTeacher) await createTeacherProfile(user.id, { full_name: name, email: user.email });
        await updateTeacherProfileForAdmin(user.id, {
          bio: bio || '',
          specializations: specializations || '',
          price_per_call: parseInt(pricePerCall, 10) || 500,
          experience_years: parseInt(experienceYears, 10) || 0,
          rating: parseFloat(rating) || 4.8,
          followers: parseInt(followers, 10) || 0,
          availability_status: availabilityStatus || 'offline',
        });
      } else if (role === 'student') {
        const existingStudent = await getStudentProfileForAdmin(user.id);
        if (!existingStudent) await createStudentProfile(user.id, { full_name: name, email: user.email });
        await updateStudentProfileForAdmin(user.id, {
          grade_level: gradeLevel || '',
          subjects_interested: subjectsInterested || '',
          preferred_language: preferredLanguage || 'English',
        });
      }

      Toast.show('User updated');
      navigation.goBack();
    } catch (e) {
      console.error('🔴 UserEdit save:', e);
      Alert.alert('Error', e?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#5568FE" />
          <Text style={styles.loadingText}>Loading user...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit User</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionLabel}>Profile</Text>
          <Text style={styles.label}>User ID</Text>
          <Text style={styles.idText} numberOfLines={1}>{user?.id}</Text>

          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor="#6b7280"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Role</Text>
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[styles.roleChip, role === r.value && styles.roleChipActive]}
                onPress={() => setRole(r.value)}
              >
                <Text style={[styles.roleChipText, role === r.value && styles.roleChipTextActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.verifiedRow}>
            <Text style={styles.label}>Email verified</Text>
            <Text style={styles.verifiedValue}>{user?.email_verified ? 'Yes' : 'No'}</Text>
          </View>

          {/* Teacher details */}
          {role === 'teacher' && (
            <>
              <Text style={styles.sectionLabel}>Teacher details</Text>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="Bio"
                placeholderTextColor="#6b7280"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
              />
              <Text style={styles.label}>Specializations</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="e.g. Math, Physics (comma separated)"
                placeholderTextColor="#6b7280"
                value={specializations}
                onChangeText={setSpecializations}
                multiline
              />
              <Text style={styles.label}>Price per call (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="500"
                placeholderTextColor="#6b7280"
                value={pricePerCall}
                onChangeText={setPricePerCall}
                keyboardType="numeric"
              />
              <Text style={styles.label}>Experience (years)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#6b7280"
                value={experienceYears}
                onChangeText={setExperienceYears}
                keyboardType="numeric"
              />
              <Text style={styles.label}>Rating</Text>
              <TextInput
                style={styles.input}
                placeholder="4.8"
                placeholderTextColor="#6b7280"
                value={rating}
                onChangeText={setRating}
                keyboardType="decimal-pad"
              />
              <Text style={styles.label}>Followers</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#6b7280"
                value={followers}
                onChangeText={setFollowers}
                keyboardType="numeric"
              />
              <Text style={styles.label}>Status</Text>
              <View style={styles.roleRow}>
                {STATUS_OPTIONS.map((s) => (
                  <TouchableOpacity
                    key={s.value}
                    style={[styles.roleChip, availabilityStatus === s.value && styles.roleChipActive]}
                    onPress={() => setAvailabilityStatus(s.value)}
                  >
                    <Text style={[styles.roleChipText, availabilityStatus === s.value && styles.roleChipTextActive]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.walletBtn}
                onPress={() =>
                  navigation.navigate(SCREEN_NAMES.AdminTeacherWallet, {
                    teacherId: user.id,
                    teacherName: user.full_name || 'Teacher',
                  })
                }
              >
                <Text style={styles.walletBtnText}>View teacher wallet</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Student details */}
          {role === 'student' && (
            <>
              <Text style={styles.sectionLabel}>Student details</Text>
              <Text style={styles.label}>Grade level</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 10th, High School"
                placeholderTextColor="#6b7280"
                value={gradeLevel}
                onChangeText={setGradeLevel}
              />
              <Text style={styles.label}>Subjects interested</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="e.g. Math, Science"
                placeholderTextColor="#6b7280"
                value={subjectsInterested}
                onChangeText={setSubjectsInterested}
                multiline
              />
              <Text style={styles.label}>Preferred language</Text>
              <TextInput
                style={styles.input}
                placeholder="English"
                placeholderTextColor="#6b7280"
                value={preferredLanguage}
                onChangeText={setPreferredLanguage}
              />
            </>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D2A' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#9ca3af', marginTop: 10, fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1C1F4A' },
  backBtn: { marginRight: 12 },
  backText: { color: '#5568FE', fontSize: 16, fontWeight: '600' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 24, paddingBottom: 40 },
  sectionLabel: { color: '#5568FE', fontSize: 14, fontWeight: '700', marginTop: 24, marginBottom: 12 },
  label: { color: '#9ca3af', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 14 },
  idText: { color: '#6b7280', fontSize: 12, marginBottom: 4 },
  input: {
    backgroundColor: '#1C1F4A',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: '#fff',
    fontSize: 15,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  roleChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#1C1F4A',
  },
  roleChipActive: { backgroundColor: '#5568FE' },
  roleChipText: { color: '#9ca3af', fontSize: 14, fontWeight: '500' },
  roleChipTextActive: { color: '#fff' },
  walletBtn: {
    backgroundColor: '#1C1F4A',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#5568FE',
  },
  walletBtnText: { color: '#5568FE', fontSize: 15, fontWeight: '600' },
  verifiedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  verifiedValue: { color: '#fff', fontSize: 14 },
  saveBtn: {
    backgroundColor: '#5568FE',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
