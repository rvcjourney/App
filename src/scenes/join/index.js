import {
  RTCView,
  createCameraVideoTrack,
  switchAudioDevice,
  useMediaDevice,
} from "@videosdk.live/react-native-sdk";
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  BackHandler,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  FlatList,
  Alert,
  PermissionsAndroid,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MicOff,
  MicOn,
  VideoOff,
  VideoOn,
  CameraSwitch,
  Speaker,
} from "../../assets/icons";
import TextInputContainer from "../../components/TextInputContainer";
import Button from "../../components/Button";
import colors from "../../styles/colors";
import { createMeeting, getToken, validateMeeting } from "../../api/api";
import { SCREEN_NAMES } from "../../navigators/screenNames";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-simple-toast";
import Menu from "../../components/Menu";
import MenuItem from "../meeting/Components/MenuItem";
import { ROBOTO_FONTS } from "../../styles/fonts";
import Modal from "react-native-modal";
import { supabase } from "../../../supabase";
import logger from "../../utils/logger";

export default function Join({ navigation, route }) {
  logger.info('Join component mounted');
  const { booking, isTeacher, meetingId: routeMeetingId, bookingId, studentId, name: routeName } = route?.params || {};
  logger.info('Join route params:', { booking, isTeacher, routeMeetingId, bookingId, studentId, routeName });
  
  const [tracks, setTrack] = useState(null);
  const [micOn, setMicon] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [name, setName] = useState(routeName || "");
  const [meetingId, setMeetingId] = useState(routeMeetingId || "");
  const [isAudioListVisible, setAudioListVisible] = useState(false);
  const [facingMode, setFacingMode] = useState("user");
  const [audioList, setAudioList] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [loadingTeacherName, setLoadingTeacherName] = useState(false);

  const meetingTypes = [
    { key: "ONE_TO_ONE", value: "One to One Meeting" },
    { key: "GROUP", value: "Group Meeting" },
  ];

  const [meetingType, setMeetingType] = useState(meetingTypes[0]);
  const [isVisibleCreateMeetingContainer, setIsVisibleCreateMeetingContainer] = useState(false);
  const [isVisibleJoinMeetingContainer, setIsVisibleJoinMeetingContainer] = useState(false);

  const optionRef = useRef();
  const { getAudioDeviceList } = useMediaDevice();

  // ---------------- Permission Handler ----------------
  const requestCameraAndMicPermissions = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        if (
          granted[PermissionsAndroid.PERMISSIONS.CAMERA] !== PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] !== PermissionsAndroid.RESULTS.GRANTED
        ) {
          Alert.alert(
            "Permissions Required",
            "Camera and Microphone permissions are required to join a meeting."
          );
          return false;
        }
        return true;
      } catch (err) {
        logger.warn(err);
        return false;
      }
    }
    return true; // iOS permissions handled automatically
  };

  // ---------------- Video Track ----------------
  const getTrack = async () => {
    const hasPermission = await requestCameraAndMicPermissions();
    if (!hasPermission) return;

    const track = await createCameraVideoTrack({
      optimizationMode: "motion",
      encoderConfig: "h720p_w960p",
      facingMode: facingMode,
    });
    setTrack(track);
  };

  const disposeVideoTrack = () => {
    if (tracks) {
      tracks.getTracks().forEach((track) => (track.enabled = false));
      setTrack(null);
    }
  };

  useEffect(() => {
    getTrack();
  }, [facingMode]);

  // Fetch teacher's name when teacher is creating a meeting
  useEffect(() => {
    const fetchTeacherName = async () => {
      if (isTeacher && !name && !routeName) {
        try {
          setLoadingTeacherName(true);
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profileRows } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', user.id)
              .limit(1);

            const profile = Array.isArray(profileRows) && profileRows.length > 0 ? profileRows[0] : profileRows;

            if (profile?.full_name) {
              logger.info('✅ [Join] Teacher name fetched:', profile.full_name);
              setName(profile.full_name);
            }
          }
        } catch (error) {
          logger.error('🔴 [Join] Error fetching teacher name:', error);
        } finally {
          setLoadingTeacherName(false);
        }
      }
    };

    fetchTeacherName();
  }, [isTeacher]);

  // Auto-join meeting if student is coming from dashboard with meeting_id
  useEffect(() => {
    const autoJoinMeeting = async () => {
      if (routeMeetingId && routeName && !isTeacher) {
        logger.info('📱 Auto-joining meeting for student...');
        
        // Slight delay to ensure UI is ready
        setTimeout(async () => {
          try {
            const hasPermission = await requestCameraAndMicPermissions();
            if (!hasPermission) return;

            logger.info('🟡 [Join] Getting token for student...');
            const token = await getToken();
            if (!token) {
              Toast.show("❌ Failed to get authentication token");
              return;
            }
            logger.info('✅ [Join] Token received');

            logger.info('🟡 [Join] Validating meeting...');
            const valid = await validateMeeting({ token, meetingId: routeMeetingId.trim() });
            
            if (!valid) {
              Toast.show("❌ Invalid meeting code");
              return;
            }
            logger.info('✅ [Join] Meeting validated');

            disposeVideoTrack();
            logger.info('🟡 [Join] Navigating to meeting screen...');
            
            // Scheduled end for student join (if booking passed with slot info)
            const scheduledEndTime = route?.params?.booking?.booked_date != null && route?.params?.booking?.duration_minutes != null
              ? new Date(route.params.booking.booked_date).getTime() + (route.params.booking.duration_minutes || 60) * 60 * 1000
              : undefined;

            navigation.navigate(SCREEN_NAMES.Meeting, {
              name: routeName.trim(),
              token,
              meetingId: routeMeetingId.trim(),
              micEnabled: micOn,
              webcamEnabled: videoOn,
              meetingType: meetingType.key,
              defaultCamera: facingMode === "user" ? "front" : "back",
              bookingId: bookingId,
              isTeacher: false,
              studentId: studentId,
              scheduledEndTime: scheduledEndTime || undefined,
            });
            
            logger.info('✅ [Join] Navigation complete');
          } catch (error) {
            logger.error('🔴 [Join] Error auto-joining meeting:', error);
            const msg = error?.message || 'Something went wrong';
            Toast.show(`❌ ${msg}`);
            if (msg.includes('Cannot reach') || msg.includes('network')) {
              Alert.alert('Video call server unreachable', msg + '\n\nTip: 1) Start backend: npm start in backend folder. 2) Use same IP in .env (REACT_APP_AUTH_URL = http://YOUR_PC_IP:3000). 3) Phone and PC on same WiFi, or use USB + adb reverse tcp:3000 tcp:3000.');
            }
          }
        }, 500);
      }
    };

    autoJoinMeeting();
  }, [routeMeetingId, routeName, isTeacher]);

  // ---------------- Audio Devices ----------------
  const fetchAudioDevices = async () => {
    const devices = await getAudioDeviceList();
    setAudioList(devices);
  };

  const handleDevicePress = async (device) => {
    await switchAudioDevice(device.deviceId);
    setSelectedDeviceId(device.deviceId);
    toggleAudioList();
  };

  const handleAudioButtonPress = async () => {
    await fetchAudioDevices();
    toggleAudioList();
  };

  const toggleAudioList = () => setAudioListVisible(!isAudioListVisible);

  // ---------------- Camera Facing ----------------
  const toggleCameraFacing = () => {
    disposeVideoTrack();
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // ---------------- Back Handler ----------------
  const isMainScreen = () => !isVisibleJoinMeetingContainer && !isVisibleCreateMeetingContainer;

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (!isMainScreen()) {
          setIsVisibleCreateMeetingContainer(false);
          setIsVisibleJoinMeetingContainer(false);
          return true;
        } else return false;
      };

      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [isVisibleCreateMeetingContainer, isVisibleJoinMeetingContainer])
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: colors.primary["900"] }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView
          edges={["top", "bottom"]}
          style={{ flex: 1, backgroundColor: colors.primary["900"], justifyContent: "space-between" }}
        >
          {/* Audio & Camera Controls */}
          <View style={{ flexDirection: "row", justifyContent: "flex-end", padding: 16 }}>
            <TouchableOpacity onPress={handleAudioButtonPress} style={{ padding: 20, marginRight: 10 }}>
              <Speaker width={25} height={25} fill={colors.primary[100]} />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleCameraFacing} style={{ padding: 20, marginRight: 10 }}>
            {/* <TouchableOpacity style={{ padding: 20, marginRight: 10 }}> */}
              <CameraSwitch width={25} height={25} fill={colors.primary[100]} />
            </TouchableOpacity>
          </View>

          {/* Audio Device Modal */}
          <Modal
            isVisible={isAudioListVisible}
            onBackdropPress={toggleAudioList}
            style={{ justifyContent: "flex-end", margin: 0 }}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Available Audio Devices</Text>
              <FlatList
                data={audioList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.deviceButton,
                      item.deviceId === selectedDeviceId && styles.selectedDeviceButton,
                    ]}
                    onPress={() => handleDevicePress(item)}
                  >
                    <Text style={styles.deviceText}>{item.label}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.deviceId}
              />
            </View>
          </Modal>

          {/* Video Preview */}
          <View style={{ paddingTop: "5%", height: "45%" }}>
            <View style={{ flex: 1, width: "50%", alignSelf: "center", borderRadius: 12, overflow: "hidden" }}>
              {videoOn && tracks ? (
                <RTCView
                  streamURL={tracks.toURL()}
                  objectFit="cover"
                  mirror={true}
                  style={{ flex: 1, borderRadius: 20 }}
                />
              ) : (
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#202427",
                  }}
                >
                  <Text style={{ color: colors.primary[100] }}>Camera Off</Text>
                </View>
              )}

              {/* Mic & Camera Buttons */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-evenly",
                  position: "absolute",
                  bottom: 10,
                  right: 0,
                  left: 0,
                }}
              >
                <TouchableOpacity
                  onPress={() => setMicon(!micOn)}
                  style={{
                    height: 50,
                    aspectRatio: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: 100,
                    backgroundColor: micOn ? colors.primary["100"] : "red",
                  }}
                >
                  {micOn ? <MicOn width={25} height={25} fill={colors.black} /> : <MicOff width={25} height={25} fill={colors.primary["100"]} />}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setVideoOn(!videoOn)}
                  style={{
                    height: 50,
                    aspectRatio: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: 100,
                    backgroundColor: videoOn ? colors.primary["100"] : "red",
                  }}
                >
                  {videoOn ? <VideoOn width={25} height={25} fill={colors.black} /> : <VideoOff width={35} height={35} fill={colors.primary["100"]} />}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Create / Join Meeting UI */}
          <View style={{ marginHorizontal: 32 }}>
            {!isVisibleCreateMeetingContainer && !isVisibleJoinMeetingContainer && (
              <>
                <Button text="Create a meeting" onPress={() => setIsVisibleCreateMeetingContainer(true)} />
                <Button text="Join a meeting" backgroundColor="#202427" onPress={() => setIsVisibleJoinMeetingContainer(true)} />
              </>
            )}

            {/* Create Meeting */}
            {isVisibleCreateMeetingContainer && (
              <>
                <TouchableOpacity
                  onPress={() => optionRef.current.show()}
                  style={{ height: 50, justifyContent: "center", alignItems: "center", backgroundColor: "#202427", borderRadius: 12, marginVertical: 12 }}
                >
                  <Text style={{ color: colors.primary["100"], fontSize: 16, fontFamily: ROBOTO_FONTS.RobotoBold }}>{meetingType.value}</Text>
                </TouchableOpacity>
                <Menu ref={optionRef} menuBackgroundColor={colors.primary[700]} fullWidth>
                  {meetingTypes.map((mt, idx) => (
                    <View key={mt.key}>
                      <MenuItem
                        title={mt.value}
                        onPress={() => {
                          optionRef.current.close(true);
                          setMeetingType(mt);
                        }}
                      />
                      {idx !== meetingTypes.length - 1 && <View style={{ height: 1, backgroundColor: colors.primary["600"] }} />}
                    </View>
                  ))}
                </Menu>
                <TextInputContainer placeholder="Enter your name" value={name} setValue={setName} />
                <Button
                  text="Start a meeting"
                  onPress={async () => {
                    if (!name.trim()) return Toast.show("Please enter your name");

                    // ✅ Request permission before joining
                    const hasPermission = await requestCameraAndMicPermissions();
                    if (!hasPermission) return;

                    try {
                      logger.info('🟡 [Join] Starting meeting creation process...');
                      
                      logger.info('🟡 [Join] Getting token...');
                      const token = await getToken();
                      if (!token) {
                        Toast.show("❌ Failed to get authentication token");
                        return;
                      }
                      logger.info('✅ [Join] Token received');

                      logger.info('🟡 [Join] Creating meeting with VideoSDK...');
                      const meetingId = await createMeeting({ token });
                      if (!meetingId) {
                        Toast.show("❌ Failed to create meeting");
                        return;
                      }
                      logger.info('✅ [Join] Meeting created:', meetingId);

                      disposeVideoTrack();
                      logger.info('🟡 [Join] Navigating to meeting screen...');
                      // Scheduled end = booked_date + duration_minutes (for teacher end button & auto-end)
                      const scheduledEndTime = booking?.booked_date && (booking?.duration_minutes != null)
                        ? new Date(booking.booked_date).getTime() + (booking.duration_minutes || 60) * 60 * 1000
                        : undefined;

                      navigation.navigate(SCREEN_NAMES.Meeting, {
                        name: name.trim(),
                        token,
                        meetingId,
                        micEnabled: micOn,
                        webcamEnabled: videoOn,
                        meetingType: meetingType.key,
                        defaultCamera: facingMode === "user" ? "front" : "back",
                        bookingId: booking?.id,
                        isTeacher: isTeacher,
                        studentId: booking?.student_id,
                        scheduledEndTime: scheduledEndTime || undefined,
                      });
                      
                      logger.info('✅ [Join] Navigation complete');
                    } catch (error) {
                      logger.error('🔴 [Join] Error starting meeting:', error);
                      const msg = error?.message || 'Something went wrong';
                      Toast.show(`❌ ${msg}`);
                      if (msg.includes('Cannot reach') || msg.includes('network')) {
                        Alert.alert('Video call server unreachable', msg + '\n\nTip: 1) Start backend: npm start in backend folder. 2) Use same IP in .env (REACT_APP_AUTH_URL = http://YOUR_PC_IP:3000). 3) Phone and PC on same WiFi, or use USB + adb reverse tcp:3000 tcp:3000.');
                      }
                    }
                  }}
                />
              </>
            )}

            {/* Join Meeting */}
            {isVisibleJoinMeetingContainer && (
              <>
                <TouchableOpacity
                  onPress={() => optionRef.current.show()}
                  style={{ height: 50, justifyContent: "center", alignItems: "center", backgroundColor: "#202427", borderRadius: 12, marginVertical: 12 }}
                >
                  <Text style={{ color: colors.primary["100"], fontSize: 16, fontFamily: ROBOTO_FONTS.RobotoBold }}>{meetingType.value}</Text>
                </TouchableOpacity>
                <Menu ref={optionRef} menuBackgroundColor={colors.primary[700]} fullWidth bottom={120}>
                  {meetingTypes.map((mt, idx) => (
                    <View key={mt.key}>
                      <MenuItem
                        title={mt.value}
                        onPress={() => {
                          optionRef.current.close(true);
                          setMeetingType(mt);
                        }}
                      />
                      {idx !== meetingTypes.length - 1 && <View style={{ height: 1, backgroundColor: colors.primary["600"] }} />}
                    </View>
                  ))}
                </Menu>
                <TextInputContainer placeholder="Enter your name" value={name} setValue={setName} />
                <TextInputContainer placeholder="Enter meeting code" value={meetingId} setValue={setMeetingId} />
                <Button
                  text="Join a meeting"
                  onPress={async () => {
                    if (!name.trim()) return Toast.show("Please enter your name");
                    if (!meetingId.trim()) return Toast.show("Please enter meetingId");

                    // ✅ Request permission before joining
                    const hasPermission = await requestCameraAndMicPermissions();
                    if (!hasPermission) return;

                    try {
                      logger.info('🟡 [Join] Starting meeting join process...');
                      
                      logger.info('🟡 [Join] Getting token...');
                      const token = await getToken();
                      if (!token) {
                        Toast.show("❌ Failed to get authentication token");
                        return;
                      }
                      logger.info('✅ [Join] Token received');

                      logger.info('🟡 [Join] Validating meeting...');
                      const valid = await validateMeeting({ token, meetingId: meetingId.trim() });
                      
                      if (!valid) {
                        Toast.show("❌ Invalid meeting code");
                        return;
                      }
                      logger.info('✅ [Join] Meeting validated');

                      disposeVideoTrack();
                      logger.info('🟡 [Join] Navigating to meeting screen...');
                      
                      navigation.navigate(SCREEN_NAMES.Meeting, {
                        name: name.trim(),
                        token,
                        meetingId: meetingId.trim(),
                        micEnabled: micOn,
                        webcamEnabled: videoOn,
                        meetingType: meetingType.key,
                        defaultCamera: facingMode === "user" ? "front" : "back",
                      });
                      
                      logger.info('✅ [Join] Navigation complete');
                    } catch (error) {
                      logger.error('🔴 [Join] Error joining meeting:', error);
                      const msg = error?.message || 'Something went wrong';
                      Toast.show(`❌ ${msg}`);
                      if (msg.includes('Cannot reach') || msg.includes('network')) {
                        Alert.alert('Video call server unreachable', msg + '\n\nTip: 1) Start backend: npm start in backend folder. 2) Use same IP in .env (REACT_APP_AUTH_URL = http://YOUR_PC_IP:3000). 3) Phone and PC on same WiFi, or use USB + adb reverse tcp:3000 tcp:3000.');
                      }
                    }
                  }}
                />
              </>
            )}
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: "white",
    padding: 22,
    fontSize: 18,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  deviceButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    marginBottom: 10,
  },
  deviceText: {
    fontSize: 16,
    color: "#333",
  },
  selectedDeviceButton: {
    backgroundColor: "#BBB5B4",
  },
});
