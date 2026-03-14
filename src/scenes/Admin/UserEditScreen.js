import React, { useState, useEffect } from 'react';
import {
  View,
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
import UNIFIED_THEME from '../../constants/unifiedTheme';
import ThemedText from '../../components/ThemedText';
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
          <ActivityIndicator size="large" color={UNIFIED_THEME.colors.accent.primary} />
          <ThemedText variant="body" size="sm" color="muted" style={styles.loadingText}>Loading user...</ThemedText>
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
            <ThemedText color="primary" style={styles.backText}>← Back</ThemedText>
          </TouchableOpacity>
          <ThemedText variant="heading" size="md" style={styles.title}>Edit User</ThemedText>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText color="primary" style={styles.sectionLabel}>Profile</ThemedText>
          <ThemedText variant="label" size="sm" color="muted" style={styles.label}>User ID</ThemedText>
          <ThemedText variant="body" size="xs" color="muted" numberOfLines={1} style={styles.idText}>{user?.id}</ThemedText>

          <ThemedText variant="label" size="sm" color="muted" style={styles.label}>Full Name *</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor={UNIFIED_THEME.colors.text.muted}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          <ThemedText variant="label" size="sm" color="muted" style={styles.label}>Role</ThemedText>
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[styles.roleChip, role === r.value && styles.roleChipActive]}
                onPress={() => setRole(r.value)}
              >
                <ThemedText
                  variant="label"
                  size="sm"
                  color={role === r.value ? 'onAccent' : 'muted'}
                  style={styles.roleChipText}
                >
                  {r.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.verifiedRow}>
            <ThemedText variant="label" size="sm" color="muted" style={styles.label}>Email verified</ThemedText>
            <ThemedText variant="body" size="sm" style={styles.verifiedValue}>{user?.email_verified ? 'Yes' : 'No'}</ThemedText>
          </View>

          {/* Teacher details */}
          {role === 'teacher' && (
            <>
              <ThemedText color="primary" style={styles.sectionLabel}>Teacher details</ThemedText>
              <ThemedText variant="label" size="sm" color="muted" style={styles.label}>Bio</ThemedText>
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="Bio"
                placeholderTextColor={UNIFIED_THEME.colors.text.muted}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
              />
              <ThemedText variant="label" size="sm" color="muted" style={styles.label}>Specializations</ThemedText>
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="e.g. Math, Physics (comma separated)"
                placeholderTextColor={UNIFIED_THEME.colors.text.muted}
                value={specializations}
                onChangeText={setSpecializations}
                multiline
              />
              <ThemedText variant="label" size="sm" color="muted" style={styles.label}>Price per call (₹)</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="500"
                placeholderTextColor={UNIFIED_THEME.colors.text.muted}
                value={pricePerCall}
                onChangeText={setPricePerCall}
                keyboardType="numeric"
              />
              <ThemedText variant="label" size="sm" color="muted" style={styles.label}>Experience (years)</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={UNIFIED_THEME.colors.text.muted}
                value={experienceYears}
                onChangeText={setExperienceYears}
                keyboardType="numeric"
              />
              <ThemedText variant="label" size="sm" color="muted" style={styles.label}>Rating</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="4.8"
                placeholderTextColor={UNIFIED_THEME.colors.text.muted}
                value={rating}
                onChangeText={setRating}
                keyboardType="decimal-pad"
              />
              <ThemedText variant="label" size="sm" color="muted" style={styles.label}>Followers</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={UNIFIED_THEME.colors.text.muted}
                value={followers}
                onChangeText={setFollowers}
                keyboardType="numeric"
              />
              <ThemedText variant="label" size="sm" color="muted" style={styles.label}>Status</ThemedText>
              <View style={styles.roleRow}>
                {STATUS_OPTIONS.map((s) => (
                  <TouchableOpacity
                    key={s.value}
                    style={[styles.roleChip, availabilityStatus === s.value && styles.roleChipActive]}
                    onPress={() => setAvailabilityStatus(s.value)}
                  >
                    <ThemedText
                      variant="label"
                      size="sm"
                      color={availabilityStatus === s.value ? 'onAccent' : 'muted'}
                      style={styles.roleChipText}
                    >
                      {s.label}
                    </ThemedText>
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
                <ThemedText color="primary" style={styles.walletBtnText}>View teacher wallet</ThemedText>
              </TouchableOpacity>
            </>
          )}

          {/* Student details */}
          {role === 'student' && (
            <>
              <ThemedText color="primary" style={styles.sectionLabel}>Student details</ThemedText>
              <ThemedText variant="label" size="sm" color="muted" style={styles.label}>Grade level</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="e.g. 10th, High School"
                placeholderTextColor={UNIFIED_THEME.colors.text.muted}
                value={gradeLevel}
                onChangeText={setGradeLevel}
              />
              <ThemedText variant="label" size="sm" color="muted" style={styles.label}>Subjects interested</ThemedText>
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="e.g. Math, Science"
                placeholderTextColor={UNIFIED_THEME.colors.text.muted}
                value={subjectsInterested}
                onChangeText={setSubjectsInterested}
                multiline
              />
              <ThemedText variant="label" size="sm" color="muted" style={styles.label}>Preferred language</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="English"
                placeholderTextColor={UNIFIED_THEME.colors.text.muted}
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
              <ActivityIndicator color={UNIFIED_THEME.colors.text.onAccent} size="small" />
            ) : (
              <ThemedText color="onAccent" style={styles.saveBtnText}>Save changes</ThemedText>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UNIFIED_THEME.colors.primary.light },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: UNIFIED_THEME.spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: UNIFIED_THEME.colors.border.light,
  },
  backBtn: { marginRight: UNIFIED_THEME.spacing.md },
  backText: { fontSize: 16, fontWeight: '600' },
  title: { fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: UNIFIED_THEME.spacing.lg, paddingVertical: UNIFIED_THEME.spacing.xxxl, paddingBottom: UNIFIED_THEME.spacing.xxxl },
  sectionLabel: { marginTop: UNIFIED_THEME.spacing.xxxl, marginBottom: UNIFIED_THEME.spacing.md },
  label: { marginBottom: UNIFIED_THEME.spacing.sm, marginTop: UNIFIED_THEME.spacing.md },
  idText: { marginBottom: UNIFIED_THEME.spacing.xs },
  input: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    paddingVertical: UNIFIED_THEME.spacing.md,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    color: UNIFIED_THEME.colors.text.primary,
    fontSize: 15,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: UNIFIED_THEME.spacing.md, marginTop: UNIFIED_THEME.spacing.sm },
  roleChip: {
    paddingVertical: UNIFIED_THEME.spacing.md,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    backgroundColor: UNIFIED_THEME.colors.component.card,
  },
  roleChipActive: { backgroundColor: UNIFIED_THEME.colors.accent.primary },
  roleChipText: {},
  roleChipTextActive: { color: UNIFIED_THEME.colors.text.onAccent },
  walletBtn: {
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    paddingVertical: UNIFIED_THEME.spacing.md,
    alignItems: 'center',
    marginTop: UNIFIED_THEME.spacing.xxxl,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.accent.primary,
  },
  walletBtnText: { fontSize: 15, fontWeight: '600' },
  verifiedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: UNIFIED_THEME.spacing.xxxl },
  verifiedValue: {},
  saveBtn: {
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    paddingVertical: UNIFIED_THEME.spacing.lg,
    alignItems: 'center',
    marginTop: UNIFIED_THEME.spacing.xxxl,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: {},
});
