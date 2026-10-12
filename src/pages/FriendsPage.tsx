import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  QrCode,
  Copy,
  Check,
  Search,
  Send,
  MessageSquare,
  Globe,
  X,
  Star,
  Sparkles,
  Camera,
  Clock,
  UserCheck,
  Share2,
  Download,
  AlertCircle,
  XCircle,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import QRCode from 'qrcode';
import { FriendItem, UserProfile } from '../hooks/useTalkFlow.ts';
import { LOCALES, LocaleKey, getT } from '../utils/i18n.ts';
import { AddFriendModal, SearchUserItem } from '../components/AddFriendModal.tsx';
import { QRScannerModal } from '../components/QRScannerModal.tsx';
import { MyQRCodeModal } from '../components/MyQRCodeModal.tsx';
import { UserProfilePreviewModal, UserLookupResult } from '../components/UserProfilePreviewModal.tsx';

export interface FriendsPageProps {
  friends: FriendItem[];
  pendingIncoming: any[];
  pendingOutgoing?: any[];
  currentUser: UserProfile | null;
  onAcceptFriend: (friendshipId: string) => Promise<void> | void;
  onDeclineFriend?: (friendshipId: string) => Promise<void> | void;
  onCancelFriend?: (friendshipId: string) => Promise<{ success: boolean; message: string }>;
  onSendFriendRequest: (username: string) => Promise<{ success: boolean; message: string }>;
  onSearchUsers?: (query: string) => Promise<SearchUserItem[]>;
  onLookupUser?: (identifier: string) => Promise<any>;
  onStartChatWithFriend: (friendId: string) => void;
  currentLanguage: LocaleKey;
}

export type FriendsTab = 'all' | 'online' | 'requests' | 'find' | 'myqrcode' | 'suggestions' | 'favorites';

export const FriendsPage: React.FC<FriendsPageProps> = ({
  friends,
  pendingIncoming,
  pendingOutgoing = [],
  currentUser,
  onAcceptFriend,
  onDeclineFriend,
  onCancelFriend,
  onSendFriendRequest,
  onSearchUsers,
  onLookupUser,
  onStartChatWithFriend,
  currentLanguage,
}) => {
  const t = getT(currentLanguage);

  const [activeTab, setActiveTab] = useState<FriendsTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [targetUsername, setTargetUsername] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [favoriteFriendIds, setFavoriteFriendIds] = useState<string[]>(['usr_alex', 'usr_amina']);

  // Modals state
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isMyQrModalOpen, setIsMyQrModalOpen] = useState(false);
  const [previewUserResult, setPreviewUserResult] = useState<UserLookupResult | null>(null);

  // Dedicated "My QR Code" page state
  const [pageQrDataUrl, setPageQrDataUrl] = useState<string>('');

  // Live in-page search state (for "Find Friends" tab)
  const [liveSearchQuery, setLiveSearchQuery] = useState('');
  const [liveSearchResults, setLiveSearchResults] = useState<SearchUserItem[]>([]);
  const [isLiveSearching, setIsLiveSearching] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const inviteUrl = currentUser?.username
    ? `${window.location.origin}/invite/${currentUser.username}`
    : 'https://talkflow.app/invite/user';

  // Generate QR for My QR Code Page / Tab
  useEffect(() => {
    if (!currentUser) return;
    QRCode.toDataURL(inviteUrl, {
      width: 480,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setPageQrDataUrl(url))
      .catch((err) => console.error('QR generation failed', err));
  }, [currentUser, inviteUrl]);

  // Live in-page search debounced
  useEffect(() => {
    if (activeTab !== 'find') return;
    if (!liveSearchQuery.trim()) {
      setLiveSearchResults([]);
      setIsLiveSearching(false);
      return;
    }

    setIsLiveSearching(true);
    const timer = setTimeout(async () => {
      if (onSearchUsers) {
        try {
          const res = await onSearchUsers(liveSearchQuery.trim());
          setLiveSearchResults(res);
        } catch (err) {
          console.error('Search error', err);
        } finally {
          setIsLiveSearching(false);
        }
      } else {
        setIsLiveSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [liveSearchQuery, activeTab, onSearchUsers]);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!pageQrDataUrl || !currentUser) return;
    const a = document.createElement('a');
    a.href = pageQrDataUrl;
    a.download = `talkflow-qr-${currentUser.username}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // When QR code is scanned via camera
  const handleScanSuccess = async (scannedText: string) => {
    setIsScannerModalOpen(false);
    if (!onLookupUser) {
      setFeedback({ type: 'error', text: 'Lookup service unavailable' });
      return;
    }

    try {
      const lookupData = await onLookupUser(scannedText);
      if (lookupData && lookupData.user) {
        setPreviewUserResult(lookupData);
      } else {
        setFeedback({ type: 'error', text: `Could not find a user matching "${scannedText}"` });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || `No user found for "${scannedText}"` });
    }
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUsername.trim()) return;

    if (currentUser && targetUsername.trim().toLowerCase() === currentUser.username.toLowerCase()) {
      setFeedback({ type: 'error', text: 'You cannot add yourself as a friend.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const res = await onSendFriendRequest(targetUsername.trim());
    setIsSubmitting(false);
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      setTargetUsername('');
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const toggleFavorite = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteFriendIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const onlineFriends = friends.filter((f) => f.presence.isOnline);
  const favoriteFriends = friends.filter((f) => favoriteFriendIds.includes(f.user.id));

  const filteredFriends = friends
    .filter((f) => {
      if (activeTab === 'online') return f.presence.isOnline;
      if (activeTab === 'favorites') return favoriteFriendIds.includes(f.user.id);
      return true;
    })
    .filter(
      (f) =>
        f.user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Suggestions pool
  const SUGGESTIONS = [
    {
      id: 'usr_amina_sug',
      displayName: 'Amina Osei',
      username: 'amina',
      country: '🇰🇪 Kenya (East Africa)',
      mutual: 4,
      avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
      interests: ['Swahili', 'FinTech', 'Cloud'],
    },
    {
      id: 'usr_jeanpaul_sug',
      displayName: 'Jean-Paul Habimana',
      username: 'jeanpaul',
      country: '🇷🇼 Rwanda (East Africa)',
      mutual: 3,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      interests: ['KigaliTech', 'Rust', 'WebRTC'],
    },
    {
      id: 'usr_maya_sug',
      displayName: 'Maya Chen (マヤ)',
      username: 'maya',
      country: '🇯🇵 Japan',
      mutual: 2,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      interests: ['Design', 'Tokyo', 'Audio'],
    },
    {
      id: 'usr_omar_sug',
      displayName: 'عمر المنصور (Omar)',
      username: 'omar',
      country: '🇪🇬 Egypt (RTL)',
      mutual: 5,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      interests: ['Cairo', 'Security', 'PostgreSQL'],
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header & Actions Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
              <Users className="w-6 h-6 text-indigo-400" />
              <span>{t('friends')} &amp; Global Community</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Connect seamlessly via username, QR scan, shareable links, and manage friend requests.
            </p>
          </div>

          {/* Requirement 1: Prominent "Add Friend" Button and Quick Actions */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => setIsAddFriendModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-900/30 flex items-center gap-2 transition cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Friend</span>
            </button>

            <button
              onClick={() => setIsScannerModalOpen(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-cyan-300 font-semibold text-xs flex items-center gap-2 transition cursor-pointer shadow"
            >
              <Camera className="w-4 h-4" />
              <span>Scan QR</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('myqrcode');
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-slate-200 font-semibold text-xs flex items-center gap-2 transition cursor-pointer shadow"
            >
              <QrCode className="w-4 h-4 text-indigo-400" />
              <span>My QR Code</span>
            </button>

            <span className="text-xs px-3 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 font-mono hidden sm:inline-block">
              {friends.length} Friends ({onlineFriends.length} Online)
            </span>
          </div>
        </div>

        {/* Global Feedback Banner if any */}
        {feedback && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-2 shadow-lg animate-in slide-in-from-top-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                : 'bg-rose-950/80 border-rose-800 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Filter Navigation */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800 text-xs font-semibold overflow-x-auto scrollbar-none">
            {[
              { id: 'all', label: `All Friends (${friends.length})` },
              { id: 'online', label: `Online (${onlineFriends.length})` },
              {
                id: 'requests',
                label: `Requests (${pendingIncoming.length + pendingOutgoing.length})`,
                badge: pendingIncoming.length > 0 ? pendingIncoming.length : undefined,
              },
              { id: 'find', label: 'Find Friends' },
              { id: 'myqrcode', label: 'My QR Code' },
              { id: 'suggestions', label: 'Suggestions' },
              { id: 'favorites', label: `Close Friends (${favoriteFriends.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Quick Friend Filter Input (for 'all', 'online', 'favorites') */}
          {(activeTab === 'all' || activeTab === 'online' || activeTab === 'favorites') && (
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter friend list..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}
        </div>

        {/* TAB 1: REQUESTS (INCOMING & OUTGOING) */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Incoming Requests */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Incoming Friend Requests ({pendingIncoming.length})</span>
                </h3>
                <span className="text-[11px] text-slate-400">Waiting for your approval</span>
              </div>

              {pendingIncoming.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {pendingIncoming.map((req) => (
                    <div
                      key={req.friendshipId}
                      className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 shadow hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={req.from.avatarUrl}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-white leading-tight truncate">
                            {req.from.displayName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">
                            @{req.from.username}
                          </div>
                          {req.mutualFriendsCount !== undefined && req.mutualFriendsCount > 0 && (
                            <span className="text-[9px] text-indigo-300 font-mono block mt-0.5">
                              {req.mutualFriendsCount} mutual friends
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={async () => {
                            await onAcceptFriend(req.friendshipId);
                            setFeedback({
                              type: 'success',
                              text: `Accepted friend request from ${req.from.displayName}!`,
                            });
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition active:scale-95"
                        >
                          Accept
                        </button>
                        {onDeclineFriend && (
                          <button
                            onClick={async () => {
                              await onDeclineFriend(req.friendshipId);
                              setFeedback({
                                type: 'success',
                                text: `Declined friend request from @${req.from.username}.`,
                              });
                            }}
                            className="p-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 rounded-xl transition cursor-pointer border border-slate-700 hover:border-rose-800"
                            title="Decline"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-slate-950/60 rounded-xl text-center text-xs text-slate-500 border border-dashed border-slate-800">
                  No incoming requests waiting for review.
                </div>
              )}
            </div>

            {/* Outgoing Requests with Cancel Action */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  <span>Outgoing / Sent Requests ({pendingOutgoing.length})</span>
                </h3>
                <span className="text-[11px] text-slate-400">Waiting for their response</span>
              </div>

              {pendingOutgoing.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {pendingOutgoing.map((outReq) => (
                    <div
                      key={outReq.friendshipId}
                      className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 shadow hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={outReq.to?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${outReq.friendshipId}`}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-white leading-tight truncate">
                            {outReq.to?.displayName || `@${outReq.to?.username}`}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">
                            @{outReq.to?.username}
                          </div>
                          <span className="text-[9px] text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded font-mono inline-block mt-0.5">
                            Pending
                          </span>
                        </div>
                      </div>

                      {onCancelFriend && (
                        <button
                          onClick={async () => {
                            const res = await onCancelFriend(outReq.friendshipId);
                            if (res.success) {
                              setFeedback({ type: 'success', text: 'Friend request cancelled.' });
                            } else {
                              setFeedback({ type: 'error', text: res.message });
                            }
                          }}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 hover:border-rose-800 transition cursor-pointer shrink-0"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-slate-950/60 rounded-xl text-center text-xs text-slate-500 border border-dashed border-slate-800">
                  No active outgoing friend requests.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: FIND FRIENDS (LIVE SEARCH BY USERNAME & DISPLAY NAME) */}
        {activeTab === 'find' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-indigo-400" />
                  <span>Find &amp; Add Friends</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Search across 24 countries by username or display name with instant results.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsScannerModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-cyan-300 text-xs font-semibold border border-slate-800 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Scan QR Code</span>
                </button>
              </div>
            </div>

            {/* Live Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={liveSearchQuery}
                onChange={(e) => setLiveSearchQuery(e.target.value)}
                placeholder="Type username or display name (e.g. maya, omar, alex, jeanpaul)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-10 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono shadow-inner"
              />
              {liveSearchQuery && (
                <button
                  type="button"
                  onClick={() => setLiveSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Results Grid */}
            <div>
              {isLiveSearching ? (
                <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Searching global directory...</span>
                </div>
              ) : liveSearchResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {liveSearchResults.map((item) => {
                    const flag = LOCALES[item.user.preferredLanguage]?.flag || '🌍';
                    const isActing = actionLoadingId === item.user.username;

                    return (
                      <div
                        key={item.user.id}
                        onClick={() => {
                          setPreviewUserResult({
                            user: item.user,
                            relationship: item.relationship,
                            friendshipId: item.friendshipId,
                            mutualFriendsCount: item.mutualFriendsCount,
                            isOnline: item.isOnline,
                          });
                        }}
                        className="p-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl flex flex-col justify-between gap-3 shadow hover:shadow-indigo-950/20 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.user.avatarUrl}
                            alt=""
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-bold text-xs text-white truncate">
                                {item.user.displayName}
                              </span>
                              <span className="text-xs">{flag}</span>
                              {item.user.role === 'admin' && (
                                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono truncate">
                              @{item.user.username}
                            </div>
                            {item.mutualFriendsCount !== undefined && item.mutualFriendsCount > 0 && (
                              <span className="text-[10px] text-indigo-300 font-mono block mt-0.5">
                                {item.mutualFriendsCount} mutual friends
                              </span>
                            )}
                          </div>
                        </div>

                        {item.user.bio && (
                          <p className="text-[11px] text-slate-400 line-clamp-2">{item.user.bio}</p>
                        )}

                        <div className="pt-2 border-t border-slate-900" onClick={(e) => e.stopPropagation()}>
                          {item.relationship === 'friend' ? (
                            <button
                              type="button"
                              onClick={() => onStartChatWithFriend(item.user.id)}
                              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Message</span>
                            </button>
                          ) : item.relationship === 'outgoing_request' ? (
                            <button
                              type="button"
                              onClick={async () => {
                                if (item.friendshipId && onCancelFriend) {
                                  setActionLoadingId(item.user.username);
                                  await onCancelFriend(item.friendshipId);
                                  setActionLoadingId(null);
                                  setLiveSearchResults((prev) =>
                                    prev.map((r) =>
                                      r.user.id === item.user.id ? { ...r, relationship: 'none' } : r
                                    )
                                  );
                                }
                              }}
                              disabled={isActing}
                              className="w-full py-2 bg-amber-500/10 hover:bg-rose-500/20 text-amber-300 hover:text-rose-300 border border-amber-500/30 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Cancel Request</span>
                            </button>
                          ) : item.relationship === 'incoming_request' ? (
                            <button
                              type="button"
                              onClick={async () => {
                                if (item.friendshipId) {
                                  setActionLoadingId(item.user.username);
                                  await onAcceptFriend(item.friendshipId);
                                  setActionLoadingId(null);
                                  setLiveSearchResults((prev) =>
                                    prev.map((r) =>
                                      r.user.id === item.user.id ? { ...r, relationship: 'friend' } : r
                                    )
                                  );
                                }
                              }}
                              disabled={isActing}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept Request</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={async () => {
                                setActionLoadingId(item.user.username);
                                const res = await onSendFriendRequest(item.user.username);
                                setActionLoadingId(null);
                                if (res.success) {
                                  setFeedback({ type: 'success', text: res.message });
                                  setLiveSearchResults((prev) =>
                                    prev.map((r) =>
                                      r.user.id === item.user.id ? { ...r, relationship: 'outgoing_request' } : r
                                    )
                                  );
                                } else {
                                  setFeedback({ type: 'error', text: res.message });
                                }
                              }}
                              disabled={isActing}
                              className="w-full py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>{isActing ? 'Sending...' : 'Add Friend'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : liveSearchQuery.trim() ? (
                <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                  No users found matching &quot;{liveSearchQuery}&quot;. Try another query or send an invite link below.
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl space-y-1">
                  <p className="text-slate-400 font-medium">Type a username or display name above to search</p>
                  <p className="text-[11px] text-slate-500">
                    Results are sanitized to protect user privacy and respect user safety blocklists.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: DEDICATED "MY QR CODE" PAGE (Requirement 4) */}
        {activeTab === 'myqrcode' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl max-w-xl mx-auto">
            <div className="text-center space-y-1">
              <div className="inline-flex p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-2">
                <QrCode className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">My QR Code &amp; Invite Link</h2>
              <p className="text-xs text-slate-400">
                Share this unique QR code with friends to let them scan and add you instantly without typing.
              </p>
            </div>

            {/* Profile & Scannable QR Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 flex flex-col items-center space-y-4 shadow-inner">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser?.avatarUrl}
                  alt=""
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/50"
                />
                <div className="text-left">
                  <h3 className="font-bold text-base text-white">{currentUser?.displayName}</h3>
                  <span className="text-xs font-mono text-cyan-400">@{currentUser?.username}</span>
                  {currentUser?.country && (
                    <div className="text-[11px] text-slate-400">{currentUser.country}</div>
                  )}
                </div>
              </div>

              {/* QR Code graphic */}
              <div className="p-4 bg-white rounded-3xl shadow-2xl">
                {pageQrDataUrl ? (
                  <img
                    src={pageQrDataUrl}
                    alt={`TalkFlow QR for @${currentUser?.username}`}
                    className="w-56 h-56 object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                    Generating QR code...
                  </div>
                )}
              </div>

              <div className="text-center space-y-0.5">
                <span className="text-xs font-semibold text-slate-300">
                  Unique Personal Invite Code
                </span>
                <p className="text-[10px] text-slate-500 font-mono">
                  Points directly to your profile • Valid worldwide
                </p>
              </div>
            </div>

            {/* Shareable Link Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Shareable Invitation Link
              </label>
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-2">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  className="bg-transparent text-xs text-slate-300 font-mono flex-1 px-2 focus:outline-none truncate"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow cursor-pointer shrink-0"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `Connect with ${currentUser?.displayName} on TalkFlow`,
                      text: `Add me on TalkFlow: @${currentUser?.username}`,
                      url: inviteUrl,
                    }).catch(() => {});
                  } else {
                    handleCopy();
                  }
                }}
                className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer border border-slate-700"
              >
                <Share2 className="w-4 h-4 text-cyan-400" />
                <span>Share Invite</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadQr}
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>Download QR Image</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: SUGGESTIONS & DISCOVERY */}
        {activeTab === 'suggestions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Smart Friend Suggestions</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Recommended based on mutual friends, East African regions, and shared tags.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {SUGGESTIONS.map((sug) => {
                const isPending = pendingOutgoing.some((r) => r.to?.username === sug.username);
                const isFriend = friends.some((f) => f.user.username === sug.username);

                return (
                  <div
                    key={sug.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-lg"
                  >
                    <div className="space-y-2 text-center">
                      <img
                        src={sug.avatarUrl}
                        alt=""
                        className="w-14 h-14 rounded-full mx-auto object-cover border-2 border-indigo-500/30"
                      />
                      <div>
                        <div className="font-bold text-xs text-white">{sug.displayName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">@{sug.username}</div>
                        <div className="text-[11px] text-slate-300 mt-1">{sug.country}</div>
                      </div>

                      <div className="text-[10px] text-indigo-300 font-mono">
                        {sug.mutual} mutual friends
                      </div>

                      <div className="flex flex-wrap gap-1 justify-center">
                        {sug.interests.map((it) => (
                          <span
                            key={it}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 font-mono"
                          >
                            #{it}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        if (isFriend) {
                          onStartChatWithFriend(sug.id);
                        } else {
                          const res = await onSendFriendRequest(sug.username);
                          if (res.success) {
                            setFeedback({ type: 'success', text: res.message });
                          } else {
                            setFeedback({ type: 'error', text: res.message });
                          }
                        }
                      }}
                      disabled={isPending}
                      className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{isFriend ? 'Message' : isPending ? 'Request Sent' : 'Add Friend'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: ALL / ONLINE / FAVORITES FRIENDS GRID */}
        {(activeTab === 'all' || activeTab === 'online' || activeTab === 'favorites') && (
          <div className="space-y-4">
            {filteredFriends.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredFriends.map((f) => {
                  const isFav = favoriteFriendIds.includes(f.user.id);
                  const isOnline = f.presence.isOnline;
                  const flag = LOCALES[f.user.preferredLanguage]?.flag || '🌍';

                  return (
                    <div
                      key={f.friendshipId}
                      onClick={() =>
                        setPreviewUserResult({
                          user: f.user,
                          relationship: 'friend',
                          friendshipId: f.friendshipId,
                          isOnline,
                        })
                      }
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all shadow-md flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={f.user.avatarUrl}
                            alt={f.user.displayName}
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-700"
                          />
                          <span
                            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                              isOnline ? 'bg-emerald-400' : 'bg-slate-600'
                            }`}
                          />
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-white truncate">
                              {f.user.displayName}
                            </span>
                            <span className="text-xs">{flag}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate">
                            @{f.user.username}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                            <span>{isOnline ? 'Active Now' : 'Offline'}</span>
                            {f.user.country && <span>• {f.user.country}</span>}
                          </div>
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-1.5 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => toggleFavorite(f.user.id, e)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${
                            isFav
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-amber-400'
                          }`}
                          title={isFav ? 'Remove from Close Friends' : 'Star as Close Friend'}
                        >
                          <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                        </button>

                        <button
                          onClick={() => onStartChatWithFriend(f.user.id)}
                          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow cursor-pointer transition"
                          title="Message Friend"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                No friends found matching current filter.
              </div>
            )}
          </div>
        )}

        {/* Invite & Add Friend Bar (Persistent Footer Banner) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-indigo-400" />
                <span>Send Friend Request / Share Invite</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Add friends directly by username or share your unique personal invite link.
              </p>
            </div>

            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{isCopied ? 'Invite Link Copied!' : 'Copy Invite Link'}</span>
            </button>
          </div>

          <form onSubmit={handleSendRequest} className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">@</span>
              <input
                type="text"
                value={targetUsername}
                onChange={(e) => setTargetUsername(e.target.value)}
                placeholder="Enter handle to connect (e.g. alex, amina, jeanpaul)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !targetUsername.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow flex items-center gap-2 transition-all cursor-pointer shrink-0 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Sending...' : 'Send Request'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* MODAL 1: ADD FRIEND (SEARCH & QUICK ACTIONS) */}
      <AddFriendModal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
        currentUser={currentUser}
        onSendRequest={onSendFriendRequest}
        onAcceptFriend={onAcceptFriend}
        onDeclineFriend={onDeclineFriend}
        onCancelRequest={onCancelFriend}
        onSearchUsers={onSearchUsers}
        onStartChatWithFriend={onStartChatWithFriend}
        onOpenScanner={() => setIsScannerModalOpen(true)}
        onOpenMyQrCode={() => setIsMyQrModalOpen(true)}
        onSelectUserForPreview={(user, meta) => {
          setIsAddFriendModalOpen(false);
          setPreviewUserResult({
            user,
            relationship: meta?.relationship || 'none',
            friendshipId: meta?.friendshipId,
            mutualFriendsCount: meta?.mutualFriendsCount,
            isOnline: meta?.isOnline,
          });
        }}
        currentLanguage={currentLanguage}
      />

      {/* MODAL 2: CAMERA QR SCANNER */}
      <QRScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onScanSuccess={handleScanSuccess}
        currentLanguage={currentLanguage}
      />

      {/* MODAL 3: MY QR CODE */}
      <MyQRCodeModal
        isOpen={isMyQrModalOpen}
        onClose={() => setIsMyQrModalOpen(false)}
        currentUser={currentUser}
        currentLanguage={currentLanguage}
      />

      {/* MODAL 4: USER PROFILE PREVIEW (AFTER SCANNING OR DIRECT SEARCH) */}
      <UserProfilePreviewModal
        isOpen={Boolean(previewUserResult)}
        onClose={() => setPreviewUserResult(null)}
        data={previewUserResult}
        currentUser={currentUser}
        onSendFriendRequest={onSendFriendRequest}
        onAcceptFriendRequest={onAcceptFriend}
        onDeclineFriendRequest={onDeclineFriend || (() => {})}
        onCancelFriendRequest={onCancelFriend || (async () => ({ success: false, message: 'Not supported' }))}
        onStartChat={onStartChatWithFriend}
        currentLanguage={currentLanguage}
      />
    </div>
  );
};
