import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import {
  useMeeting,
} from "@videosdk.live/react-native-sdk";
import OneToOneMeetingViewer from "./OneToOne";
import ConferenceMeetingViewer from "./Conference/ConferenceMeetingViewer";
import ParticipantLimitViewer from "./OneToOne/ParticipantLimitViewer";
import WaitingToJoinView from "./Components/WaitingToJoinView";

export default function MeetingContainer({ webcamEnabled, meetingType, isTeacher = true }) {
  const [isJoined, setJoined] = useState(false);
  const [participantLimit, setParticipantLimit] = useState(false);
  const [error, setError] = useState(null);

  console.log('MeetingContainer mounted, meetingType:', meetingType);

  const { join, participants, leave } = useMeeting({
    onMeetingJoined: () => {
      console.log('Meeting joined');
      setTimeout(() => {
        setJoined(true);
      }, 500);
    },
    onParticipantLeft: () => {
      if (participants.size < 2) {
        setParticipantLimit(false);
      }
    },
    onError: (error) => {
      console.error('Meeting error:', error);
      setError(error);
    },
  });

  useEffect(() => {
    if (isJoined) {
      if (participants.size > 2) {
        setParticipantLimit(true);
      }
    }
  }, [isJoined]);

  useEffect(() => {
    setTimeout(() => {
      if (!isJoined) {
        join();
      }
    }, 1000);

    return () => {
      leave();
    };
  }, []);

  return error ? (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0D2A' }}>
      <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center', paddingHorizontal: 20 }}>
        Error: {error.message || 'Failed to join meeting'}
      </Text>
    </View>
  ) : isJoined ? (
    meetingType === "GROUP" ? (
      <ConferenceMeetingViewer isTeacher={isTeacher} />
    ) : participantLimit ? (
      <ParticipantLimitViewer />
    ) : (
      <OneToOneMeetingViewer isTeacher={isTeacher} />
    )
  ) : (
    <WaitingToJoinView />
  );
}
