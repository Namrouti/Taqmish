import { Platform } from 'react-native';

const gold = '#D5AE63';
const goldSoft = '#E8CCA1';
const espresso = '#362C26';
const espressoSoft = '#5E4D40';
const bronze = '#A98A62';
const cream = '#FBF6EF';
const mist = '#8E7E6C';

export const Colors = {
  light: {
    text: '#251C15',
    background: '#F8F1E7',
    tint: gold,
    icon: '#8E765C',
    tabIconDefault: '#9E866C',
    tabIconSelected: gold,
  },
  dark: {
    text: cream,
    background: espresso,
    tint: gold,
    icon: mist,
    tabIconDefault: '#7E6A56',
    tabIconSelected: goldSoft,
  },
};

export const LuxuryTheme = {
  accent: gold,
  accentSoft: goldSoft,
  background: '#F9F4ED',
  backgroundAlt: '#FFFBF6',
  backgroundMuted: '#F4ECE2',
  border: '#E7D9C8',
  borderSoft: '#EFE4D6',
  card: '#FFFDF9',
  cardAlt: '#F8F1E8',
  chip: '#FFF8F0',
  chipActive: '#E7C98E',
  glow: 'rgba(213, 174, 99, 0.16)',
  overlay: 'rgba(64, 52, 44, 0.18)',
  placeholder: '#E8DED2',
  shadow: '#BFA27A',
  surface: '#FFFDFC',
  surfaceRaised: '#FFF7EE',
  textMuted: mist,
  textPrimary: '#4B4037',
  textStrong: '#2F2722',
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "'Tajawal', 'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
