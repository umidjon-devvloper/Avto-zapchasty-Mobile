import { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Pressable, KeyboardAvoidingView, Platform, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { setStatusBarStyle } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useFocusEffect, router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { getSocket } from '../../src/lib/socket';
import { theme, s, ms } from '../../src/theme';
import { timeAgo } from '../../src/lib/format';
import { Loading } from '../../src/components/Loading';
import type { ChatMessage, ConversationInfo } from '../../src/lib/types';

export default function ChatThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const myId = useAuth((s) => s.user?._id ?? s.user?.id);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const { data: info } = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => api.getConversation(id),
    refetchInterval: 30000, // onlayn holatini yangilab turish
  });
  const peer = info?.other;

  const { data: messages, isLoading } = useQuery({
    queryKey: ['chat', id],
    queryFn: () => api.getChatMessages(id),
  });

  useFocusEffect(useCallback(() => {
    setStatusBarStyle('light');
    return () => setStatusBarStyle('dark');
  }, []));

  const appendMessage = (m: ChatMessage) => {
    qc.setQueryData<ChatMessage[]>(['chat', id], (prev) => {
      const list = prev ?? [];
      if (list.some((x) => x._id === m._id)) return list;
      return [...list, m];
    });
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('conversation:open', id);
    const onNew = (m: ChatMessage) => { if (m.conversationId === id) appendMessage(m); };
    const onPresence = (p: { userId: string; online: boolean; lastSeen?: string }) => {
      qc.setQueryData<ConversationInfo>(['conversation', id], (prev) => {
        if (!prev?.other || String(prev.other._id) !== String(p.userId)) return prev;
        return { ...prev, other: { ...prev.other, online: p.online, lastSeen: p.lastSeen ?? prev.other.lastSeen } };
      });
    };
    socket.on('message:new', onNew);
    socket.on('presence:update', onPresence);
    api.markChatRead(id).then(() => qc.invalidateQueries({ queryKey: ['conversations'] })).catch(() => {});
    return () => {
      socket.off('message:new', onNew);
      socket.off('presence:update', onPresence);
      socket.emit('conversation:leave', id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setText('');
    setSending(true);
    try {
      const msg = await api.sendChatMessage(id, body);
      appendMessage(msg);
      qc.invalidateQueries({ queryKey: ['conversations'] });
    } catch {
      setText(body);
    } finally {
      setSending(false);
    }
  };

  const onCall = async () => {
    if (!peer?.phone) { Alert.alert('Telefon raqami ko\'rsatilmagan'); return; }
    const url = `tel:${peer.phone}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Qo\'ng\'iroq qilib bo\'lmadi', `Raqam: ${peer.phone}`);
    }
  };

  // API eski -> yangi qaytaradi; inverted ro'yxat uchun yangi -> eski
  const ordered = [...(messages ?? [])].reverse();
  const title = peer?.shopName || peer?.name || 'Suhbat';
  const initial = title.trim().charAt(0).toUpperCase();
  const presence = peer?.online
    ? 'onlayn'
    : peer?.lastSeen
      ? `oxirgi marta ${timeAgo(peer.lastSeen)}`
      : '';

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
      {/* ── Premium header ── */}
      <LinearGradient colors={theme.gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={[styles.headerRow, { paddingTop: insets.top + 6 }]}>
          <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()} hitSlop={6}>
            <Ionicons name="chevron-back" size={ms(24)} color="#fff" />
          </Pressable>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
            {peer?.online ? <View style={styles.onlineDot} /> : null}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{title}</Text>
            <View style={styles.subRow}>
              {peer?.online ? <View style={styles.subDot} /> : null}
              <Text style={styles.sub} numberOfLines={1}>
                {[presence, peer?.phone].filter(Boolean).join('  ·  ') || 'Suhbat'}
              </Text>
            </View>
          </View>

          {peer?.phone ? (
            <Pressable style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.8 }]} onPress={onCall} hitSlop={6}>
              <Ionicons name="call" size={ms(19)} color="#fff" />
            </Pressable>
          ) : null}
        </View>
      </LinearGradient>

      {/* ── Xabarlar ── */}
      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={ordered}
          inverted
          keyExtractor={(m) => m._id}
          contentContainerStyle={{ padding: theme.space.lg, gap: s(6) }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const mine = String(item.senderId) === String(myId);
            return (
              <View style={[styles.bubbleWrap, mine ? styles.wrapMine : styles.wrapTheirs]}>
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  <Text style={[styles.msgText, mine && { color: theme.colors.onPrimary }]}>{item.text}</Text>
                  <Text style={[styles.msgTime, mine ? styles.msgTimeMine : styles.msgTimeTheirs]}>
                    {new Date(item.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* ── Yozish paneli ── */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TextInput
          style={styles.input}
          placeholder="Xabar yozing..."
          placeholderTextColor={theme.colors.muted}
          value={text}
          onChangeText={setText}
          multiline
        />
        <Pressable style={({ pressed }) => [styles.sendBtn, (!text.trim() || pressed) && { opacity: text.trim() ? 0.85 : 0.4 }]} onPress={send} disabled={!text.trim()}>
          <LinearGradient colors={theme.gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sendFill}>
            <Ionicons name="send" size={ms(18)} color={theme.colors.onPrimary} />
          </LinearGradient>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { borderBottomLeftRadius: s(22), borderBottomRightRadius: s(22), ...theme.shadow.navy },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: s(10), paddingHorizontal: theme.space.md, paddingBottom: s(14) },
  backBtn: { width: s(34), height: s(34), alignItems: 'center', justifyContent: 'center' },
  avatar: {
    width: s(42), height: s(42), borderRadius: s(21), backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: ms(18), fontWeight: '900', color: '#fff' },
  onlineDot: {
    position: 'absolute', right: -1, bottom: -1, width: s(13), height: s(13), borderRadius: s(7),
    backgroundColor: theme.colors.success, borderWidth: 2, borderColor: theme.colors.brand,
  },
  name: { fontSize: ms(16.5), fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: s(5), marginTop: s(2) },
  subDot: { width: s(7), height: s(7), borderRadius: s(4), backgroundColor: theme.colors.success },
  sub: { fontSize: ms(12.5), color: 'rgba(255,255,255,0.78)', fontVariant: ['tabular-nums'], flex: 1 },
  callBtn: {
    width: s(40), height: s(40), borderRadius: s(20), backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },

  bubbleWrap: { width: '100%', flexDirection: 'row' },
  wrapMine: { justifyContent: 'flex-end' },
  wrapTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', paddingHorizontal: s(13), paddingTop: s(8), paddingBottom: s(6), borderRadius: s(18) },
  mine: { backgroundColor: theme.colors.primary, borderBottomRightRadius: s(5) },
  theirs: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderBottomLeftRadius: s(5) },
  msgText: { fontSize: ms(15), color: theme.colors.text, lineHeight: ms(20) },
  msgTime: { fontSize: ms(10.5), alignSelf: 'flex-end', marginTop: s(2), fontVariant: ['tabular-nums'] },
  msgTimeMine: { color: 'rgba(255,255,255,0.8)' },
  msgTimeTheirs: { color: theme.colors.faint },

  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: s(8), paddingHorizontal: theme.space.md, paddingTop: s(10), borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.card },
  input: { flex: 1, maxHeight: s(120), minHeight: s(46), borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, paddingHorizontal: s(16), paddingTop: s(12), paddingBottom: s(12), fontSize: ms(15), color: theme.colors.text, backgroundColor: theme.colors.bg },
  sendBtn: { width: s(46), height: s(46), borderRadius: s(23), overflow: 'hidden', ...theme.shadow.brand },
  sendFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
