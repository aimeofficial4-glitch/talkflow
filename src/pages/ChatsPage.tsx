import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar.tsx';
import { ConversationView } from '../components/ConversationView.tsx';
import { CreatePollModal } from '../components/CreatePollModal.tsx';
import {
  ConversationSummary,
  ChatMessage,
  FriendItem,
  DeviceSessionInfo,
  UserProfile,
  PollItem,
} from '../hooks/useTalkFlow.ts';
import { LocaleKey } from '../utils/i18n.ts';
import { ArrowLeft, MessageSquare } from 'lucide-react';

interface ChatsPageProps {
  conversations: ConversationSummary[];
  activeConvId: string;
  onSelectConversation: (id: string) => void;
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
  friends: FriendItem[];
  pendingIncoming: any[];
  onAcceptFriend: (friendshipId: string) => void;
  sessions: DeviceSessionInfo[];
  onRevokeSession: (sessionId: string) => void;
  onOpenAddFriend: () => void;
  smartReplies?: string[];
  isLowAiMode?: boolean;
  onSendAttachment?: (type: 'image' | 'document' | 'audio') => void;
  onStartCall?: (peer: UserProfile, type: 'audio' | 'video') => void;
  onSendVoiceNote?: (durationSeconds: number, waveform: number[]) => void;
  polls?: PollItem[];
  onCreatePoll?: (question: string, options: string[]) => void;
  onVotePoll?: (pollId: string, optionId: string) => void;
  pinnedMessage?: ChatMessage | null;
  onPinMessage?: (messageId: string | null) => void;
}

export const ChatsPage: React.FC<ChatsPageProps> = ({
  conversations,
  activeConvId,
  onSelectConversation,
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
  friends,
  pendingIncoming,
  onAcceptFriend,
  sessions,
  onRevokeSession,
  onOpenAddFriend,
  smartReplies,
  isLowAiMode,
  onSendAttachment,
  onStartCall,
  onSendVoiceNote,
  polls = [],
  onCreatePoll,
  onVotePoll,
  pinnedMessage,
  onPinMessage,
}) => {
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);

  const activeConversation = conversations.find((c) => c.id === activeConvId);

  const handleSelectConv = (id: string) => {
    onSelectConversation(id);
    setMobileView('chat');
  };

  return (
    <div className="flex-1 flex overflow-hidden relative w-full h-full">
      {/* Sidebar List (Visible on desktop, or on mobile when mobileView === 'list') */}
      <div className={`h-full ${mobileView === 'chat' ? 'hidden md:flex' : 'flex w-full md:w-80 lg:w-96'} shrink-0`}>
        <Sidebar
          conversations={conversations}
          activeConvId={activeConvId}
          onSelectConversation={handleSelectConv}
          friends={friends}
          pendingIncoming={pendingIncoming}
          onAcceptFriend={onAcceptFriend}
          sessions={sessions}
          onRevokeSession={onRevokeSession}
          currentLanguage={currentLanguage}
          onOpenAddFriend={onOpenAddFriend}
        />
      </div>

      {/* Conversation Timeline (Visible on desktop, or on mobile when mobileView === 'chat') */}
      <div className={`flex-1 flex flex-col h-full ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
        {/* Mobile Back Button Bar */}
        <div className="md:hidden bg-slate-900 border-b border-slate-800 p-2 flex items-center gap-2">
          <button
            onClick={() => setMobileView('list')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 rounded-lg text-xs font-semibold text-slate-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Chats</span>
          </button>
          <span className="text-xs font-bold text-white truncate">{activeConversation?.name}</span>
        </div>

        <ConversationView
          conversation={activeConversation}
          messages={messages}
          currentUser={currentUser}
          onSendMessage={onSendMessage}
          onSendTyping={onSendTyping}
          onAddReaction={onAddReaction}
          onTranslateMessage={onTranslateMessage}
          typingUsers={typingUsers}
          currentLanguage={currentLanguage}
          isSimulatedOffline={isSimulatedOffline}
          outboxCount={outboxCount}
          smartReplies={smartReplies}
          isLowAiMode={isLowAiMode}
          onSendAttachment={onSendAttachment}
          onStartCall={onStartCall}
          onSendVoiceNote={onSendVoiceNote}
          polls={polls}
          onOpenCreatePoll={() => setIsPollModalOpen(true)}
          onVotePoll={onVotePoll}
          pinnedMessage={pinnedMessage}
          onPinMessage={onPinMessage}
        />
      </div>

      {/* Create Poll Modal */}
      {isPollModalOpen && onCreatePoll && (
        <CreatePollModal
          isOpen={isPollModalOpen}
          onClose={() => setIsPollModalOpen(false)}
          conversationId={activeConvId}
          onCreatePoll={onCreatePoll}
        />
      )}
    </div>
  );
};
