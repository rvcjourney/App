import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  SafeAreaView,
} from 'react-native';
import UNIFIED_THEME from '../constants/unifiedTheme';
import ThemedText from '../components/ThemedText';
import Icon from '../components/Icon';

export default function RoleSelectScreen({ navigation }) {
  return (
    <ImageBackground
      source={require('../assets/img/star.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.overlay}>
        <ThemedText variant="heading" size="lg" color="primary" style={styles.title}>Select Your Role</ThemedText>

        <TouchableOpacity
          style={[styles.card]}
          onPress={() => navigation.navigate('Login', { role: 'teacher' })}
        >
          <View style={styles.cardContent}>
            <Icon name="briefcase" size={40} color="accent.secondary" />
            <ThemedText weight="600" color="accent.primary" style={styles.cardText}>Instructor</ThemedText>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card]}
          onPress={() => navigation.navigate('Login', { role: 'student' })}
        >
          <View style={styles.cardContent}>
            <Icon name="academicTeacher" size={40} color="accent.secondary" />
            <ThemedText weight="600" color="accent.primary" style={styles.cardText}>Learner</ThemedText>
          </View>
        </TouchableOpacity>
      </SafeAreaView>
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
    padding: UNIFIED_THEME.spacing.lg,
  },

  title: {
    marginBottom: UNIFIED_THEME.spacing.xxxl,
  },

  card: {
    width: '80%',
    backgroundColor: UNIFIED_THEME.colors.component.card,
    borderColor: UNIFIED_THEME.colors.border.light,
    borderWidth: 1,
    padding: UNIFIED_THEME.spacing.lg,
    borderRadius: UNIFIED_THEME.borderRadius.md,
    marginBottom: UNIFIED_THEME.spacing.lg,
    alignItems: 'center',
  },

  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardText: {
    marginTop: UNIFIED_THEME.spacing.md,
  },
});
