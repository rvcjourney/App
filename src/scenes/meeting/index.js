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
import logger from "../../utils/logger";
const { ForegroundServiceModule } = NativeModules;

/**
 * Request Android permissions for camera, microphone, and notifications
 */
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
    logger.error("Permission request error:", e);
    return false;
  }
};


export default function Meeting({ navigation, route }) {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [meetingStartTime, setMeetingStartTime] = useState(null);

  logger.info('Meeting component mounted - function signature is valid');
  logger.info('Route params:', route?.params);

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
    scheduledEndTime,
  } = route?.params || {};

  if (!token || !meetingId || !name) {
    logger.error('Missing required meeting parameters:', { token: !!token, meetingId: !!meetingId, name: !!name });
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
    logger.info('📞 Meeting joined! Teacher:', isTeacher, 'BookingId:', bookingId);
    
    // Record when the meeting started (for calculating duration later)
    setMeetingStartTime(new Date());
    
    // If teacher is starting the meeting, notify the student
    if (isTeacher && bookingId) {
      try {
        // Get current user (teacher)
        const { data: { user } } = await supabase.auth.getUser();
        const teacherId = user?.id;
        
        logger.info('📱 Notifying student about meeting start... BookingId:', bookingId, 'TeacherId:', teacherId);
        
        const backendUrl = process.env.REACT_APP_AUTH_URL || 'http://192.168.1.19:3000';
        logger.info('🌐 Backend URL:', backendUrl);
        
        const response = await fetch(`${backendUrl}/api/meetings/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: bookingId,
            teacherId: teacherId,
            meetingId: meetingId,
          })
        });

        logger.info('📤 Backend response status:', response.status);
        
        const data = await response.json();
        logger.info('📨 Backend response data:', JSON.stringify(data, null, 2));
        
        if (data.success) {
          logger.info('✅ Student notified successfully with meeting ID:', data.meetingId);
        } else {
          logger.error('⚠️ Failed to notify student - Error:', data.error, '| Message:', data.message);
        }
      } catch (error) {
        logger.error('🔴 Error notifying student - Fetch error:', error.message);
        logger.error('🔴 Error stack:', error);
        // Continue anyway - meeting is running
      }
    }
    
    if (permissionsGranted) {
      if (Platform.OS === "android") {
        setTimeout(async () => {
          try {
            await ForegroundServiceModule.startService();
          } catch (err) {
            logger.error("[Error starting foreground service:", err);
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
        logger.warn("Foreground service stop:", e);
      }
    }
    // When teacher leaves, mark booking as completed in DB
    if (isTeacher && bookingId && meetingId) {
      try {
        // Calculate meeting duration in minutes
        const duration = meetingStartTime 
          ? Math.round((new Date() - meetingStartTime) / 60000) 
          : 60; // Default to 60 minutes if start time not tracked
        
        logger.info(`⏱️ Meeting duration: ${duration} minutes`);
        await endMeeting(bookingId, meetingId, duration);
      } catch (e) {
        logger.error("Error ending meeting in DB:", e);
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
    logger.info('Waiting for permissions...');
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
              scheduledEndTime={scheduledEndTime}
            />
          )}
        </MeetingConsumer>
      </MeetingProvider>
    </SafeAreaView>
  );
}
