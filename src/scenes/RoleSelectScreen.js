// import React from 'react';
// import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// export default function RoleSelectScreen({ navigation }) {
//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Select Your Role</Text>

//       <TouchableOpacity
//         style={styles.card}
//         onPress={() => navigation.navigate('Login', { role: 'teacher' })}
//       >
//         <Text style={styles.cardText}>👨‍🏫 Teacher</Text>
//       </TouchableOpacity>

//       <TouchableOpacity
//         style={styles.card}
//         onPress={() => navigation.navigate('Login', { role: 'student' })}
//       >
//         <Text style={styles.cardText}>👩‍🎓 Student</Text>
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
//   },

//   title: {
//     color: '#fff',
//     fontSize: 26,
//     marginBottom: 40,
//   },

//   card: {
//     width: '80%',
//     backgroundColor: '#1C1F4A',
//     padding: 20,
//     borderRadius: 12,
//     marginBottom: 20,
//     alignItems: 'center',
//   },

//   cardText: {
//     color: '#6CA0FF',
//     fontSize: 20,
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
          <Text style={styles.cardText}>👨‍🏫 Teacher</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Login', { role: 'student' })}
        >
          <Text style={styles.cardText}>👩‍🎓 Student</Text>
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
    backgroundColor: '#1C1F4A',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },

  cardText: {
    color: '#6CA0FF',
    fontSize: 20,
    fontWeight: '600',
    // padding:20,
  },
});
