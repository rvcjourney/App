# Unified Theming Implementation Guide

## Overview
This guide shows how to update all screens in the app to use the new **UNIFIED_THEME** system and replace emoji with **React Native Vector Icons**.

**Completed Examples:**
- ✅ WelcomeScreen.js - Shows full implementation pattern

**Still To Update (30+ screens):**
- 8 more Auth screens
- 3 Dashboard screens
- 10+ Feature screens
- 6 Admin screens

---

## Quick Reference: Imports to Add

```javascript
// At the top of EVERY screen file
import UNIFIED_THEME from '../constants/unifiedTheme';
import Icon from '../components/Icon';
import ThemedText from '../components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';
```

**Path Note:** Adjust relative paths based on screen depth:
- Auth screens: `../constants/unifiedTheme`
- Feature screens (nested): `../../constants/unifiedTheme`
- Admin screens (Admin/): `../../constants/unifiedTheme`

---

## Pattern 1: Replace Hardcoded Colors with UNIFIED_THEME

### OLD (Hardcoded):
```javascript
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f1b3f',
    padding: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#ff006e',
    borderRadius: 50,
    paddingVertical: 12,
  },
  border: {
    borderColor: 'rgba(255, 0, 110, 0.3)',
    borderWidth: 1,
  },
});
```

### NEW (Using UNIFIED_THEME):
```javascript
const styles = StyleSheet.create({
  container: {
    backgroundColor: UNIFIED_THEME.colors.primary.light,
    padding: UNIFIED_THEME.spacing.lg,
  },
  title: {
    color: UNIFIED_THEME.colors.text.primary,
    ...UNIFIED_THEME.typography.headingMd,
  },
  button: {
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    borderRadius: UNIFIED_THEME.borderRadius.round,
    paddingVertical: UNIFIED_THEME.spacing.md,
  },
  border: {
    borderColor: UNIFIED_THEME.colors.border.default,
    borderWidth: 1,
  },
});
```

---

## Pattern 2: Replace Emoji with Icon Component

### OLD (Emoji):
```javascript
<Text style={styles.icon}>🎥</Text>
<Text style={styles.star}>⭐</Text>
<Text style={styles.lock}>🔒</Text>
<Text style={styles.checkmark}>✅</Text>
<Text style={styles.pending}>⏳</Text>
```

### NEW (Vector Icons):
```javascript
<Icon name="videoCam" size={24} color="accent.primary" />
<Icon name="star" size={24} color="accent.primary" />
<Icon name="lock" size={24} color="accent.primary" />
<Icon name="check" size={24} color="success" />
<Icon name="hourglass" size={24} color="warning" />
```

**See `src/constants/icons.js` for complete emoji→icon mapping**

---

## Pattern 3: Replace Text with ThemedText Component

### OLD (Hardcoded Text):
```javascript
<Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '700' }}>
  Welcome
</Text>
<Text style={{ color: '#b0b0b0', fontSize: 14 }}>
  Subtitle here
</Text>
```

### NEW (ThemedText):
```javascript
<ThemedText variant="heading" size="lg" color="primary">
  Welcome
</ThemedText>
<ThemedText color="muted" size="sm">
  Subtitle here
</ThemedText>
```

**Available Props:**
- `variant`: 'heading' | 'body' | 'label'
- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
- `color`: 'primary' | 'secondary' | 'muted' | 'accent' | 'success' | 'error' | 'warning' | '#hexcode'
- `weight`: font weight number (e.g., 700)

---

## Pattern 4: Add SafeAreaView to Auth Screens

### Missing SafeAreaView (10 Auth Screens):
```javascript
// BEFORE: Missing SafeAreaView wrapper
<View style={styles.container}>
  {/* content */}
</View>

// AFTER: Add SafeAreaView
import { SafeAreaView } from 'react-native-safe-area-context';

<SafeAreaView style={styles.container}>
  {/* content */}
</SafeAreaView>
```

**Affected Screens:**
- LoginScreen ✅ (Fixed)
- SignupScreen ✅ (Fixed)
- OTPVerificationScreen
- EmailVerificationScreen
- RoleSelectScreen
- ProfessionSelectScreen
- CompleteProfileScreen
- ResetPasswordScreen ✅ (Already has it)
- WelcomeScreen ✅ (Fixed)

---

## Pattern 5: Use Theme Colors for Status States

### OLD (Hardcoded status colors):
```javascript
const color = status === 'pending' ? '#FF9800' : status === 'approved' ? '#4CAF50' : '#EF4444';
<Text style={{ color }}>Status</Text>
```

### NEW (Unified status colors):
```javascript
// UNIFIED_THEME.colors.status has all statuses defined
<ThemedText color={status}>Status</ThemedText>

// Status colors available:
// - pending: #F59E0B (orange)
// - approved: #10B981 (green)
// - rejected: #EF4444 (red)
// - active: #10B981 (green)
// - inactive: #707070 (gray)
// - available: #10B981
// - unavailable: #EF4444
```

---

## Emoji Replacement Checklist

Use this to find and replace all emoji in screens:

| Emoji | Icon Name | Used In |
|-------|-----------|---------|
| ✨ | sparkles | WelcomeScreen ✅, Others |
| 🎥 | videoCam | WelcomeScreen ✅ |
| ⭐ | star | WelcomeScreen ✅, NotificationsScreen |
| 🔒 | lock | WelcomeScreen ✅ |
| 📹 | video | WelcomeScreen ✅ |
| 📅 | calendar | NotificationsScreen, Others |
| ⏰ | clock | NotificationsScreen, TeacherEarnings |
| 📞 | phone | NotificationsScreen |
| 💳 | creditCard | NotificationsScreen |
| 💰 | money | NotificationsScreen, TeacherEarnings |
| 💵 | dollarSign | TeacherEarnings |
| 💡 | lightbulb | TeacherEarnings |
| 📊 | barChart | TeacherEarnings |
| ⏳ | hourglass | TeacherEarnings, NotificationsScreen |
| ✓/✅ | check/checkCircle | Multiple screens |
| ❌ | close/closeCircle | Multiple screens |
| 🔄 | refresh | NotificationsScreen |
| 🏦 | bank | NotificationsScreen |
| 💼 | briefcase | RoleSelectScreen |
| 🧘 | yoga | ProfessionSelectScreen |
| 💪 | gymTrainer | ProfessionSelectScreen |
| 📚 | academicTeacher | ProfessionSelectScreen |
| 🔮 | astrologers | ProfessionSelectScreen |

---

## Screen-by-Screen Update Checklist

### Auth Screens (9 total)

- [ ] **LoginScreen.js**
  - Replace hardcoded colors with UNIFIED_THEME
  - Already uses centralized colors ✅
  - Add SafeAreaView (if missing)

- [ ] **SignupScreen.js**
  - Replace hardcoded colors with UNIFIED_THEME
  - Already uses centralized colors ✅
  - Add SafeAreaView (if missing)

- [ ] **OTPVerificationScreen.js**
  - Replace hardcoded colors
  - Add SafeAreaView
  - Remove hardcoded backend IP

- [ ] **EmailVerificationScreen.js**
  - Replace hardcoded colors
  - Add SafeAreaView
  - Remove hardcoded backend IP

- [ ] **ResetPasswordScreen.js**
  - Replace hardcoded colors
  - Already has SafeAreaView ✅

- [ ] **RoleSelectScreen.js**
  - Replace hardcoded `#ff006e` with UNIFIED_THEME.colors.accent.primary
  - Update component styles

- [ ] **ProfessionSelectScreen.js**
  - Replace hardcoded colors
  - Replace checkmark emoji with Icon component
  - Use shared PROFESSIONS constant ✅

- [ ] **CompleteProfileScreen.js**
  - Add SafeAreaView
  - Update wrapper styling

- [ ] **WelcomeScreen.js** ✅ **DONE**
  - All emoji replaced with icons
  - All colors use UNIFIED_THEME
  - SafeAreaView added
  - Uses ThemedText

---

### Dashboard Screens (3 total)

- [ ] **StudentDashboard.js**
  - Replace all emoji with icons
  - Replace all hardcoded colors with UNIFIED_THEME
  - Update button/card/input styles
  - Update status color logic

- [ ] **TeacherDashboard.js**
  - Replace all emoji with icons
  - Replace all hardcoded colors with UNIFIED_THEME
  - Update status colors (pending/approved/etc)
  - Ensure consistent theming with student dashboard

- [ ] **SuperAdminDashboard.js**
  - Remove admin-only color scheme (#0B0D2A, #5568FE)
  - Use UNIFIED_THEME instead
  - Replace any emoji with icons

---

### Feature Screens (10+ total)

**Teacher Screens:**
- [ ] EditTeacherProfile.js
- [ ] BankAccountSettings.js
- [ ] TeacherAvailability.js
- [ ] TeacherEarnings.js (has ~15 emoji)
- [ ] WithdrawalRequest.js
- [ ] ScheduleLecture.js ✅ (already updated to show "Coming Soon")

**Student Screens:**
- [ ] EditStudentProfile.js
- [ ] StudentCheckout.js

**Shared Screens:**
- [ ] NotificationsScreen.js (has ~20 emoji)
- [ ] CompleteProfileScreen.js

---

### Admin Screens (6 total)

**CRITICAL:** Remove the admin-specific color theme (#0B0D2A, #5568FE) and use UNIFIED_THEME

- [ ] AdminDashboard.js
- [ ] AdminBookingsList.js
- [ ] AdminTeacherWallet.js
- [ ] AdminUserListScreen.js
- [ ] AdminUserEditScreen.js
- [ ] UserEditScreen.js

---

## Template: Screen Update Function

Copy this template and adapt for each screen:

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import UNIFIED_THEME from '../constants/unifiedTheme';
import Icon from '../components/Icon';
import ThemedText from '../components/ThemedText';

export default function ExampleScreen({ navigation }) {
  // Use UNIFIED_THEME colors directly
  const colors = UNIFIED_THEME.colors;
  const spacing = UNIFIED_THEME.spacing;
  const shadows = UNIFIED_THEME.shadows;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.primary.light }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        {/* Use ThemedText instead of Text */}
        <ThemedText variant="heading" size="lg">
          Screen Title
        </ThemedText>

        {/* Use Icon instead of emoji */}
        <Icon name="star" size={24} color="accent.primary" />

        {/* Use UNIFIED_THEME for styles */}
        <TouchableOpacity style={[styles.button, shadows.medium]}>
          <ThemedText color="onAccent">Action</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  button: {
    backgroundColor: UNIFIED_THEME.colors.accent.primary,
    borderRadius: UNIFIED_THEME.borderRadius.round,
    paddingVertical: UNIFIED_THEME.spacing.md,
    paddingHorizontal: UNIFIED_THEME.spacing.lg,
    alignItems: 'center',
  },
});
```

---

## Common Issues & Solutions

### Issue: "Cannot find module '../constants/unifiedTheme'"
**Solution:** Check relative path depth. From:
- `src/scenes/` → `../constants/unifiedTheme`
- `src/scenes/Teacher/` → `../../constants/unifiedTheme`
- `src/scenes/Admin/` → `../../constants/unifiedTheme`

### Issue: Icon not rendering
**Solution:** Check that icon name exists in `src/constants/icons.js`. Use icon name keys, not emoji.

### Issue: ThemedText not showing right color
**Solution:** Check color prop is valid:
- Hex codes: `color="#ff006e"`
- Theme colors: `color="primary"`, `color="muted"`, `color="accent.primary"`
- Status: `color="success"`, `color="error"`, `color="pending"`

### Issue: SafeAreaView not working on Android
**Solution:** Import from `react-native-safe-area-context`, not `react-native`. Already installed in package.json ✅

### Issue: Button looks different from WelcomeScreen
**Solution:** Make sure you're using the shadow from UNIFIED_THEME.shadows in your styles:
```javascript
style={[styles.button, shadows.medium]}
```

---

## Testing Checklist

After updating each screen:

- [ ] All text uses ThemedText component or UNIFIED_THEME colors
- [ ] All emoji replaced with Icon components
- [ ] All hardcoded colors replaced with UNIFIED_THEME
- [ ] SafeAreaView added to screen (if applicable)
- [ ] Button, input, and card styles use consistent spacing
- [ ] Status colors use UNIFIED_THEME.colors.status
- [ ] Icons render correctly (not missing or broken)
- [ ] Shadows and elevation applied consistently
- [ ] Screen looks identical to before (just cleaner code)

---

## What's Already Updated ✅

1. **Core Theme System:**
   - ✅ `src/constants/unifiedTheme.js`
   - ✅ `src/constants/icons.js`
   - ✅ `src/components/Icon/index.js`
   - ✅ `src/components/ThemedView/index.js`
   - ✅ `src/components/ThemedText/index.js`

2. **Screens Updated:**
   - ✅ `src/scenes/WelcomeScreen.js`
   - ✅ `src/scenes/ScheduleLecture.js` (Coming Soon UI)
   - ✅ Color constants extracted
   - ✅ Logger utility created

---

## Next Steps

1. **Install react-native-vector-icons** (if not already):
   ```bash
   npm install react-native-vector-icons
   # or
   yarn add react-native-vector-icons
   ```

2. **Link native modules** (React Native < 0.60):
   ```bash
   react-native link react-native-vector-icons
   ```

3. **Update remaining 28+ screens** using patterns above
4. **Test all screens** rendering correctly with new theme
5. **Verify no hardcoded colors** remain outside UNIFIED_THEME

---

## Questions?

- Icon names: See `src/constants/icons.js` → ICON_MAP
- Color names: See `src/constants/unifiedTheme.js` → colors
- ThemedText props: See `src/components/ThemedText/index.js`
- Spacing values: See `src/constants/unifiedTheme.js` → spacing
