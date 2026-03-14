import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import COLORS from '../../constants/appColors';

/**
 * Reusable Network Error Modal
 * Displayed when network connectivity is lost
 */
export default function NetworkErrorModal({ visible, onDismiss }) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <Text style={styles.icon}>📡</Text>
              <Text style={styles.title}>Network is Not Connected</Text>
              <Text style={styles.message}>
                Please check your internet connection and try again.
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={onDismiss}
              >
                <Text style={styles.buttonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: COLORS.BORDER,
    borderWidth: 1,
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
  },

  icon: {
    fontSize: 48,
    marginBottom: 15,
  },

  title: {
    color: COLORS.PRIMARY,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },

  message: {
    color: COLORS.TEXT_MUTED,
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },

  button: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
