import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Send,
  Heart,
  Smile,
  Flame,
  Sparkles,
  Clock
} from 'lucide-react';
import { UserProfile } from '../hooks/useTalkFlow.ts';
import { LOCALES } from '../utils/i18n.ts';

export interface StoryItem {
  id: string;
  user_id: string;
  media_url?: string;
  text?: string;
  background_gradient?: string;
  created_at: string;
  expires_at: string;
  hasViewed: boolean;
  viewers: string[];
}

export interface StoryGroup {
  user: UserProfile;
  isMe: boolean;
  allViewed: boolean;
  stories: StoryItem[];
}

interface StoryViewerModalProps {
  group: StoryGroup;
  currentUser: UserProfile | null;
  onClose: () => void;
  onNextGroup?: () => void;
  onPrevGroup?: () => void;
  onMarkViewed: (storyId: string) => void;
  onReply: (user: UserProfile, message: string) => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  group,
  currentUser,
  onClose,
  onNextGroup,
  onPrevGroup,
  onMarkViewed,
  onReply,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showQuickSent, setShowQuickSent] = useState(false);

  const currentStory = group.stories[currentIndex];

  // Mark story as viewed on mount or change
  useEffect(() => {
    if (currentStory && !group.isMe) {
      onMarkViewed(currentStory.id);
    }
  }, [currentStory?.id, group.isMe, onMarkViewed]);

  // Auto-advance progress timer (5 seconds per story)
  useEffect(() => {
    if (isPaused) return;

    const timer = setTimeout(() => {
      if (currentIndex < group.stories.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        if (onNextGroup) {
          onNextGroup();
        } else {
          onClose();
        }
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [currentIndex, group.stories.length, isPaused, onNextGroup, onClose]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else if (onPrevGroup) {
      onPrevGroup();
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < group.stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (onNextGroup) {
      onNextGroup();
    } else {
      onClose();
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onReply(group.user, `Replying to story: "${replyText.trim()}"`);
    setReplyText('');
    setShowQuickSent(true);
    setTimeout(() => setShowQuickSent(false), 2000);
  };

  const handleSendQuickEmoji = (emoji: string) => {
    onReply(group.user, `Reacted to story: ${emoji}`);
    setShowQuickSent(true);
    setTimeout(() => setShowQuickSent(false), 2000);
  };

  if (!currentStory) return null;

  const flag = LOCALES[group.user.preferredLanguage]?.flag || '🌍';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-0 md:p-4 select-none"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Story Stage Frame */}
      <div className="relative w-full md:max-w-md h-full md:h-[90vh] md:max-h-[800px] md:rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex flex-col justify-between">
        {/* Top Progress Bars (Segmented) */}
        <div className="absolute top-0 inset-x-0 p-3 pt-4 z-30 bg-gradient-to-b from-black/80 via-black/40 to-transparent space-y-3">
          <div className="flex items-center gap-1.5 w-full">
            {group.stories.map((st, idx) => (
              <div
                key={st.id}
                className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className={`h-full bg-white transition-all duration-linear ${
                    idx < currentIndex
                      ? 'w-full'
                      : idx === currentIndex
                      ? isPaused
                        ? 'w-1/2'
                        : 'w-full duration-[5000ms]'
                      : 'w-0'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* User Info Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={group.user.avatarUrl}
                alt={group.user.displayName}
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
              />
              <div>
                <div className="flex items-center gap-1.5 text-white font-bold text-xs">
                  <span>{group.user.displayName}</span>
                  <span>{flag}</span>
                </div>
                <div className="text-[10px] text-slate-300 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(currentStory.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Story Media / Content Body */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden">
          {currentStory.media_url ? (
            <div className="w-full h-full relative">
              <img
                src={currentStory.media_url}
                alt="Story"
                className="w-full h-full object-cover"
              />
              {currentStory.text && (
                <div className="absolute bottom-24 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-center">
                  <p className="text-white text-sm font-semibold drop-shadow-md leading-relaxed">
                    {currentStory.text}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${
                currentStory.background_gradient || 'from-indigo-900 to-purple-900'
              } flex items-center justify-center p-8 text-center`}
            >
              <p className="text-white text-xl md:text-2xl font-extrabold tracking-wide drop-shadow-lg leading-relaxed">
                {currentStory.text}
              </p>
            </div>
          )}

          {/* Touch navigation zones (Left 40% prev, Right 60% next) */}
          <div
            onClick={handlePrev}
            className="absolute top-16 bottom-20 left-0 w-1/3 cursor-pointer z-10"
          />
          <div
            onClick={handleNext}
            className="absolute top-16 bottom-20 right-0 w-2/3 cursor-pointer z-10"
          />
        </div>

        {/* Bottom Bar: Reply or Viewers indicator */}
        <div className="p-3 md:p-4 bg-gradient-to-t from-black via-black/80 to-transparent z-30 space-y-2">
          {group.isMe ? (
            <div className="flex items-center justify-between text-xs text-slate-300 py-1 px-3 bg-white/10 rounded-2xl backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold">{currentStory.viewers.length} views</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">24h Status Active</span>
            </div>
          ) : (
            <>
              {/* Quick Emojis */}
              <div className="flex items-center justify-center gap-4 py-1">
                {['❤️', '😂', '🔥', '👏', '😍', '🎉'].map((em) => (
                  <button
                    key={em}
                    onClick={() => handleSendQuickEmoji(em)}
                    className="text-xl hover:scale-125 transition-transform"
                  >
                    {em}
                  </button>
                ))}
              </div>

              {/* Reply Input */}
              <form onSubmit={handleSendReply} className="flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${group.user.displayName}...`}
                  className="flex-1 bg-white/15 border border-white/20 focus:border-white rounded-full px-4 py-2 text-xs text-white placeholder:text-white/60 focus:outline-none backdrop-blur-md"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="p-2 rounded-full bg-white text-slate-900 disabled:opacity-40 hover:bg-slate-200 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          )}

          {showQuickSent && (
            <div className="text-center text-xs font-bold text-emerald-400 animate-in fade-in">
              ✓ Reaction sent to chat!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
