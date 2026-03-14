import React, { useEffect, useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { ActivityIndicator, View } from "react-native";
import { supabase } from "../../supabase";
import logger from "../utils/logger";
import COLORS from "../constants/appColors";
import { SCREEN_NAMES } from "../constants/screenNames";
import TeacherDashboard from "./TeacherDashboard";
import EditTeacherProfile from "./Teacher/EditTeacherProfile";
import TeacherAvailability from "./Teacher/TeacherAvailability";
import ScheduleLecture from "./Teacher/ScheduleLecture";
import Join from "./join";
import Meeting from "./meeting";
import TeacherEarnings from "./Teacher/TeacherEarnings";
import WithdrawalRequest from "./Teacher/WithdrawalRequest";
import BankAccountSettings from "./Teacher/BankAccountSettings";
import NotificationsScreen from "./NotificationsScreen";
import ProfessionSelectScreen from "./ProfessionSelectScreen";

const RootStack = createStackNavigator();

export default function TeacherStack() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if teacher already has a profession
  useEffect(() => {
    const checkProfession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: teacherRows } = await supabase
            .from('teacher_profiles')
            .select('profession')
            .eq('id', user.id)
            .limit(1);

          const teacherData = Array.isArray(teacherRows) && teacherRows.length > 0 ? teacherRows[0] : teacherRows;

          // If profession exists, go to dashboard. Otherwise, show profession select
          if (teacherData?.profession) {
            setInitialRoute(SCREEN_NAMES.TeacherDashboard);
          } else {
            setInitialRoute(SCREEN_NAMES.ProfessionSelect);
          }
        }
      } catch (error) {
        logger.error('TeacherStack: Error checking profession:', error);
        // Default to dashboard if error
        setInitialRoute(SCREEN_NAMES.TeacherDashboard);
      } finally {
        setLoading(false);
      }
    };

    checkProfession();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.ADMIN_BG }}>
        <ActivityIndicator size="large" color={COLORS.ADMIN_ACCENT} />
      </View>
    );
  }

  return (
    <RootStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={initialRoute}
    >
      <RootStack.Screen
        name={SCREEN_NAMES.ProfessionSelect}
        component={ProfessionSelectScreen}
      />
      <RootStack.Screen
        name={SCREEN_NAMES.TeacherDashboard}
        component={TeacherDashboard}
      />
      <RootStack.Screen 
        name={SCREEN_NAMES.EditTeacherProfile} 
        component={EditTeacherProfile}
      />
      <RootStack.Screen 
        name={SCREEN_NAMES.TeacherAvailability} 
        component={TeacherAvailability}
      />
      <RootStack.Screen 
        name={SCREEN_NAMES.ScheduleLecture} 
        component={ScheduleLecture}
      />
      <RootStack.Screen 
        name={SCREEN_NAMES.Join} 
        component={Join}
      />
      <RootStack.Screen 
        name={SCREEN_NAMES.Meeting} 
        component={Meeting}
      />
      <RootStack.Screen
        name={SCREEN_NAMES.TeacherEarnings}
        component={TeacherEarnings}
      />
      <RootStack.Screen
        name={SCREEN_NAMES.WithdrawalRequest}
        component={WithdrawalRequest}
      />
      <RootStack.Screen
        name={SCREEN_NAMES.BankAccountSettings}
        component={BankAccountSettings}
      />
      <RootStack.Screen
        name={SCREEN_NAMES.Notifications}
        component={NotificationsScreen}
      />
    </RootStack.Navigator>
  );
}
