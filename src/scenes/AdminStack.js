import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SCREEN_NAMES } from '../navigators/screenNames';
import SuperAdminDashboard from './SuperAdminDashboard';
import UserListScreen from './Admin/UserListScreen';
import UserEditScreen from './Admin/UserEditScreen';
import AdminBookingsList from './Admin/AdminBookingsList';

const Stack = createStackNavigator();

export default function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={SCREEN_NAMES.SuperAdminDashboard} component={SuperAdminDashboard} />
      <Stack.Screen name={SCREEN_NAMES.AdminUserList} component={UserListScreen} />
      <Stack.Screen name={SCREEN_NAMES.AdminUserEdit} component={UserEditScreen} />
      <Stack.Screen name={SCREEN_NAMES.AdminBookingsList} component={AdminBookingsList} />
    </Stack.Navigator>
  );
}
