import { Tabs, usePathname, useRouter } from 'expo-router'
import React, { useEffect, useRef } from 'react'
import { View } from 'react-native'

import { HapticTab } from '@/components/haptic-tab'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import {
  useAppStore,
  useLastSavedTab,
  useStorageHydrationSettled,
  type AppTab,
} from '@/src/stores/app-store'
import { decideTabRestore, observeTabBeforeHydration } from '@/src/utils/tabRestore'

const TAB_HREF: Record<AppTab, '/(tabs)' | '/(tabs)/today' | '/(tabs)/stats'> = {
  calendar: '/(tabs)',
  today: '/(tabs)/today',
  stats: '/(tabs)/stats',
}

/**
 * Maps an Expo Router path to a persisted tab.
 * The tab layout calls this after hydration and on each tab change. Modal routes return null so they do not overwrite the saved tab.
 * @param pathname - The path from {@link usePathname}.
 * @returns The visible tab, or null when the path is not a tab.
 * @example tabFromPathname('/stats') // => 'stats'
 */
function tabFromPathname(pathname: string): AppTab | null {
  if (pathname === '/today' || pathname.endsWith('/today')) {
    return 'today'
  }
  if (pathname === '/stats' || pathname.endsWith('/stats')) {
    return 'stats'
  }
  if (
    pathname === '/' ||
    pathname === '/index' ||
    pathname === '/(tabs)' ||
    pathname.endsWith('/(tabs)')
  ) {
    return 'calendar'
  }
  return null
}

export default function TabLayout() {
  const colorSchemeRaw = useColorScheme()
  const colorScheme: 'light' | 'dark' = colorSchemeRaw === 'dark' ? 'dark' : 'light'
  const pathname = usePathname()
  const router = useRouter()
  const hydrationSettled = useStorageHydrationSettled()
  const savedTab = useLastSavedTab()
  const didRestore = useRef(false)
  const choiceDuringHydration = useRef<AppTab | null>(null)
  const seenTabDuringHydration = useRef<AppTab | null | undefined>(undefined)

  useEffect(() => {
    const visible = tabFromPathname(pathname)

    // Track taps until the one-time restore runs, including the render where hydration flips true.
    if (!didRestore.current) {
      const observed = observeTabBeforeHydration(
        choiceDuringHydration.current,
        seenTabDuringHydration.current,
        visible,
      )
      choiceDuringHydration.current = observed.choice
      seenTabDuringHydration.current = observed.seen
    }

    const decision = decideTabRestore({
      hydrationSettled,
      restored: didRestore.current,
      visible,
      saved: useAppStore.getState().currentTab,
      chosenBeforeHydration: choiceDuringHydration.current,
    })

    if (decision.type === 'pending') {
      return
    }

    didRestore.current = true

    if (decision.type === 'replace') {
      router.replace(TAB_HREF[decision.tab])
      return
    }

    if (
      decision.type === 'sync' &&
      decision.tab !== useAppStore.getState().currentTab
    ) {
      useAppStore.getState().setCurrentTab(decision.tab)
    }
  }, [hydrationSettled, pathname, router])

  return (
    <>
      {process.env.EXPO_PUBLIC_E2E_TEST === 'true' && savedTab ? (
        <View
          collapsable={false}
          testID={`session-tab-saved-${savedTab}`}
          style={{ width: 1, height: 1, position: 'absolute' }}
        />
      ) : null}
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme].tint,
          headerShown: false,
          tabBarButton: HapticTab,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Calendar',
            tabBarAccessibilityLabel: 'calendar-tab',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="calendar" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="today"
          options={{
            title: 'Today',
            tabBarAccessibilityLabel: 'today-tab',
            tabBarButtonTestID: 'today-tab',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="checkmark.circle.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: 'Stats',
            tabBarAccessibilityLabel: 'stats-tab',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="chart.bar.fill" color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  )
}
