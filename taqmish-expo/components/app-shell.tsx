import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LuxuryTheme } from '@/constants/theme';

type AppShellProps = PropsWithChildren<{
  footer?: ReactNode;
  onPrimaryAction?: () => void;
  primaryActionBottomOffset?: number;
  primaryActionIcon?: keyof typeof Ionicons.glyphMap;
  primaryActionLabel?: string;
  primaryActionRightOffset?: number;
  subtitle?: string;
  title: string;
}>;

export function AppShell({
  children,
  footer,
  onPrimaryAction,
  primaryActionBottomOffset = 88,
  primaryActionIcon = 'add',
  primaryActionLabel,
  primaryActionRightOffset = 20,
  subtitle,
  title,
}: AppShellProps) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 108 + bottomInset }]}>
        {children}
      </ScrollView>

      {onPrimaryAction ? (
        <Pressable
          accessibilityLabel={primaryActionLabel}
          onPress={onPrimaryAction}
          style={({ pressed }) => [
            styles.fab,
            { bottom: primaryActionBottomOffset + bottomInset, right: primaryActionRightOffset },
            pressed ? styles.fabPressed : null,
          ]}>
          <Ionicons color={LuxuryTheme.textStrong} name={primaryActionIcon} size={22} />
        </Pressable>
      ) : null}

      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 18,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  fab: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.accent,
    borderRadius: 28,
    elevation: 6,
    height: 58,
    justifyContent: 'center',
    position: 'absolute',
    shadowColor: LuxuryTheme.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    width: 58,
  },
  fabPressed: {
    transform: [{ scale: 0.98 }],
  },
  root: {
    backgroundColor: LuxuryTheme.background,
    flex: 1,
  },
});
