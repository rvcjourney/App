import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import Briefcase from '../assets/icons/Briefcase';
import GraduationCap from '../assets/icons/GraduationCap';

export default function RoleSelectScreen({ navigation }) {
  return (
    <ImageBackground
      source={require('../assets/img/star.jpg')} // same or different image
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>Select Your Role</Text>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Login', { role: 'teacher' })}
        >
          <View style={styles.cardContent}>
            <Briefcase width={40} height={40} fill="#ff006e" />
            <Text style={styles.cardText}>Instructor</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Login', { role: 'student' })}
        >
          <View style={styles.cardContent}>
            <GraduationCap width={40} height={40} fill="#ff006e" />
            <Text style={styles.cardText}>Learner</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    color: '#fff',
    fontSize: 26,
    marginBottom: 40,
  },

  card: {
    width: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 0, 110, 0.3)',
    borderWidth: 1,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: 'rgba(255, 0, 110, 0.2)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },

  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardText: {
    color: '#ff006e',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
  },
});
