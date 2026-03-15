/**
 * Unified Icon Component
 * Renders custom SVG icons from src/assets/icons/
 * Supports all custom SVG components with consistent interface
 */

import React from 'react';
import UNIFIED_THEME from '../../constants/unifiedTheme';

// Import all custom SVG icons
import Home from '../../assets/icons/Home';
import User from '../../assets/icons/User';
import Users from '../../assets/icons/Users';
import Settings from '../../assets/icons/Settings';
import Calendar from '../../assets/icons/Calendar';
import Clock from '../../assets/icons/Clock';
import Star from '../../assets/icons/Star';
import SearchIcon from '../../assets/icons/SearchIcon';
import Phone from '../../assets/icons/Phone';
import DollarSign from '../../assets/icons/DollarSign';
import CheckCircle from '../../assets/icons/CheckCircle';
import Heart from '../../assets/icons/Heart';
import HeartFilled from '../../assets/icons/HeartFilled';
import HeartOutline from '../../assets/icons/HeartOutline';
import ChevronRight from '../../assets/icons/ChevronRight';
import ChevronLeft from '../../assets/icons/ChevronLeft';
import Video from '../../assets/icons/Video';
import BookOpen from '../../assets/icons/BookOpen';
import Briefcase from '../../assets/icons/Briefcase';
import Play from '../../assets/icons/Play';
import AlertCircle from '../../assets/icons/AlertCircle';
import GraduationCap from '../../assets/icons/GraduationCap';
import MoneyBag from '../../assets/icons/MoneyBag';
import Bell from '../../assets/icons/Bell';
import Check from '../../assets/icons/Check';
import Close from '../../assets/icons/Close';
import Lock from '../../assets/icons/Lock';
import Money from '../../assets/icons/Money';
import Hourglass from '../../assets/icons/Hourglass';
import Lightbulb from '../../assets/icons/Lightbulb';
import BarChart from '../../assets/icons/BarChart';
import Upload from '../../assets/icons/Upload';
import Sparkles from '../../assets/icons/Sparkles';
import Inbox from '../../assets/icons/Inbox';
import Email from '../../assets/icons/Email';
import CreditCard from '../../assets/icons/CreditCard';
import Bank from '../../assets/icons/Bank';
import Wallet from '../../assets/icons/Wallet';
import Refresh from '../../assets/icons/Refresh';
import Download from '../../assets/icons/Download';
import Plus from '../../assets/icons/Plus';
import Minus from '../../assets/icons/Minus';
import Info from '../../assets/icons/Info';
import Eye from '../../assets/icons/Eye';
import EyeOff from '../../assets/icons/EyeOff';
import TrendingUp from '../../assets/icons/TrendingUp';
import Menu from '../../assets/icons/Menu';

/**
 * Icon name to component mapping
 * Maps all icon names used in the app to their SVG components
 * Includes aliases for multiple names pointing to same icon
 */
const ICON_MAP = {
  // Navigation
  home: Home,
  user: User,
  users: Users,
  settings: Settings,

  // Time & Calendar
  calendar: Calendar,
  clock: Clock,

  // Rating & Selection
  star: Star,
  starFilled: Star,

  // Search & Actions
  search: SearchIcon,
  phone: Phone,

  // Finance
  dollarSign: DollarSign,
  money: Money,
  creditCard: CreditCard,
  bank: Bank,
  wallet: Wallet,

  // Status & Feedback
  checkCircle: CheckCircle,
  'check-circle': CheckCircle,
  check: Check,
  close: Close,
  closeCircle: Close,

  // Favorites & Emotions
  heart: Heart,
  heartFilled: HeartFilled,
  'heart-outline': HeartOutline,
  heartOutline: HeartOutline,

  // Navigation Arrows
  chevronRight: ChevronRight,
  forward: ChevronRight,
  chevronLeft: ChevronLeft,
  back: ChevronLeft,
  'chevron-left': ChevronLeft,

  // Media
  video: Video,
  videoCam: Video,
  play: Play,

  // Learning & Education
  book: BookOpen,
  bookOpen: BookOpen,
  academicTeacher: BookOpen,
  briefcase: Briefcase,
  businessConsultant: Briefcase,
  graduationCap: GraduationCap,

  // Notifications & Info
  bell: Bell,
  info: Info,
  alertCircle: AlertCircle,
  inbox: Inbox,

  // Communication
  email: Email,

  // Status Indicators
  hourglass: Hourglass,
  sparkles: Sparkles,

  // Utility
  lightbulb: Lightbulb,
  lock: Lock,
  barChart: BarChart,
  trendingUp: TrendingUp,
  upload: Upload,
  download: Download,
  refresh: Refresh,

  // Math Operations
  plus: Plus,
  minus: Minus,

  // Visibility
  eye: Eye,
  eyeOff: EyeOff,

  // Menu
  menu: Menu,
  moneyBag: MoneyBag,
};

/**
 * Resolve color from UNIFIED_THEME
 * @param {string} color - Color name or hex value
 * @returns {string} Resolved color hex value
 */
const resolveColor = (color) => {
  // Default to primary text if no color specified
  if (!color) return UNIFIED_THEME.colors.text.primary;

  // If it's "primary", use primary text color
  if (color === 'primary') return UNIFIED_THEME.colors.text.primary;

  // If it's a hex code, use directly
  if (color.startsWith('#')) return color;

  // Check accent colors (e.g., "accent.primary")
  if (color.includes('.')) {
    const parts = color.split('.');
    if (UNIFIED_THEME.colors[parts[0]] && UNIFIED_THEME.colors[parts[0]][parts[1]]) {
      return UNIFIED_THEME.colors[parts[0]][parts[1]];
    }
  }

  // Check accent colors directly
  if (UNIFIED_THEME.colors.accent[color]) {
    return UNIFIED_THEME.colors.accent[color];
  }

  // Check text colors
  if (UNIFIED_THEME.colors.text[color]) {
    return UNIFIED_THEME.colors.text[color];
  }

  // Check status colors
  if (UNIFIED_THEME.colors.status[color]) {
    return UNIFIED_THEME.colors.status[color];
  }

  // If not found in theme, return as-is (could be a valid CSS color)
  return color;
};

/**
 * Icon Component
 * @param {string} name - Icon name from ICON_MAP
 * @param {number} size - Icon size in pixels (width and height)
 * @param {string} color - Color name or hex value (resolved via UNIFIED_THEME)
 * @param {object} style - Additional styles to pass to SVG
 * @param {object} props - Additional props to spread on SVG
 */
export const Icon = ({
  name,
  size = 24,
  color = 'primary',
  style,
  ...props
}) => {
  // Get SVG component from mapping
  const SvgIcon = ICON_MAP[name];

  // Return null silently if icon not found (clean production builds)
  if (!SvgIcon) {
    return null;
  }

  // Resolve color through UNIFIED_THEME
  const resolvedColor = resolveColor(color);

  // Render SVG icon with resolved properties
  return (
    <SvgIcon
      width={size}
      height={size}
      fill={resolvedColor}
      style={style}
      {...props}
    />
  );
};

export default Icon;
