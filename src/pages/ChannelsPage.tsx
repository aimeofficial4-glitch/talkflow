import React, { useState } from 'react';
import {
  Radio,
  Users,
  CheckCircle2,
  Eye,
  Share2,
  Sparkles,
  Bell,
  BellOff,
  Search,
  ExternalLink,
  MessageSquare,
  Plus,
  BarChart3,
  Image as ImageIcon,
  Send,
  X,
  Vote,
  TrendingUp,
  Heart
} from 'lucide-react';
import { UserProfile } from '../hooks/useTalkFlow.ts';
import { LocaleKey, getT } from '../utils/i18n.ts';

export interface ChannelPost {
  id: string;
  body: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  views: number;
  reactions: Record<string, number>;
  created_at: string;
  commentsCount?: number;
  comments?: Array<{ id: string; user: string; avatar: string; text: string; time: string }>;
  poll?: {
    question: string;
    options: Array<{ text: string; votes: number }>;
    totalVotes: number;
    userVotedIndex?: number;
  };
}

export interface ChannelItem {
  id: string;
  title: string;
  handle: string;
  description: string;
  avatar_url: string;
  category: string;
  verified: boolean;
  subscribers: string[];
  isSubscribed: boolean;
  subscriberCount: number;
  isOwner?: boolean;
  posts: ChannelPost[];
}

interface ChannelsPageProps {
  channels: ChannelItem[];
  currentUser: UserProfile | null;
  onSubscribe: (channelId: string) => void;
  onReactPost: (channelId: string, postId: string, emoji: string) => void;
  currentLanguage: LocaleKey;
}

export const ChannelsPage: React.FC<ChannelsPageProps> = ({
  channels: initialChannels,
  currentUser,
  onSubscribe,
  onReactPost,
  currentLanguage,
}) => {
  const t = getT(currentLanguage);
  const [channels, setChannels] = useState<ChannelItem[]>(initialChannels);
  const [activeChannelId, setActiveChannelId] = useState<string>(
    initialChannels[0]?.id || 'chan_talkflow_official'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [tabFilter, setTabFilter] = useState<'discover' | 'subscribed' | 'my_channels'>('discover');

  // Modals & Panels
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isSubscribersOpen, setIsSubscribersOpen] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');

  // Create Channel form
  const [newChanTitle, setNewChanTitle] = useState('');
  const [newChanHandle, setNewChanHandle] = useState('');
  const [newChanDesc, setNewChanDesc] = useState('');
  const [newChanCategory, setNewChanCategory] = useState('Tech & Engineering');

  // Create Post form
  const [newPostBody, setNewPostBody] = useState('');
  const [newPostMedia, setNewPostMedia] = useState('');
  const [includePoll, setIncludePoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOpt1, setPollOpt1] = useState('');
  const [pollOpt2, setPollOpt2] = useState('');

  const activeChannel = channels.find((c) => c.id === activeChannelId) || channels[0];

  const filteredChannels = channels
    .filter((c) => {
      if (tabFilter === 'subscribed') return c.isSubscribed;
      if (tabFilter === 'my_channels') return c.isOwner || c.handle.includes('admin') || c.handle.includes(currentUser?.username || '');
      return true; // discover
    })
    .filter(
      (c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChanTitle.trim() || !newChanHandle.trim()) return;

    const newChan: ChannelItem = {
      id: 'chan_' + crypto.randomUUID().slice(0, 8),
      title: newChanTitle.trim(),
      handle: newChanHandle.trim().toLowerCase().replace('@', ''),
      description: newChanDesc.trim() || 'Official broadcast channel.',
      avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${newChanHandle}`,
      category: newChanCategory,
      verified: true,
      subscribers: [currentUser?.id || 'usr_alex'],
      isSubscribed: true,
      subscriberCount: 1,
      isOwner: true,
      posts: [
        {
          id: 'post_' + crypto.randomUUID().slice(0, 8),
          body: `🎉 Welcome to ${newChanTitle}! Stay tuned for announcements and broadcasts.`,
          views: 1,
          reactions: { '🚀': 1, '❤️': 1 },
          created_at: new Date().toISOString(),
        },
      ],
    };

    setChannels([newChan, ...channels]);
    setActiveChannelId(newChan.id);
    setIsCreateChannelOpen(false);
    setNewChanTitle('');
    setNewChanHandle('');
    setNewChanDesc('');
  };

  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostBody.trim() || !activeChannel) return;

    const newPost: ChannelPost = {
      id: 'post_' + crypto.randomUUID().slice(0, 8),
      body: newPostBody.trim(),
      media_url: newPostMedia.trim() || undefined,
      views: 1,
      reactions: { '👍': 1 },
      created_at: new Date().toISOString(),
      commentsCount: 0,
      comments: [],
      poll: includePoll && pollQuestion.trim()
        ? {
            question: pollQuestion.trim(),
            options: [
              { text: pollOpt1.trim() || 'Option A', votes: 0 },
              { text: pollOpt2.trim() || 'Option B', votes: 0 },
            ],
            totalVotes: 0,
          }
        : undefined,
    };

    setChannels(
      channels.map((ch) =>
        ch.id === activeChannel.id
          ? { ...ch, posts: [newPost, ...ch.posts] }
          : ch
      )
    );

    setIsCreatePostOpen(false);
    setNewPostBody('');
    setNewPostMedia('');
    setIncludePoll(false);
    setPollQuestion('');
    setPollOpt1('');
    setPollOpt2('');
  };

  const handleVotePoll = (channelId: string, postId: string, optionIndex: number) => {
    setChannels(
      channels.map((ch) => {
        if (ch.id !== channelId) return ch;
        return {
          ...ch,
          posts: ch.posts.map((p) => {
            if (p.id !== postId || !p.poll || p.poll.userVotedIndex !== undefined) return p;
            const updatedOptions = [...p.poll.options];
            updatedOptions[optionIndex].votes += 1;
            return {
              ...p,
              poll: {
                ...p.poll,
                options: updatedOptions,
                totalVotes: p.poll.totalVotes + 1,
                userVotedIndex: optionIndex,
              },
            };
          }),
        };
      })
    );
  };

  const handleAddComment = (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!commentInput.trim() || !activeChannel) return;

    const newComment = {
      id: 'cmt_' + Date.now(),
      user: currentUser?.displayName || 'User',
      avatar: currentUser?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user',
      text: commentInput.trim(),
      time: 'Just now',
    };

    setChannels(
      channels.map((ch) => {
        if (ch.id !== activeChannel.id) return ch;
        return {
          ...ch,
          posts: ch.posts.map((p) => {
            if (p.id !== postId) return p;
            const existingComments = p.comments || [];
            return {
              ...p,
              commentsCount: (p.commentsCount || 0) + 1,
              comments: [...existingComments, newComment],
            };
          }),
        };
      })
    );

    setCommentInput('');
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full bg-slate-950 overflow-hidden">
      {/* Sidebar: Channels Directory */}
      <div className="w-full md:w-80 border-r border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>Broadcast Channels</span>
            </h2>
            <button
              onClick={() => setIsCreateChannelOpen(true)}
              className="p-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1 transition-all"
              title="Create Channel"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search public channels..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 p-0.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-semibold">
            {[
              { id: 'discover', label: 'Discover' },
              { id: 'subscribed', label: 'Subscribed' },
              { id: 'my_channels', label: 'My Channels' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTabFilter(tab.id as any)}
                className={`flex-1 py-1 rounded-lg transition-all ${
                  tabFilter === tab.id
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredChannels.map((ch) => {
            const isSelected = ch.id === activeChannelId;
            return (
              <button
                key={ch.id}
                onClick={() => setActiveChannelId(ch.id)}
                className={`w-full p-3 rounded-2xl text-left flex items-center gap-3 transition-all ${
                  isSelected
                    ? 'bg-cyan-950/50 border border-cyan-800/80 text-white shadow-sm'
                    : 'hover:bg-slate-900 border border-transparent text-slate-300'
                }`}
              >
                <img
                  src={ch.avatar_url}
                  alt={ch.title}
                  className="w-11 h-11 rounded-xl object-cover border border-slate-700 shrink-0"
                />

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs truncate text-white">{ch.title}</span>
                    {ch.verified && (
                      <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0 fill-cyan-400/20" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">@{ch.handle}</div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-2">
                    <span>{ch.subscriberCount.toLocaleString()} members</span>
                    {ch.isSubscribed && (
                      <span className="text-emerald-400 font-semibold">• Subscribed</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Channel Broadcast Feed */}
      {activeChannel ? (
        <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
          {/* Channel Header */}
          <div className="p-4 md:px-6 py-4 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={activeChannel.avatar_url}
                alt={activeChannel.title}
                className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shadow-md shrink-0"
              />
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-bold text-white truncate">{activeChannel.title}</h1>
                  {activeChannel.verified && (
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate">
                  @{activeChannel.handle} •{' '}
                  <span
                    onClick={() => setIsSubscribersOpen(true)}
                    className="hover:underline cursor-pointer text-cyan-300 font-semibold"
                  >
                    {activeChannel.subscriberCount.toLocaleString()} subscribers
                  </span>{' '}
                  • {activeChannel.category}
                </p>
              </div>
            </div>

            {/* Actions: Broadcast, Analytics, Subscribe */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAnalyticsOpen(true)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Channel Analytics"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </button>

              <button
                onClick={() => setIsCreatePostOpen(true)}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Broadcast</span>
              </button>

              <button
                onClick={() => {
                  onSubscribe(activeChannel.id);
                  setChannels(
                    channels.map((c) =>
                      c.id === activeChannel.id
                        ? {
                            ...c,
                            isSubscribed: !c.isSubscribed,
                            subscriberCount: c.isSubscribed ? c.subscriberCount - 1 : c.subscriberCount + 1,
                          }
                        : c
                    )
                  );
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0 ${
                  activeChannel.isSubscribed
                    ? 'bg-slate-800 hover:bg-rose-950/50 text-slate-200 hover:text-rose-300 border border-slate-700 hover:border-rose-700/60'
                    : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-cyan-600/30'
                }`}
              >
                {activeChannel.isSubscribed ? (
                  <>
                    <BellOff className="w-3.5 h-3.5" />
                    <span>Subscribed</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5" />
                    <span>Subscribe</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Description banner */}
          <div className="px-6 py-2 bg-slate-900/60 border-b border-slate-800/60 text-xs text-slate-400">
            {activeChannel.description}
          </div>

          {/* Posts Feed */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-3xl mx-auto w-full">
            {activeChannel.posts.map((post) => (
              <div
                key={post.id}
                className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl space-y-3 p-5"
              >
                {/* Media if present */}
                {post.media_url && (
                  <div className="rounded-2xl overflow-hidden border border-slate-800 max-h-80 w-full">
                    <img
                      src={post.media_url}
                      alt="Broadcast Media"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Text Body */}
                <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {post.body}
                </p>

                {/* Interactive Poll in Channel */}
                {post.poll && (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                    <div className="font-bold text-xs text-white flex items-center gap-1.5">
                      <Vote className="w-4 h-4 text-cyan-400" />
                      <span>{post.poll.question}</span>
                    </div>

                    <div className="space-y-2">
                      {post.poll.options.map((opt, oIdx) => {
                        const pct = post.poll!.totalVotes > 0 ? Math.round((opt.votes / post.poll!.totalVotes) * 100) : 0;
                        const isVoted = post.poll!.userVotedIndex === oIdx;
                        return (
                          <div
                            key={oIdx}
                            onClick={() => handleVotePoll(activeChannel.id, post.id, oIdx)}
                            className={`p-2.5 rounded-xl border relative overflow-hidden cursor-pointer transition-all ${
                              isVoted ? 'border-cyan-500 bg-cyan-950/30' : 'border-slate-800 hover:border-slate-700 bg-slate-900'
                            }`}
                          >
                            <div
                              className="absolute top-0 bottom-0 left-0 bg-cyan-500/20 transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                            <div className="relative flex justify-between text-xs font-semibold">
                              <span className="text-slate-200">{opt.text}</span>
                              <span className="font-mono text-cyan-400">{pct}% ({opt.votes})</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Post Footer: Reactions, Views, Comments */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  {/* Reactions */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['❤️', '🚀', '🔥', '👍', '🎉'].map((emoji) => {
                      const count = post.reactions[emoji] || 0;
                      return (
                        <button
                          key={emoji}
                          onClick={() => onReactPost(activeChannel.id, post.id, emoji)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${
                            count > 0
                              ? 'bg-slate-800 border-slate-700 text-slate-200 hover:border-cyan-500'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>{emoji}</span>
                          {count > 0 && <span className="font-mono text-[11px]">{count}</span>}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-4 text-slate-500 text-[11px] font-mono">
                    <button
                      onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                      className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{post.commentsCount || 0} comments</span>
                    </button>

                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>{post.views.toLocaleString()}</span>
                    </span>

                    <span>
                      {new Date(post.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Comments Section Drawer */}
                {activeCommentPostId === post.id && (
                  <div className="pt-3 border-t border-slate-800/60 space-y-3 animate-in fade-in">
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {post.comments && post.comments.length > 0 ? (
                        post.comments.map((cmt) => (
                          <div key={cmt.id} className="p-2.5 bg-slate-950 rounded-xl flex items-start gap-2.5 text-xs">
                            <img src={cmt.avatar} alt="" className="w-6 h-6 rounded-full" />
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-white">{cmt.user}</span>
                                <span className="text-[10px] text-slate-500">{cmt.time}</span>
                              </div>
                              <p className="text-slate-300 mt-0.5">{cmt.text}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-[11px] text-slate-500 italic p-2 text-center">
                          No comments yet. Join the conversation!
                        </div>
                      )}
                    </div>

                    <form onSubmit={(e) => handleAddComment(e, post.id)} className="flex gap-2">
                      <input
                        type="text"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        placeholder="Leave a comment on this broadcast..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-500">
          Select a channel to view broadcasts.
        </div>
      )}

      {/* MODAL: CREATE CHANNEL */}
      {isCreateChannelOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateChannel} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-white">Create New Broadcast Channel</h3>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Channel Name</label>
              <input
                type="text"
                required
                value={newChanTitle}
                onChange={(e) => setNewChanTitle(e.target.value)}
                placeholder="e.g. TalkFlow Engineering"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Public Handle (@handle)</label>
              <input
                type="text"
                required
                value={newChanHandle}
                onChange={(e) => setNewChanHandle(e.target.value)}
                placeholder="talkflow_eng"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Category</label>
              <select
                value={newChanCategory}
                onChange={(e) => setNewChanCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Tech & Engineering">Tech &amp; Engineering</option>
                <option value="Global News">Global News</option>
                <option value="East Africa Hub">East Africa Hub</option>
                <option value="Education & Science">Education &amp; Science</option>
                <option value="Community">Community</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Description</label>
              <textarea
                rows={2}
                value={newChanDesc}
                onChange={(e) => setNewChanDesc(e.target.value)}
                placeholder="What is this channel about?"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateChannelOpen(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-xs font-bold text-white shadow"
              >
                Create Channel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CREATE BROADCAST POST */}
      {isCreatePostOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handlePublishPost} className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-white">Broadcast Post to @{activeChannel?.handle}</h3>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Post Content</label>
              <textarea
                rows={4}
                required
                value={newPostBody}
                onChange={(e) => setNewPostBody(e.target.value)}
                placeholder="Type your public broadcast message..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Media Attachment URL (Optional)</label>
              <input
                type="text"
                value={newPostMedia}
                onChange={(e) => setNewPostMedia(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            {/* Attach Interactive Poll */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Vote className="w-4 h-4 text-cyan-400" />
                  <span>Attach In-Channel Poll</span>
                </span>
                <input
                  type="checkbox"
                  checked={includePoll}
                  onChange={(e) => setIncludePoll(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700"
                />
              </div>

              {includePoll && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Poll Question (e.g. Which region next?)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={pollOpt1}
                      onChange={(e) => setPollOpt1(e.target.value)}
                      placeholder="Option 1"
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={pollOpt2}
                      onChange={(e) => setPollOpt2(e.target.value)}
                      placeholder="Option 2"
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatePostOpen(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow"
              >
                Broadcast Now
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CHANNEL ANALYTICS */}
      {isAnalyticsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-white">Analytics: {activeChannel?.title}</h3>
              </div>
              <button onClick={() => setIsAnalyticsOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-3 gap-3 font-mono text-center">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Subscribers</span>
                <span className="text-base font-bold text-white">{activeChannel?.subscriberCount.toLocaleString()}</span>
                <span className="text-[10px] text-emerald-400 block font-sans">+12.4% this week</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Total Views</span>
                <span className="text-base font-bold text-cyan-400">14.8K</span>
                <span className="text-[10px] text-slate-400 block font-sans">Avg 1.2K / post</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Engagement</span>
                <span className="text-base font-bold text-emerald-400">94.2%</span>
                <span className="text-[10px] text-slate-400 block font-sans">High retention</span>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <span className="font-bold text-white block">Top Audience Regions:</span>
              <div className="space-y-1 font-mono text-[11px] text-slate-300">
                <div className="flex justify-between"><span>🇰🇪 Kenya &amp; East Africa</span><span className="text-cyan-400 font-bold">42%</span></div>
                <div className="flex justify-between"><span>🇺🇸 North America</span><span className="text-cyan-400 font-bold">28%</span></div>
                <div className="flex justify-between"><span>🇯🇵 Japan &amp; East Asia</span><span className="text-cyan-400 font-bold">18%</span></div>
                <div className="flex justify-between"><span>🇪🇺 Europe</span><span className="text-cyan-400 font-bold">12%</span></div>
              </div>
            </div>

            <button
              onClick={() => setIsAnalyticsOpen(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
            >
              Close Analytics
            </button>
          </div>
        </div>
      )}

      {/* MODAL: SUBSCRIBERS */}
      {isSubscribersOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white">Channel Subscribers ({activeChannel?.subscriberCount})</h3>
              <button onClick={() => setIsSubscribersOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {['usr_alex', 'usr_amina', 'usr_jeanpaul', 'usr_neema', 'usr_maya', 'usr_omar'].map((id) => (
                <div key={id} className="p-2 bg-slate-950 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${id}`} alt="" className="w-7 h-7 rounded-full" />
                    <span className="text-slate-200 font-mono">@{id.replace('usr_', '')}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">Subscriber</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setIsSubscribersOpen(false)}
              className="w-full py-2 bg-slate-800 text-white font-bold text-xs rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
