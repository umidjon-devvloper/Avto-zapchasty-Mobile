import { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ScrollView, StatusBar, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { setStatusBarStyle } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/lib/auth';
import { api } from '../../src/lib/api';
import { useColors, useScheme } from '../../src/theme/useColors';
import { useNotificationStore } from '../../src/lib/notificationStore';
import { useThemeStore, type SchemePreference } from '../../src/theme/themeStore';
import { useT, useLocaleStore, type Locale } from '../../src/lib/i18n';
import { theme, s, ms } from '../../src/theme';
import { AuthPrompt } from '../../src/components/AuthPrompt';
import { Wordmark } from '../../src/components/Brand';
import { unregisterPush } from '../../src/lib/push';
import { resolveImage } from '../../src/lib/image';
import { disconnectSocket } from '../../src/lib/socket';

type IconName = keyof typeof Ionicons.glyphMap;
type MenuItem = { icon: IconName; label: string; sub?: string; tint: string; onPress: () => void };

const LOCALE_OPTIONS: { value: Locale; label: string }[] = [
  { value: 'uz', label: "O'zbekcha" },
  { value: 'ru', label: 'Русский' },
];

export default function Profile() {
  const colors = useColors();
  const scheme = useScheme();
  const t = useT();
  const locale = useLocaleStore((st) => st.locale);
  const setLocale = useLocaleStore((st) => st.setLocale);
  const preference = useThemeStore((st) => st.preference);
  const setPreference = useThemeStore((st) => st.setPreference);

  const SCHEME_OPTIONS: { value: SchemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'system', label: t.profile.themeAuto, icon: 'phone-portrait-outline' },
    { value: 'light', label: t.profile.themeLight, icon: 'sunny-outline' },
    { value: 'dark', label: t.profile.themeDark, icon: 'moon-outline' },
  ];
  const unreadNotifs = useNotificationStore((s) => s.notifications.filter((n) => !n.read).length);
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
    try { const u = await api.me(); setUser(u); } catch {}
    finally { setRefreshing(false); }
  }, [setUser]);

  // Apple 5.1.1(v): akkauntni ilova ichida o'chirish imkoni — ikki bosqichli tasdiq
  const onDeleteAccount = () => {
    Alert.alert(t.profile.deleteConfirmTitle, t.profile.deleteConfirmText, [
      { text: t.profile.cancel, style: 'cancel' },
      {
        text: t.profile.deleteConfirmBtn,
        style: 'destructive',
        onPress: () =>
          Alert.alert(t.profile.deleteFinalTitle, t.profile.deleteFinalText, [
            { text: t.profile.cancel, style: 'cancel' },
            {
              text: t.profile.deleteConfirmBtn,
              style: 'destructive',
              onPress: async () => {
                try {
                  await api.deleteAccount();
                  await unregisterPush();
                  disconnectSocket();
                  logout();
                  Alert.alert(t.profile.deleteDone);
                } catch (e) {
                  Alert.alert(t.common.error, String(e));
                }
              },
            },
          ]),
      },
    ]);
  };

  if (!accessToken || !user) {
    return <AuthPrompt text={t.profile.loginPrompt} />;
  }

  const initial = (user.name || user.phone || '?').trim().charAt(0).toUpperCase();
  const verified = user.sellerProfile?.verified;
  const avatar = user.sellerProfile?.avatar;

  const groups: { title: string; items: MenuItem[] }[] = [
    {
      title: t.profile.activity,
      items: [
        { icon: 'person-circle', label: t.profile.editProfile, sub: t.profile.editProfileSub, tint: colors.primary, onPress: () => router.push('/edit-profile') },
        { icon: 'pricetags', label: t.profile.myListings, sub: t.profile.myListingsSub, tint: colors.ink, onPress: () => router.push('/my-listings') },
        { icon: 'add-circle', label: t.profile.newListing, sub: t.profile.newListingSub, tint: colors.primary, onPress: () => router.push('/create-listing') },
      ],
    },
    {
      title: t.profile.account,
      items: [
        { icon: 'heart', label: t.profile.favorites, sub: t.profile.favoritesSub, tint: colors.danger, onPress: () => router.push('/favorites') },
        { icon: 'chatbubbles', label: t.profile.messages, sub: t.profile.messagesSub, tint: colors.info, onPress: () => router.push('/messages') },
        { icon: 'notifications', label: t.profile.notifications, sub: unreadNotifs > 0 ? t.profile.notificationsSubNew(unreadNotifs) : t.profile.notificationsSub, tint: colors.primary, onPress: () => router.push('/notifications') },
      ],
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.brand} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        <LinearGradient colors={theme.gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <SafeAreaView edges={['top']}>
            <Text style={styles.headerLabel}>{t.profile.title}</Text>
            <View style={styles.identity}>
              <Pressable style={styles.avatarWrap} onPress={() => router.push('/edit-profile')}>
                {avatar ? (
                  <Image source={{ uri: resolveImage(avatar) }} style={styles.avatarImg} contentFit="cover" />
                ) : (
                  <Text style={styles.avatarText}>{initial}</Text>
                )}
                {verified && (
                  <View style={[styles.verifiedRing, { backgroundColor: colors.card, borderColor: colors.brand }]}>
                    <Ionicons name="shield-checkmark" size={ms(13)} color={colors.success} />
                  </View>
                )}
              </Pressable>
              <View style={styles.identityInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>{user.name || t.common.user}</Text>
                  {verified && <Ionicons name="checkmark-circle" size={ms(17)} color="#fff" />}
                </View>
                <Text style={styles.phone}>{user.phone}</Text>
                <View style={styles.roleChip}>
                  <Text style={styles.roleText}>{t.profile.roles[user.role] || t.common.user}</Text>
                </View>
              </View>
            </View>
            {user.sellerProfile?.shopName ? (
              <View style={styles.shopBar}>
                <Ionicons name="storefront-outline" size={ms(14)} color="rgba(255,255,255,0.8)" />
                <Text style={styles.shopText} numberOfLines={1}>{user.sellerProfile.shopName}</Text>
                {verified && (
                  <View style={styles.shopVerified}>
                    <Ionicons name="shield-checkmark" size={ms(11)} color={colors.success} />
                    <Text style={[styles.shopVerifiedText, { color: colors.success }]}>{t.profile.verified}</Text>
                  </View>
                )}
              </View>
            ) : null}
          </SafeAreaView>
        </LinearGradient>

        {groups.map((g) => (
          <View key={g.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>{g.title}</Text>
            <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {g.items.map((m, i) => (
                <Pressable
                  key={m.label}
                  style={({ pressed }) => [
                    styles.menuRow,
                    i < g.items.length - 1 && [styles.menuDivider, { borderBottomColor: colors.hairline }],
                    pressed && { backgroundColor: colors.surface },
                  ]}
                  onPress={m.onPress}
                >
                  <View style={[styles.menuIcon, { backgroundColor: m.tint + '1c' }]}>
                    <Ionicons name={m.icon} size={ms(20)} color={m.tint} />
                  </View>
                  <View style={styles.menuLabel}>
                    <Text style={[styles.menuText, { color: colors.text }]}>{m.label}</Text>
                    {m.sub ? <Text style={[styles.menuSub, { color: colors.muted }]}>{m.sub}</Text> : null}
                  </View>
                  <View style={[styles.menuChevronWrap, { backgroundColor: colors.surface }]}>
                    <Ionicons name="chevron-forward" size={ms(16)} color={colors.faint} />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>{t.profile.appearance}</Text>
          <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.themeRow}>
              <View style={[styles.themeIcon, { backgroundColor: colors.brandSoft }]}>
                <Ionicons name={scheme === 'dark' ? 'moon' : 'sunny'} size={ms(18)} color={colors.ink} />
              </View>
              <View style={[styles.themeSegment, { backgroundColor: colors.surface }]}>
                {SCHEME_OPTIONS.map((opt) => {
                  const active = preference === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      style={[styles.themeBtn, active && { backgroundColor: colors.card, ...theme.shadow.sm }]}
                      onPress={() => setPreference(opt.value)}
                    >
                      <Ionicons name={opt.icon} size={ms(14)} color={active ? colors.ink : colors.faint} />
                      <Text style={[styles.themeBtnText, { color: active ? colors.ink : colors.faint }]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View style={[styles.themeRow, { borderTopWidth: 1, borderTopColor: colors.hairline }]}>
              <View style={[styles.themeIcon, { backgroundColor: colors.brandSoft }]}>
                <Ionicons name="language" size={ms(18)} color={colors.ink} />
              </View>
              <View style={[styles.themeSegment, { backgroundColor: colors.surface }]}>
                {LOCALE_OPTIONS.map((opt) => {
                  const active = locale === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      style={[styles.themeBtn, active && { backgroundColor: colors.card, ...theme.shadow.sm }]}
                      onPress={() => setLocale(opt.value)}
                    >
                      <Text style={[styles.themeBtnText, { color: active ? colors.ink : colors.faint }]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Pressable
            style={({ pressed }) => [
              styles.logoutBtn,
              { backgroundColor: colors.dangerSoft, borderColor: colors.danger + '30' },
              pressed && { opacity: 0.82 },
            ]}
            onPress={() =>
              Alert.alert(t.profile.logoutConfirmTitle, t.profile.logoutConfirmText, [
                { text: t.profile.cancel, style: 'cancel' },
                { text: t.profile.logoutConfirmTitle, style: 'destructive', onPress: async () => { await unregisterPush(); disconnectSocket(); logout(); } },
              ])
            }
          >
            <Ionicons name="log-out-outline" size={ms(19)} color={colors.danger} />
            <Text style={[styles.logoutText, { color: colors.danger }]}>{t.profile.logout}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.deleteBtn,
              { backgroundColor: colors.danger },
              pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
            ]}
            onPress={onDeleteAccount}
          >
            <Ionicons name="trash-outline" size={ms(18)} color="#fff" />
            <Text style={styles.deleteText}>{t.profile.deleteAccount}</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Wordmark size={ms(16)} />
          <Text style={[styles.version, { color: colors.faint }]}>v1.2.0 · {t.home.tagline}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: s(24) },
  header: { paddingHorizontal: s(16), paddingBottom: s(24), borderBottomLeftRadius: s(32), borderBottomRightRadius: s(32), ...theme.shadow.navy },
  headerLabel: { fontSize: ms(22), fontWeight: '800', color: '#fff', paddingTop: s(4), marginBottom: s(20), letterSpacing: -0.3 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: s(16) },
  avatarWrap: {
    width: s(72), height: s(72), borderRadius: s(24),
    backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: ms(28), fontWeight: '900', color: '#fff' },
  avatarImg: { width: '100%', height: '100%', borderRadius: s(22) },
  verifiedRing: {
    position: 'absolute', right: s(-4), bottom: s(-4),
    width: s(24), height: s(24), borderRadius: s(12),
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },
  identityInfo: { flex: 1, gap: s(4) },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: s(6) },
  name: { fontSize: ms(20), fontWeight: '800', color: '#fff', letterSpacing: -0.3, flex: 1 },
  phone: { fontSize: ms(14), color: 'rgba(255,255,255,0.72)', fontVariant: ['tabular-nums'] },
  roleChip: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: s(10), paddingVertical: s(4), borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  roleText: { fontSize: ms(11), fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: 0.3 },
  shopBar: { flexDirection: 'row', alignItems: 'center', gap: s(8), marginTop: s(18), paddingTop: s(14), borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.14)' },
  shopText: { fontSize: ms(14), color: 'rgba(255,255,255,0.88)', fontWeight: '600', flex: 1 },
  shopVerified: { flexDirection: 'row', alignItems: 'center', gap: s(3) },
  shopVerifiedText: { fontSize: ms(11), fontWeight: '700' },

  section: { paddingHorizontal: s(16), marginTop: s(22) },
  sectionTitle: { fontSize: ms(11.5), fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: s(10), marginLeft: s(4) },
  groupCard: { borderRadius: theme.radius.xl, borderWidth: 1, overflow: 'hidden', ...theme.shadow.sm },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: s(14), paddingHorizontal: s(16), paddingVertical: s(14) },
  menuDivider: { borderBottomWidth: 1 },
  menuIcon: { width: s(42), height: s(42), borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1 },
  menuText: { fontSize: ms(15.5), fontWeight: '700' },
  menuSub: { fontSize: ms(12), marginTop: s(2) },
  menuChevronWrap: { width: s(28), height: s(28), borderRadius: s(14), alignItems: 'center', justifyContent: 'center' },

  themeRow: { flexDirection: 'row', alignItems: 'center', gap: s(12), paddingHorizontal: s(16), paddingVertical: s(12) },
  themeIcon: { width: s(38), height: s(38), borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center' },
  themeLabel: { fontSize: ms(15), fontWeight: '700', flex: 1 },
  themeSegment: { flexDirection: 'row', borderRadius: theme.radius.lg, padding: s(3), gap: s(3) },
  themeBtn: { flexDirection: 'row', alignItems: 'center', gap: s(4), paddingHorizontal: s(10), paddingVertical: s(7), borderRadius: theme.radius.md },
  themeBtnText: { fontSize: ms(11.5), fontWeight: '700' },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(8), paddingVertical: s(16), borderRadius: theme.radius.xl, borderWidth: 1 },
  logoutText: { fontSize: ms(15), fontWeight: '800' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(8),
    paddingVertical: s(16), borderRadius: theme.radius.xl, marginTop: s(10),
    shadowColor: '#e23d3d', shadowOpacity: 0.3, shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 }, elevation: 5,
  },
  deleteText: { fontSize: ms(15), fontWeight: '800', color: '#fff' },

  footer: { alignItems: 'center', paddingTop: s(28), paddingBottom: s(8), gap: s(5) },
  version: { fontSize: ms(11.5) },
});
