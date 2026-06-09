import { Tabs, usePathname, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { LuxuryTheme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/providers/auth-provider';

const TAB_TITLES: Record<string, string> = {
  '/(tabs)/closet': 'خزانه',
  '/(tabs)/coordination': 'Calendar',
  '/(tabs)/index': 'Home',
  '/(tabs)/profile': 'Profile',
  '/(tabs)/settings': 'Closet',
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [isDrawerVisible, setDrawerVisible] = useState(false);
  const [drawerSide, setDrawerSide] = useState<'left' | 'right'>('left');
  const headerTitle = useMemo(() => TAB_TITLES[pathname] ?? 'TUQ MISH', [pathname]);

  const openLeftDrawer = () => {
    setDrawerSide('left');
    setDrawerVisible(true);
  };

  const openRightDrawer = () => {
    setDrawerSide('right');
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  return (
    <View style={styles.root}>
      <View style={[styles.headerWrap, { paddingTop: insets.top + 2 }]}>
        <View style={styles.headerGlowLeft} />
        <View style={styles.headerGlowRight} />
        <View style={styles.headerRow}>
          <Pressable onPress={openLeftDrawer} style={styles.headerIcon}>
            <Ionicons color={LuxuryTheme.textPrimary} name="menu-outline" size={24} />
          </Pressable>

          <View style={styles.brandWrap}>
            <View style={styles.logoMonogramWrap}>
              <View style={styles.logoRing} />
              <Text style={styles.logoMonogramTop}>T</Text>
              <Text style={styles.logoMonogramBottom}>M</Text>
            </View>
            <View style={styles.brandTextWrap}>
              <Text style={styles.brandNameInline}>TUQ MISH</Text>
              <Text style={styles.headerTitle}>{headerTitle}</Text>
            </View>
          </View>

          <Pressable onPress={openRightDrawer} style={styles.headerIcon}>
            <View style={styles.headerBellWrap}>
              <Ionicons color={LuxuryTheme.textPrimary} name="notifications-outline" size={22} />
              <View style={styles.headerBellDot} />
            </View>
          </Pressable>
        </View>
      </View>

      <View style={styles.tabsWrap}>
        <Tabs
          screenOptions={{
            headerShown: false,
            sceneStyle: {
              backgroundColor: colorScheme === 'dark' ? LuxuryTheme.background : '#F8F1E7',
            },
            tabBarActiveTintColor: LuxuryTheme.accent,
            tabBarInactiveTintColor: colorScheme === 'dark' ? '#8F7A64' : '#9C856A',
            tabBarButton: HapticTab,
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
            },
            tabBarStyle: {
              backgroundColor: LuxuryTheme.surface,
              borderTopColor: LuxuryTheme.borderSoft,
              borderTopWidth: 1,
              height: 70 + Math.max(insets.bottom, 8),
              paddingBottom: Math.max(insets.bottom, 10),
              paddingTop: 8,
            },
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              tabBarIcon: ({ color, size }) => <Ionicons color={color} name="home-outline" size={size} />,
            }}
          />
          <Tabs.Screen
            name="closet"
            options={{
              title: 'خزانه',
              tabBarIcon: ({ color, size }) => <Ionicons color={color} name="book-outline" size={size} />,
            }}
          />
          <Tabs.Screen
            name="coordination"
            options={{
              title: 'Calendar',
              tabBarIcon: ({ color, size }) => <Ionicons color={color} name="calendar-outline" size={size} />,
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Closet',
              tabBarIcon: ({ color, size }) => <Ionicons color={color} name="shirt-outline" size={size} />,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ color, size }) => <Ionicons color={color} name="person-outline" size={size} />,
            }}
          />
        </Tabs>
      </View>

      <Modal animationType="fade" visible={isDrawerVisible} transparent onRequestClose={closeDrawer}>
        <View style={styles.drawerOverlay}>
          {drawerSide === 'right' ? null : <Pressable style={styles.drawerBackdrop} onPress={closeDrawer} />}
          <View
            style={[
              styles.drawerPanel,
              drawerSide === 'right' ? styles.drawerPanelRight : styles.drawerPanelLeft,
              { paddingTop: insets.top + 18 },
            ]}>
            <View style={styles.drawerHeader}>
              <View style={styles.drawerLogoMonogramWrap}>
                <View style={styles.drawerLogoRing} />
                <Text style={styles.drawerLogoMonogramTop}>T</Text>
                <Text style={styles.drawerLogoMonogramBottom}>M</Text>
              </View>
              <View>
                <Text style={styles.drawerBrandLine}>TUQ MISH</Text>
                <Text style={styles.drawerBrandSubline}>OUTFIT COORDINATOR</Text>
              </View>
            </View>

            {drawerSide === 'left' ? (
              <>
                <Text style={styles.drawerTitle}>Navigation</Text>
                <Pressable onPress={() => { closeDrawer(); router.push('/(tabs)'); }} style={styles.drawerItem}>
                  <Text style={styles.drawerItemText}>Home</Text>
                </Pressable>
                <Pressable onPress={() => { closeDrawer(); router.push('/(tabs)/closet'); }} style={styles.drawerItem}>
                  <Text style={styles.drawerItemText}>خزانه</Text>
                </Pressable>
                <Pressable onPress={() => { closeDrawer(); router.push('/(tabs)/coordination'); }} style={styles.drawerItem}>
                  <Text style={styles.drawerItemText}>Calendar</Text>
                </Pressable>
                <Pressable onPress={() => { closeDrawer(); router.push('/(tabs)/settings'); }} style={styles.drawerItem}>
                  <Text style={styles.drawerItemText}>Closet</Text>
                </Pressable>
                <Pressable onPress={() => { closeDrawer(); router.push('/(tabs)/profile'); }} style={styles.drawerItem}>
                  <Text style={styles.drawerItemText}>Profile</Text>
                </Pressable>
                <Pressable onPress={() => { closeDrawer(); void logout(); }} style={styles.drawerItem}>
                  <Text style={[styles.drawerItemText, styles.drawerLogout]}>Logout</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={[styles.drawerTitle, styles.drawerTitleRight]}>Notifications</Text>
                <Pressable onPress={closeDrawer} style={styles.drawerItem}>
                  <Text style={styles.drawerItemText}>No new outfit reminders</Text>
                </Pressable>
                <Pressable onPress={() => { closeDrawer(); router.push('/(tabs)/profile'); }} style={styles.drawerItem}>
                  <Text style={styles.drawerItemText}>Open Profile</Text>
                </Pressable>
                <Pressable onPress={() => { closeDrawer(); router.push('/(tabs)/coordination'); }} style={styles.drawerItem}>
                  <Text style={styles.drawerItemText}>Start New Outfit</Text>
                </Pressable>
                <Pressable onPress={() => { closeDrawer(); router.push('/(tabs)/settings'); }} style={styles.drawerItem}>
                  <Text style={styles.drawerItemText}>Closet Tools</Text>
                </Pressable>
              </>
            )}
          </View>
          {drawerSide === 'right' ? <Pressable style={styles.drawerBackdrop} onPress={closeDrawer} /> : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  brandTextWrap: {
    alignItems: 'center',
    flex: 1,
  },
  brandWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: 10,
    justifyContent: 'center',
  },
  brandNameInline: {
    color: LuxuryTheme.textStrong,
    fontFamily: 'serif',
    fontSize: 24,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  drawerBackdrop: {
    flex: 1,
  },
  drawerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    marginBottom: 24,
  },
  drawerBrandLine: {
    color: LuxuryTheme.textStrong,
    fontFamily: 'serif',
    fontSize: 24,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  drawerBrandSubline: {
    color: LuxuryTheme.accent,
    fontSize: 10,
    letterSpacing: 2.6,
    marginTop: 4,
  },
  drawerItem: {
    borderBottomColor: LuxuryTheme.borderSoft,
    borderBottomWidth: 1,
    paddingVertical: 14,
  },
  drawerItemText: {
    color: LuxuryTheme.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  drawerLogoMonogramBottom: {
    color: LuxuryTheme.accent,
    fontFamily: 'serif',
    fontSize: 36,
    left: 18,
    position: 'absolute',
    top: 22,
  },
  drawerLogoMonogramTop: {
    color: LuxuryTheme.accent,
    fontFamily: 'serif',
    fontSize: 34,
    left: 12,
    position: 'absolute',
    top: 4,
  },
  drawerLogoMonogramWrap: {
    alignItems: 'center',
    height: 78,
    justifyContent: 'center',
    position: 'relative',
    width: 78,
  },
  drawerLogoRing: {
    borderColor: 'rgba(213, 174, 99, 0.5)',
    borderRadius: 999,
    borderWidth: 1,
    height: 48,
    marginTop: 14,
    width: 48,
  },
  drawerLogout: {
    color: '#E1A86D',
  },
  drawerOverlay: {
    backgroundColor: LuxuryTheme.overlay,
    flex: 1,
    flexDirection: 'row',
  },
  drawerPanel: {
    backgroundColor: LuxuryTheme.surface,
    paddingHorizontal: 18,
    width: 280,
  },
  drawerPanelLeft: {
    borderRightColor: LuxuryTheme.border,
    borderRightWidth: 1,
  },
  drawerPanelRight: {
    borderLeftColor: LuxuryTheme.border,
    borderLeftWidth: 1,
  },
  drawerTitle: {
    color: LuxuryTheme.accent,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 10,
  },
  drawerTitleRight: {
    textAlign: 'right',
  },
  headerGlowLeft: {
    backgroundColor: LuxuryTheme.glow,
    borderRadius: 999,
    height: 110,
    left: -22,
    position: 'absolute',
    top: 8,
    width: 110,
  },
  headerGlowRight: {
    backgroundColor: 'rgba(213, 174, 99, 0.1)',
    borderRadius: 999,
    height: 140,
    position: 'absolute',
    right: -22,
    top: -24,
    width: 140,
  },
  headerIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.74)',
    borderColor: LuxuryTheme.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  headerBellDot: {
    backgroundColor: LuxuryTheme.accent,
    borderRadius: 999,
    height: 8,
    position: 'absolute',
    right: 1,
    top: 0,
    width: 8,
  },
  headerBellWrap: {
    position: 'relative',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: LuxuryTheme.textMuted,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2.4,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  headerWrap: {
    backgroundColor: LuxuryTheme.backgroundAlt,
    borderBottomColor: LuxuryTheme.borderSoft,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  logoMonogramBottom: {
    color: LuxuryTheme.accent,
    fontFamily: 'serif',
    fontSize: 30,
    left: 16,
    position: 'absolute',
    top: 16,
  },
  logoMonogramTop: {
    color: LuxuryTheme.accent,
    fontFamily: 'serif',
    fontSize: 28,
    left: 10,
    position: 'absolute',
    top: 0,
  },
  logoMonogramWrap: {
    alignItems: 'center',
    height: 62,
    justifyContent: 'center',
    position: 'relative',
    width: 62,
  },
  logoRing: {
    borderColor: 'rgba(213, 174, 99, 0.5)',
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    marginTop: 10,
    width: 34,
  },
  root: {
    backgroundColor: LuxuryTheme.background,
    flex: 1,
  },
  tabsWrap: {
    flex: 1,
    marginTop: -8,
  },
});
