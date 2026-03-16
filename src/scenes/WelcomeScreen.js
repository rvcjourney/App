import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import UNIFIED_THEME from '../constants/unifiedTheme';
import Icon from '../components/Icon';
import ThemedText from '../components/ThemedText';

export default function WelcomeScreen({ navigation }) {
  const colors = UNIFIED_THEME.colors.primary.gradient;
  const spacing = UNIFIED_THEME.spacing;
  const shadows = UNIFIED_THEME.shadows;

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      {/* Decorative stars background */}
      {/* <View style={styles.starsContainer}>
        <Icon name="sparkles" size={24} color="accent.primary" style={[styles.star, { left: '15%', top: '10%' }]} />
        <Icon name="sparkles" size={24} color="accent.primary" style={[styles.star, { right: '15%', top: '20%' }]} />
        <Icon name="sparkles" size={24} color="accent.primary" style={[styles.star, { left: '20%', bottom: '25%' }]} />
        <Icon name="sparkles" size={24} color="accent.primary" style={[styles.star, { right: '25%', bottom: '40%' }]} />
        <Icon name="sparkles" size={24} color="accent.primary" style={[styles.star, { left: '5%', top: '50%' }]} />
        <Icon name="sparkles" size={24} color="accent.primary" style={[styles.star, { right: '5%', top: '42%' }]} />
      </View> */}

      <SafeAreaView style={styles.overlay}>
        {/* Logo/Icon placeholder */}
        <View style={[styles.logoContainer, shadows.glow]}>
          <Icon name="videoCam" size={40} color="accent.secondary" />
        </View>

        <ThemedText variant="heading" size="md" color="secondary" style={styles.title}>
          Connect with Your
        </ThemedText>

        <View style={styles.appNameContainer}>
          <ThemedText variant="heading" size="lg" color="primary" style={styles.appName}>
            Favorite Celebrities
          </ThemedText>
        </View>

        <ThemedText color="muted" style={styles.subtitle}>
          via Video Call{'\n'}
          Where Fans & Stars Meet
        </ThemedText>

        <TouchableOpacity
          style={[styles.button, shadows.large]}
          onPress={() => navigation.navigate('RoleSelect')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[UNIFIED_THEME.colors.accent.primary, UNIFIED_THEME.colors.accent.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <ThemedText color="onAccent" weight="700" style={styles.buttonText}>
              Get Started →
            </ThemedText>
          </LinearGradient>
        </TouchableOpacity>

        {/* Social proof text */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Icon name="star" size={20} color="accent.primary" style={styles.statIconSpacing} />
            <ThemedText size="sm" weight="600" color="secondary" style={styles.statText}>
              100K+ Celebrities
            </ThemedText>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Icon name="lock" size={20} color="accent.primary" style={styles.statIconSpacing} />
            <ThemedText size="sm" weight="600" color="secondary" style={styles.statText}>
              Secure Payment
            </ThemedText>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Icon name="video" size={20} color="accent.primary" style={styles.statIconSpacing} />
            <ThemedText size="sm" weight="600" color="secondary" style={styles.statText}>
              Instant Video Call
            </ThemedText>
          </View>
        </View>
      </SafeAreaView>
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
    opacity: 0.8,
  },

  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: UNIFIED_THEME.spacing.lg,
  },

  logoContainer: {
    marginBottom: UNIFIED_THEME.spacing.xxxl,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: UNIFIED_THEME.colors.border.light,
    borderWidth: 2,
    borderColor: UNIFIED_THEME.colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    textAlign: 'center',
    marginBottom: UNIFIED_THEME.spacing.sm,
    letterSpacing: 0.5,
  },

  appNameContainer: {
    marginBottom: UNIFIED_THEME.spacing.xl,
  },

  appName: {
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 52,
  },

  subtitle: {
    textAlign: 'center',
    marginBottom: UNIFIED_THEME.spacing.xxxl,
    lineHeight: 24,
  },

  button: {
    width: '100%',
    marginBottom: UNIFIED_THEME.spacing.xxxl,
    borderRadius: UNIFIED_THEME.borderRadius.round,
    overflow: 'hidden',
  },

  buttonGradient: {
    paddingVertical: UNIFIED_THEME.spacing.md,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: UNIFIED_THEME.borderRadius.round,
  },

  buttonText: {
    letterSpacing: 0.5,
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    paddingVertical: UNIFIED_THEME.spacing.lg,
    backgroundColor: UNIFIED_THEME.colors.component.input,
    borderRadius: UNIFIED_THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: UNIFIED_THEME.colors.border.light,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statIconSpacing: {
    marginBottom: UNIFIED_THEME.spacing.xs,
  },

  statText: {
    textAlign: 'center',
  },

  divider: {
    width: 1,
    height: 30,
    backgroundColor: UNIFIED_THEME.colors.border.light,
    marginHorizontal: UNIFIED_THEME.spacing.sm,
  },
});
