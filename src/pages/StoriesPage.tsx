import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Eye,
  Clock,
  CheckCircle2,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { UserProfile } from '../hooks/useTalkFlow.ts';
import { StoryGroup, StoryViewerModal } from '../components/StoryViewerModal.tsx';
import { CreateStoryModal } from '../components/CreateStoryModal.tsx';
import { LOCALES, LocaleKey, getT } from '../utils/i18n.ts';

interface StoriesPageProps {
  stories: StoryGroup[];
  currentUser: UserProfile | null;
  onPostStory: (data: { mediaUrl?: string; text?: string; backgroundGradient?: string }) => void;
  onMarkViewed: (storyId: string) => void;
  onReplyToStory: (user: UserProfile, message: string) => void;
  currentLanguage: LocaleKey;
}

export const StoriesPage: React.FC<StoriesPageProps> = ({
  stories,
  currentUser,
  onPostStory,
  onMarkViewed,
  onReplyToStory,
  currentLanguage,
}) => {
  const t = getT(currentLanguage);
  const [selectedGroup, setSelectedGroup] = useState<StoryGroup | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Separate my status vs others
  const myStoryGroup = stories.find((s) => s.isMe);
  const otherStories = stories.filter((s) => !s.isMe);

  const recentStories = otherStories.filter((s) => !s.allViewed);
  const viewedStories = otherStories.filter((s) => s.allViewed);

  const handleOpenViewer = (group: StoryGroup) => {
    setSelectedGroup(group);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Status &amp; Stories</span>
            </h1>
            <span className="text-[10px] font-mono text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-800/80">
              24h Ephemeral
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Share moments with friends across time zones. Stories disappear automatically after 24 hours.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Status</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-4xl">
        {/* My Status Card */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-3xl flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={currentUser?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                alt={currentUser?.displayName || 'User'}
                className={`w-14 h-14 rounded-full object-cover border-2 ${
                  myStoryGroup?.stories.length
                    ? 'border-purple-500 p-0.5'
                    : 'border-slate-700'
                }`}
              />
              <button
                onClick={() => setIsCreateOpen(true)}
                className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center text-xs font-bold shadow-md"
                title="Add new story"
              >
                +
              </button>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">My Status</h3>
              <p className="text-xs text-slate-400">
                {myStoryGroup?.stories.length
                  ? `${myStoryGroup.stories.length} active updates • Tap to view`
                  : 'Tap to add status update'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {myStoryGroup && myStoryGroup.stories.length > 0 && (
              <button
                onClick={() => handleOpenViewer(myStoryGroup)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                <span>View Mine</span>
              </button>
            )}

            <button
              onClick={() => setIsCreateOpen(true)}
              className="p-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition-colors"
              title="Add status"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Recent Updates (Unviewed - Glowing Rings) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 uppercase tracking-wider px-1">
            <span>Recent Updates ({recentStories.length})</span>
            <span className="text-[10px] text-emerald-400">Unviewed</span>
          </div>

          {recentStories.length === 0 ? (
            <div className="p-6 bg-slate-900/40 rounded-2xl border border-slate-800/60 text-center text-xs text-slate-500">
              No new unviewed stories from friends right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentStories.map((group) => {
                const flag = LOCALES[group.user.preferredLanguage]?.flag || '🌍';
                const latestStory = group.stories[group.stories.length - 1];

                return (
                  <div
                    key={group.user.id}
                    onClick={() => handleOpenViewer(group)}
                    className="p-3.5 bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/50 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all shadow-sm group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar with vibrant glowing ring */}
                      <div className="relative shrink-0">
                        <div className="w-13 h-13 rounded-full p-0.5 bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-400 shadow-md">
                          <img
                            src={group.user.avatarUrl}
                            alt={group.user.displayName}
                            className="w-12 h-12 rounded-full object-cover border-2 border-slate-900"
                          />
                        </div>
                        <span className="absolute -bottom-1 -right-1 text-xs drop-shadow">{flag}</span>
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                          {group.user.displayName}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {latestStory.text || 'Photo update'}
                        </p>
                        <div className="text-[10px] text-purple-400 font-mono">
                          {new Date(latestStory.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Viewed Updates */}
        {viewedStories.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider px-1">
              Viewed Updates ({viewedStories.length})
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {viewedStories.map((group) => {
                const flag = LOCALES[group.user.preferredLanguage]?.flag || '🌍';
                const latestStory = group.stories[group.stories.length - 1];

                return (
                  <div
                    key={group.user.id}
                    onClick={() => handleOpenViewer(group)}
                    className="p-3.5 bg-slate-950 hover:bg-slate-900 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all opacity-75 hover:opacity-100 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-full p-0.5 border-2 border-slate-700">
                          <img
                            src={group.user.avatarUrl}
                            alt={group.user.displayName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        </div>
                        <span className="absolute -bottom-1 -right-1 text-xs">{flag}</span>
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <h4 className="text-xs font-semibold text-slate-200 truncate">
                          {group.user.displayName}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">
                          {latestStory.text || 'Photo update'}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Floating Story Viewer Modal */}
      {selectedGroup && (
        <StoryViewerModal
          group={selectedGroup}
          currentUser={currentUser}
          onClose={() => setSelectedGroup(null)}
          onMarkViewed={onMarkViewed}
          onReply={onReplyToStory}
        />
      )}

      {/* Create Story Modal */}
      <CreateStoryModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        currentUser={currentUser}
        onCreateStory={onPostStory}
      />
    </div>
  );
};
