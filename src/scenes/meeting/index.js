import React, { useEffect, useState } from "react";
import { Platform, NativeModules, PermissionsAndroid, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "../../styles/colors";
import {
  MeetingConsumer,
  MeetingProvider,
} from "@videosdk.live/react-native-sdk";
import MeetingContainer from "./MeetingContainer";
import { SCREEN_NAMES } from "../../navigators/screenNames";
const { ForegroundServiceModule } = NativeModules;

// const requestPermissions = async () => {
//   if (Platform.OS !== "android") return true;

//   try {
//     const permissions = [
//       PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
//       PermissionsAndroid.PERMISSIONS.CAMERA,
//       PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
//     ];
//     const granted = await PermissionsAndroid.requestMultiple(permissions);
//     const allGranted = Object.values(granted).every(
//       (permission) => permission === PermissionsAndroid.RESULTS.GRANTED
//     );

//     console.log(allGranted ? "permissions granted" : "permissions denied");

//     return allGranted;
//   } catch (err) {
//     console.error("Error requesting permissions:", err);
//     return false;
//   }
// };
const requestPermissions = async () => {
  if (Platform.OS !== "android") return true;

  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ]);

    const cameraGranted =
      granted[PermissionsAndroid.PERMISSIONS.CAMERA] ===
      PermissionsAndroid.RESULTS.GRANTED;

    const micGranted =
      granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
      PermissionsAndroid.RESULTS.GRANTED;

    if (!cameraGranted || !micGranted) {
      return false;
    }

    if (Platform.Version >= 33) {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
    }

    return true;
  } catch (e) {
    console.log("Permission error", e);
    return false;
  }
};


export default function Meeting({ navigation, route }) {
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  console.log('Meeting component mounted - function signature is valid');
  console.log('Route params:', route?.params);

  const {
    token,
    meetingId,
    micEnabled,
    webcamEnabled,
    name,
    meetingType,
    defaultCamera,
  } = route?.params || {};

  if (!token || !meetingId || !name) {
    console.error('Missing required meeting parameters:', { token: !!token, meetingId: !!meetingId, name: !!name });
    return (
      <SafeAreaView
        edges={["top", "bottom"]}
        style={{ flex: 1, backgroundColor: colors.primary[900], justifyContent: 'center', alignItems: 'center' }}
      >
        <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center' }}>
          Error: Missing meeting parameters. Please try joining again.
        </Text>
      </SafeAreaView>
    );
  }

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const granted = await requestPermissions();
      if (isMounted) setPermissionsGranted(granted);
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleMeetingJoined = async () => {
    if (permissionsGranted) {
      if (Platform.OS === "android") {
        setTimeout(async () => {
          try {
            await ForegroundServiceModule.startService();
          } catch (err) {
            console.error("[Error starting foreground service:", err);
          }
        }, 300);
      }
    }
  };

  const handleMeetingLeft = () => {
    if (Platform.OS === "android") {
      ForegroundServiceModule.stopService();
    }
    navigation.navigate(SCREEN_NAMES.Join);
  };

  if (Platform.OS === "android" && !permissionsGranted) {
    console.log('Waiting for permissions...');
    return (
      <SafeAreaView
        edges={["top", "bottom"]}
        style={{ flex: 1, backgroundColor: colors.primary[900], padding: 12, justifyContent: 'center', alignItems: 'center' }}
      >
        <Text style={{ color: '#fff', fontSize: 16 }}>Requesting permissions...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: colors.primary[900], padding: 12 }}
    >
      <MeetingProvider
        config={{
          meetingId: meetingId,
          micEnabled: micEnabled,
          webcamEnabled: webcamEnabled,
          name: name,
          notification: {
            title: "Video SDK Meeting",
            message: "Meeting is running.",
          },
          defaultCamera: defaultCamera,
        }}
        token={token}
      >
        <MeetingConsumer
          onMeetingJoined={handleMeetingJoined}
          onMeetingLeft={handleMeetingLeft}
        >
          {() => (
            <MeetingContainer
              webcamEnabled={webcamEnabled}
              meetingType={meetingType}
            />
          )}
        </MeetingConsumer>
      </MeetingProvider>
    </SafeAreaView>
  );
}
