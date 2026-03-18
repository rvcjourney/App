import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import StudentDashboard from "./StudentDashboard"; // Restored to actual dashboard
import EditStudentProfile from "./Student/EditStudentProfile";
import Join from "./join";
import Meeting from "./meeting";
import { SCREEN_NAMES } from "../constants/screenNames";
import StudentCheckout from "./Student/StudentCheckout";
import NotificationsScreen from "./NotificationsScreen";

const Stack = createStackNavigator();

export default function StudentStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name={SCREEN_NAMES.StudentDashboard}
        component={StudentDashboard}
      />
      <Stack.Screen 
        name={SCREEN_NAMES.EditStudentProfile} 
        component={EditStudentProfile}
      />
      <Stack.Screen 
        name={SCREEN_NAMES.Join} 
        component={Join}
      />
      <Stack.Screen 
        name={SCREEN_NAMES.Meeting} 
        component={Meeting}
      />
      <Stack.Screen
        name={SCREEN_NAMES.StudentCheckout}
        component={StudentCheckout}
      />
      <Stack.Screen
        name={SCREEN_NAMES.Notifications}
        component={NotificationsScreen}
      />
    </Stack.Navigator>
  );
}
