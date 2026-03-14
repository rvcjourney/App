/**
 * Icon Mapping System
 * Maps emoji/icon names to React Native Vector Icons with library and name
 * Used instead of hardcoded emoji throughout the app
 *
 * Libraries available:
 * - AntDesign
 * - MaterialIcons
 * - MaterialCommunityIcons
 * - Feather
 * - FontAwesome (legacy)
 * - FontAwesome5
 */

export const ICON_MAP = {
  // ===== PROFESSIONS (from PROFESSIONS constant) =====
  yoga: {
    library: 'MaterialCommunityIcons',
    name: 'yoga',
    size: 40,
    description: 'Yoga Profession',
  },
  gymTrainer: {
    library: 'MaterialCommunityIcons',
    name: 'dumbbell',
    size: 40,
    description: 'Gym Trainer',
  },
  academicTeacher: {
    library: 'MaterialCommunityIcons',
    name: 'book-open',
    size: 40,
    description: 'Academic Teacher',
  },
  businessConsultant: {
    library: 'MaterialCommunityIcons',
    name: 'briefcase',
    size: 40,
    description: 'Business Consultant',
  },
  astrologers: {
    library: 'MaterialCommunityIcons',
    name: 'crystal-ball',
    size: 40,
    description: 'Astrologers',
  },

  // ===== COMMON ACTIONS =====
  star: {
    library: 'AntDesign',
    name: 'star',
    size: 20,
    description: 'Star/Rating',
  },
  starFilled: {
    library: 'AntDesign',
    name: 'star',
    size: 20,
    solid: true,
    description: 'Filled Star',
  },
  check: {
    library: 'AntDesign',
    name: 'check',
    size: 20,
    description: 'Checkmark',
  },
  checkCircle: {
    library: 'AntDesign',
    name: 'checkcircle',
    size: 24,
    description: 'Check Circle',
  },
  close: {
    library: 'AntDesign',
    name: 'close',
    size: 20,
    description: 'Close/X',
  },
  closeCircle: {
    library: 'AntDesign',
    name: 'closecircle',
    size: 24,
    description: 'Close Circle',
  },
  lock: {
    library: 'AntDesign',
    name: 'lock',
    size: 20,
    description: 'Lock/Security',
  },

  // ===== MEDIA =====
  camera: {
    library: 'MaterialCommunityIcons',
    name: 'video-camera',
    size: 20,
    description: 'Camera',
  },
  video: {
    library: 'MaterialCommunityIcons',
    name: 'video',
    size: 20,
    description: 'Video Recording',
  },
  videoCam: {
    library: 'MaterialCommunityIcons',
    name: 'video-outline',
    size: 20,
    description: 'Video Call',
  },

  // ===== TIME & CALENDAR =====
  calendar: {
    library: 'AntDesign',
    name: 'calendar',
    size: 18,
    description: 'Calendar/Date',
  },
  clock: {
    library: 'AntDesign',
    name: 'clockcircle',
    size: 18,
    description: 'Clock/Time',
  },
  hourglass: {
    library: 'MaterialCommunityIcons',
    name: 'hourglass',
    size: 20,
    description: 'Pending/Loading',
  },

  // ===== COMMUNICATION =====
  phone: {
    library: 'AntDesign',
    name: 'phone',
    size: 18,
    description: 'Phone Call',
  },
  email: {
    library: 'MaterialCommunityIcons',
    name: 'email',
    size: 18,
    description: 'Email',
  },

  // ===== FINANCE & PAYMENT =====
  creditCard: {
    library: 'MaterialCommunityIcons',
    name: 'credit-card',
    size: 18,
    description: 'Credit Card',
  },
  money: {
    library: 'MaterialCommunityIcons',
    name: 'cash-multiple',
    size: 18,
    description: 'Money',
  },
  dollarSign: {
    library: 'Feather',
    name: 'dollar-sign',
    size: 20,
    description: 'Dollar/Price',
  },
  bank: {
    library: 'MaterialCommunityIcons',
    name: 'bank',
    size: 18,
    description: 'Bank',
  },
  wallet: {
    library: 'MaterialCommunityIcons',
    name: 'wallet',
    size: 18,
    description: 'Wallet/Payment',
  },

  // ===== DATA & CHARTS =====
  trendingUp: {
    library: 'Feather',
    name: 'trending-up',
    size: 20,
    description: 'Trending Up/Growth',
  },
  barChart: {
    library: 'Feather',
    name: 'bar-chart-2',
    size: 20,
    description: 'Bar Chart',
  },
  lightbulb: {
    library: 'MaterialCommunityIcons',
    name: 'lightbulb',
    size: 20,
    description: 'Idea/Info',
  },

  // ===== NAVIGATION =====
  home: {
    library: 'AntDesign',
    name: 'home',
    size: 24,
    description: 'Home',
  },
  user: {
    library: 'AntDesign',
    name: 'user',
    size: 24,
    description: 'User/Profile',
  },
  users: {
    library: 'AntDesign',
    name: 'team',
    size: 24,
    description: 'Users/Group',
  },
  settings: {
    library: 'AntDesign',
    name: 'setting',
    size: 24,
    description: 'Settings',
  },
  menu: {
    library: 'AntDesign',
    name: 'menufold',
    size: 24,
    description: 'Menu',
  },
  back: {
    library: 'Feather',
    name: 'chevron-left',
    size: 24,
    description: 'Back',
  },
  forward: {
    library: 'Feather',
    name: 'chevron-right',
    size: 24,
    description: 'Forward',
  },
  arrowLeft: {
    library: 'Feather',
    name: 'arrow-left',
    size: 24,
    description: 'Arrow Left',
  },
  arrowRight: {
    library: 'Feather',
    name: 'arrow-right',
    size: 24,
    description: 'Arrow Right',
  },

  // ===== NOTIFICATIONS & ACTIONS =====
  bell: {
    library: 'MaterialCommunityIcons',
    name: 'bell',
    size: 20,
    description: 'Notification Bell',
  },
  search: {
    library: 'AntDesign',
    name: 'search1',
    size: 20,
    description: 'Search',
  },
  plus: {
    library: 'AntDesign',
    name: 'plus',
    size: 20,
    description: 'Add/Plus',
  },
  minus: {
    library: 'AntDesign',
    name: 'minus',
    size: 20,
    description: 'Remove/Minus',
  },
  refresh: {
    library: 'Feather',
    name: 'refresh-cw',
    size: 18,
    description: 'Refresh/Reload',
  },
  download: {
    library: 'Feather',
    name: 'download',
    size: 18,
    description: 'Download',
  },
  upload: {
    library: 'Feather',
    name: 'upload',
    size: 18,
    description: 'Upload',
  },

  // ===== MISCELLANEOUS =====
  sparkles: {
    library: 'MaterialCommunityIcons',
    name: 'sparkles',
    size: 20,
    description: 'Sparkle/Premium',
  },
  info: {
    library: 'AntDesign',
    name: 'infocirlce',
    size: 20,
    description: 'Info',
  },
  heart: {
    library: 'AntDesign',
    name: 'heart',
    size: 20,
    description: 'Heart/Like',
  },
  heartFilled: {
    library: 'AntDesign',
    name: 'heart',
    size: 20,
    solid: true,
    description: 'Heart Filled',
  },
  eye: {
    library: 'Feather',
    name: 'eye',
    size: 20,
    description: 'Eye/View',
  },
  eyeOff: {
    library: 'Feather',
    name: 'eye-off',
    size: 20,
    description: 'Eye Off/Hidden',
  },
};

export default ICON_MAP;
