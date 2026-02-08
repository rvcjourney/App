import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import StudentDashboard from "./StudentDashboard";
import EditStudentProfile from "./Student/EditStudentProfile";
import Join from "./join";
import Meeting from "./meeting";
import { SCREEN_NAMES } from "../navigators/screenNames";
import StudentCheckout from "./Student/StudentCheckout";

const Stack = createStackNavigator();

export default function StudentStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="StudentDashboard" 
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
    </Stack.Navigator>
  );
}
