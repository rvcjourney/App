# 📚 LearnEasy - Video SDK React Native App | Complete Codebase Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Project Structure](#project-structure)
4. [Core Components & Functionality](#core-components--functionality)
5. [Authentication Flow](#authentication-flow)
6. [Meeting System](#meeting-system)
7. [Component Breakdown](#component-breakdown)
8. [Styling & Theme](#styling--theme)
9. [Key Libraries](#key-libraries)
10. [Data Flow Diagrams](#data-flow-diagrams)

---

## 📋 Project Overview

**LearnEasy** is a React Native application that enables **live video classes** between teachers and students. It integrates:
- **VideoSDK.live** for real-time video/audio communication
- **Supabase** for user authentication and profile management
- **React Navigation** for screen navigation
- Multiple meeting types (One-to-One, Group/Conference)

### Key Features
✅ User authentication (signup/login)
✅ Role-based access (Teacher/Student)
✅ Live video meetings (one-to-one and group)
✅ Audio device switching
✅ Screen sharing
✅ Chat functionality
✅ Meeting recording
✅ Participant management
✅ Local/Remote participant viewing

---

## 🏗️ Architecture & Technology Stack

### Frontend Framework
- **React Native** 0.79.3 - Cross-platform mobile development
- **React Navigation** 7.x - Screen navigation and routing

### Real-Time Communication
- **@videosdk.live/react-native-sdk** 0.7.3 - Video/audio SDK
- **@videosdk.live/react-native-incallmanager** 0.1.3 - Audio management

### Backend & Authentication
- **Supabase** (@supabase/supabase-js 2.91.1) - Backend-as-a-Service
  - Authentication (Supabase Auth)
  - Database (PostgreSQL)
  - Profile management

### UI & Styling
- **React Native Modal** - Modal dialogs
- **Lottie** - Animations
- **React Native SVG** - Vector graphics
- **React Native Simple Toast** - Toast notifications

### Development Tools
- **Node.js** >= 18
- **Yarn** 1.22.22 package manager
- **Babel** 7.28.0
- **ESLint** 9.32.0
- **Jest** 30.0.5 - Testing framework

---

## 📂 Project Structure

```
videosdk-rtc-react-native-sdk-example/
│
├── index.js                    # Entry point - registers VideoSDK
├── App.js                      # Main app wrapper with NavigationContainer
│
├── src/
│   ├── api/
│   │   └── api.js             # VideoSDK API calls (token, meeting creation)
│   │
│   ├── assets/
│   │   ├── animation/         # Lottie JSON animations
│   │   ├── fonts/             # Custom fonts (Roboto)
│   │   ├── icons/             # SVG icon components
│   │   └── img/               # Background images
│   │
│   ├── components/            # Reusable UI components
│   │   ├── Avatar/            # User avatar with initials
│   │   ├── Blink/             # Blinking animation component
│   │   ├── BottomSheet/       # Modal bottom sheet
│   │   ├── Button/            # Primary button component
│   │   ├── IconContainer/     # Icon button wrapper
│   │   ├── Menu/              # Context menu
│   │   └── TextInputContainer/ # Styled text input
│   │
│   ├── navigators/
│   │   └── screenNames.js     # Screen name constants
│   │
│   ├── scenes/                # Screen components
│   │   ├── RootNavigator.js   # Root navigation logic
│   │   ├── AuthStack.js       # Auth screen stack (unauthenticated)
│   │   ├── StudentStack.js    # Student dashboard stack
│   │   ├── TeacherStack.js    # Teacher dashboard stack
│   │   ├── WelcomeScreen.js   # Welcome/landing screen
│   │   ├── RoleSelectScreen.js # Role selection (teacher/student)
│   │   ├── LoginScreen.js     # Login form
│   │   ├── SignupScreen.js    # Signup form
│   │   ├── StudentDashboard.js # Student dashboard
│   │   ├── TeacherDashboard.js # Teacher dashboard
│   │   │
│   │   ├── join/              # Meeting join screen
│   │   │   ├── index.js       # Join meeting form
│   │   │   └── stub.js        # Export stub
│   │   │
│   │   └── meeting/           # Meeting screens
│   │       ├── index.js       # Meeting setup & permissions
│   │       ├── MeetingContainer.js # Meeting state manager
│   │       ├── Components/    # Meeting components
│   │       ├── Conference/    # Group meeting view
│   │       ├── OneToOne/      # One-to-one meeting view
│   │       ├── Hooks/         # Custom hooks
│   │       └── stub.js        # Export stub
│   │
│   ├── styles/
│   │   ├── colors.js          # Color palette
│   │   ├── fonts.js           # Font definitions
│   │   └── spacing.js         # Spacing utilities
│   │
│   └── utils/
│       ├── getRandomColors.js # Utility for random colors
│       └── useOrientation.js  # Custom hook for device orientation
│
├── android/                   # Android native code
├── ios/                       # iOS native code
│
├── firebase.json              # Firebase config
├── supabase.js               # Supabase client setup
├── package.json              # Dependencies & scripts
├── babel.config.js           # Babel configuration
├── metro.config.js           # Metro bundler config
└── README.md                 # Project documentation
```

---

## 🔧 Core Components & Functionality

### 1. **index.js - App Entry Point**
```javascript
- Imports react-native-url-polyfill for browser APIs
- Sets status bar color to match theme
- Registers VideoSDK service
- Registers main App component
```

### 2. **App.js - Root Component**
```javascript
- Wraps entire app with NavigationContainer
- Renders RootNavigator component
- Provides navigation context
```

### 3. **supabase.js - Backend Setup**
```javascript
- Initializes Supabase client with:
  - URL: wgyoarzdzlkadefydfvk.supabase.co
  - Anonymous Key (public key)
- Exported as global 'supabase' instance
- Used for auth and database operations
```

### 4. **api.js - VideoSDK API Integration**
```javascript
Key Functions:
- getToken(): Gets VideoSDK authentication token
  - From REACT_APP_VIDEOSDK_TOKEN env variable, or
  - From external API (REACT_APP_AUTH_URL)
  
- createMeeting({ token }): Creates new meeting room
  - POST to /v2/rooms
  - Returns roomId
  
- validateMeeting({ meetingId, token }): Validates meeting exists
  - GET /v2/rooms/validate/{meetingId}
  - Returns boolean
  
- fetchSession({ meetingId, token }): Gets session details
  - GET /v2/sessions?roomId={meetingId}
  - Returns session data
```

---

## 🔐 Authentication Flow

### Complete Authentication Journey

```
┌─────────────────────────────────────────────────────────────┐
│                   App Launch (App.js)                       │
│                  ↓                                            │
│         NavigationContainer                                 │
│                  ↓                                            │
│            RootNavigator.js                                 │
│         (Auth State Manager)                                │
└────────┬──────────────────────────────────────────────────┘
         │
         ├─ Session Check (supabase.auth.getSession)
         │
         ├─ If no session ──→ AuthStack (Unauthenticated)
         │                      │
         │                      ├─→ WelcomeScreen
         │                      ├─→ RoleSelectScreen
         │                      ├─→ LoginScreen
         │                      └─→ SignupScreen
         │
         └─ If session exists ──→ Fetch User Role
                                  │
                                  ├─ Role = 'student' ──→ StudentStack
                                  │                       (StudentDashboard)
                                  │
                                  └─ Role = 'teacher' ──→ TeacherStack
                                                         (TeacherDashboard)
```

### RootNavigator.js - Central Auth Controller
```javascript
State Management:
- session: User authentication session from Supabase
- role: User role ('teacher' or 'student')
- loading: Shows loading spinner during auth check

Key Functions:
1. initAuth():
   - Gets current session on app load
   - Sets up auth state change listener
   - Subscribes to auth events

2. fetchRole(userId):
   - Queries 'profiles' table
   - Gets user role
   - Updates state to show correct dashboard

3. Navigation Logic:
   - No session → Show AuthStack (welcome/login/signup)
   - Session + role → Show role-specific stack
   - Loading → Show spinner
```

### Authentication Process

**Signup (SignupScreen.js)**
```javascript
1. User enters: fullName, email, password
2. supabase.auth.signUp() → Creates auth user
3. supabase.from('profiles').insert() → Stores profile with role
4. Trigger: onAuthStateChange → Updates RootNavigator
5. Role fetched → Navigates to dashboard
```

**Login (LoginScreen.js)**
```javascript
1. User enters: email, password
2. supabase.auth.signInWithPassword() → Authenticates
3. Trigger: onAuthStateChange → Updates RootNavigator
4. Role fetched → Navigates to dashboard
```

### Database Schema (Supabase)
```sql
-- profiles table
CREATE TABLE profiles (
  id uuid (primary key, matches auth.users.id)
  full_name text
  role text ('teacher' or 'student')
)
```

---

## 📹 Meeting System

### Meeting Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    Join Screen (join/index.js)              │
│  (Create or Join Meeting)                                   │
└────────────┬─────────────────────────────────────────────────┘
             │
             ├─ Create New Meeting:
             │  1. Get VideoSDK token from api.js
             │  2. createMeeting({ token }) → returns meetingId
             │  3. Validate meeting
             │
             └─ Join Existing Meeting:
                1. User enters meetingId
                2. validateMeeting() → verify it exists
             │
             ↓
┌──────────────────────────────────────────────────────────────┐
│              Meeting Screen (meeting/index.js)              │
│  (Setup & Permission Requests)                              │
└────────────┬─────────────────────────────────────────────────┘
             │
             ├─ Request Permissions:
             │  - Camera (CAMERA)
             │  - Microphone (RECORD_AUDIO)
             │  - Notifications (Android 13+)
             │
             ├─ Create Video Track
             ├─ Initialize Audio Devices
             │
             ↓
┌──────────────────────────────────────────────────────────────┐
│        MeetingContainer.js (State Manager)                  │
│  - Wraps meeting with MeetingProvider                        │
│  - Handles join/leave logic                                 │
└────────────┬─────────────────────────────────────────────────┘
             │
             ├─ useMeeting() hook:
             │  - localParticipant, participants
             │  - join(), leave(), end()
             │  - toggleMic(), toggleWebcam()
             │  - toggleScreenShare()
             │  - startRecording(), stopRecording()
             │
             ├─ On meeting joined:
             │  - Check participant count
             │  - Render appropriate view
             │
             ├─ If 1-to-1 meeting ──→ OneToOneMeetingViewer
             │  (2 participants max)
             │
             └─ If Group meeting ──→ ConferenceMeetingViewer
                (2+ participants)
```

### Join Screen (join/index.js) - Detailed

```javascript
Main Features:
1. Meeting Type Selection:
   - ONE_TO_ONE (max 2 participants)
   - GROUP (unlimited)

2. Video Preview:
   - createCameraVideoTrack() - Get local video
   - RTCView - Display video preview
   - Mic/Video toggle buttons
   - Camera switch (front/back)
   - Audio device selection

3. Meeting Creation/Joining:
   - Create: Calls createMeeting() API
   - Join: User enters meeting ID
   - Validates meeting before joining

4. State Management:
   - tracks: Local video track
   - micOn/videoOn: Audio/video states
   - name: User display name
   - meetingId: Target meeting
   - facingMode: Camera direction (user/environment)
   - audioList: Available audio devices
```

### Meeting Container (MeetingContainer.js)

```javascript
Purpose: State manager for meeting lifecycle

Uses useMeeting() hook:
- join(): Join meeting with token/meetingId
- participants: Map of all participants
- localParticipant: Self participant info
- toggleMic(): Mute/unmute
- toggleWebcam(): Turn camera on/off
- leave(): Leave meeting
- end(): End meeting for all

Meeting Status:
- isJoined: Meeting joined successfully
- participantLimit: Enforce max participants (2 for 1-to-1)
- error: Meeting error messages

Rendering Logic:
├─ Loading → WaitingToJoinView (spinner)
├─ Error → Error message display
├─ meetingType === "GROUP" → ConferenceMeetingViewer
│  (Multiple participants in grid)
├─ meetingType === "ONE_TO_ONE" && participants > 2 → ParticipantLimitViewer
└─ meetingType === "ONE_TO_ONE" → OneToOneMeetingViewer
   (Large + mini view layout)
```

### Meeting Views

#### 1. **OneToOneMeetingViewer** (One-to-One Meetings)
```javascript
Layout:
- Large View: Remote participant
- Mini View: Local participant (corner)
- Control Bar: Mic, Video, Camera Switch, Screen Share, etc.

Key Features:
- toggleMic(): Mute/unmute microphone
- toggleWebcam(): Turn camera on/off
- changeWebcam(): Switch between front/back camera
- toggleScreenShare(): Share screen
- startRecording(): Record meeting
- stopRecording(): Stop recording

Menus:
- Leave Menu: Leave or End for all
- Audio Device Menu: Switch audio output
- More Options: Chat, Participants, Recording status
- Chat Viewer: Send/receive messages
- Participant List: View all participants

State:
- chatViewer: Show/hide chat
- participantListViewer: Show/hide participants
- participantStatsViewer: Show/hide network stats
```

#### 2. **ConferenceMeetingViewer** (Group Meetings)
```javascript
Layout:
- Participant Grid: Multiple participants in grid view
- Pinned Participant: Large view for presenter
- Control Bar: Same controls as OneToOne

Additional Features:
- Grid Layout: Display 2-4 participants per screen
- Pinned View: Presenter/speaker in large view
- Active Speaker: Highlight speaking participant
- Presenter Mode: One large + grid layout

All Features:
- Same controls as OneToOne
- Grid switching
- Participant pinning
- Recording (entire meeting)
```

---

## 🎨 Component Breakdown

### UI Components (src/components/)

#### 1. **Button Component**
```javascript
Props:
- text: Button label
- backgroundColor: Custom button color (default: #5568FE)
- onPress: Click handler
- style: Custom styles
- textStyle: Custom text styles

Usage:
<Button 
  text="Join Meeting" 
  onPress={() => handleJoin()}
  backgroundColor="#2ECC71"
/>
```

#### 2. **Avatar Component**
```javascript
Props:
- fullName: User name (shows first letter)
- containerBackgroundColor: Background color
- fontSize: Text size
- style: Custom styles

Usage:
<Avatar 
  fullName="John Doe"
  containerBackgroundColor="#5568FE"
  fontSize={16}
/>
```

#### 3. **IconContainer Component**
Purpose: Wrapper for control button icons (mic, video, etc.)

#### 4. **BottomSheet Component**
Purpose: Modal bottom sheet for menus (participants, chat)
- Slides up from bottom
- Swipeable to close
- Dark background overlay

#### 5. **Menu Component**
Purpose: Context menu for options
- Appears at tap location
- MenuItem sub-components
- Used for Leave, Audio Devices, More options

#### 6. **TextInputContainer Component**
Purpose: Styled text input for forms
- Meeting ID input
- User name input
- Chat message input

#### 7. **Blink Component**
Purpose: Blinking animation indicator
- Recording status indicator
- Online status indicator

### Scene Components (src/scenes/)

#### **Dashboard Screens**

**StudentDashboard.js**
```
Layout:
┌─────────────────────┐
│  Hello 👋           │
│  Student            │ (Header)
├─────────────────────┤
│  📹 Join Live Class │ (Primary action)
├─────────────────────┤
│  📚 My Classes      │
│  🗓️ Schedule        │ (Grid - 2 columns)
│  📝 Assignments     │
│  ✅ Attendance      │
├─────────────────────┤
│  🔔 Notifications   │
│  🚪 Logout          │
└─────────────────────┘

Functions:
- Join live class → Navigate to Join screen
- Alert placeholders for other features
```

**TeacherDashboard.js**
```
Layout:
┌─────────────────────┐
│  Welcome back 👋    │
│  Mr. Teacher        │ (Header)
├─────────────────────┤
│  🎥 Start Live Class│ (Primary action)
├─────────────────────┤
│  📊 My Sessions     │
│  👨‍🎓 Students        │ (Grid - 2 columns)
│  💰 Earnings        │
│  🔔 Notifications   │
├─────────────────────┤
│  ⚙️ Settings        │
│  🚪 Logout          │
└─────────────────────┘

Functions:
- Start live class → Navigate to Join screen
- Alert placeholders for other features
```

---

## 🎨 Styling & Theme

### Color Palette (src/styles/colors.js)
```javascript
Primary Colors:
- 100: #FFFFFF (White)
- 200: #EFEFEF (Light Gray)
- 300: #DADADA (Gray)
- 400: #818181 (Medium Gray)
- 500: #6F767E (Gray)
- 600: #404B53 (Dark Gray)
- 700: #232830 (Darker Gray)
- 800: #1A1C22 (Very Dark)
- 900: #050A0E (Charcoal/Black) - Main background

Accent Colors:
- Purple: #5568FE (Primary action)
- Green: #2ECC71 (Success, teacher actions)
- Blue: #6CA0FF (Links, highlights)
```

### Font System (src/styles/fonts.js)
```javascript
Primary Font Family: Roboto
- Roboto-Bold
- Roboto-Regular
- (Located in src/assets/fonts/Roboto/)

Font Sizing:
- Large headings: 26-36px
- Subheadings: 18-20px
- Body text: 14-16px
- Small text: 12-14px
```

### Spacing Utilities (src/styles/spacing.js)
```javascript
- convertRFValue(value): Responsive font scaling
- Adapts to different screen sizes
```

### Theme Colors Used Throughout
```javascript
Dark Mode Theme:
- Background: #0B0D2A (dark navy)
- Card Background: #1C1F4A (navy)
- Text: #FFFFFF (white)
- Secondary Text: #CCCCCC (light gray)
- Primary Action: #1E2BFF or #5568FE (blue)
- Teacher Action: #2ECC71 (green)
- Links: #6CA0FF (light blue)
```

---

## 📦 Key Libraries & Their Usage

### React Navigation (v7.x)
```javascript
- NavigationContainer: Root navigation wrapper
- createStackNavigator: Screen stack management
- useFocusEffect: Detect screen focus changes
- useNavigation: Access navigation from components

Structure:
RootNavigator (dynamic)
├── AuthStack (unauthenticated users)
│   ├── WelcomeScreen
│   ├── RoleSelectScreen
│   ├── LoginScreen
│   ├── SignupScreen
│   ├── Join
│   └── Meeting
├── StudentStack (authenticated students)
│   ├── StudentDashboard
│   ├── Join
│   └── Meeting
└── TeacherStack (authenticated teachers)
    ├── TeacherDashboard
    ├── Join
    └── Meeting
```

### VideoSDK (@videosdk.live/react-native-sdk)
```javascript
Core Hooks:
- useMeeting():
  * join(), leave(), end()
  * toggleMic(), toggleWebcam()
  * toggleScreenShare()
  * participants (Map of all)
  * localParticipant, localMicOn, localWebcamOn
  * startRecording(), stopRecording()
  * recordingState

- useParticipant():
  * Access individual participant
  * displayName, isVisible, webcamStream

- MeetingProvider:
  * Wraps meeting context
  * Provides useMeeting hook

- MeetingConsumer:
  * Consumer for meeting context

- RTCView:
  * Displays video streams
  * Local or remote participant

API Calls (getToken, createMeeting, validateMeeting)
```

### Supabase (@supabase/supabase-js)
```javascript
Authentication:
- supabase.auth.signUp({ email, password })
- supabase.auth.signInWithPassword({ email, password })
- supabase.auth.getSession()
- supabase.auth.onAuthStateChange(callback)

Database:
- supabase.from('table').select()
- supabase.from('table').insert()
- supabase.from('table').update()

Used For:
- User registration & login
- Profile storage
- Role management
```

### UI Libraries
```javascript
- react-native-modal: Modal dialogs
- lottie-react-native: Animations (recording, joining)
- react-native-svg: SVG icons
- react-native-simple-toast: Toast notifications
- react-native-safe-area-context: Safe area handling
- react-native-screens: Native screen management
- react-native-gesture-handler: Touch gesture handling
- react-native-hyperlink: Clickable links
```

### Utilities
```javascript
- moment: Date/time formatting
- react-native-responsive-fontsize: Responsive text
- react-native-dotenv: Environment variables
- @react-native-community/cli: React Native CLI tools
```

---

## 📊 Data Flow Diagrams

### Complete App Flow

```
User Opens App
        ↓
   index.js
   - Register VideoSDK
   - Register App component
        ↓
   App.js
   - NavigationContainer
        ↓
   RootNavigator.js
   - Check authentication
        ├─ No Session ──→ AuthStack
        │  ├─ WelcomeScreen → Button press
        │  ├─ RoleSelectScreen → Choose teacher/student
        │  ├─ LoginScreen/SignupScreen → Auth via Supabase
        │  │  - signUp() or signInWithPassword()
        │  │  - Store profile in 'profiles' table
        │  │  - Trigger onAuthStateChange()
        │  ├─ Fetch role from profiles table
        │  └─ Redirect to dashboard
        │
        └─ Session exists ──→ Fetch Role
           ├─ Role = 'student' ──→ StudentStack
           │  └─ StudentDashboard
           │     ├─ View class info
           │     └─ Click "Join Live Class"
           │        ↓
           │        Join Screen (join/index.js)
           │        - Create or join meeting
           │
           └─ Role = 'teacher' ──→ TeacherStack
              └─ TeacherDashboard
                 ├─ View session info
                 └─ Click "Start Live Class"
                    ↓
                    Join Screen (join/index.js)
                    - Create meeting
```

### Meeting Creation & Joining Flow

```
Join Screen (join/index.js)
├─ Create Meeting:
│  1. Get token from api.getToken()
│  2. Call api.createMeeting({ token })
│     POST /v2/rooms → returns meetingId
│  3. Validate meeting with api.validateMeeting()
│     GET /v2/rooms/validate/{meetingId}
│  4. Navigate to Meeting screen with token + meetingId
│
└─ Join Existing Meeting:
   1. User enters meeting ID
   2. Get token from api.getToken()
   3. Call api.validateMeeting({ meetingId, token })
   4. If valid, navigate to Meeting screen

              ↓

Meeting Screen (meeting/index.js)
├─ Request Permissions
│  - Camera
│  - Microphone
│  - Notifications (Android)
├─ Create video track
├─ Initialize audio devices
└─ Navigate to MeetingContainer

              ↓

MeetingContainer.js
├─ useMeeting() hook with token/meetingId
├─ On joined:
│  - Check participant count
│  - Render appropriate view
│
├─ For 1-to-1 → OneToOneMeetingViewer
│  └─ Large view + mini view layout
│
└─ For Group → ConferenceMeetingViewer
   └─ Grid layout with controls
```

### Video Stream Flow

```
Local Participant:
├─ createCameraVideoTrack() in Join screen
├─ Video preview in RTCView
├─ Send video to meeting via toggleWebcam()
└─ Display in mini view during meeting

Remote Participant:
├─ Receive video stream from other participant
├─ Render in RTCView with video track
├─ Display in large view (1-to-1) or grid (group)
└─ Handle participant join/leave events

Meeting Container manages:
- participants (Map): All participant data
- localParticipant: Self info
- Trigger re-renders when participants change
```

---

## 🔄 State Management Summary

### Global States
1. **RootNavigator**: Authentication state, session, role
2. **Dashboard**: Alert dialogs (mock features)
3. **Join Screen**: Meeting creation/validation state
4. **Meeting Container**: Meeting join state, participant count
5. **One-to-One Viewer**: Chat, participants, recording state
6. **Conference Viewer**: Chat, participants, grid layout, recording state

### Local Component States
- Input fields: email, password, name, meetingId
- Toggle states: mic, video, screen share, camera
- UI states: menu visibility, bottom sheet visibility
- Media: audio device list, selected device

---

## 🚀 Key Features Implementation

### 1. **User Authentication**
- Location: `RootNavigator.js`, `LoginScreen.js`, `SignupScreen.js`
- Method: Supabase Auth
- States: No session → AuthStack, Session → Dashboard

### 2. **Meeting Creation**
- Location: `join/index.js`
- Method: `api.createMeeting()` → VideoSDK API
- Returns: meetingId, token

### 3. **Live Video**
- Location: `meeting/index.js`, `MeetingContainer.js`, View files
- Method: `useMeeting()` hook + VideoSDK
- Features: Mic, video, camera switch

### 4. **Screen Sharing**
- Location: Meeting viewers
- Method: `toggleScreenShare()`, `enableScreenShare()`, `disableScreenShare()`
- Shows presenter video + shared screen

### 5. **Recording**
- Location: Meeting viewers
- Method: `startRecording()`, `stopRecording()`
- Animation: Lottie recording indicator

### 6. **Chat**
- Location: `Components/ChatViewer.js`
- Method: VideoSDK chat API
- UI: Bottom sheet viewer

### 7. **Participant Management**
- Location: Meeting viewers
- Shows: All participants with video
- Features: Grid (group), large+mini (1-to-1)
- List: Bottom sheet with all participants

---

## 📱 Screen Navigation Reference

```
SCREEN_NAMES Constants (screenNames.js):
- Join: "Join_Screen"
- Meeting: "Meeting_Screen"
- WelcomeScreen: "WelcomeScreen"
- RoleSelectScreen: "RoleSelect"

Navigation Chains:
1. Welcome → RoleSelect → Login → Dashboard → Join → Meeting
2. Dashboard → Join → Meeting
3. Meeting → Dashboard (leave) or App (end)
```

---

## 🔧 Development & Debugging

### Key Console Logs
Look for colored console logs in code:
- 🔵 Blue: Info/flow logs
- ✅ Green: Success logs
- 🔴 Red: Error logs

### Common Issues & Solutions
1. **Missing token**: Set `REACT_APP_VIDEOSDK_TOKEN` in `.env`
2. **Permission denied**: Request camera/mic permissions
3. **Meeting not found**: Validate meetingId exists
4. **Video not showing**: Check WebRTC permissions
5. **Supabase errors**: Verify connection string and keys

### Testing
```bash
npm test              # Run Jest tests
yarn test             # Using Yarn
npm run lint          # Run ESLint
npm run android       # Build Android
npm run ios           # Build iOS
npm start             # Start Metro bundler
```

---

## 📋 Configuration Files

### .env File (Not shown, create from .env.example)
```
REACT_APP_VIDEOSDK_TOKEN=your_token_here
REACT_APP_AUTH_URL=optional_auth_api
```

### supabase.js Configuration
```javascript
URL: https://wgyoarzdzlkadefydfvk.supabase.co
Key: Public anonymous key (exposed, that's okay for Supabase)
```

### firebase.json
- Firebase distribution config (for APK distribution)

### babel.config.js
- Babel presets for React Native compilation
- Supports react-native-dotenv for env variables

### metro.config.js
- Metro bundler configuration for React Native
- Asset resolution configuration

---

## 🎓 Summary

This is a **complete educational video conferencing platform** built with:

1. **Modern React Native** - Cross-platform mobile app
2. **VideoSDK.live** - Real-time video/audio communication
3. **Supabase** - User management and authentication
4. **React Navigation** - Screen management
5. **Responsive UI** - Dark theme, animations, icons

The app supports multiple meeting types (1-to-1 and group), complete role-based access control, and all major conference features.

---

**Generated**: January 25, 2026
**Framework**: React Native 0.79.3
**Video SDK**: @videosdk.live/react-native-sdk 0.7.3
