// import React from 'react';
// import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// export default function WelcomeScreen({ navigation }) {
//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Welcome to</Text>
//       <Text style={styles.appName}>LearnEasy</Text>

//       <Text style={styles.subtitle}>
//         Learn from expert teachers{'\n'}
//         via live video classes
//       </Text>

//       <TouchableOpacity
//         style={styles.button}
//         onPress={() => navigation.navigate('RoleSelect')}
//       >
//         <Text style={styles.buttonText}>Get Started →</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#0B0D2A',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },

//   title: {
//     fontSize: 28,
//     color: '#fff',
//   },

//   appName: {
//     fontSize: 36,
//     fontWeight: 'bold',
//     color: '#6CA0FF',
//     marginBottom: 20,
//   },

//   subtitle: {
//     color: '#ccc',
//     fontSize: 16,
//     textAlign: 'center',
//     marginBottom: 40,
//   },

//   button: {
//     backgroundColor: '#1E2BFF',
//     paddingVertical: 14,
//     paddingHorizontal: 40,
//     borderRadius: 30,
//   },

//   buttonText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '600',
//   },
// });

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';

export default function WelcomeScreen({ navigation }) {
  return (
    <ImageBackground
      source={require('../assets/img/star.jpg')} // change path if needed
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>Welcome to</Text>
        <Text style={styles.appName}>LearnEasy</Text>

        <Text style={styles.subtitle}>
          Learn from expert teachers{'\n'}
          via live video classes
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('RoleSelect')}
        >
          <Text style={styles.buttonText}>Get Started →</Text>
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
    padding: 20,
  },

  title: {
    fontSize: 28,
    color: '#fff',
  },

  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#6CA0FF',
    marginBottom: 20,
  },

  subtitle: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },

  button: {
    backgroundColor: '#1E2BFF',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
  },

  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
