import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Check,
  CheckCheck,
  Clock,
  Globe,
  Smile,
  Languages,
  Shield,
  Hash,
  Users,
  AlertCircle,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Music,
  Phone,
  Video,
  Pin,
  Play,
  Pause,
  Mic,
  Trash2,
  BarChart3,
  Volume2,
  Sparkles,
  Search,
  Star,
  Reply,
  Forward,
  Bookmark,
  Sliders,
  X,
  Calendar,
  Flame,
  Download,
  Share2,
  MoreVertical,
  VolumeX,
  Palette
} from 'lucide-react';
import { ChatMessage, ConversationSummary, UserProfile, PollItem } from '../hooks/useTalkFlow.ts';
import { LocaleKey, LOCALES, getT } from '../utils/i18n.ts';

interface ConversationViewProps {
  conversation: ConversationSummary | undefined;
  messages: ChatMessage[];
  currentUser: UserProfile | null;
  onSendMessage: (body: string) => void;
  onSendTyping: (isTyping: boolean) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onTranslateMessage: (messageId: string, targetLang: string) => void;
  typingUsers: string[];
  currentLanguage: LocaleKey;
  isSimulatedOffline: boolean;
  outboxCount: number;
  smartReplies?: string[];
  isLowAiMode?: boolean;
  onSendAttachment?: (type: 'image' | 'document' | 'audio') => void;
  onStartCall?: (peer: UserProfile, type: 'audio' | 'video') => void;
  onSendVoiceNote?: (durationSeconds: number, waveform: number[]) => void;
  polls?: PollItem[];
  onOpenCreatePoll?: () => void;
  onVotePoll?: (pollId: string, optionId: string) => void;
  pinnedMessage?: ChatMessage | null;
  onPinMessage?: (messageId: string | null) => void;
}

const COMMON_REACTIONS = ['👍', '❤️', '🚀', '😂', '🎉', '🔥'];

const SAMPLE_STICKERS = [
  '🎉', '🚀', '🔥', '❤️', '👏', '🥳', '😎', '💡', '✨', '☕', '💪', '🙌',
  '🎈', '💯', '🌟', '🦄', '🍕', '🌍', '⚡', '🏆', '💎', '🎯', '🥑', '🦁'
];

const SAMPLE_GIFS = [
  { name: 'Celebration', url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=300&auto=format&fit=crop&q=80' },
  { name: 'Coding High Five', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80' },
  { name: 'Tokyo Lights', url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=300&auto=format&fit=crop&q=80' },
  { name: 'Coffee Break', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&auto=format&fit=crop&q=80' },
];

export const ConversationView: React.FC<ConversationViewProps> = ({
  conversation,
  messages,
  currentUser,
  onSendMessage,
  onSendTyping,
  onAddReaction,
  onTranslateMessage,
  typingUsers,
  currentLanguage,
  isSimulatedOffline,
  outboxCount,
  smartReplies = [],
  isLowAiMode = true,
  onSendAttachment,
  onStartCall,
  onSendVoiceNote,
  polls = [],
  onOpenCreatePoll,
  onVotePoll,
  pinnedMessage,
  onPinMessage,
}) => {
  const t = getT(currentLanguage);
  const [inputText, setInputText] = useState('');
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);
  const [showOriginalMap, setShowOriginalMap] = useState<Record<string, boolean>>({});
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);

  // New Chat Features States (Pillar 1)
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [disappearingMode, setDisappearingMode] = useState<'off' | '24h' | '7d' | '90d'>('off');
  const [isDisappearingModalOpen, setIsDisappearingModalOpen] = useState(false);
  const [isSharedMediaOpen, setIsSharedMediaOpen] = useState(false);
  const [isChatSettingsOpen, setIsChatSettingsOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);
  const [stickerTab, setStickerTab] = useState<'emoji' | 'stickers' | 'gifs'>('emoji');
  const [savedMessageIds, setSavedMessageIds] = useState<string[]>([]);
  const [isScheduledModalOpen, setIsScheduledModalOpen] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('18:00');
  const [chatWallpaper, setChatWallpaper] = useState<'default' | 'dark' | 'gradient' | 'minimal'>('default');
  const [isMuted, setIsMuted] = useState(false);
  
  // Voice note recording states (WhatsApp / Telegram style)
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [playbackSpeedMap, setPlaybackSpeedMap] = useState<Record<string, number>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Voice recording timer
  useEffect(() => {
    if (!isRecording) {
      setRecordDuration(0);
      return;
    }
    const interval = setInterval(() => {
      setRecordDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
    onSendTyping(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    onSendTyping(e.target.value.length > 0);
  };

  const handleFinishVoiceRecord = () => {
    if (recordDuration < 1) {
      setIsRecording(false);
      return;
    }
    const waveform = Array.from({ length: 24 }).map(() => Math.floor(15 + Math.random() * 85));
    onSendVoiceNote?.(recordDuration, waveform);
    setIsRecording(false);
  };

  const handleCancelVoiceRecord = () => {
    setIsRecording(false);
  };

  const toggleVoicePlayback = (messageId: string) => {
    if (playingVoiceId === messageId) {
      setPlayingVoiceId(null);
    } else {
      setPlayingVoiceId(messageId);
    }
  };

  const cyclePlaybackSpeed = (messageId: string) => {
    const current = playbackSpeedMap[messageId] || 1;
    const next = current === 1 ? 1.5 : current === 1.5 ? 2 : 1;
    setPlaybackSpeedMap((prev) => ({ ...prev, [messageId]: next }));
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <Users className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-slate-300">No Conversation Selected</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Select a chat from the sidebar or start a new conversation with a friend.
        </p>
      </div>
    );
  }

  const otherMember = conversation.members.find((m) => m.user?.id !== currentUser?.id);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden">
      {/* Conversation Top Header */}
      <div className="px-6 py-3.5 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          {conversation.avatarUrl ? (
            <img
              src={conversation.avatarUrl}
              alt={conversation.name}
              className="w-10 h-10 rounded-full object-cover border border-slate-700 shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-sm">
              {conversation.name.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm text-white leading-tight">{conversation.name}</h2>
              {conversation.type === 'group' && (
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                  {conversation.members.length} members
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1 font-mono text-[11px] text-cyan-400 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800/60">
                <Hash className="w-3 h-3" /> {t('seqNumber')}: {conversation.currentSeq}
              </span>
              <span>•</span>
              <span className="text-[11px] text-slate-400">
                {conversation.members.filter((m) => m.isOnline).length} online
              </span>
            </div>
          </div>
        </div>

        {/* Right Header: Audio & Video Call buttons + Search, Media, Settings & Security badge */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* In-Chat Search Button */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`p-2 rounded-xl border transition-all ${
              isSearchOpen ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700'
            }`}
            title="Search messages in chat"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Disappearing Messages Quick Indicator & Config */}
          <button
            onClick={() => setIsDisappearingModalOpen(true)}
            className={`p-2 rounded-xl border transition-all ${
              disappearingMode !== 'off' ? 'bg-amber-600/30 text-amber-300 border-amber-500/50' : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700'
            }`}
            title={`Disappearing messages: ${disappearingMode}`}
          >
            <Clock className="w-4 h-4" />
          </button>

          {/* Shared Media Viewer */}
          <button
            onClick={() => setIsSharedMediaOpen(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
            title="View shared media, docs, audio"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Chat Settings Button */}
          <button
            onClick={() => setIsChatSettingsOpen(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
            title="Chat settings & wallpaper"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Call Buttons (WhatsApp / Telegram style) */}
          {otherMember?.user && onStartCall && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onStartCall(otherMember.user, 'audio')}
                className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all shadow-sm"
                title="Start Voice Call"
              >
                <Phone className="w-4 h-4" />
              </button>

              <button
                onClick={() => onStartCall(otherMember.user, 'video')}
                className="p-2 rounded-xl bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white transition-all shadow-sm"
                title="Start Video Call"
              >
                <Video className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-300 font-medium">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Seq Ordered</span>
          </div>
        </div>
      </div>

      {/* In-Chat Search Bar */}
      {isSearchOpen && (
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center gap-3 text-xs z-20">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords in this conversation..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            autoFocus
          />
          {searchQuery && (
            <span className="text-[11px] text-slate-400 font-mono">
              {messages.filter((m) => m.body.toLowerCase().includes(searchQuery.toLowerCase())).length} found
            </span>
          )}
          <button
            onClick={() => {
              setIsSearchOpen(false);
              setSearchQuery('');
            }}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Disappearing Messages Active Banner */}
      {disappearingMode !== 'off' && (
        <div className="bg-amber-950/60 border-b border-amber-800/50 px-4 py-1.5 flex items-center justify-between text-[11px] text-amber-300">
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Disappearing messages active: New messages expire after {disappearingMode}.</span>
          </div>
          <button
            onClick={() => setIsDisappearingModalOpen(true)}
            className="font-bold underline hover:text-amber-200"
          >
            Change
          </button>
        </div>
      )}

      {/* Pinned Message Banner if active */}
      {pinnedMessage && (
        <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-300 z-10">
          <div className="flex items-center gap-2 truncate">
            <Pin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="font-semibold text-indigo-300">Pinned:</span>
            <span className="truncate italic text-slate-300">"{pinnedMessage.body}"</span>
          </div>
          {onPinMessage && (
            <button
              onClick={() => onPinMessage(null)}
              className="text-[10px] text-slate-500 hover:text-rose-400 font-mono px-2 py-0.5 rounded hover:bg-slate-800 ml-2 shrink-0"
            >
              Unpin
            </button>
          )}
        </div>
      )}

      {/* Offline Mode Warning Banner */}
      {isSimulatedOffline && (
        <div className="bg-amber-950/80 border-b border-amber-800/60 px-4 py-2 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{t('offlineBanner')} ({outboxCount} {t('outboxQueued')})</span>
          </div>
          <span className="text-[10px] font-mono bg-amber-900/80 px-2 py-0.5 rounded border border-amber-700">
            AUTO-RECONNECT ON
          </span>
        </div>
      )}

      {/* Message Timeline */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUser?.id;
          const senderMember = conversation.members.find((m) => m.user?.id === msg.sender_id);
          const senderName = isMe ? currentUser?.displayName : senderMember?.user?.displayName || 'User';
          const senderAvatar = isMe ? currentUser?.avatarUrl : senderMember?.user?.avatarUrl;

          // Translation states
          const hasTranslation = Boolean(msg.translatedText || msg.translations?.find((t) => t.targetLang === currentLanguage));
          const translatedDisplay = msg.translatedText || msg.translations?.find((t) => t.targetLang === currentLanguage)?.text;
          const isShowingOriginal = showOriginalMap[msg.id];
          const displayBody = (hasTranslation && !isShowingOriginal ? translatedDisplay : msg.body) || '';

          // Poll check
          const isPoll = msg.type === 'poll' || displayBody.startsWith('📊 Poll:') || msg.body.startsWith('📊 Poll:');
          const matchedPoll = polls.find(
            (p) => p.message_id === msg.id || displayBody.includes(p.question)
          );

          // Voice note check
          const isVoiceNote = msg.type === 'voice_note' || displayBody.startsWith('🎙️ Voice Note');

          return (
            <div
              key={msg.id || msg.client_msg_id}
              className={`flex gap-3 group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              {senderAvatar && (
                <img
                  src={senderAvatar}
                  alt={senderName || ''}
                  className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0 mt-1"
                />
              )}

              {/* Message Bubble Container */}
              <div className={`max-w-[85%] md:max-w-[70%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                {/* Sender Name in Group Chat */}
                {conversation.type === 'group' && !isMe && (
                  <div className="text-[11px] font-semibold text-indigo-400 px-1">
                    {senderName}
                  </div>
                )}

                <div
                  className={`relative p-3.5 rounded-2xl shadow-md transition-all ${
                    isMe
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
                  }`}
                >
                  {/* Sequence Pill & Tag */}
                  <div className="flex items-center justify-between gap-3 text-[10px] mb-1.5 opacity-80">
                    <span className="font-mono flex items-center gap-1 font-bold">
                      <Hash className="w-2.5 h-2.5" />
                      {msg.seq}
                    </span>

                    {/* Language tag */}
                    {msg.language && (
                      <span className="text-[10px] font-mono px-1 rounded bg-black/20 opacity-70 uppercase">
                        {msg.language}
                      </span>
                    )}
                  </div>

                  {/* 1. Voice Note Player (WhatsApp / Telegram style) */}
                  {isVoiceNote ? (
                    <div className="p-2 bg-black/20 rounded-xl space-y-2 min-w-[240px]">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleVoicePlayback(msg.id)}
                          className="p-2 rounded-full bg-white text-slate-900 hover:bg-slate-200 transition-colors shrink-0"
                        >
                          {playingVoiceId === msg.id ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </button>

                        {/* Animated Waveform bars */}
                        <div className="flex-1 flex items-center gap-0.5 h-8">
                          {(msg.voiceWaveform || [20, 45, 70, 30, 85, 40, 60, 90, 35, 50, 75, 25, 65, 80, 40, 55]).map(
                            (height, idx) => (
                              <span
                                key={idx}
                                className={`w-1 rounded-full transition-all ${
                                  playingVoiceId === msg.id
                                    ? 'bg-cyan-300 animate-pulse'
                                    : 'bg-white/40'
                                }`}
                                style={{ height: `${Math.max(6, height * 0.28)}px` }}
                              />
                            )
                          )}
                        </div>

                        {/* Speed Toggle: 1x, 1.5x, 2x */}
                        <button
                          type="button"
                          onClick={() => cyclePlaybackSpeed(msg.id)}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white/20 hover:bg-white/30 text-white"
                        >
                          {playbackSpeedMap[msg.id] || 1}x
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-white/70 px-1 font-mono">
                        <span>🎙️ Audio Note</span>
                        <span>{msg.voiceDuration || 4}s</span>
                      </div>
                    </div>
                  ) : isPoll && matchedPoll ? (
                    /* 2. Interactive In-Chat Poll Card (WhatsApp / Telegram style) */
                    <div className="p-3 bg-black/20 rounded-2xl space-y-3 min-w-[260px]">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-cyan-300 shrink-0" />
                        <span className="font-bold text-xs text-white leading-snug">
                          {matchedPoll.question}
                        </span>
                      </div>

                      {/* Options */}
                      <div className="space-y-1.5">
                        {matchedPoll.options.map((opt) => {
                          const totalVotes = matchedPoll.options.reduce(
                            (acc, o) => acc + o.voter_ids.length,
                            0
                          );
                          const pct =
                            totalVotes > 0
                              ? Math.round((opt.voter_ids.length / totalVotes) * 100)
                              : 0;
                          const hasVoted = currentUser && opt.voter_ids.includes(currentUser.id);

                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => onVotePoll?.(matchedPoll.id, opt.id)}
                              className={`w-full p-2 rounded-xl text-left relative overflow-hidden border transition-all text-xs ${
                                hasVoted
                                  ? 'bg-indigo-950/60 border-indigo-400 text-white font-semibold'
                                  : 'bg-black/30 border-white/10 hover:border-white/30 text-slate-200'
                              }`}
                            >
                              {/* Background vote percentage fill bar */}
                              <div
                                className="absolute inset-y-0 left-0 bg-indigo-500/30 transition-all duration-500 pointer-events-none"
                                style={{ width: `${pct}%` }}
                              />

                              <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] ${
                                      hasVoted ? 'border-indigo-400 bg-indigo-500 text-white' : 'border-white/40'
                                    }`}
                                  >
                                    {hasVoted && '✓'}
                                  </span>
                                  <span>{opt.text}</span>
                                </div>
                                <span className="font-mono text-[10px] text-white/80">{pct}%</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="text-[10px] text-white/60 font-mono flex items-center justify-between px-1">
                        <span>
                          {matchedPoll.options.reduce((acc, o) => acc + o.voter_ids.length, 0)} votes
                        </span>
                        <span>Single Choice</span>
                      </div>
                    </div>
                  ) : (
                    /* 3. Standard Text Body */
                    <p
                      dir={
                        (hasTranslation && !isShowingOriginal && ['ar', 'fa', 'ur', 'he'].includes(currentLanguage)) ||
                        ((!hasTranslation || isShowingOriginal) && ['ar', 'fa', 'ur', 'he'].includes(msg.language))
                          ? 'rtl'
                          : 'auto'
                      }
                      className="text-sm leading-relaxed whitespace-pre-wrap break-words"
                    >
                      {displayBody.replace(/\[Attachment:\s*https?:\/\/[^\]]+\]/g, '').trim()}
                    </p>
                  )}

                  {/* Media Attachment Preview if present */}
                  {displayBody.includes('[Attachment:') && (() => {
                    const match = displayBody.match(/\[Attachment:\s*(https?:\/\/[^\]]+)\]/);
                    const url = match ? match[1] : '';
                    const isImg = url.match(/\.(jpg|jpeg|png|gif|webp)|unsplash/i);
                    return (
                      <div className="mt-2 rounded-xl overflow-hidden border border-white/20 bg-black/40">
                        {isImg ? (
                          <img src={url} alt="Attachment" className="max-h-48 w-full object-cover rounded-lg" />
                        ) : (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 p-2.5 text-xs text-indigo-300 hover:text-indigo-200 underline font-medium"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Download Document / Media</span>
                          </a>
                        )}
                      </div>
                    );
                  })()}

                  {/* Translation pill if translated */}
                  {hasTranslation && (
                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                      <span className="text-cyan-300 font-mono text-[10px] flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {isShowingOriginal ? 'Original Text' : `Translated (${LOCALES[currentLanguage]?.nativeLabel}) • ${t('cached')}`}
                      </span>

                      <button
                        onClick={() =>
                          setShowOriginalMap((prev) => ({
                            ...prev,
                            [msg.id]: !prev[msg.id],
                          }))
                        }
                        className="text-[10px] underline opacity-80 hover:opacity-100 ml-2"
                      >
                        {isShowingOriginal ? `View Translation` : t('originalText')}
                      </button>
                    </div>
                  )}

                  {/* Bubble Footer: Timestamp & Ticks */}
                  <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[10px] opacity-75">
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {/* Delivery & Read Receipts for outgoing messages */}
                    {isMe && (
                      <span title={msg.status || 'sent'}>
                        {msg.status === 'pending' ? (
                          <Clock className="w-3 h-3 animate-pulse text-amber-300" />
                        ) : msg.status === 'read' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-cyan-300 font-bold" />
                        ) : msg.status === 'delivered' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-slate-300" />
                        ) : (
                          <Check className="w-3 h-3 text-slate-300" />
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Message Hover Actions: Pin message & Reactions */}
                <div className="flex items-center gap-2 mt-1 px-1">
                  {/* On Demand Translate Button */}
                  {!hasTranslation && msg.sender_id !== currentUser?.id && !isVoiceNote && (
                    <button
                      onClick={() => onTranslateMessage(msg.id, currentLanguage)}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 py-0.5 px-1.5 rounded hover:bg-slate-800/80 transition-colors"
                      title={t('translateTo', { lang: LOCALES[currentLanguage]?.label || currentLanguage })}
                    >
                      <Languages className="w-3 h-3" />
                      <span>{t('translateTo', { lang: LOCALES[currentLanguage]?.label || currentLanguage })}</span>
                    </button>
                  )}

                  {/* Pin Message Button */}
                  {onPinMessage && (
                    <button
                      onClick={() => onPinMessage(msg.id)}
                      className="text-[11px] text-slate-400 hover:text-indigo-300 flex items-center gap-1 py-0.5 px-1.5 rounded hover:bg-slate-800/80 transition-colors"
                      title="Pin message to top"
                    >
                      <Pin className="w-3 h-3" />
                      <span>Pin</span>
                    </button>
                  )}

                  {/* Reaction trigger */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveReactionMessageId(activeReactionMessageId === msg.id ? null : msg.id)}
                      className="text-[11px] text-slate-400 hover:text-slate-200 py-0.5 px-1.5 rounded hover:bg-slate-800/80 flex items-center gap-1 transition-colors"
                    >
                      <Smile className="w-3 h-3" />
                    </button>

                    {activeReactionMessageId === msg.id && (
                      <div className="absolute left-0 bottom-full mb-1 flex items-center gap-1 p-1 bg-slate-900 border border-slate-700 rounded-full shadow-xl z-20">
                        {COMMON_REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              onAddReaction(msg.id, emoji);
                              setActiveReactionMessageId(null);
                            }}
                            className="p-1 hover:scale-125 transition-transform text-sm"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Reaction Badges Container */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    {Array.from(new Set(msg.reactions.map((r) => r.emoji))).map((emoji) => {
                      const count = msg.reactions?.filter((r) => r.emoji === emoji).length || 0;
                      return (
                        <span
                          key={emoji}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-xs shadow-sm font-mono"
                        >
                          <span>{emoji}</span>
                          <span className="text-[10px] text-slate-300">{count}</span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Real-Time Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-indigo-400 italic py-1 px-2 animate-pulse">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce delay-100" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce delay-200" />
            </span>
            <span>{typingUsers.join(', ')} {t('typing')}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Smart Reply Chips & Input Box */}
      <div className="p-3 md:p-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md shrink-0 space-y-2.5">
        {/* Quick Smart Replies */}
        {smartReplies && smartReplies.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[10px] uppercase font-mono text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/80 shrink-0 font-bold">
              {isLowAiMode ? '⚡ Low-AI' : '✨ Gemini'}
            </span>
            {smartReplies.map((reply, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSendMessage(reply)}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs whitespace-nowrap transition-all shadow-sm"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        {/* Voice Recording Mode or Standard Input Form */}
        {isRecording ? (
          /* WhatsApp / Telegram style live voice recorder */
          <div className="flex items-center justify-between gap-3 p-2 bg-slate-950 border border-rose-500/50 rounded-2xl shadow-xl animate-in fade-in">
            <div className="flex items-center gap-3 pl-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-mono font-bold text-rose-400">
                Recording {Math.floor(recordDuration / 60)}:{(recordDuration % 60).toString().padStart(2, '0')}
              </span>
              <div className="flex items-center gap-1 h-5 pl-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-1 bg-rose-400 rounded-full animate-pulse"
                    style={{
                      height: `${Math.max(6, Math.sin(i * 0.8 + recordDuration) * 14 + 10)}px`,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelVoiceRecord}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                title="Discard Recording"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleFinishVoiceRecord}
                className="p-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                title="Send Voice Note"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Quoted Reply Banner */}
            {replyingTo && (
              <div className="bg-slate-950/90 border border-indigo-500/40 rounded-xl p-2.5 flex items-center justify-between text-xs animate-in fade-in">
                <div className="flex items-center gap-2 truncate">
                  <Reply className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="font-semibold text-indigo-300">
                    Replying to {replyingTo.sender_id === currentUser?.id ? 'yourself' : otherMember?.user?.displayName || 'User'}:
                  </span>
                  <span className="truncate italic text-slate-300">&ldquo;{replyingTo.body}&rdquo;</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <form onSubmit={handleSend} className="flex items-center gap-2">
              {/* Media / Attachment Upload Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAttachmentOpen(!isAttachmentOpen)}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
                  title="Attachment menu (Photo, Document, Poll, Audio)"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {isAttachmentOpen && (
                  <div className="absolute bottom-12 left-0 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-40 space-y-1">
                    <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-slate-400 font-mono">
                      Share to Chat
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onSendAttachment?.('image');
                        setIsAttachmentOpen(false);
                      }}
                      className="w-full px-2.5 py-1.5 text-left text-xs text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Send Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSendAttachment?.('document');
                        setIsAttachmentOpen(false);
                      }}
                      className="w-full px-2.5 py-1.5 text-left text-xs text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Send Document (PDF)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenCreatePoll?.();
                        setIsAttachmentOpen(false);
                      }}
                      className="w-full px-2.5 py-1.5 text-left text-xs text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Create Poll</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSendAttachment?.('audio');
                        setIsAttachmentOpen(false);
                      }}
                      className="w-full px-2.5 py-1.5 text-left text-xs text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Music className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Send Audio File</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Stickers, Emoji & GIFs Picker Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStickerPickerOpen(!isStickerPickerOpen)}
                  className={`p-2.5 rounded-xl border transition-colors ${
                    isStickerPickerOpen
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                  }`}
                  title="Stickers, Emojis & GIFs"
                >
                  <Smile className="w-4 h-4" />
                </button>

                {isStickerPickerOpen && (
                  <div className="absolute bottom-12 left-0 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-40 space-y-2">
                    <div className="flex border-b border-slate-800 pb-2 gap-2 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setStickerTab('emoji')}
                        className={`flex-1 py-1 rounded text-center transition-colors ${
                          stickerTab === 'emoji' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Emojis
                      </button>
                      <button
                        type="button"
                        onClick={() => setStickerTab('stickers')}
                        className={`flex-1 py-1 rounded text-center transition-colors ${
                          stickerTab === 'stickers' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Stickers
                      </button>
                      <button
                        type="button"
                        onClick={() => setStickerTab('gifs')}
                        className={`flex-1 py-1 rounded text-center transition-colors ${
                          stickerTab === 'gifs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        GIFs
                      </button>
                    </div>

                    {stickerTab === 'emoji' && (
                      <div className="grid grid-cols-6 gap-2 text-xl max-h-40 overflow-y-auto">
                        {['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😋', '😜', '🤪', '🤫', '🤔', '🤐', '🤗', '🥳', '😎', '👍', '❤️', '🔥', '🚀', '🎉'].map((em) => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => {
                              setInputText((prev) => prev + em);
                              setIsStickerPickerOpen(false);
                            }}
                            className="p-1 hover:scale-125 transition-transform"
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    )}

                    {stickerTab === 'stickers' && (
                      <div className="grid grid-cols-6 gap-2 text-2xl max-h-40 overflow-y-auto">
                        {SAMPLE_STICKERS.map((stk, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              onSendMessage(stk);
                              setIsStickerPickerOpen(false);
                            }}
                            className="p-1 hover:scale-125 transition-transform"
                          >
                            {stk}
                          </button>
                        ))}
                      </div>
                    )}

                    {stickerTab === 'gifs' && (
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {SAMPLE_GIFS.map((g, i) => (
                          <div
                            key={i}
                            onClick={() => {
                              onSendMessage(`[GIF: ${g.name}] ${g.url}`);
                              setIsStickerPickerOpen(false);
                            }}
                            className="group relative rounded-lg overflow-hidden border border-slate-700 cursor-pointer hover:border-indigo-500"
                          >
                            <img src={g.url} alt={g.name} className="w-full h-16 object-cover" />
                            <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[10px] text-slate-200 text-center py-0.5 truncate px-1">
                              {g.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Schedule Message Button */}
              <button
                type="button"
                onClick={() => setIsScheduledModalOpen(true)}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
                title="Schedule message for later"
              >
                <Calendar className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder={t('typeMessage')}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all"
              />

              {/* Voice Note Button (WhatsApp / Telegram style) */}
              {!inputText.trim() ? (
                <button
                  type="button"
                  onClick={() => setIsRecording(true)}
                  className="p-2.5 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all shadow-sm"
                  title="Record Voice Note"
                >
                  <Mic className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-600/30 transition-all"
                  title="Send Message"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </form>
          </div>
        )}
      </div>

      {/* Disappearing Messages Modal */}
      {isDisappearingModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Disappearing Messages</span>
              </h3>
              <button onClick={() => setIsDisappearingModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              When enabled, new messages sent in this chat will disappear from all devices after the selected timer.
            </p>
            <div className="space-y-2">
              {[
                { id: 'off', label: 'Off', desc: 'Messages are stored permanently' },
                { id: '24h', label: '24 Hours', desc: 'Disappear after 1 day' },
                { id: '7d', label: '7 Days', desc: 'Disappear after 1 week' },
                { id: '90d', label: '90 Days', desc: 'Disappear after 3 months' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setDisappearingMode(opt.id as any);
                    setIsDisappearingModalOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                    disappearingMode === opt.id
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[10px] text-slate-400">{opt.desc}</div>
                  </div>
                  {disappearingMode === opt.id && <Check className="w-4 h-4 text-indigo-400" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Shared Media Modal */}
      {isSharedMediaOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span>Shared Media, Docs & Voice Notes</span>
              </h3>
              <button onClick={() => setIsSharedMediaOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg overflow-hidden border border-slate-800">
                <img src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&auto=format&fit=crop&q=80" alt="" className="w-full h-20 object-cover" />
              </div>
              <div className="rounded-lg overflow-hidden border border-slate-800">
                <img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300&auto=format&fit=crop&q=80" alt="" className="w-full h-20 object-cover" />
              </div>
              <div className="rounded-lg overflow-hidden border border-slate-800">
                <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80" alt="" className="w-full h-20 object-cover" />
              </div>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="font-bold text-slate-200">Documents & Audio Shared</div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>TalkFlow-Architecture-Whitepaper.pdf</span>
                <span className="text-indigo-400">1.4 MB</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Voice-Note-Tokyo-Sync.m4a</span>
                <span className="text-indigo-400">0:14s</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Settings Modal */}
      {isChatSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>Chat Settings</span>
              </h3>
              <button onClick={() => setIsChatSettingsOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <div className="font-bold text-slate-200">Mute Notifications</div>
                  <div className="text-[10px] text-slate-400">Silence sound &amp; vibration</div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs ${
                    isMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {isMuted ? 'Muted' : 'Unmuted'}
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">Chat Wallpaper</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['default', 'dark', 'gradient', 'minimal'] as const).map((wp) => (
                    <button
                      key={wp}
                      type="button"
                      onClick={() => setChatWallpaper(wp)}
                      className={`p-2 rounded-lg border text-center capitalize ${
                        chatWallpaper === wp ? 'border-indigo-500 bg-indigo-500/10 font-bold text-indigo-300' : 'border-slate-800 text-slate-400'
                      }`}
                    >
                      {wp}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    const data = JSON.stringify(messages, null, 2);
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `talkflow-chat-${conversation.id}.json`;
                    a.click();
                    setIsChatSettingsOpen(false);
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Chat History (JSON)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Message Modal */}
      {isScheduledModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Schedule Message</span>
              </h3>
              <button onClick={() => setIsScheduledModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Pick a future time to automatically deliver this message to {conversation.name}.
            </p>
            <div className="space-y-2">
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  if (inputText.trim()) {
                    onSendMessage(`⏰ [SCHEDULED FOR ${scheduledTime}]: ${inputText}`);
                    setInputText('');
                  }
                  setIsScheduledModalOpen(false);
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg"
              >
                Confirm Scheduled Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
