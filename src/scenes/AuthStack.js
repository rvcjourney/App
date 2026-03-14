import React from "react";
import "react-native-gesture-handler";
import { createStackNavigator } from "@react-navigation/stack";
import { SCREEN_NAMES } from "../constants/screenNames";
import { LogBox } from "react-native";

import WelcomeScreen from "./WelcomeScreen";
import RoleSelectScreen from "./RoleSelectScreen";
import LoginScreen from "./LoginScreen";
import SignupScreen from "./SignupScreen";
import ResetPasswordScreen from "./ResetPasswordScreen";
import OTPVerificationScreen from "./OTPVerificationScreen";
import Join from "./join";
import Meeting from "./meeting";

// Only suppress specific warnings, not all warnings
LogBox.ignoreLogs(["VirtualizedList: You have a large list"]);

const RootStack = createStackNavigator();

export default function AuthStack() {
  return (
    <RootStack.Navigator
      screenOptions={{
        animationEnabled: false,
        presentation: "modal",
      }}
      // initialRouteName={SCREEN_NAMES.Join}
      initialRouteName={SCREEN_NAMES.WelcomeScreen}
    >
      <RootStack.Screen
        name={SCREEN_NAMES.WelcomeScreen}
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />

      <RootStack.Screen
        name={SCREEN_NAMES.RoleSelectScreen}
        component={RoleSelectScreen}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name={SCREEN_NAMES.Login}
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name={SCREEN_NAMES.Signup}
        component={SignupScreen}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name={SCREEN_NAMES.ResetPassword}
        component={ResetPasswordScreen}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name={SCREEN_NAMES.OTPVerification}
        component={OTPVerificationScreen}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name={SCREEN_NAMES.Join}
        component={Join}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name={SCREEN_NAMES.Meeting}
        component={Meeting}
        options={{ headerShown: false }}
      />
    </RootStack.Navigator>
  );
}
