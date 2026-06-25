import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { useColors } from '../../src/theme/useColors';
import { theme, s, ms } from '../../src/theme';
import type { ConversationItem } from '../../src/lib/types';

type IoniconName = keyof typeof Ionicons.glyphMap;

function TabIcon({
  base, color, size, focused, badge,
}: {
  base: string; color: string; size: number; focused: boolean; badge?: number;
}) {
  const colors = useColors();
  const iconName = (focused ? base : `${base}-outline`) as IoniconName;
  return (
    <View style={tabStyles.wrap}>
      {focused && <View style={[tabStyles.dot, { backgroundColor: colors.primary }]} />}
      <Ionicons name={iconName} color={color} size={focused ? size + 1 : size} />
      {badge && badge > 0 ? (
        <View style={tabStyles.badge}>
          <Ionicons name="ellipse" size={8} color={colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', width: s(36), height: s(36) },
  dot: { position: 'absolute', top: 0, width: s(22), height: s(3), borderRadius: 2 },
  badge: { position: 'absolute', top: 2, right: 2 },
});

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const token = useAuth((st) => st.accessToken);
  const colors = useColors();
  const { data } = useQuery({
    queryKey: ['conversations'],
    queryFn: api.conversations,
    enabled: !!token,
    refetchInterval: token ? 20000 : false,
  });
  const unread = (data ?? []).reduce((sum: number, c: ConversationItem) => sum + c.unread, 0);

  const barContent = s(58);
  const bottomInset = Math.max(insets.bottom, s(8));

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.faint,
        tabBarLabelStyle: {
          fontSize: ms(10.5),
          fontWeight: '700',
          marginTop: 0,
          letterSpacing: 0.1,
        },
        tabBarItemStyle: { paddingVertical: s(6) },
        tabBarStyle: {
          borderTopColor: colors.hairline,
          borderTopWidth: 1,
          backgroundColor: colors.card,
          height: barContent + bottomInset,
          paddingTop: s(8),
          paddingBottom: bottomInset,
          ...theme.shadow.md,
        },
        tabBarBadgeStyle: {
          backgroundColor: colors.primary,
          color: '#fff',
          fontSize: 10,
          fontWeight: '800',
          minWidth: ms(18),
          height: ms(18),
          borderRadius: ms(9),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Bosh sahifa',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon base="home" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Qidiruv',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon base="search" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Xabarlar',
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon base="chatbubbles" color={color} size={size} focused={focused} badge={unread} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Saralangan',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon base="heart" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon base="person" color={color} size={size} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
