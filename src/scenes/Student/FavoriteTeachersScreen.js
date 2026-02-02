import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import User from '../../assets/icons/User';
import HeartFilled from '../../assets/icons/HeartFilled';
import Calendar from '../../assets/icons/Calendar';

const teacherStatusColor = (status) => {
  const s = (status || 'offline').toLowerCase();
  if (s === 'online') return '#22c55e';
  if (s === 'away') return '#eab308';
  return '#6b7280';
};

export default function FavoriteTeachersScreen({ navigation, route }) {
  const favoriteTeachers = route.params?.favoriteTeachers || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Favorite Teachers</Text>
        <View style={{ width: 40 }} />
      </View>

      {favoriteTeachers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💔</Text>
          <Text style={styles.emptyText}>No favorite teachers yet</Text>
          <Text style={styles.emptySubtext}>Tap the heart icon on a teacher to add them here.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
          {favoriteTeachers.map(teacher => (
            <View key={teacher.id} style={styles.card}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatarWrapper}>
                  <User width={40} height={40} fill="#5568FE" />
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: teacherStatusColor(teacher.availability_status) },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.infoContainer}>
                <Text style={styles.name} numberOfLines={1}>
                  {teacher.profile?.full_name || 'Teacher'}
                </Text>
                <Text style={styles.subject} numberOfLines={1}>
                  {typeof teacher.specializations === 'string'
                    ? teacher.specializations.split(',')[0].trim()
                    : 'Subject'}
                </Text>
                <Text style={styles.price}>
                  ₹{teacher.price_per_call || 500}/call
                </Text>
              </View>
              <View style={styles.actions}>
                <HeartFilled width={20} height={20} fill="#FF6B6B" />
                <TouchableOpacity
                  style={styles.scheduleBtn}
                  onPress={() => {
                    // Navigate back and open the schedule from the main dashboard
                    navigation.goBack();
                  }}
                >
                  <Calendar width={20} height={20} fill="#5568FE" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D2A',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backText: {
    color: '#6CA0FF',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#1C1F4A',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1C1F4A',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  subject: {
    color: '#999',
    fontSize: 12,
    marginBottom: 4,
  },
  price: {
    color: '#6CA0FF',
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    alignItems: 'center',
  },
  scheduleBtn: {
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtext: {
    color: '#999',
    fontSize: 13,
    textAlign: 'center',
  },
});

