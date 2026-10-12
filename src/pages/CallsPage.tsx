import React, { useState } from 'react';
import {
  Phone,
  Video,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Search,
  Plus,
  Clock,
  ShieldCheck,
  UserCheck,
  Calendar,
  Sparkles
} from 'lucide-react';
import { UserProfile } from '../hooks/useTalkFlow.ts';
import { LOCALES, LocaleKey, getT } from '../utils/i18n.ts';

export interface CallLogItem {
  id: string;
  caller_id: string;
  recipient_id: string;
  type: 'audio' | 'video';
  status: 'completed' | 'missed' | 'declined';
  duration_seconds: number;
  created_at: string;
  isCaller: boolean;
  peer: UserProfile | null;
}

interface CallsPageProps {
  calls: CallLogItem[];
  friends: Array<{ friendshipId: string; user: UserProfile; presence: { isOnline: boolean } }>;
  currentUser: UserProfile | null;
  onStartCall: (peer: UserProfile, type: 'audio' | 'video') => void;
  currentLanguage: LocaleKey;
}

export const CallsPage: React.FC<CallsPageProps> = ({
  calls,
  friends,
  currentUser,
  onStartCall,
  currentLanguage,
}) => {
  const t = getT(currentLanguage);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'missed'>('all');
  const [isNewCallModalOpen, setIsNewCallModalOpen] = useState(false);

  const formatDuration = (seconds: number) => {
    if (seconds <= 0) return '0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const formatCallDate = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Today, ${timeStr}`;
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
  };

  const filteredCalls = calls
    .filter((c) => {
      if (filterType === 'missed') {
        return c.status === 'missed' || c.status === 'declined';
      }
      return true;
    })
    .filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.peer?.displayName.toLowerCase().includes(q) ||
        c.peer?.username.toLowerCase().includes(q)
      );
    });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Top Header */}
      <div className="p-4 md:p-6 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Phone className="w-5 h-5 text-indigo-400" />
              <span>Calls &amp; Voice Hub</span>
            </h1>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/80">
              WebRTC E2E
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Crystal-clear 1080p video &amp; Opus audio calling across 24 countries.
          </p>
        </div>

        <button
          onClick={() => setIsNewCallModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Call</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-4 md:px-6 py-3 border-b border-slate-800 bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search call logs..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Tab Filter */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-end sm:self-auto text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Calls ({calls.length})
          </button>
          <button
            onClick={() => setFilterType('missed')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              filterType === 'missed'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Missed ({calls.filter((c) => c.status === 'missed').length})
          </button>
        </div>
      </div>

      {/* Calls List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
        {filteredCalls.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
            <Phone className="w-12 h-12 text-slate-700" />
            <div className="text-sm font-semibold text-slate-400">No calls in log</div>
            <p className="text-xs max-w-sm">
              Start an instant video or voice call with any of your friends around the world!
            </p>
            <button
              onClick={() => setIsNewCallModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
            >
              Start First Call
            </button>
          </div>
        ) : (
          filteredCalls.map((c) => {
            const isMissed = c.status === 'missed' || c.status === 'declined';
            const flag = c.peer?.preferredLanguage ? LOCALES[c.peer.preferredLanguage]?.flag : '🌍';

            return (
              <div
                key={c.id}
                className="p-4 bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Peer Avatar */}
                  <div className="relative shrink-0">
                    <img
                      src={c.peer?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=peer'}
                      alt={c.peer?.displayName || 'User'}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-700"
                    />
                    <span className="absolute -bottom-1 -right-1 text-xs drop-shadow">{flag}</span>
                  </div>

                  {/* Info */}
                  <div className="min-w-0 space-y-0.5">
                    <h4 className="text-sm font-bold text-white truncate flex items-center gap-2">
                      <span>{c.peer?.displayName || 'TalkFlow Friend'}</span>
                      {c.type === 'video' ? (
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-800/60">
                          Video
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-800/60">
                          Voice
                        </span>
                      )}
                    </h4>

                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                      {isMissed ? (
                        <span className="flex items-center gap-1 text-rose-400 font-bold">
                          <PhoneMissed className="w-3.5 h-3.5" />
                          <span>Missed</span>
                        </span>
                      ) : c.isCaller ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <PhoneOutgoing className="w-3.5 h-3.5" />
                          <span>Outgoing ({formatDuration(c.duration_seconds)})</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-cyan-400">
                          <PhoneIncoming className="w-3.5 h-3.5" />
                          <span>Incoming ({formatDuration(c.duration_seconds)})</span>
                        </span>
                      )}

                      <span>•</span>
                      <span className="text-slate-500">{formatCallDate(c.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Direct Callback Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {c.peer && (
                    <>
                      <button
                        onClick={() => onStartCall(c.peer!, 'audio')}
                        className="p-2.5 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-xl border border-slate-700 hover:border-indigo-500 transition-all shadow-sm"
                        title="Voice Call"
                      >
                        <Phone className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onStartCall(c.peer!, 'video')}
                        className="p-2.5 bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white rounded-xl border border-slate-700 hover:border-cyan-500 transition-all shadow-sm"
                        title="Video Call"
                      >
                        <Video className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Start New Call Modal */}
      {isNewCallModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-indigo-400" />
                <span>Start New Call</span>
              </h3>
              <button
                onClick={() => setIsNewCallModalOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Choose a friend to launch an instant WebRTC voice or video call:
            </p>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {friends.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No friends added yet. Add friends via username search or invite link first!
                </div>
              ) : (
                friends.map((fr) => {
                  const flag = LOCALES[fr.user.preferredLanguage]?.flag || '🌍';
                  return (
                    <div
                      key={fr.friendshipId}
                      className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={fr.user.avatarUrl}
                            alt={fr.user.displayName}
                            className="w-10 h-10 rounded-full object-cover border border-slate-700"
                          />
                          <span className="absolute bottom-0 right-0 text-[10px]">{flag}</span>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{fr.user.displayName}</div>
                          <div className="text-[11px] text-slate-400">@{fr.user.username}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setIsNewCallModalOpen(false);
                            onStartCall(fr.user, 'audio');
                          }}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white transition-colors"
                          title="Voice Call"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setIsNewCallModalOpen(false);
                            onStartCall(fr.user, 'video');
                          }}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white transition-colors"
                          title="Video Call"
                        >
                          <Video className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
