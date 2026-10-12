import React, { useState } from 'react';
import {
  MessageSquare,
  Users,
  Smartphone,
  Search,
  Check,
  UserPlus,
  Trash2,
  Laptop,
  Radio,
  Clock,
  ShieldAlert,
  Pin,
  Archive,
  VolumeX,
  Hash,
  Sparkles
} from 'lucide-react';
import { ConversationSummary, FriendItem, DeviceSessionInfo } from '../hooks/useTalkFlow.ts';
import { LocaleKey, getT } from '../utils/i18n.ts';

export type ChatFilterCategory = 'all' | 'unread' | 'pinned' | 'channels' | 'groups' | 'direct' | 'archived';

interface SidebarProps {
  conversations: ConversationSummary[];
  activeConvId: string;
  onSelectConversation: (id: string) => void;
  friends: FriendItem[];
  pendingIncoming: any[];
  onAcceptFriend: (friendshipId: string) => void;
  sessions: DeviceSessionInfo[];
  onRevokeSession: (sessionId: string) => void;
  currentLanguage: LocaleKey;
  onOpenAddFriend: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConvId,
  onSelectConversation,
  friends,
  pendingIncoming,
  onAcceptFriend,
  sessions,
  onRevokeSession,
  currentLanguage,
  onOpenAddFriend,
}) => {
  const t = getT(currentLanguage);
  const [activeTab, setActiveTab] = useState<'chats' | 'friends' | 'sessions'>('chats');
  const [chatFilter, setChatFilter] = useState<ChatFilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pinnedConvIds, setPinnedConvIds] = useState<string[]>(['conv_global_hub']);
  const [archivedConvIds, setArchivedConvIds] = useState<string[]>([]);

  const togglePinConv = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedConvIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const toggleArchiveConv = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setArchivedConvIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const filteredConversations = conversations
    .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((c) => {
      const isArchived = archivedConvIds.includes(c.id);
      if (chatFilter === 'archived') return isArchived;
      if (isArchived) return false; // Hide archived from normal tabs

      if (chatFilter === 'unread') return (c.unreadCount || 0) > 0;
      if (chatFilter === 'pinned') return pinnedConvIds.includes(c.id);
      if (chatFilter === 'channels') return (c.type as string) === 'channel' || c.name.includes('Channel') || c.name.includes('📢');
      if (chatFilter === 'groups') return c.type === 'group';
      if (chatFilter === 'direct') return c.type === 'direct';
      return true; // 'all'
    })
    .sort((a, b) => {
      // Pinned chats appear first
      const aPinned = pinnedConvIds.includes(a.id) ? 1 : 0;
      const bPinned = pinnedConvIds.includes(b.id) ? 1 : 0;
      return bPinned - aPinned;
    });

  const filteredFriends = friends.filter(
    (f) =>
      f.user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const CHAT_FILTERS: Array<{ id: ChatFilterCategory; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: `Unread (${totalUnread})` },
    { id: 'pinned', label: 'Pinned' },
    { id: 'direct', label: 'Direct' },
    { id: 'groups', label: 'Groups' },
    { id: 'channels', label: 'Channels' },
    { id: 'archived', label: 'Archived' },
  ];

  return (
    <aside className="w-full md:w-80 lg:w-96 border-r border-slate-800 bg-slate-900/90 flex flex-col h-full shrink-0">
      {/* Search Input */}
      <div className="p-3 border-b border-slate-800 space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchChats')}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Chat Categories Filter Bar */}
        {activeTab === 'chats' && (
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            {CHAT_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setChatFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  chatFilter === f.id
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-800 px-3 pt-2 gap-1 bg-slate-900/50">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
            activeTab === 'chats'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{t('chats')}</span>
          {totalUnread > 0 && (
            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center">
              {totalUnread}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
            activeTab === 'friends'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{t('friends')}</span>
          {pendingIncoming.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center animate-pulse">
              {pendingIncoming.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
            activeTab === 'sessions'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>{t('sessions')}</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* TAB 1: CONVERSATIONS */}
        {activeTab === 'chats' && (
          <div className="space-y-1">
            {filteredConversations.map((conv) => {
              const isSelected = conv.id === activeConvId;
              return (
                <button
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className={`w-full p-3 rounded-xl flex items-center gap-3 text-left transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border border-indigo-500/40 shadow-sm'
                      : 'hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {conv.avatarUrl ? (
                      <img
                        src={conv.avatarUrl}
                        alt={conv.name}
                        className="w-11 h-11 rounded-full object-cover border border-slate-700"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-indigo-600/30 text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                        {conv.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    {conv.type === 'direct' && conv.members.some((m) => m.isOnline) && (
                      <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 absolute bottom-0 right-0"></span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        {pinnedConvIds.includes(conv.id) && (
                          <Pin className="w-3 h-3 text-indigo-400 fill-indigo-400/30 shrink-0" />
                        )}
                        <h4 className="text-xs font-semibold text-slate-100 truncate">{conv.name}</h4>
                      </div>
                      {conv.lastMessage && (
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[11px] text-slate-400 truncate">
                        {conv.lastMessage?.body || 'No messages yet'}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {conv.unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-indigo-600 text-white font-mono text-[10px] shrink-0 font-bold">
                            {conv.unreadCount}
                          </span>
                        )}
                        <span
                          onClick={(e) => togglePinConv(conv.id, e)}
                          title={pinnedConvIds.includes(conv.id) ? 'Unpin chat' : 'Pin chat'}
                          className={`p-1 rounded hover:bg-slate-700/80 cursor-pointer ${
                            pinnedConvIds.includes(conv.id) ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <Pin className="w-3 h-3" />
                        </span>
                        <span
                          onClick={(e) => toggleArchiveConv(conv.id, e)}
                          title={archivedConvIds.includes(conv.id) ? 'Unarchive chat' : 'Archive chat'}
                          className={`p-1 rounded hover:bg-slate-700/80 cursor-pointer ${
                            archivedConvIds.includes(conv.id) ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <Archive className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* TAB 2: FRIENDS */}
        {activeTab === 'friends' && (
          <div className="space-y-3 p-1">
            {/* Pending Requests Banner */}
            {pendingIncoming.length > 0 && (
              <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3 space-y-2">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                  Friend Requests Received
                </span>
                {pendingIncoming.map((req) => (
                  <div key={req.friendshipId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={req.from.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                      <div className="text-xs">
                        <div className="font-semibold text-white">{req.from.displayName}</div>
                        <div className="text-[10px] text-slate-400">@{req.from.username}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onAcceptFriend(req.friendshipId)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg shadow"
                    >
                      Accept
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={onOpenAddFriend}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white flex items-center justify-center gap-2 text-xs font-semibold transition-colors"
            >
              <UserPlus className="w-4 h-4 text-indigo-400" />
              <span>{t('addFriend')} / Scan QR</span>
            </button>

            {filteredFriends.map((f) => (
              <div
                key={f.friendshipId}
                className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={f.user.avatarUrl}
                      alt={f.user.displayName}
                      className="w-9 h-9 rounded-full object-cover border border-slate-700"
                    />
                    <span
                      className={`w-2.5 h-2.5 rounded-full border-2 border-slate-950 absolute bottom-0 right-0 ${
                        f.presence.isOnline ? 'bg-emerald-400' : 'bg-slate-600'
                      }`}
                    ></span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white leading-tight">{f.user.displayName}</h4>
                    <p className="text-[10px] text-slate-400">@{f.user.username} • {f.user.timezone}</p>
                    <span className="text-[10px] font-mono text-cyan-400">
                      {f.presence.isOnline ? t('online') : t('offline')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: DEVICES & MULTI-SESSION TRACKING */}
        {activeTab === 'sessions' && (
          <div className="space-y-3 p-1">
            <div className="p-3 bg-indigo-950/30 border border-indigo-800/50 rounded-xl text-xs text-indigo-200">
              <span className="font-semibold block mb-1">Multi-Device Synchronization</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Active sessions across mobile and desktop stay synchronized via WebSocket sequence reconciliation.
              </p>
            </div>

            {sessions.map((sess) => (
              <div
                key={sess.id}
                className={`p-3 rounded-xl border text-xs space-y-2 ${
                  sess.isCurrent
                    ? 'bg-slate-950 border-indigo-500/50 shadow-sm'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-indigo-400" />
                    <div>
                      <span className="font-semibold text-white block">{sess.deviceName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{sess.ipAddress}</span>
                    </div>
                  </div>

                  {sess.isCurrent ? (
                    <span className="text-[10px] bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full font-semibold">
                      {t('currentDevice')}
                    </span>
                  ) : (
                    <button
                      onClick={() => onRevokeSession(sess.id)}
                      className="text-rose-400 hover:text-rose-300 p-1.5 rounded hover:bg-rose-950/50 transition-colors"
                      title={t('remoteLogout')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                  <span>Last active: {new Date(sess.lastActiveAt).toLocaleTimeString()}</span>
                  <span className="font-mono text-emerald-400">Authenticated</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
