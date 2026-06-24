import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme, s, ms } from '../theme';
import { useAuth } from '../lib/auth';
import { unregisterPush } from '../lib/push';
import { disconnectSocket } from '../lib/socket';

const SUPPORT_PHONE = '+998712000000';

export function BlockedScreen() {
  const logout = useAuth((s) => s.logout);
  const user = useAuth((s) => s.user);

  const handleLogout = async () => {
    await unregisterPush().catch(() => {});
    disconnectSocket();
    logout();
  };

  const handleSupport = () => {
    Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => {});
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#1a0a0a', '#2d0f0f', '#1a0a0a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <LinearGradient
            colors={[theme.colors.dangerSoft, '#ffd0d0']}
            style={styles.iconGrad}
          >
            <Ionicons name="ban-outline" size={ms(52)} color={theme.colors.danger} />
          </LinearGradient>
          <View style={styles.iconRing} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Hisobingiz bloklandi</Text>
        <Text style={styles.sub}>
          Siz administrator tomonidan vaqtincha bloklangansiz.{'\n'}
          Tafsilotlar uchun qo'llab-quvvatlash xizmatiga murojaat qiling.
        </Text>

        {/* Info card */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Ionicons name="person-outline" size={ms(18)} color="rgba(255,255,255,0.5)" />
            <Text style={styles.cardLabel}>Hisob</Text>
            <Text style={styles.cardValue}>{user?.phone ?? '—'}</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.cardRow}>
            <Ionicons name="shield-outline" size={ms(18)} color="rgba(255,255,255,0.5)" />
            <Text style={styles.cardLabel}>Holat</Text>
            <View style={styles.blockedBadge}>
              <Ionicons name="ellipse" size={ms(7)} color={theme.colors.danger} />
              <Text style={styles.blockedBadgeText}>Bloklangan</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.supportBtn, pressed && { opacity: 0.85 }]}
            onPress={handleSupport}
          >
            <LinearGradient
              colors={theme.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.supportFill}
            >
              <Ionicons name="call-outline" size={ms(18)} color="#fff" />
              <Text style={styles.supportText}>Qo'llab-quvvatlash</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.75 }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={ms(17)} color="rgba(255,255,255,0.55)" />
            <Text style={styles.logoutText}>Chiqish</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: s(28), gap: 0 },

  iconWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: s(28) },
  iconGrad: {
    width: s(104),
    height: s(104),
    borderRadius: s(34),
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRing: {
    position: 'absolute',
    width: s(120),
    height: s(120),
    borderRadius: s(40),
    borderWidth: 1.5,
    borderColor: theme.colors.danger + '30',
  },

  title: {
    fontSize: ms(26),
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: s(12),
  },
  sub: {
    fontSize: ms(14.5),
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: ms(22),
    marginBottom: s(32),
    maxWidth: s(300),
  },

  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: s(20),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: s(20),
    paddingVertical: s(6),
    marginBottom: s(28),
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    paddingVertical: s(14),
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cardLabel: {
    fontSize: ms(14),
    color: 'rgba(255,255,255,0.45)',
    flex: 1,
  },
  cardValue: {
    fontSize: ms(14),
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    fontVariant: ['tabular-nums'],
  },
  blockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
    backgroundColor: theme.colors.danger + '22',
    paddingHorizontal: s(10),
    paddingVertical: s(4),
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.danger + '40',
  },
  blockedBadgeText: {
    fontSize: ms(12.5),
    fontWeight: '800',
    color: theme.colors.danger,
  },

  actions: { width: '100%', gap: s(12) },
  supportBtn: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    ...theme.shadow.brand,
  },
  supportFill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(9),
    height: s(54),
  },
  supportText: { fontSize: ms(16), fontWeight: '800', color: '#fff' },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(7),
    height: s(48),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  logoutText: { fontSize: ms(14.5), color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
});
