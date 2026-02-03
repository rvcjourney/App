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
import { supabase } from "../../../supabase";
import { endMeeting } from "../../database/database";
import Toast from "react-native-simple-toast";
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
    bookingId,
    isTeacher,
    studentId,
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
    console.log('📞 Meeting joined! Teacher:', isTeacher, 'BookingId:', bookingId);
    
    // If teacher is starting the meeting, notify the student
    if (isTeacher && bookingId) {
      try {
        // Get current user (teacher)
        const { data: { user } } = await supabase.auth.getUser();
        const teacherId = user?.id;
        
        console.log('📱 Notifying student about meeting start... BookingId:', bookingId, 'TeacherId:', teacherId);
        
        const backendUrl = process.env.REACT_APP_AUTH_URL || 'http://192.168.1.5:3000';
        console.log('🌐 Backend URL:', backendUrl);
        
        const response = await fetch(`${backendUrl}/api/meetings/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: bookingId,
            teacherId: teacherId,
            meetingId: meetingId,
          })
        });

        console.log('📤 Backend response status:', response.status);
        
        const data = await response.json();
        console.log('📨 Backend response data:', JSON.stringify(data, null, 2));
        
        if (data.success) {
          console.log('✅ Student notified successfully with meeting ID:', data.meetingId);
        } else {
          console.error('⚠️ Failed to notify student - Error:', data.error, '| Message:', data.message);
        }
      } catch (error) {
        console.error('🔴 Error notifying student - Fetch error:', error.message);
        console.error('🔴 Error stack:', error);
        // Continue anyway - meeting is running
      }
    }
    
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

  const handleMeetingLeft = async () => {
    if (Platform.OS === "android") {
      try {
        ForegroundServiceModule.stopService();
      } catch (e) {
        console.warn("Foreground service stop:", e);
      }
    }
    // When teacher leaves, mark booking as completed in DB
    if (isTeacher && bookingId && meetingId) {
      try {
        await endMeeting(bookingId, meetingId);
      } catch (e) {
        console.error("Error ending meeting in DB:", e);
      }
    }
    Toast.show("Meeting completed");
    const dashboardName = isTeacher ? "TeacherDashboard" : "StudentDashboard";
    navigation.reset({
      index: 0,
      routes: [{ name: dashboardName }],
    });
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
              isTeacher={isTeacher}
            />
          )}
        </MeetingConsumer>
      </MeetingProvider>
    </SafeAreaView>
  );
}
