import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  Clipboard,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import {
  useMeeting,
  getAudioDeviceList,
  switchAudioDevice,
} from "@videosdk.live/react-native-sdk";
import {
  CallEnd,
  CameraSwitch,
  Chat,
  Copy,
  EndForAll,
  Leave,
  MicOff,
  MicOn,
  More,
  Participants,
  ScreenShare,
  VideoOff,
  VideoOn,
} from "../../../assets/icons";
import colors from "../../../styles/colors";
import IconContainer from "../../../components/IconContainer";
import LocalParticipantPresenter from "../Components/LocalParticipantPresenter";
import Menu from "../../../components/Menu";
import MenuItem from "../Components/MenuItem";
import { ROBOTO_FONTS } from "../../../styles/fonts";
import Toast from "react-native-simple-toast";
import BottomSheet from "../../../components/BottomSheet";
import ParticipantListViewer from "../Components/ParticipantListViewer";
import ChatViewer from "../Components/ChatViewer";
import ParticipantView from "./ParticipantView";
import RemoteParticipantPresenter from "./RemoteParticipantPresenter";
import VideosdkRPK from "../../../../VideosdkRPK";
import { convertRFValue } from "../../../styles/spacing";

const MemoizedParticipant = React.memo(
  ParticipantView,
  ({ participantId }, { participantId: oldParticipantId }) =>
    participantId === oldParticipantId
);
import { MemoizedParticipantGrid } from "./ConferenceParticipantGrid";
import { useOrientation } from "../../../utils/useOrientation";

const TEN_MINUTES_MS = 10 * 60 * 1000;

export default function ConferenceMeetingViewer({ isTeacher = true, scheduledEndTime }) {
  const {
    localParticipant,
    participants,
    pinnedParticipants,
    localWebcamOn,
    localMicOn,
    leave,
    end,
    changeWebcam,
    toggleWebcam,
    toggleMic,
    presenterId,
    localScreenShareOn,
    toggleScreenShare,
    meetingId,
    enableScreenShare,
    disableScreenShare,
    activeSpeakerId,
  } = useMeeting({
    onError: (data) => {
      const { code, message } = data;

      Toast.show(`Error: ${code}: ${message}`);
    },
  });

  const leaveMenu = useRef();
  const bottomSheetRef = useRef();
  const audioDeviceMenuRef = useRef();
  const moreOptionsMenu = useRef();
  const orientation = useOrientation();

  const participantIds = useMemo(() => {
    const pinnedParticipantId = [...pinnedParticipants.keys()].filter(
      (participantId) => {
        return participantId != localParticipant.id;
      }
    );
    const regularParticipantIds = [...participants.keys()].filter(
      (participantId) => {
        return (
          ![...pinnedParticipants.keys()].includes(participantId) &&
          localParticipant.id != participantId
        );
      }
    );
    const ids = [
      localParticipant?.id,
      ...pinnedParticipantId,
      ...regularParticipantIds,
    ].slice(0, presenterId ? 2 : 6);

    if (activeSpeakerId) {
      if (!ids.includes(activeSpeakerId)) {
        ids[ids.length - 1] = activeSpeakerId;
      }
    }
    return ids;
  }, [
    participants,
    activeSpeakerId,
    pinnedParticipants,
    presenterId,
    localScreenShareOn,
  ]);

  const [bottomSheetView, setBottomSheetView] = useState("");

  const [audioDevice, setAudioDevice] = useState([]);

  // Teacher can "End for all" only from 10 min before scheduled end (or if no schedule)
  const canTeacherEndMeeting =
    !scheduledEndTime || typeof scheduledEndTime !== "number" || Date.now() >= scheduledEndTime - TEN_MINUTES_MS;

  async function updateAudioDeviceList() {
    const devices = await getAudioDeviceList();
    setAudioDevice(devices);
  }

  useEffect(() => {
    if (Platform.OS == "ios") {
      VideosdkRPK.addListener("onScreenShare", (event) => {
        if (event === "START_BROADCAST") {
          enableScreenShare();
        } else if (event === "STOP_BROADCAST") {
          disableScreenShare();
        }
      });

      return () => {
        VideosdkRPK.removeAllListeners("onScreenShare");
        // VideosdkRPK.removeSubscription("onScreenShare");
      };
    }
  }, []);

  return (
    <>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          width: "100%",
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "space-between",
          }}
        >
          {isTeacher && (
            <View style={{ flexDirection: "row" }}>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: ROBOTO_FONTS.RobotoBold,
                  color: colors.primary[100],
                }}
              >
                {meetingId ? meetingId : "xxx - xxx - xxx"}
              </Text>

              <TouchableOpacity
                style={{
                  justifyContent: "center",
                  marginLeft: 10,
                }}
                onPress={() => {
                  Clipboard.setString(meetingId);
                  Toast.show("Meeting Id copied Successfully");
                }}
              >
                <Copy fill={colors.primary[100]} width={18} height={18} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity
            style={{ marginRight: 12 }}
            onPress={() => {
              changeWebcam();
            }}
          >
            <CameraSwitch height={26} width={26} fill={colors.primary[100]} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setBottomSheetView("PARTICIPANT_LIST");
              bottomSheetRef.current.show();
            }}
            activeOpacity={1}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginHorizontal: 8,
            }}
          >
            <Participants height={24} width={24} fill={colors.primary[100]} />
            <Text
              style={{
                fontSize: convertRFValue(14),
                color: colors.primary[100],
                marginLeft: 4,
                fontFamily: ROBOTO_FONTS.RobotoMedium,
              }}
            >
              {participants ? [...participants.keys()].length : 1}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Center */}
      <View
        style={{
          flex: 1,
          flexDirection: orientation == "PORTRAIT" ? "column" : "row",
          marginVertical: 12,
        }}
      >
        {presenterId && !localScreenShareOn ? (
          <RemoteParticipantPresenter presenterId={presenterId} />
        ) : presenterId && localScreenShareOn ? (
          <LocalParticipantPresenter />
        ) : null}

        <MemoizedParticipantGrid
          participantIds={participantIds}
          isPresenting={presenterId != null}
        />
      </View>
      <Menu
        ref={leaveMenu}
        menuBackgroundColor={colors.primary[700]}
        placement="left"
      >
        <MenuItem
          title={"Leave"}
          description={"Only you will leave the call"}
          icon={<Leave width={22} height={22} />}
          onPress={() => {
            leave();
            moreOptionsMenu.current.close();
          }}
        />
        {isTeacher && (
          <>
            <View
              style={{
                height: 1,
                backgroundColor: colors.primary["600"],
              }}
            />
            <MenuItem
              title={"End"}
              description={
                canTeacherEndMeeting
                  ? "End call for all participants"
                  : "You can end 10 min before scheduled end time"
              }
              icon={<EndForAll />}
              onPress={() => {
                if (!canTeacherEndMeeting) {
                  Toast.show("You can end the meeting 10 minutes before the scheduled end time.");
                  leaveMenu.current.close();
                  return;
                }
                end();
                leaveMenu.current.close();
              }}
            />
          </>
        )}
      </Menu>
      <Menu
        ref={audioDeviceMenuRef}
        menuBackgroundColor={colors.primary[700]}
        placement="left"
        left={70}
      >
        {audioDevice.map((device, index) => {
          return (
            <>
              <MenuItem
                title={
                  device == "SPEAKER_PHONE"
                    ? "Speaker"
                    : device == "EARPIECE"
                    ? "Earpiece"
                    : device == "BLUETOOTH"
                    ? "Bluetooth"
                    : "Wired Headset"
                }
                onPress={() => {
                  switchAudioDevice(device);
                  audioDeviceMenuRef.current.close();
                }}
              />

              {index != audioDevice.length - 1 && (
                <View
                  style={{
                    height: 1,
                    backgroundColor: colors.primary["600"],
                  }}
                />
              )}
            </>
          );
        })}
      </Menu>
      <Menu
        ref={moreOptionsMenu}
        menuBackgroundColor={colors.primary[700]}
        placement="right"
      >
        {(presenterId == null || localScreenShareOn) && (
          <MenuItem
            title={`${localScreenShareOn ? "Stop" : "Start"} Screen Share`}
            icon={<ScreenShare width={22} height={22} />}
            onPress={() => {
              moreOptionsMenu.current.close();
              if (presenterId == null || localScreenShareOn)
                Platform.OS === "android"
                  ? toggleScreenShare({enableAudio:false})
                  : VideosdkRPK.startBroadcast();
            }}
          />
        )}
      </Menu>
      {/* Bottom */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-evenly",
        }}
      >
        <IconContainer
          backgroundColor={"red"}
          Icon={() => {
            return <CallEnd height={26} width={26} fill="#FFF" />;
          }}
          onPress={() => {
            leaveMenu.current.show();
          }}
        />
        <IconContainer
          style={{
            paddingLeft: 0,
            height: 52,
          }}
          isDropDown={true}
          onDropDownPress={async () => {
            await updateAudioDeviceList();
            audioDeviceMenuRef.current.show();
          }}
          backgroundColor={!localMicOn ? colors.primary[100] : "transparent"}
          onPress={() => {
            toggleMic();
          }}
          Icon={() => {
            return localMicOn ? (
              <MicOn height={24} width={24} fill="#FFF" />
            ) : (
              <MicOff height={28} width={28} fill="#1D2939" />
            );
          }}
        />
        <IconContainer
          style={{
            borderWidth: 1.5,
            borderColor: "#2B3034",
          }}
          backgroundColor={!localWebcamOn ? colors.primary[100] : "transparent"}
          onPress={() => {
            toggleWebcam();
          }}
          Icon={() => {
            return localWebcamOn ? (
              <VideoOn height={24} width={24} fill="#FFF" />
            ) : (
              <VideoOff height={36} width={36} fill="#1D2939" />
            );
          }}
        />
        <IconContainer
          onPress={() => {
            setBottomSheetView("CHAT");
            bottomSheetRef.current.show();
          }}
          style={{
            borderWidth: 1.5,
            borderColor: "#2B3034",
          }}
          Icon={() => {
            return <Chat height={22} width={22} fill="#FFF" />;
          }}
        />
        <IconContainer
          style={{
            borderWidth: 1.5,
            borderColor: "#2B3034",
            transform: [{ rotate: "90deg" }],
          }}
          onPress={() => {
            moreOptionsMenu.current.show();
          }}
          Icon={() => {
            return <More height={18} width={18} fill="#FFF" />;
          }}
        />
      </View>
      <BottomSheet
        sheetBackgroundColor={"#2B3034"}
        draggable={false}
        radius={12}
        hasDraggableIcon
        closeFunction={() => {
          setBottomSheetView("");
        }}
        ref={bottomSheetRef}
        height={Dimensions.get("window").height * 0.5}
      >
        {bottomSheetView === "CHAT" ? (
          <ChatViewer />
        ) : bottomSheetView === "PARTICIPANT_LIST" ? (
          <ParticipantListViewer participantIds={[...participants.keys()]} />
        ) : null}
      </BottomSheet>
    </>
  );
}
