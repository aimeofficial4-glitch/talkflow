import React, { useState } from 'react';
import {
  X,
  UserPlus,
  MessageSquare,
  Check,
  Clock,
  Globe,
  MapPin,
  Sparkles,
  Users,
  AlertCircle,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { UserProfile } from '../hooks/useTalkFlow.ts';
import { LocaleKey, LOCALES, getT } from '../utils/i18n.ts';

export interface UserLookupResult {
  user: UserProfile;
  isSelf?: boolean;
  relationship: 'friend' | 'outgoing_request' | 'incoming_request' | 'none';
  friendshipId?: string;
  mutualFriendsCount?: number;
  isOnline?: boolean;
}

interface UserProfilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: UserLookupResult | null;
  currentUser: UserProfile | null;
  onSendFriendRequest: (username: string) => Promise<{ success: boolean; message: string }>;
  onAcceptFriendRequest: (friendshipId: string) => Promise<void> | void;
  onDeclineFriendRequest: (friendshipId: string) => Promise<void> | void;
  onCancelFriendRequest: (friendshipId: string) => Promise<{ success: boolean; message: string }>;
  onStartChat: (userId: string) => void;
  currentLanguage: LocaleKey;
}

export const UserProfilePreviewModal: React.FC<UserProfilePreviewModalProps> = ({
  isOpen,
  onClose,
  data,
  currentUser,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onDeclineFriendRequest,
  onCancelFriendRequest,
  onStartChat,
  currentLanguage,
}) => {
  const t = getT(currentLanguage);

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [relationshipOverride, setRelationshipOverride] = useState<string | null>(null);

  if (!isOpen || !data) return null;

  const { user, isSelf, mutualFriendsCount = 0, isOnline } = data;
  const currentRel = relationshipOverride || data.relationship;
  const friendshipId = data.friendshipId;

  const flag = LOCALES[user.preferredLanguage]?.flag || '🌍';

  const handleAddFriend = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await onSendFriendRequest(user.username);
      setIsLoading(false);
      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        setRelationshipOverride('outgoing_request');
      } else {
        setFeedback({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setIsLoading(false);
      setFeedback({ type: 'error', text: err.message || 'Failed to send request' });
    }
  };

  const handleCancelRequest = async () => {
    if (!friendshipId) return;
    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await onCancelFriendRequest(friendshipId);
      setIsLoading(false);
      if (res.success) {
        setFeedback({ type: 'success', text: 'Friend request cancelled.' });
        setRelationshipOverride('none');
      } else {
        setFeedback({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setIsLoading(false);
      setFeedback({ type: 'error', text: err.message || 'Failed to cancel request' });
    }
  };

  const handleAccept = async () => {
    if (!friendshipId) return;
    setIsLoading(true);
    setFeedback(null);
    try {
      await onAcceptFriendRequest(friendshipId);
      setIsLoading(false);
      setFeedback({ type: 'success', text: `You are now friends with ${user.displayName}!` });
      setRelationshipOverride('friend');
    } catch (err: any) {
      setIsLoading(false);
      setFeedback({ type: 'error', text: err.message || 'Failed to accept request' });
    }
  };

  const handleDecline = async () => {
    if (!friendshipId) return;
    setIsLoading(true);
    setFeedback(null);
    try {
      await onDeclineFriendRequest(friendshipId);
      setIsLoading(false);
      setFeedback({ type: 'success', text: 'Friend request declined.' });
      setRelationshipOverride('none');
    } catch (err: any) {
      setIsLoading(false);
      setFeedback({ type: 'error', text: err.message || 'Failed to decline request' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm sm:max-w-md w-full overflow-hidden shadow-2xl flex flex-col relative">
        {/* Header Cover Banner */}
        <div className="h-24 bg-gradient-to-r from-indigo-900 via-indigo-700 to-cyan-700 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-950/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-0 space-y-4 -mt-10">
          {/* Avatar & Core Identity */}
          <div className="flex items-start justify-between">
            <div className="relative">
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-slate-900 shadow-xl bg-slate-800"
              />
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                  isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                }`}
                title={isOnline ? 'Online now' : 'Offline'}
              />
            </div>

            {/* Relationship Badge */}
            <div className="pt-10">
              {isSelf ? (
                <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 text-[11px] font-semibold border border-slate-700">
                  Your Profile
                </span>
              ) : currentRel === 'friend' ? (
                <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 inline-flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Friends
                </span>
              ) : currentRel === 'outgoing_request' ? (
                <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30 inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Request Pending
                </span>
              ) : currentRel === 'incoming_request' ? (
                <span className="px-2.5 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 text-[11px] font-bold border border-cyan-500/30">
                  Requested You
                </span>
              ) : null}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-bold text-white">{user.displayName}</h2>
              <span className="text-sm">{flag}</span>
              {user.role === 'admin' && (
                <span className="p-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" title="Administrator">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-cyan-400 font-semibold">@{user.username}</p>
          </div>

          {/* Bio */}
          {user.bio ? (
            <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800 leading-relaxed">
              {user.bio}
            </p>
          ) : (
            <p className="text-xs text-slate-500 italic">No bio provided.</p>
          )}

          {/* Quick Meta Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 uppercase block">Region</span>
                <span className="text-xs text-slate-200 truncate block">{user.country || 'Global'}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 uppercase block">Connections</span>
                <span className="text-xs text-indigo-300 font-semibold truncate block">
                  {mutualFriendsCount} Mutual
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 uppercase block">Language</span>
                <span className="text-xs text-slate-200 font-mono block">
                  {user.preferredLanguage?.toUpperCase() || 'EN'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 uppercase block">Timezone</span>
                <span className="text-xs text-slate-200 font-mono truncate block">
                  {user.timezone || 'UTC'}
                </span>
              </div>
            </div>
          </div>

          {/* Feedback message */}
          {feedback && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
                  : 'bg-rose-950/70 text-rose-300 border-rose-800'
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

          {/* Action Buttons depending on relationship */}
          <div className="pt-2">
            {isSelf ? (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
                This is your own profile. You cannot add yourself as a friend.
              </div>
            ) : currentRel === 'friend' ? (
              <button
                type="button"
                onClick={() => {
                  onStartChat(user.id);
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Start Direct Chat</span>
              </button>
            ) : currentRel === 'outgoing_request' ? (
              <div className="space-y-2">
                <div className="p-2.5 bg-amber-950/30 border border-amber-900/50 rounded-xl text-xs text-amber-300 text-center font-medium">
                  Friend request sent. Waiting for @{user.username} to accept.
                </div>
                <button
                  type="button"
                  onClick={handleCancelRequest}
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 font-semibold text-xs border border-slate-700 hover:border-rose-800 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{isLoading ? 'Cancelling...' : 'Cancel Friend Request'}</span>
                </button>
              </div>
            ) : currentRel === 'incoming_request' ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={isLoading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isLoading ? 'Accepting...' : 'Accept Request'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDecline}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 font-semibold text-xs border border-slate-700 hover:border-rose-800 transition cursor-pointer"
                >
                  Decline
                </button>
              </div>
            ) : (
              /* Requirement 5: Prominent "Add Friend" button after scanning / lookup */
              <button
                type="button"
                onClick={handleAddFriend}
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isLoading ? 'Sending Request...' : 'Add Friend'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
