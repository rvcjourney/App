import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export default function WelcomeScreen({ navigation }) {
  return (
    <LinearGradient
      colors={['#0f1b3f', '#1a0033', '#0d0015']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      {/* Decorative stars background */}
      <View style={styles.starsContainer}>
        <Text style={[styles.star, { left: '10%', top: '15%' }]}>✨</Text>
        <Text style={[styles.star, { right: '15%', top: '20%' }]}>✨</Text>
        <Text style={[styles.star, { left: '20%', bottom: '25%' }]}>✨</Text>
        <Text style={[styles.star, { right: '10%', bottom: '30%' }]}>✨</Text>
        <Text style={[styles.star, { left: '5%', top: '50%' }]}>✨</Text>
        <Text style={[styles.star, { right: '5%', top: '40%' }]}>✨</Text>
      </View>

      <View style={styles.overlay}>
        {/* Logo/Icon placeholder */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>🎥</Text>
        </View>

        <Text style={styles.title}>Connect with Your</Text>

        <View style={styles.appNameContainer}>
          <Text style={styles.appName}>Favorite Celebrities</Text>
        </View>

        <Text style={styles.subtitle}>
          via Video Call{'\n'}
          Where Fans & Stars Meet
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('RoleSelect')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#ff006e', '#00d4ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Get Started →</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Social proof text */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statText}>100K+ Celebrities</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>🔒</Text>
            <Text style={styles.statText}>Secure Payment</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>📹</Text>
            <Text style={styles.statText}>Instant Video Call</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  starsContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },

  star: {
    position: 'absolute',
    fontSize: 24,
    opacity: 0.6,
  },

  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  logoContainer: {
    marginBottom: 30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 0, 110, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 0, 110, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff006e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },

  logoEmoji: {
    fontSize: 40,
  },

  title: {
    fontSize: 24,
    color: '#e0e0e0',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },

  appNameContainer: {
    marginBottom: 20,
  },

  appName: {
    fontSize: 44,
    fontWeight: '700',
    textAlign: 'center',
    color: '#ffffff',
    letterSpacing: -1,
    lineHeight: 52,
  },

  subtitle: {
    color: '#b0b0b0',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 50,
    fontWeight: '500',
    lineHeight: 24,
  },

  button: {
    width: '100%',
    marginBottom: 40,
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: '#ff006e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 15,
  },

  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 110, 0.2)',
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },

  statText: {
    color: '#e0e0e0',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 0, 110, 0.2)',
    marginHorizontal: 8,
  },
});
