# Connectiqo Theme Guide

This document defines the complete design system for the Connectiqo application. Follow this guide when updating UI components to maintain visual consistency.

---

## 🎨 Color Palette

### Primary Colors
| Color | Hex Code | Usage |
|-------|----------|-------|
| **Neon Pink/Magenta** | `#ff006e` | Primary accent, CTA buttons, highlights, glow effects |
| **Bright Magenta** | `#ff1493` | Alternative accent for interactive elements |
| **Cyan/Electric Blue** | `#00d4ff` | Secondary accent, alternative highlights |
| **Bright Blue** | `#00b4ff` | Gradients, secondary CTAs |

### Background Colors
| Color | Hex Code | Usage |
|-------|----------|-------|
| **Dark Navy** | `#0f1b3f` | Primary background |
| **Deep Purple** | `#1a0033` | Card backgrounds, overlays |
| **Very Dark Purple** | `#0d0015` | Dark mode backgrounds |
| **Dark Slate** | `#1a1a2e` | Alternative background |

### Text Colors
| Color | Hex Code | Usage |
|-------|----------|-------|
| **White** | `#ffffff` | Primary text, headings |
| **Light Gray** | `#e0e0e0` | Secondary text |
| **Medium Gray** | `#b0b0b0` | Tertiary text, hints |
| **Muted Gray** | `#808080` | Disabled text |

### Transparent/Glass Colors
| Color | Usage |
|-------|-------|
| `rgba(255, 255, 255, 0.08)` | Card backgrounds (glassmorphism) |
| `rgba(255, 255, 255, 0.05)` | Subtle overlays |
| `rgba(255, 0, 110, 0.3)` | Neon pink borders |
| `rgba(0, 212, 255, 0.3)` | Cyan borders |
| `rgba(255, 0, 110, 0.2)` | Neon pink glow (subtle) |
| `rgba(255, 0, 110, 0.6)` | Neon pink glow (strong) |

---

## 📐 Typography

### Font Families
- **Primary**: Inter, Poppins, or system sans-serif
- **Fallback**: -apple-system, BlinkMacSystemFont, Segoe UI

### Font Sizes & Weights
| Type | Size | Weight | Usage |
|------|------|--------|-------|
| **Display/Heading 1** | 36-44px | 700 (Bold) | App name, major headings |
| **Heading 2** | 28-32px | 700 (Bold) | Section titles |
| **Heading 3** | 22-24px | 600 (SemiBold) | Subsections |
| **Body Large** | 18px | 600 (SemiBold) | Button text, emphasis |
| **Body Regular** | 16px | 500 (Medium) | Paragraph text |
| **Body Small** | 14px | 400 (Regular) | Captions, hints |
| **Label** | 12px | 500 (Medium) | Tags, labels |

### Text Styles
- **Headings**: Bright white (`#ffffff`), bold, letter spacing: -0.5px
- **Body**: Light gray (`#e0e0e0`), medium weight
- **Hints**: Medium gray (`#b0b0b0`), small size
- **Line Height**: 1.5x for readability

---

## 🎭 Component Styles

### 1. Cards (Glassmorphism)
```css
background: rgba(255, 255, 255, 0.08);
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 0, 110, 0.3);
border-radius: 16-24px;
box-shadow: 0 0 20px rgba(255, 0, 110, 0.2);
padding: 16-24px;
```

**Hover/Active State**:
```css
box-shadow: 0 0 20px rgba(255, 0, 110, 0.6), inset 0 0 20px rgba(255, 0, 110, 0.2);
border-color: rgba(255, 0, 110, 0.6);
```

### 2. Buttons (CTA)
**Primary Button**:
```css
background: linear-gradient(135deg, #ff006e, #00d4ff);
border-radius: 30-50px;
padding: 14-16px vertical, 40-60px horizontal;
box-shadow: 0 0 20px rgba(255, 0, 110, 0.4);
color: #ffffff;
font-weight: 600;
font-size: 18px;
```

**Hover State**:
```css
box-shadow: 0 0 30px rgba(255, 0, 110, 0.8), 0 0 60px rgba(0, 212, 255, 0.4);
transform: scale(1.02);
```

**Secondary Button**:
```css
background: rgba(255, 0, 110, 0.2);
border: 2px solid #ff006e;
color: #ff006e;
```

### 3. Input Fields
```css
background: rgba(255, 255, 255, 0.05);
border: 1px solid rgba(255, 0, 110, 0.3);
border-radius: 12px;
color: #ffffff;
padding: 12px 16px;
```

**Focus State**:
```css
border-color: #ff006e;
box-shadow: 0 0 10px rgba(255, 0, 110, 0.4);
```

### 4. Profile Images
```css
border-radius: 50%;
border: 3px solid #ff006e;
box-shadow: 0 0 20px rgba(255, 0, 110, 0.6);
overflow: hidden;
```

### 5. Bottom Navigation
```css
background: rgba(15, 27, 63, 0.95);
backdrop-filter: blur(10px);
border-top: 1px solid rgba(255, 0, 110, 0.2);
position: absolute;
bottom: 0;
```

**Icon Active State**:
```css
color: #ff006e;
text-shadow: 0 0 10px rgba(255, 0, 110, 0.6);
```

### 6. Background & Overlays
**Gradient Background**:
```css
background: linear-gradient(135deg, #0f1b3f 0%, #1a0033 50%, #0d0015 100%);
```

**Overlay**:
```css
background: rgba(15, 27, 63, 0.85);
```

---

## ✨ Effects & Animations

### Glow Effects
**Strong Glow** (primary CTAs):
```css
box-shadow: 0 0 20px rgba(255, 0, 110, 0.6), inset 0 0 20px rgba(255, 0, 110, 0.2);
```

**Subtle Glow** (cards):
```css
box-shadow: 0 0 20px rgba(255, 0, 110, 0.2);
```

**Cyan Glow** (secondary):
```css
box-shadow: 0 0 20px rgba(0, 212, 255, 0.4);
```

### Animations
- **Hover transitions**: 200-300ms ease-out
- **Button press**: Scale to 0.98
- **Glow pulse**: 2-3s loop
- **Fade in**: 300-500ms ease-in

### Decorative Elements
- **Stars/Sparkles**: Scatter across background, 0.5-1s twinkling animation
- **Gradient overlays**: On images with 20-40% opacity

---

## 📱 Spacing & Layout

### Padding & Margins
| Level | Value | Usage |
|-------|-------|-------|
| **xs** | 4-8px | Small gaps |
| **sm** | 12-16px | Component padding |
| **md** | 20-24px | Section padding |
| **lg** | 32-40px | Major spacing |
| **xl** | 48-56px | Full-width spacing |

### Border Radius
| Type | Value | Usage |
|------|-------|-------|
| **Small** | 8-12px | Input fields, chips |
| **Medium** | 16-20px | Cards, modals |
| **Large** | 30-50px | Buttons, large elements |
| **Full** | 50% | Circles, avatars |

### Shadows
- **Subtle**: `0 2px 8px rgba(255, 0, 110, 0.1)`
- **Medium**: `0 8px 16px rgba(255, 0, 110, 0.2)`
- **Strong**: `0 20px 40px rgba(255, 0, 110, 0.3)`

---

## 🎯 Component Examples

### Welcome Screen
- Full gradient background
- Large app name in bright colors
- Gradient CTA button with glow
- Subtitle in light gray

### Browse/Explore
- Card grid with glassmorphism
- Image overlays with gradient
- Star ratings in top corner
- Call count in bottom left

### Profile Page
- Large circular avatar with glow
- Gradient background
- Card-based information layout
- Prominent subscribe/CTA button

### Navigation
- Bottom sticky nav with 4-5 icons
- Active icon shows glow effect
- Semi-transparent background
- Minimal design

---

## 🎨 Usage Instructions

When updating UI components:

1. **Always reference this guide** before making color/style changes
2. **Use CSS variables** for colors (recommended):
   ```css
   --primary-accent: #ff006e;
   --secondary-accent: #00d4ff;
   --dark-bg: #0f1b3f;
   --text-primary: #ffffff;
   ```
3. **Maintain glassmorphism** on all cards
4. **Add glow effects** to interactive elements
5. **Use gradients** for CTAs and visual hierarchy
6. **Keep spacing consistent** with the scale provided
7. **Test on dark backgrounds** to ensure contrast

---

## 🚀 Quick Reference

**Most Used Colors:**
- Primary Accent: `#ff006e`
- Dark Background: `#0f1b3f`
- Text: `#ffffff`
- Glow: `rgba(255, 0, 110, 0.6)`

**Most Used Effects:**
- Glassmorphism: `background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(10px);`
- Gradient CTA: `background: linear-gradient(135deg, #ff006e, #00d4ff);`
- Glow Border: `box-shadow: 0 0 20px rgba(255, 0, 110, 0.6);`

---

*Last Updated: 2026-03-09*
