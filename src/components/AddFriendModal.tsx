import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  QrCode,
  Copy,
  Check,
  Send,
  Search,
  Camera,
  UserPlus,
  Users,
  Clock,
  Sparkles,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile } from '../hooks/useTalkFlow.ts';
import { LocaleKey, LOCALES, getT } from '../utils/i18n.ts';

export interface SearchUserItem {
  user: UserProfile;
  relationship: 'friend' | 'outgoing_request' | 'incoming_request' | 'none';
  friendshipId?: string;
  mutualFriendsCount?: number;
  isOnline?: boolean;
}

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onSendRequest: (username: string) => Promise<{ success: boolean; message: string }>;
  onAcceptFriend?: (friendshipId: string) => Promise<void> | void;
  onDeclineFriend?: (friendshipId: string) => Promise<void> | void;
  onCancelRequest?: (friendshipId: string) => Promise<{ success: boolean; message: string }>;
  onSearchUsers?: (query: string) => Promise<SearchUserItem[]>;
  onStartChatWithFriend?: (friendId: string) => void;
  onOpenScanner: () => void;
  onOpenMyQrCode: () => void;
  onSelectUserForPreview?: (user: UserProfile, meta?: any) => void;
  currentLanguage: LocaleKey;
}

export const AddFriendModal: React.FC<AddFriendModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSendRequest,
  onAcceptFriend,
  onDeclineFriend,
  onCancelRequest,
  onSearchUsers,
  onStartChatWithFriend,
  onOpenScanner,
  onOpenMyQrCode,
  onSelectUserForPreview,
  currentLanguage,
}) => {
  const t = getT(currentLanguage);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUserItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const searchTimeoutRef = useRef<any>(null);

  const inviteUrl = currentUser?.username
    ? `${window.location.origin}/invite/${currentUser.username}`
    : 'https://talkflow.app/invite/user';

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Live search debounced
  useEffect(() => {
    if (!isOpen) return;

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      if (onSearchUsers) {
        try {
          const results = await onSearchUsers(searchQuery.trim());
          setSearchResults(results);
        } catch (err) {
          console.error('Search failed', err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setIsSearching(false);
      }
    }, 280);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, isOpen, onSearchUsers]);

  if (!isOpen) return null;

  const handleSendRequestDirect = async (username: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActionLoadingId(username);
    setFeedback(null);

    const res = await onSendRequest(username);
    setActionLoadingId(null);
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      // update state in searchResults
      setSearchResults((prev) =>
        prev.map((item) =>
          item.user.username.toLowerCase() === username.toLowerCase()
            ? { ...item, relationship: 'outgoing_request' }
            : item
        )
      );
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleCancelRequestDirect = async (friendshipId: string, username: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onCancelRequest) return;
    setActionLoadingId(username);
    const res = await onCancelRequest(friendshipId);
    setActionLoadingId(null);
    if (res.success) {
      setFeedback({ type: 'success', text: 'Friend request cancelled.' });
      setSearchResults((prev) =>
        prev.map((item) =>
          item.user.username.toLowerCase() === username.toLowerCase()
            ? { ...item, relationship: 'none', friendshipId: undefined }
            : item
        )
      );
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleAcceptDirect = async (friendshipId: string, username: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onAcceptFriend) return;
    setActionLoadingId(username);
    await onAcceptFriend(friendshipId);
    setActionLoadingId(null);
    setFeedback({ type: 'success', text: `You are now friends with @${username}!` });
    setSearchResults((prev) =>
      prev.map((item) =>
        item.user.username.toLowerCase() === username.toLowerCase()
          ? { ...item, relationship: 'friend' }
          : item
      )
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {t('addFriend')}
              </h2>
              <p className="text-xs text-slate-400">Search by username, display name, or scan QR code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Discovery Actions Bar */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenScanner();
            }}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 flex items-center gap-3 transition text-left group cursor-pointer shadow"
          >
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-white">Scan QR Code</div>
              <div className="text-[10px] text-slate-400">Using camera</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenMyQrCode();
            }}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 flex items-center gap-3 transition text-left group cursor-pointer shadow"
          >
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-white">My QR Code</div>
              <div className="text-[10px] text-slate-400">Display &amp; Share</div>
            </div>
          </button>
        </div>

        {/* Live Search Input */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Search Users Globally
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username or display name (e.g. maya, omar, jeanpaul)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/70 border-rose-800 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Live Search Results */}
          <div className="space-y-2">
            {isSearching ? (
              <div className="p-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <span className="w-3 h-3 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                <span>Searching user directory...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Found {searchResults.length} Match{searchResults.length > 1 ? 'es' : ''}
                </span>

                {searchResults.map((item) => {
                  const flag = LOCALES[item.user.preferredLanguage]?.flag || '🌍';
                  const isActing = actionLoadingId === item.user.username;

                  return (
                    <div
                      key={item.user.id}
                      onClick={() => {
                        if (onSelectUserForPreview) {
                          onSelectUserForPreview(item.user, item);
                        }
                      }}
                      className="p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center justify-between gap-3 transition cursor-pointer group shadow"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={item.user.avatarUrl}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                          />
                          <span
                            className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${
                              item.isOnline ? 'bg-emerald-400' : 'bg-slate-600'
                            }`}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-bold text-xs text-white truncate">
                              {item.user.displayName}
                            </span>
                            <span className="text-xs">{flag}</span>
                            {item.user.role === 'admin' && (
                              <ShieldCheck className="w-3 h-3 text-indigo-400" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate">
                            @{item.user.username}
                          </div>
                          {item.mutualFriendsCount !== undefined && item.mutualFriendsCount > 0 && (
                            <span className="text-[10px] text-indigo-300 font-mono flex items-center gap-1 mt-0.5">
                              <Users className="w-2.5 h-2.5" />
                              {item.mutualFriendsCount} mutual friends
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        {item.relationship === 'friend' ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (onStartChatWithFriend) onStartChatWithFriend(item.user.id);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Chat</span>
                          </button>
                        ) : item.relationship === 'outgoing_request' ? (
                          <button
                            type="button"
                            onClick={(e) =>
                              item.friendshipId &&
                              handleCancelRequestDirect(item.friendshipId, item.user.username, e)
                            }
                            disabled={isActing}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-rose-500/20 text-amber-300 hover:text-rose-300 border border-amber-500/30 hover:border-rose-500/40 text-xs font-semibold transition"
                          >
                            <Clock className="w-3 h-3 inline mr-1" />
                            <span>Pending (Cancel)</span>
                          </button>
                        ) : item.relationship === 'incoming_request' ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) =>
                                item.friendshipId &&
                                handleAcceptDirect(item.friendshipId, item.user.username, e)
                              }
                              disabled={isActing}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow"
                            >
                              Accept
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleSendRequestDirect(item.user.username, e)}
                            disabled={isActing}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold transition shadow flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>{isActing ? 'Sending...' : 'Add Friend'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : searchQuery.trim() ? (
              <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                No users found matching &quot;{searchQuery}&quot;. Try another name or invite them!
              </div>
            ) : null}
          </div>

          {/* Shareable Invite Link Bar */}
          <div className="pt-2 border-t border-slate-800 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Personal Invitation Link
            </label>
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1.5">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="bg-transparent text-xs text-slate-300 font-mono flex-1 px-2 focus:outline-none truncate"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow cursor-pointer shrink-0"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
