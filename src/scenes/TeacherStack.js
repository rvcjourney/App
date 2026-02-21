import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import TeacherDashboard from "./TeacherDashboard";
import EditTeacherProfile from "./Teacher/EditTeacherProfile";
import TeacherAvailability from "./Teacher/TeacherAvailability";
import ScheduleLecture from "./Teacher/ScheduleLecture";
import Join from "./join";
import Meeting from "./meeting";
import { SCREEN_NAMES } from "../navigators/screenNames";
import TeacherEarnings from "./Teacher/TeacherEarnings";
import WithdrawalRequest from "./Teacher/WithdrawalRequest";
import BankAccountSettings from "./Teacher/BankAccountSettings";

const RootStack = createStackNavigator();

export default function TeacherStack() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen 
        name="TeacherDashboard" 
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
    </RootStack.Navigator>
  );
}
