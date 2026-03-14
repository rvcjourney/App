/**
 * Screen name constants used throughout the app navigation
 * Central source of truth to ensure consistency across navigators
 */

export const SCREEN_NAMES = {
  // Auth screens
  WelcomeScreen: 'WelcomeScreen',
  RoleSelectScreen: 'RoleSelect',
  Login: 'Login',
  Signup: 'Signup',
  ResetPassword: 'ResetPassword',
  OTPVerification: 'OTPVerification',

  // Meeting screens
  Join: 'Join_Screen',
  Meeting: 'Meeting_Screen',

  // Student screens
  StudentDashboard: 'StudentDashboard',
  EditStudentProfile: 'EditStudentProfile',
  StudentCheckout: 'StudentCheckout',

  // Teacher screens
  TeacherDashboard: 'TeacherDashboard',
  ProfessionSelect: 'ProfessionSelect',
  EditTeacherProfile: 'EditTeacherProfile',
  TeacherAvailability: 'TeacherAvailability',
  ScheduleLecture: 'ScheduleLecture',
  TeacherEarnings: 'TeacherEarnings',
  WithdrawalRequest: 'WithdrawalRequest',
  BankAccountSettings: 'BankAccountSettings',

  // Shared
  Notifications: 'Notifications',

  // Admin screens
  SuperAdminDashboard: 'SuperAdminDashboard',
  AdminUserList: 'AdminUserList',
  AdminUserEdit: 'AdminUserEdit',
  AdminBookingsList: 'AdminBookingsList',
  AdminTeacherWallet: 'AdminTeacherWallet',
  AdminFinance: 'AdminFinance',
};

export default SCREEN_NAMES;
