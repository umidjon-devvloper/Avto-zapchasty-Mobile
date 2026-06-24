import { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ScrollView, StatusBar, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { setStatusBarStyle } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/lib/auth';
import { api } from '../../src/lib/api';
import { theme, s, ms } from '../../src/theme';
import { AuthPrompt } from '../../src/components/AuthPrompt';
import { Wordmark } from '../../src/components/Brand';
import { unregisterPush } from '../../src/lib/push';
import { disconnectSocket } from '../../src/lib/socket';

type IconName = keyof typeof Ionicons.glyphMap;
type MenuItem = { icon: IconName; label: string; sub?: string; tint: string; onPress: () => void };

const ROLE_LABEL: Record<string, string> = {
  buyer: 'Xaridor',
  seller: 'Sotuvchi',
  admin: 'Administrator',
  superadmin: 'Administrator',
};

export default function Profile() {
  const { accessToken, user, logout } = useAuth();
  const setUser = useAuth((s) => s.setUser);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!accessToken) return;
    setStatusBarStyle('light');
    return () => setStatusBarStyle('dark');
  }, [accessToken]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const u = await api.me();
      setUser(u);
    } catch {}
    finally { setRefreshing(false); }
  }, [setUser]);

  if (!accessToken || !user) {
    return <AuthPrompt text="Profil va e'lonlaringiz uchun tizimga kiring" />;
  }

  const initial = (user.name || user.phone || '?').trim().charAt(0).toUpperCase();
  const verified = user.sellerProfile?.verified;

  const groups: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Faoliyat',
      items: [
        {
          icon: 'pricetags',
          label: "Mening e'lonlarim",
          sub: "Joylashtirilgan e'lonlar",
          tint: theme.colors.brand,
          onPress: () => router.push('/my-listings'),
        },
        {
          icon: 'add-circle',
          label: "Yangi e'lon berish",
          sub: 'Detalingizni soting',
          tint: theme.colors.primary,
          onPress: () => router.push('/create-listing'),
        },
      ],
    },
    {
      title: 'Hisob',
      items: [
        {
          icon: 'heart',
          label: 'Saralangan',
          sub: "Yoqtirgan e'lonlaringiz",
          tint: theme.colors.danger,
          onPress: () => router.push('/favorites'),
        },
        {
          icon: 'chatbubbles',
          label: 'Xabarlar',
          sub: 'Sotuvchilar bilan suhbat',
          tint: theme.colors.info,
          onPress: () => router.push('/messages'),
        },
      ],
    },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.brand} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >

        {/* Header */}
        <LinearGradient
          colors={theme.gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            <Text style={styles.headerLabel}>Profil</Text>

            {/* Identity */}
            <View style={styles.identity}>
              <View style={styles.avatarWrap}>
                <Text style={styles.avatarText}>{initial}</Text>
                {verified && (
                  <View style={styles.verifiedRing}>
                    <Ionicons name="shield-checkmark" size={ms(13)} color={theme.colors.success} />
                  </View>
                )}
              </View>

              <View style={styles.identityInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {user.name || 'Foydalanuvchi'}
                  </Text>
                  {verified && (
                    <Ionicons name="checkmark-circle" size={ms(17)} color="#fff" />
                  )}
                </View>
                <Text style={styles.phone}>{user.phone}</Text>
                <View style={styles.roleChip}>
                  <Text style={styles.roleText}>
                    {ROLE_LABEL[user.role] || 'Foydalanuvchi'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Shop name */}
            {user.sellerProfile?.shopName ? (
              <View style={styles.shopBar}>
                <Ionicons name="storefront-outline" size={ms(14)} color="rgba(255,255,255,0.8)" />
                <Text style={styles.shopText} numberOfLines={1}>
                  {user.sellerProfile.shopName}
                </Text>
                {verified && (
                  <View style={styles.shopVerified}>
                    <Ionicons name="shield-checkmark" size={ms(11)} color={theme.colors.success} />
                    <Text style={styles.shopVerifiedText}>Tasdiqlangan</Text>
                  </View>
                )}
              </View>
            ) : null}
          </SafeAreaView>
        </LinearGradient>

        {/* Menu groups */}
        {groups.map((g) => (
          <View key={g.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{g.title}</Text>
            <View style={styles.groupCard}>
              {g.items.map((m, i) => (
                <Pressable
                  key={m.label}
                  style={({ pressed }) => [
                    styles.menuRow,
                    i < g.items.length - 1 && styles.menuDivider,
                    pressed && { backgroundColor: theme.colors.surface },
                  ]}
                  onPress={m.onPress}
                >
                  <View style={[styles.menuIcon, { backgroundColor: m.tint + '1c' }]}>
                    <Ionicons name={m.icon} size={ms(20)} color={m.tint} />
                  </View>
                  <View style={styles.menuLabel}>
                    <Text style={styles.menuText}>{m.label}</Text>
                    {m.sub ? <Text style={styles.menuSub}>{m.sub}</Text> : null}
                  </View>
                  <View style={styles.menuChevronWrap}>
                    <Ionicons name="chevron-forward" size={ms(16)} color={theme.colors.faint} />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <View style={styles.section}>
          <Pressable
            style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.82 }]}
            onPress={() =>
              Alert.alert('Chiqish', 'Hisobdan chiqasizmi?', [
                { text: 'Bekor', style: 'cancel' },
                {
                  text: 'Chiqish',
                  style: 'destructive',
                  onPress: async () => {
                    await unregisterPush();
                    disconnectSocket();
                    logout();
                  },
                },
              ])
            }
          >
            <Ionicons name="log-out-outline" size={ms(19)} color={theme.colors.danger} />
            <Text style={styles.logoutText}>Tizimdan chiqish</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Wordmark size={ms(16)} />
          <Text style={styles.version}>v1.0.0 · Ehtiyot qismlar bozori</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  scroll: { paddingBottom: s(24) },

  header: {
    paddingHorizontal: s(16),
    paddingBottom: s(24),
    borderBottomLeftRadius: s(32),
    borderBottomRightRadius: s(32),
    ...theme.shadow.navy,
  },
  headerLabel: {
    fontSize: ms(22),
    fontWeight: '800',
    color: '#fff',
    paddingTop: s(4),
    marginBottom: s(20),
    letterSpacing: -0.3,
  },

  identity: { flexDirection: 'row', alignItems: 'center', gap: s(16) },
  avatarWrap: {
    width: s(72),
    height: s(72),
    borderRadius: s(24),
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: ms(28), fontWeight: '900', color: '#fff' },
  verifiedRing: {
    position: 'absolute',
    right: s(-4),
    bottom: s(-4),
    width: s(24),
    height: s(24),
    borderRadius: s(12),
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.brand,
  },

  identityInfo: { flex: 1, gap: s(4) },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: s(6) },
  name: { fontSize: ms(20), fontWeight: '800', color: '#fff', letterSpacing: -0.3, flex: 1 },
  phone: { fontSize: ms(14), color: 'rgba(255,255,255,0.72)', fontVariant: ['tabular-nums'] },
  roleChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: s(10),
    paddingVertical: s(4),
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  roleText: { fontSize: ms(11), fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: 0.3 },

  shopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    marginTop: s(18),
    paddingTop: s(14),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.14)',
  },
  shopText: { fontSize: ms(14), color: 'rgba(255,255,255,0.88)', fontWeight: '600', flex: 1 },
  shopVerified: { flexDirection: 'row', alignItems: 'center', gap: s(3) },
  shopVerifiedText: { fontSize: ms(11), color: theme.colors.success, fontWeight: '700' },

  section: { paddingHorizontal: s(16), marginTop: s(22) },
  sectionTitle: {
    fontSize: ms(11.5),
    fontWeight: '800',
    color: theme.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: s(10),
    marginLeft: s(4),
  },

  groupCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadow.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(14),
    paddingHorizontal: s(16),
    paddingVertical: s(14),
  },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: theme.colors.hairline },
  menuIcon: {
    width: s(42),
    height: s(42),
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1 },
  menuText: { fontSize: ms(15.5), fontWeight: '700', color: theme.colors.text },
  menuSub: { fontSize: ms(12), color: theme.colors.muted, marginTop: s(2) },
  menuChevronWrap: {
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
    paddingVertical: s(16),
    backgroundColor: theme.colors.dangerSoft,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.danger + '30',
  },
  logoutText: { fontSize: ms(15), fontWeight: '800', color: theme.colors.danger },

  footer: { alignItems: 'center', paddingTop: s(28), paddingBottom: s(8), gap: s(5) },
  version: { fontSize: ms(11.5), color: theme.colors.faint },
});
