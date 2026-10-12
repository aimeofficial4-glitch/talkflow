import { useState, useEffect, useRef, useCallback } from 'react';
import { LocaleKey } from '../utils/i18n.ts';
import { ActiveCallState } from '../components/CallModal.tsx';
import { IncomingCallData } from '../components/IncomingCallToast.tsx';
import { CallLogItem } from '../pages/CallsPage.tsx';
import { StoryGroup } from '../components/StoryViewerModal.tsx';
import { ChannelItem } from '../pages/ChannelsPage.tsx';

export interface PollItem {
  id: string;
  conversation_id: string;
  message_id: string;
  question: string;
  options: Array<{ id: string; text: string; voter_ids: string[] }>;
  created_by: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  bio?: string;
  preferredLanguage: LocaleKey;
  timezone: string;
  role?: 'admin' | 'user';
  country?: string;
  isActive?: boolean;
  sessionCount?: number;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  type: 'direct' | 'group';
  name: string;
  avatarUrl?: string;
  currentSeq: number;
  myLastReadSeq: number;
  unreadCount: number;
  lastMessage?: {
    id: string;
    seq: number;
    senderId: string;
    body: string;
    createdAt: string;
  };
  members: Array<{
    user: UserProfile;
    role: string;
    lastReadSeq: number;
    isOnline: boolean;
  }>;
}

export interface ChatMessage {
  id: string;
  client_msg_id: string;
  conversation_id: string;
  seq: number;
  sender_id: string;
  body: string;
  language: string;
  created_at: string;
  status?: 'pending' | 'sent' | 'delivered' | 'read';
  reactions?: Array<{ id: string; user_id: string; emoji: string }>;
  translations?: Array<{ targetLang: string; text: string }>;
  translatedText?: string;
  isShowingOriginal?: boolean;
  type?: 'text' | 'image' | 'document' | 'audio' | 'voice_note' | 'poll';
  mediaUrl?: string;
  voiceDuration?: number;
  voiceWaveform?: number[];
  pollId?: string;
  isPinned?: boolean;
}

export interface DeviceSessionInfo {
  id: string;
  deviceName: string;
  deviceType: 'web' | 'mobile_ios' | 'mobile_android' | 'desktop';
  ipAddress: string;
  userAgent: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface FriendItem {
  friendshipId: string;
  user: UserProfile;
  presence: {
    status: 'online' | 'offline' | 'away';
    lastSeen: number;
    isOnline: boolean;
  };
}

// Web Audio synthesizer for message chime (zero external dependencies)
function playMessageSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  } catch (e) {
    // Ignore audio autoplay restrictions
  }
}

function playCallEndSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch (e) {}
}

export function useTalkFlow() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string>('');
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');
  const [socketStatus, setSocketStatus] = useState<'connected' | 'connecting' | 'reconnecting' | 'offline'>('connecting');
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [isLowAiMode, setIsLowAiMode] = useState(true); // Default to low AI mode as requested
  const [smartReplies, setSmartReplies] = useState<string[]>(['Sounds good! 👍', 'Got it, thanks!', 'I will check right away.']);

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('conv_global_hub');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<any[]>([]);
  const [pendingOutgoing, setPendingOutgoing] = useState<any[]>([]);
  const [sessions, setSessions] = useState<DeviceSessionInfo[]>([]);

  // Advanced features: Video/Voice Calls, Stories, Channels, Polls, and Pinned Message
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [callHistory, setCallHistory] = useState<CallLogItem[]>([]);
  const [stories, setStories] = useState<StoryGroup[]>([]);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [polls, setPolls] = useState<PollItem[]>([]);
  const [pinnedMessage, setPinnedMessage] = useState<ChatMessage | null>(null);

  // Real-time typing indicators map: convId -> Set of usernames
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});

  // Offline outbox queue: stores messages waiting to be sent
  const [outbox, setOutbox] = useState<Array<{
    client_msg_id: string;
    conversation_id: string;
    body: string;
    language: string;
  }>>([]);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const reconnectAttemptsRef = useRef(0);
  const lastTypingSentRef = useRef<number>(0);

  // 1. Initial Login as Admin (Mr.hacher) or load stored session
  useEffect(() => {
    async function initUser() {
      try {
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: 'Mr.hacher',
            password: '1a2i3m4e',
            deviceName: 'Admin Console Workstation (Web)',
            deviceType: 'desktop',
          }),
        });
        const data = await res.json();
        if (data.user && data.accessToken) {
          setCurrentUser(data.user);
          setAccessToken(data.accessToken);
          setCurrentDeviceId(data.deviceId);
        }
      } catch (err) {
        console.error('Login initial fail:', err);
      }
    }
    initUser();
  }, []);

  // Call duration ticker
  useEffect(() => {
    if (!activeCall || activeCall.status !== 'connected') return;
    const interval = setInterval(() => {
      setActiveCall((prev) => (prev ? { ...prev, durationSeconds: prev.durationSeconds + 1 } : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeCall?.status]);

  // 2. Fetch Conversations, Friends, Sessions, Calls, Stories & Channels
  const refreshData = useCallback(async () => {
    if (!accessToken) return;
    const authHeaders = { Authorization: `Bearer ${accessToken}` };

    try {
      const [convRes, friendsRes, sessionsRes, callsRes, storiesRes, channelsRes] = await Promise.all([
        fetch('/api/v1/conversations', { headers: authHeaders }),
        fetch('/api/v1/friends', { headers: authHeaders }),
        fetch('/api/v1/auth/sessions', { headers: authHeaders }),
        fetch('/api/v1/calls', { headers: authHeaders }),
        fetch('/api/v1/stories', { headers: authHeaders }),
        fetch('/api/v1/channels', { headers: authHeaders }),
      ]);

      if (convRes.ok) {
        const convData = await convRes.json();
        setConversations(convData.conversations);
      }
      if (friendsRes.ok) {
        const friendsData = await friendsRes.json();
        setFriends(friendsData.friends || []);
        setPendingIncoming(friendsData.pendingIncoming || []);
        setPendingOutgoing(friendsData.pendingOutgoing || []);
      }
      if (sessionsRes.ok) {
        const sessData = await sessionsRes.json();
        setSessions(sessData.sessions);
      }
      if (callsRes.ok) {
        const callsData = await callsRes.json();
        setCallHistory(callsData.calls || []);
      }
      if (storiesRes.ok) {
        const storiesData = await storiesRes.json();
        setStories(storiesData.stories || []);
      }
      if (channelsRes.ok) {
        const chanData = await channelsRes.json();
        setChannels(chanData.channels || []);
      }
    } catch (err) {
      console.error('Error fetching base data:', err);
    }
  }, [accessToken]);

  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [currentUser, refreshData]);

  // 3. Fetch Messages, Polls & Pinned Message for active conversation
  const loadMessages = useCallback(async (convId: string) => {
    if (!accessToken || !convId) return;
    const authHeaders = { Authorization: `Bearer ${accessToken}` };
    try {
      const [msgRes, pollRes, pinRes] = await Promise.all([
        fetch(`/api/v1/conversations/${convId}/messages`, { headers: authHeaders }),
        fetch(`/api/v1/conversations/${convId}/polls`, { headers: authHeaders }),
        fetch(`/api/v1/conversations/${convId}/pin`, { headers: authHeaders }),
      ]);

      if (msgRes.ok) {
        const data = await msgRes.json();
        setMessages(
          data.messages.map((m: any) => ({
            ...m,
            status: 'read',
          }))
        );
      }
      if (pollRes.ok) {
        const pollData = await pollRes.json();
        setPolls(pollData.polls || []);
      }
      if (pinRes.ok) {
        const pinData = await pinRes.json();
        setPinnedMessage(pinData.pinnedMessage || null);
      }
    } catch (err) {
      console.error('Failed to load conversation details:', err);
    }
  }, [accessToken]);

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    }
  }, [activeConvId, loadMessages]);

  // 4. WebSocket Lifecycle Management with Reconnection & Offline Outbox Drainage
  const connectWebSocket = useCallback(() => {
    if (isSimulatedOffline) {
      if (socketRef.current) socketRef.current.close();
      setSocketStatus('offline');
      return;
    }

    if (!currentUser || !accessToken) return;

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setSocketStatus(reconnectAttemptsRef.current > 0 ? 'reconnecting' : 'connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws?token=${encodeURIComponent(accessToken)}&deviceId=${encodeURIComponent(currentDeviceId)}`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setSocketStatus('connected');
      reconnectAttemptsRef.current = 0;

      // Drain outbox queue immediately upon reconnection
      setOutbox((prevOutbox) => {
        if (prevOutbox.length > 0) {
          prevOutbox.forEach((item) => {
            ws.send(
              JSON.stringify({
                type: 'send_message',
                client_msg_id: item.client_msg_id,
                conversation_id: item.conversation_id,
                body: item.body,
                language: item.language,
              })
            );
          });
        }
        return [];
      });

      // Seq catchup: request missed messages since highest known seq
      if (activeConvId && messages.length > 0) {
        const highestSeq = Math.max(...messages.map((m) => m.seq), 0);
        ws.send(
          JSON.stringify({
            type: 'sync_request',
            conversation_id: activeConvId,
            last_seen_seq: highestSeq,
          })
        );
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleIncomingSocketMessage(data);
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };

    ws.onclose = () => {
      setSocketStatus('reconnecting');
      socketRef.current = null;
      if (!isSimulatedOffline) {
        const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 10000);
        reconnectAttemptsRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
      } else {
        setSocketStatus('offline');
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [currentUser, accessToken, currentDeviceId, isSimulatedOffline, activeConvId, messages]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [connectWebSocket]);

  // 5. Incoming Socket Event Router
  const handleIncomingSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'connected':
        break;

      case 'msg_ack': {
        // Update optimistic pending message to confirmed seq from server
        setMessages((prev) =>
          prev.map((m) =>
            m.client_msg_id === data.client_msg_id
              ? {
                  ...m,
                  id: data.message_id,
                  seq: data.seq,
                  status: 'sent',
                  created_at: data.created_at,
                }
              : m
          )
        );
        refreshData();
        break;
      }

      case 'new_message': {
        const newMsg: ChatMessage = {
          ...data.message,
          status: 'delivered',
        };

        if (data.conversation_id === activeConvId) {
          setMessages((prev) => {
            // Deduplicate if already present
            if (prev.some((m) => m.id === newMsg.id || m.client_msg_id === newMsg.client_msg_id)) {
              return prev;
            }
            return [...prev, newMsg];
          });

          // Send read receipt if active conversation
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(
              JSON.stringify({
                type: 'mark_read',
                conversation_id: activeConvId,
                seq: newMsg.seq,
              })
            );
          }
        }

        playMessageSound();
        refreshData();
        break;
      }

      case 'delivery_status': {
        setMessages((prev) =>
          prev.map((m) => (m.seq === data.seq && m.conversation_id === data.conversation_id ? { ...m, status: 'delivered' } : m))
        );
        break;
      }

      case 'read_receipt': {
        setMessages((prev) =>
          prev.map((m) =>
            m.conversation_id === data.conversation_id && m.seq <= data.read_up_to_seq
              ? { ...m, status: 'read' }
              : m
          )
        );
        break;
      }

      case 'typing_indicator': {
        const { conversation_id, username, is_typing } = data;
        setTypingUsers((prev) => {
          const current = prev[conversation_id] || [];
          if (is_typing) {
            if (!current.includes(username)) {
              return { ...prev, [conversation_id]: [...current, username] };
            }
          } else {
            return { ...prev, [conversation_id]: current.filter((u) => u !== username) };
          }
          return prev;
        });
        break;
      }

      case 'sync_response': {
        if (data.messages && data.messages.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newToAdd = data.messages.filter((m: any) => !existingIds.has(m.id));
            return [...prev, ...newToAdd].sort((a, b) => a.seq - b.seq);
          });
        }
        break;
      }

      case 'reaction_update': {
        setMessages((prev) =>
          prev.map((m) => (m.id === data.message_id ? { ...m, reactions: data.reactions } : m))
        );
        break;
      }

      case 'presence_update': {
        setFriends((prev) =>
          prev.map((f) =>
            f.user.id === data.userId
              ? {
                  ...f,
                  presence: {
                    ...f.presence,
                    status: data.status,
                    isOnline: data.status === 'online',
                    lastSeen: data.timestamp,
                  },
                }
              : f
          )
        );
        break;
      }

      case 'session_revoked': {
        alert('Your session was remotely revoked from another device.');
        window.location.reload();
        break;
      }

      case 'incoming_call': {
        setIncomingCall({
          callId: data.callId,
          caller: data.caller,
          callType: data.callType || 'video',
          offer: data.offer,
        });
        break;
      }

      case 'call_answered': {
        setActiveCall((prev) => {
          if (prev && prev.callId === data.callId) {
            return { ...prev, status: 'connected' };
          }
          return prev;
        });
        break;
      }

      case 'call_ended': {
        setActiveCall(null);
        setIncomingCall(null);
        playCallEndSound();
        refreshData();
        break;
      }

      case 'poll_created':
      case 'poll_updated': {
        if (data.poll) {
          setPolls((prev) => {
            const idx = prev.findIndex((p) => p.id === data.poll.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = data.poll;
              return updated;
            }
            return [...prev, data.poll];
          });
        }
        break;
      }

      case 'pinned_message_update': {
        if (data.conversation_id === activeConvId) {
          if (data.message_id) {
            const found = messages.find((m) => m.id === data.message_id);
            setPinnedMessage(found || null);
          } else {
            setPinnedMessage(null);
          }
        }
        break;
      }

      case 'friend_request_received':
      case 'friend_request_sent':
      case 'friend_request_accepted':
      case 'friend_request_declined':
      case 'friend_request_cancelled': {
        refreshData();
        break;
      }

      default:
        break;
    }
  }, [activeConvId, refreshData]);

  // 6. Action: Send Message (client_msg_id deduplication, outbox queuing, optimistic render)
  const sendMessage = useCallback((body: string) => {
    if (!body.trim() || !currentUser || !activeConvId) return;

    const clientMsgId = 'cmsg_' + crypto.randomUUID();
    const tempSeq = (messages[messages.length - 1]?.seq || 0) + 1;

    const optimisticMessage: ChatMessage = {
      id: 'temp_' + clientMsgId,
      client_msg_id: clientMsgId,
      conversation_id: activeConvId,
      seq: tempSeq,
      sender_id: currentUser.id,
      body: body.trim(),
      language: currentUser.preferredLanguage,
      created_at: new Date().toISOString(),
      status: 'pending',
    };

    // Optimistically render
    setMessages((prev) => [...prev, optimisticMessage]);

    // If online, dispatch via WebSocket; if offline, add to Outbox
    if (socketRef.current?.readyState === WebSocket.OPEN && !isSimulatedOffline) {
      socketRef.current.send(
        JSON.stringify({
          type: 'send_message',
          client_msg_id: clientMsgId,
          conversation_id: activeConvId,
          body: body.trim(),
          language: currentUser.preferredLanguage,
        })
      );
    } else {
      setOutbox((prev) => [
        ...prev,
        {
          client_msg_id: clientMsgId,
          conversation_id: activeConvId,
          body: body.trim(),
          language: currentUser.preferredLanguage,
        },
      ]);
    }
  }, [activeConvId, currentUser, isSimulatedOffline, messages]);

  // 7. Action: Send Typing Notification (throttled to 2 seconds)
  const sendTyping = useCallback((isTyping: boolean) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN || isSimulatedOffline) return;
    const now = Date.now();
    if (isTyping && now - lastTypingSentRef.current < 2000) return;
    lastTypingSentRef.current = now;

    socketRef.current.send(
      JSON.stringify({
        type: 'typing',
        conversation_id: activeConvId,
        is_typing: isTyping,
      })
    );
  }, [activeConvId, isSimulatedOffline]);

  // 8. Action: React to Message
  const addReaction = useCallback((messageId: string, emoji: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'react',
          message_id: messageId,
          emoji,
        })
      );
    }
  }, []);

  // 9. Action: On-Demand Message Translation (Checks cache, preserves original untouched)
  const translateMessage = useCallback(async (messageId: string, targetLang: string) => {
    try {
      const res = await fetch('/api/v1/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ messageId, targetLang, lowAi: isLowAiMode }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  translatedText: data.translatedText,
                  isShowingOriginal: false,
                }
              : m
          )
        );
      }
    } catch (err) {
      console.error('Translation error:', err);
    }
  }, [accessToken, isLowAiMode]);

  // Fetch smart replies whenever latest message or preferred language changes
  useEffect(() => {
    async function loadSmartReplies() {
      if (!accessToken) return;
      const lastMsg = messages[messages.length - 1];
      if (!lastMsg) return;
      try {
        const res = await fetch('/api/v1/smart-replies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            lastMessage: lastMsg.body,
            language: currentUser?.preferredLanguage || 'en',
            lowAi: isLowAiMode,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.replies) setSmartReplies(data.replies);
        }
      } catch {
        // Fallback default replies preserved
      }
    }
    loadSmartReplies();
  }, [messages.length, accessToken, currentUser?.preferredLanguage, isLowAiMode]);

  // 10. Action: Switch Quick User (for interactive demo & multi-user testing)
  const switchUser = useCallback(async (userId: string) => {
    try {
      const res = await fetch('/api/v1/auth/switch-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setAccessToken(data.accessToken);
        setCurrentDeviceId(data.deviceId);
        if (socketRef.current) socketRef.current.close();
      }
    } catch (err) {
      console.error('Failed to switch user:', err);
    }
  }, []);

  // 11. Action: Remote Revoke Session
  const revokeSession = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/v1/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      }
    } catch (err) {
      console.error('Revoke session failed:', err);
    }
  }, [accessToken]);

  // 12. Action: Friend Request
  const sendFriendRequest = useCallback(async (username: string) => {
    try {
      const res = await fetch('/api/v1/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send request');
      refreshData();
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }, [accessToken, refreshData]);

  // 13. Action: Accept Friend Request
  const acceptFriendRequest = useCallback(async (friendshipId: string) => {
    try {
      const res = await fetch('/api/v1/friends/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ friendshipId }),
      });
      if (res.ok) {
        const data = await res.json();
        refreshData();
        if (data.conversationId) setActiveConvId(data.conversationId);
      }
    } catch (err) {
      console.error('Accept friend error:', err);
    }
  }, [accessToken, refreshData]);

  // 14. Action: Update User Settings
  const updateSettings = useCallback(async (newSettings: {
    preferred_language?: LocaleKey;
    timezone?: string;
    display_name?: string;
    bio?: string;
    country?: string;
  }) => {
    try {
      const res = await fetch('/api/v1/users/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error('Update settings error:', err);
    }
  }, [accessToken]);

  // 15. Action: Decline Friend Request
  const declineFriendRequest = useCallback(async (friendshipId: string) => {
    try {
      const res = await fetch('/api/v1/friends/decline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ friendshipId }),
      });
      if (res.ok) {
        refreshData();
      }
    } catch (err) {
      console.error('Decline friend error:', err);
    }
  }, [accessToken, refreshData]);

  // 15b. Action: Cancel Outgoing Friend Request
  const cancelFriendRequest = useCallback(async (friendshipId: string) => {
    try {
      const res = await fetch('/api/v1/friends/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ friendshipId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel request');
      refreshData();
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }, [accessToken, refreshData]);

  // 15c. Action: Search Users by Username or Display Name
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) return [];
    try {
      const res = await fetch(`/api/v1/users/search?q=${encodeURIComponent(query.trim())}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        return data.users || [];
      }
      return [];
    } catch (err) {
      console.error('Search users error:', err);
      return [];
    }
  }, [accessToken]);

  // 15d. Action: Lookup User by Identifier (Username, ID, or QR invite URL)
  const lookupUser = useCallback(async (identifier: string) => {
    if (!identifier.trim()) return null;
    try {
      const res = await fetch(`/api/v1/users/lookup?identifier=${encodeURIComponent(identifier.trim())}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'User not found');
      return data;
    } catch (err: any) {
      throw err;
    }
  }, [accessToken]);

  // 16. Action: Send Media Attachment via CDN
  const sendAttachmentMessage = useCallback(async (sampleType: 'image' | 'document' | 'audio', caption?: string) => {
    try {
      const res = await fetch('/api/v1/attachments/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          sampleType,
          filename: sampleType === 'image' ? 'photo_upload.jpg' : sampleType === 'document' ? 'spec.pdf' : 'voice.m4a',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const mediaUrl = data.attachment?.url || '';
        const bodyText = caption ? `${caption}\n[Attachment: ${mediaUrl}]` : `[Attachment: ${mediaUrl}]`;
        sendMessage(bodyText);
      }
    } catch (err) {
      console.error('Attachment upload failed:', err);
    }
  }, [accessToken, sendMessage]);

  // 17. Action: Email/Username Login
  const loginWithCredentials = useCallback(async (identifier: string, pass: string) => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      setCurrentUser(data.user);
      setAccessToken(data.accessToken);
      setCurrentDeviceId(data.deviceId);
      if (socketRef.current) socketRef.current.close();
      return { success: true, message: 'Welcome back!' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }, []);

  // 18. Action: Register New Account
  const registerUser = useCallback(async (formData: any) => {
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setCurrentUser(data.user);
      setAccessToken(data.accessToken);
      setCurrentDeviceId(data.deviceId);
      if (socketRef.current) socketRef.current.close();
      return { success: true, message: 'Account created successfully!' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }, []);

  // 19. Action: Forgot Password
  const forgotPassword = useCallback(async (email: string) => {
    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      return { success: true, message: data.message, resetToken: data.resetToken };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }, []);

  // 20. Action: Reset Password
  const resetPassword = useCallback(async (token: string, newPass: string) => {
    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }, []);

  // 21. Action: Logout
  const logout = useCallback(async () => {
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      // Ignored
    }
    setCurrentUser(null);
    setAccessToken('');
    if (socketRef.current) socketRef.current.close();
  }, [accessToken]);

  // 22. Action: Start Voice / Video Call
  const startCall = useCallback((peer: UserProfile, type: 'audio' | 'video' = 'video') => {
    const callId = 'call_' + crypto.randomUUID().slice(0, 8);
    const newCall: ActiveCallState = {
      callId,
      peer,
      type,
      status: 'calling',
      isCaller: true,
      startTime: Date.now(),
      durationSeconds: 0,
      isMuted: false,
      isCameraOff: false,
      isScreenSharing: false,
      isMinimized: false,
    };
    setActiveCall(newCall);

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'call_offer',
          callId,
          recipientId: peer.id,
          callType: type,
          offer: { sdp: 'simulated_offer_sdp' },
        })
      );
    }

    // Connect simulated peer for instant responsive demo testing
    setTimeout(() => {
      setActiveCall((prev) => {
        if (prev && prev.callId === callId && prev.status === 'calling') {
          return { ...prev, status: 'connected' };
        }
        return prev;
      });
    }, 1800);
  }, []);

  const acceptCall = useCallback((callType: 'audio' | 'video' = 'video') => {
    if (!incomingCall) return;
    const answeredCall: ActiveCallState = {
      callId: incomingCall.callId,
      peer: incomingCall.caller,
      type: callType,
      status: 'connected',
      isCaller: false,
      startTime: Date.now(),
      durationSeconds: 0,
      isMuted: false,
      isCameraOff: false,
      isScreenSharing: false,
      isMinimized: false,
    };
    setActiveCall(answeredCall);

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'call_answer',
          callId: incomingCall.callId,
          callerId: incomingCall.caller.id,
          answer: { sdp: 'simulated_answer_sdp' },
          accepted: true,
        })
      );
    }
    setIncomingCall(null);
  }, [incomingCall]);

  const declineCall = useCallback(() => {
    if (!incomingCall) return;
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'call_end',
          callId: incomingCall.callId,
          targetUserId: incomingCall.caller.id,
          durationSeconds: 0,
          callType: incomingCall.callType,
        })
      );
    }
    setIncomingCall(null);
    playCallEndSound();
  }, [incomingCall]);

  const endCall = useCallback(() => {
    if (!activeCall) return;
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'call_end',
          callId: activeCall.callId,
          targetUserId: activeCall.peer.id,
          durationSeconds: activeCall.durationSeconds,
          callType: activeCall.type,
        })
      );
    }
    playCallEndSound();

    if (accessToken) {
      fetch('/api/v1/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          recipientId: activeCall.peer.id,
          type: activeCall.type,
          status: activeCall.durationSeconds > 0 ? 'completed' : 'missed',
          durationSeconds: activeCall.durationSeconds,
        }),
      }).then(() => refreshData());
    }

    setActiveCall(null);
  }, [activeCall, accessToken, refreshData]);

  const toggleCallMute = useCallback(() => {
    setActiveCall((prev) => (prev ? { ...prev, isMuted: !prev.isMuted } : null));
  }, []);

  const toggleCallCamera = useCallback(() => {
    setActiveCall((prev) => (prev ? { ...prev, isCameraOff: !prev.isCameraOff } : null));
  }, []);

  const toggleCallScreenShare = useCallback(() => {
    setActiveCall((prev) => (prev ? { ...prev, isScreenSharing: !prev.isScreenSharing } : null));
  }, []);

  const toggleCallMinimize = useCallback(() => {
    setActiveCall((prev) => (prev ? { ...prev, isMinimized: !prev.isMinimized } : null));
  }, []);

  // 23. Action: Post 24h Story / Status
  const postStory = useCallback(async (data: { mediaUrl?: string; text?: string; backgroundGradient?: string }) => {
    if (!accessToken) return;
    try {
      const res = await fetch('/api/v1/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        refreshData();
      }
    } catch (e) {
      console.error('Failed to post story:', e);
    }
  }, [accessToken, refreshData]);

  const markStoryViewed = useCallback(async (storyId: string) => {
    if (!accessToken) return;
    try {
      await fetch(`/api/v1/stories/${storyId}/view`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setStories((prev) =>
        prev.map((g) => ({
          ...g,
          stories: g.stories.map((s) => (s.id === storyId ? { ...s, hasViewed: true } : s)),
        }))
      );
    } catch {}
  }, [accessToken]);

  const replyToStory = useCallback((user: UserProfile, message: string) => {
    const directConv = conversations.find(
      (c) => c.type === 'direct' && c.members.some((m) => m.user?.id === user.id)
    );
    if (directConv) {
      setActiveConvId(directConv.id);
      sendMessage(message);
    } else {
      sendMessage(`@${user.username}: ${message}`);
    }
  }, [conversations, sendMessage]);

  // 24. Action: Channels Subscribe & Reaction
  const subscribeChannel = useCallback(async (channelId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`/api/v1/channels/${channelId}/subscribe`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setChannels((prev) =>
          prev.map((ch) =>
            ch.id === channelId
              ? { ...ch, isSubscribed: data.isSubscribed, subscriberCount: data.subscriberCount }
              : ch
          )
        );
      }
    } catch (e) {
      console.error('Failed to toggle channel subscribe:', e);
    }
  }, [accessToken]);

  const reactChannelPost = useCallback(async (channelId: string, postId: string, emoji: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`/api/v1/channels/${channelId}/posts/${postId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ emoji }),
      });
      if (res.ok) {
        const data = await res.json();
        setChannels((prev) =>
          prev.map((ch) =>
            ch.id === channelId
              ? {
                  ...ch,
                  posts: ch.posts.map((p) => (p.id === postId ? data.post : p)),
                }
              : ch
          )
        );
      }
    } catch (e) {
      console.error('Failed to react to channel post:', e);
    }
  }, [accessToken]);

  // 25. Action: Create & Vote on In-Chat Polls
  const createPoll = useCallback(async (question: string, options: string[]) => {
    if (!accessToken || !activeConvId) return;
    try {
      const res = await fetch('/api/v1/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          conversationId: activeConvId,
          question,
          options,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPolls((prev) => [...prev, data.poll]);
        sendMessage(`📊 Poll: ${question}`);
      }
    } catch (e) {
      console.error('Failed to create poll:', e);
    }
  }, [accessToken, activeConvId, sendMessage]);

  const votePoll = useCallback(async (pollId: string, optionId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`/api/v1/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ optionId }),
      });
      if (res.ok) {
        const data = await res.json();
        setPolls((prev) => prev.map((p) => (p.id === pollId ? data.poll : p)));
      }
    } catch (e) {
      console.error('Failed to vote:', e);
    }
  }, [accessToken]);

  // 26. Action: Send Voice Audio Note
  const sendVoiceNote = useCallback((durationSeconds: number, waveform: number[]) => {
    if (!currentUser || !activeConvId) return;
    const clientMsgId = 'cmsg_' + crypto.randomUUID();
    const tempSeq = (messages[messages.length - 1]?.seq || 0) + 1;

    const optimisticMessage: ChatMessage = {
      id: 'temp_' + clientMsgId,
      client_msg_id: clientMsgId,
      conversation_id: activeConvId,
      seq: tempSeq,
      sender_id: currentUser.id,
      body: `🎙️ Voice Note (${durationSeconds}s)`,
      language: currentUser.preferredLanguage,
      created_at: new Date().toISOString(),
      status: 'pending',
      type: 'voice_note',
      voiceDuration: durationSeconds,
      voiceWaveform: waveform,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    if (socketRef.current?.readyState === WebSocket.OPEN && !isSimulatedOffline) {
      socketRef.current.send(
        JSON.stringify({
          type: 'send_message',
          client_msg_id: clientMsgId,
          conversation_id: activeConvId,
          body: `🎙️ Voice Note (${durationSeconds}s)`,
          language: currentUser.preferredLanguage,
        })
      );
    }
  }, [activeConvId, currentUser, isSimulatedOffline, messages]);

  // 27. Action: Pin / Unpin Message
  const pinMessage = useCallback(async (messageId: string | null) => {
    if (!accessToken || !activeConvId) return;
    try {
      const res = await fetch(`/api/v1/conversations/${activeConvId}/pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ messageId }),
      });
      if (res.ok) {
        const pinned = messages.find((m) => m.id === messageId) || null;
        setPinnedMessage(pinned);
      }
    } catch (e) {
      console.error('Failed to pin message:', e);
    }
  }, [accessToken, activeConvId, messages]);

  // 28. Admin Actions
  const fetchAdminUsers = useCallback(async (): Promise<UserProfile[]> => {
    if (!accessToken) return [];
    try {
      const res = await fetch('/api/v1/admin/users', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        return data.users || [];
      }
    } catch (e) {
      console.error('Failed to fetch admin users:', e);
    }
    return [];
  }, [accessToken]);

  const updateUserRole = useCallback(async (userId: string, newRole: 'admin' | 'user') => {
    if (!accessToken) return { success: false, message: 'Not authenticated' };
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role');
      if (userId === currentUser?.id) {
        setCurrentUser(data.user);
      }
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }, [accessToken, currentUser]);

  const toggleUserStatus = useCallback(async (userId: string, isActive: boolean) => {
    if (!accessToken) return { success: false, message: 'Not authenticated' };
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }, [accessToken]);

  const fetchAdminReports = useCallback(async () => {
    if (!accessToken) return [];
    try {
      const res = await fetch('/api/v1/admin/reports', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        return data.reports || [];
      }
    } catch (e) {
      console.error('Failed to fetch admin reports:', e);
    }
    return [];
  }, [accessToken]);

  const resolveAdminReport = useCallback(async (reportId: string) => {
    if (!accessToken) return { success: false };
    try {
      const res = await fetch(`/api/v1/admin/reports/${reportId}/resolve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return await res.json();
    } catch (e) {
      return { success: false };
    }
  }, [accessToken]);

  const broadcastAdminMessage = useCallback(async (title: string, message: string) => {
    if (!accessToken) return { success: false, message: 'Not authenticated' };
    try {
      const res = await fetch('/api/v1/admin/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ title, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Broadcast failed');
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }, [accessToken]);

  const fetchAdminMetrics = useCallback(async () => {
    if (!accessToken) return null;
    try {
      const res = await fetch('/api/v1/admin/metrics', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Failed to fetch metrics:', e);
    }
    return null;
  }, [accessToken]);

  return {
    currentUser,
    accessToken,
    currentDeviceId,
    socketStatus,
    isSimulatedOffline,
    setIsSimulatedOffline,
    conversations,
    activeConvId,
    setActiveConvId,
    messages,
    friends,
    pendingIncoming,
    pendingOutgoing,
    sessions,
    typingUsers: typingUsers[activeConvId] || [],
    outbox,
    isLowAiMode,
    setIsLowAiMode,
    smartReplies,
    sendMessage,
    sendTyping,
    addReaction,
    translateMessage,
    switchUser,
    revokeSession,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    searchUsers,
    lookupUser,
    sendAttachmentMessage,
    loginWithCredentials,
    registerUser,
    forgotPassword,
    resetPassword,
    logout,
    updateSettings,
    refreshData,
    // Calling features
    activeCall,
    incomingCall,
    callHistory,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleCallMute,
    toggleCallCamera,
    toggleCallScreenShare,
    toggleCallMinimize,
    // Stories features
    stories,
    postStory,
    markStoryViewed,
    replyToStory,
    // Channels features
    channels,
    subscribeChannel,
    reactChannelPost,
    // Polls & Voice & Pin features
    polls: polls.filter((p) => p.conversation_id === activeConvId),
    createPoll,
    votePoll,
    sendVoiceNote,
    pinnedMessage,
    pinMessage,
    // Admin features
    fetchAdminUsers,
    updateUserRole,
    toggleUserStatus,
    fetchAdminReports,
    resolveAdminReport,
    broadcastAdminMessage,
    fetchAdminMetrics,
  };
}
