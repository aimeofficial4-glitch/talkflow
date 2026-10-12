import React, { useState, useEffect } from 'react';
import { Navbar, AppViewPage } from './components/Navbar.tsx';
import { ChatsPage } from './pages/ChatsPage.tsx';
import { CallsPage } from './pages/CallsPage.tsx';
import { StoriesPage } from './pages/StoriesPage.tsx';
import { ChannelsPage } from './pages/ChannelsPage.tsx';
import { FriendsPage } from './pages/FriendsPage.tsx';
import { SessionsPage } from './pages/SessionsPage.tsx';
import { AuthPage } from './pages/AuthPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { ArchitecturePage } from './pages/ArchitecturePage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';
import { AddFriendModal } from './components/AddFriendModal.tsx';
import { QRScannerModal } from './components/QRScannerModal.tsx';
import { MyQRCodeModal } from './components/MyQRCodeModal.tsx';
import { UserProfilePreviewModal, UserLookupResult } from './components/UserProfilePreviewModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { SystemArchitectureModal } from './components/SystemArchitectureModal.tsx';
import { CallModal } from './components/CallModal.tsx';
import { IncomingCallToast } from './components/IncomingCallToast.tsx';
import { useTalkFlow } from './hooks/useTalkFlow.ts';
import { LOCALES, LocaleKey } from './utils/i18n.ts';

export default function App() {
  const {
    currentUser,
    accessToken,
    currentDeviceId,
    socketStatus,
    isSimulatedOffline,
    setIsSimulatedOffline,
    conversations,
    activeConvId,
    setActiveConvId,
    messages,
    friends,
    pendingIncoming,
    pendingOutgoing,
    sessions,
    typingUsers,
    outbox,
    isLowAiMode,
    setIsLowAiMode,
    smartReplies,
    sendMessage,
    sendTyping,
    addReaction,
    translateMessage,
    switchUser,
    revokeSession,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    searchUsers,
    lookupUser,
    sendAttachmentMessage,
    loginWithCredentials,
    registerUser,
    forgotPassword,
    resetPassword,
    logout,
    updateSettings,
    // Calling features
    activeCall,
    incomingCall,
    callHistory,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleCallMute,
    toggleCallCamera,
    toggleCallScreenShare,
    toggleCallMinimize,
    // Stories features
    stories,
    postStory,
    markStoryViewed,
    replyToStory,
    // Channels features
    channels,
    subscribeChannel,
    reactChannelPost,
    // Polls & Voice & Pin features
    polls,
    createPoll,
    votePoll,
    sendVoiceNote,
    pinnedMessage,
    pinMessage,
    // Admin features
    fetchAdminUsers,
    updateUserRole,
    toggleUserStatus,
    fetchAdminReports,
    resolveAdminReport,
    broadcastAdminMessage,
    fetchAdminMetrics,
  } = useTalkFlow();

  const [activePage, setActivePage] = useState<AppViewPage>('chats');
  const [currentLanguage, setCurrentLanguage] = useState<LocaleKey>('en');
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isMyQrOpen, setIsMyQrOpen] = useState(false);
  const [previewUserResult, setPreviewUserResult] = useState<UserLookupResult | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);

  // Sync preferred language from user profile
  useEffect(() => {
    if (currentUser?.preferredLanguage) {
      setCurrentLanguage(currentUser.preferredLanguage);
    }
  }, [currentUser?.preferredLanguage]);

  // Support shareable invitation link directly via URL pathname or search param
  useEffect(() => {
    const path = window.location.pathname;
    const search = new URLSearchParams(window.location.search);
    const inviteParam = search.get('invite');
    let inviteUsername = '';

    if (path.startsWith('/invite/')) {
      inviteUsername = path.replace('/invite/', '').trim();
    } else if (inviteParam) {
      inviteUsername = inviteParam.trim();
    }

    if (inviteUsername && lookupUser) {
      lookupUser(inviteUsername)
        .then((data) => {
          if (data && data.user) {
            setPreviewUserResult(data);
            setActivePage('friends');
          }
        })
        .catch((err) => {
          console.warn('Invite lookup error', err);
        });
    }
  }, [lookupUser]);

  // Check if current locale is RTL (e.g. Arabic, Persian, Urdu, Hebrew)
  const isRtl = LOCALES[currentLanguage]?.dir === 'rtl';

  const handleStartChatWithFriend = (friendId: string) => {
    const directConv = conversations.find(
      (c) => c.type === 'direct' && c.members.some((m) => m.user?.id === friendId)
    );
    if (directConv) {
      setActiveConvId(directConv.id);
    }
    setActivePage('chats');
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white ${
        isRtl ? 'font-arabic' : ''
      }`}
    >
      {/* Top Application Navbar with Page Tabs */}
      <Navbar
        currentUser={currentUser}
        socketStatus={socketStatus}
        isSimulatedOffline={isSimulatedOffline}
        onToggleOffline={() => setIsSimulatedOffline(!isSimulatedOffline)}
        onSwitchUser={switchUser}
        onSelectLanguage={setCurrentLanguage}
        currentLanguage={currentLanguage}
        onOpenAddFriend={() => setIsAddFriendOpen(true)}
        onOpenSettings={() => setActivePage('settings')}
        onOpenArchitecture={() => setActivePage('architecture')}
        outboxCount={outbox.length}
        isLowAiMode={isLowAiMode}
        onToggleLowAiMode={() => setIsLowAiMode(!isLowAiMode)}
        activePage={activePage}
        onChangePage={setActivePage}
      />

      {/* Main Page Body Router */}
      <main className="flex-1 flex overflow-hidden relative">
        {activePage === 'chats' && (
          <ChatsPage
            conversations={conversations}
            activeConvId={activeConvId}
            onSelectConversation={setActiveConvId}
            messages={messages}
            currentUser={currentUser}
            onSendMessage={sendMessage}
            onSendTyping={sendTyping}
            onAddReaction={addReaction}
            onTranslateMessage={translateMessage}
            typingUsers={typingUsers}
            currentLanguage={currentLanguage}
            isSimulatedOffline={isSimulatedOffline}
            outboxCount={outbox.length}
            friends={friends}
            pendingIncoming={pendingIncoming}
            onAcceptFriend={acceptFriendRequest}
            sessions={sessions}
            onRevokeSession={revokeSession}
            onOpenAddFriend={() => setIsAddFriendOpen(true)}
            smartReplies={smartReplies}
            isLowAiMode={isLowAiMode}
            onSendAttachment={sendAttachmentMessage}
            onStartCall={startCall}
            onSendVoiceNote={sendVoiceNote}
            polls={polls}
            onCreatePoll={createPoll}
            onVotePoll={votePoll}
            pinnedMessage={pinnedMessage}
            onPinMessage={pinMessage}
          />
        )}

        {activePage === 'calls' && (
          <CallsPage
            calls={callHistory}
            friends={friends}
            currentUser={currentUser}
            onStartCall={startCall}
            currentLanguage={currentLanguage}
          />
        )}

        {activePage === 'stories' && (
          <StoriesPage
            stories={stories}
            currentUser={currentUser}
            onPostStory={postStory}
            onMarkViewed={markStoryViewed}
            onReplyToStory={(user, replyMsg) => {
              replyToStory(user, replyMsg);
              setActivePage('chats');
            }}
            currentLanguage={currentLanguage}
          />
        )}

        {activePage === 'channels' && (
          <ChannelsPage
            channels={channels}
            currentUser={currentUser}
            onSubscribe={subscribeChannel}
            onReactPost={reactChannelPost}
            currentLanguage={currentLanguage}
          />
        )}

        {activePage === 'friends' && (
          <FriendsPage
            friends={friends}
            pendingIncoming={pendingIncoming}
            pendingOutgoing={pendingOutgoing}
            currentUser={currentUser}
            onAcceptFriend={acceptFriendRequest}
            onDeclineFriend={declineFriendRequest}
            onCancelFriend={cancelFriendRequest}
            onSendFriendRequest={sendFriendRequest}
            onSearchUsers={searchUsers}
            onLookupUser={lookupUser}
            onStartChatWithFriend={handleStartChatWithFriend}
            currentLanguage={currentLanguage}
          />
        )}

        {activePage === 'sessions' && (
          <SessionsPage
            sessions={sessions}
            currentUser={currentUser}
            onRevokeSession={revokeSession}
            currentLanguage={currentLanguage}
          />
        )}

        {activePage === 'auth' && (
          <AuthPage
            currentUser={currentUser}
            onSwitchUser={switchUser}
            onLogin={loginWithCredentials}
            onRegister={registerUser}
            onForgotPassword={forgotPassword}
            onResetPassword={resetPassword}
            onLogout={logout}
            currentLanguage={currentLanguage}
            onNavigateToChats={() => setActivePage('chats')}
          />
        )}

        {activePage === 'admin' && (
          <AdminPage
            currentUser={currentUser}
            onSwitchUser={switchUser}
            fetchAdminUsers={fetchAdminUsers}
            updateUserRole={updateUserRole}
            toggleUserStatus={toggleUserStatus}
            fetchAdminReports={fetchAdminReports}
            resolveAdminReport={resolveAdminReport}
            broadcastAdminMessage={broadcastAdminMessage}
            fetchAdminMetrics={fetchAdminMetrics}
            currentLanguage={currentLanguage}
            onNavigateToChats={() => setActivePage('chats')}
          />
        )}

        {activePage === 'settings' && (
          <SettingsPage
            currentUser={currentUser}
            currentLanguage={currentLanguage}
            onUpdateSettings={async (settings) => {
              await updateSettings(settings);
              if (settings.preferred_language) {
                setCurrentLanguage(settings.preferred_language);
              }
            }}
            sessions={sessions}
            onRevokeSession={revokeSession}
            isLowAiMode={isLowAiMode}
            onToggleLowAiMode={() => setIsLowAiMode(!isLowAiMode)}
            onNavigateToAdmin={() => setActivePage('admin')}
            accessToken={accessToken}
          />
        )}

        {activePage === 'architecture' && <ArchitecturePage />}
      </main>

      {/* Floating Modals */}
      <AddFriendModal
        isOpen={isAddFriendOpen}
        onClose={() => setIsAddFriendOpen(false)}
        currentUser={currentUser}
        onSendRequest={sendFriendRequest}
        onAcceptFriend={acceptFriendRequest}
        onDeclineFriend={declineFriendRequest}
        onCancelRequest={cancelFriendRequest}
        onSearchUsers={searchUsers}
        onStartChatWithFriend={handleStartChatWithFriend}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenMyQrCode={() => setIsMyQrOpen(true)}
        onSelectUserForPreview={(user, meta) => {
          setIsAddFriendOpen(false);
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

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={async (scannedText) => {
          setIsScannerOpen(false);
          try {
            const data = await lookupUser(scannedText);
            if (data && data.user) {
              setPreviewUserResult(data);
            }
          } catch (err) {
            console.warn('QR scan lookup error', err);
          }
        }}
        currentLanguage={currentLanguage}
      />

      <MyQRCodeModal
        isOpen={isMyQrOpen}
        onClose={() => setIsMyQrOpen(false)}
        currentUser={currentUser}
        currentLanguage={currentLanguage}
      />

      <UserProfilePreviewModal
        isOpen={Boolean(previewUserResult)}
        onClose={() => setPreviewUserResult(null)}
        data={previewUserResult}
        currentUser={currentUser}
        onSendFriendRequest={sendFriendRequest}
        onAcceptFriendRequest={acceptFriendRequest}
        onDeclineFriendRequest={declineFriendRequest}
        onCancelFriendRequest={cancelFriendRequest}
        onStartChat={handleStartChatWithFriend}
        currentLanguage={currentLanguage}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser}
        onUpdateSettings={async (settings) => {
          await updateSettings(settings);
          if (settings.preferred_language) {
            setCurrentLanguage(settings.preferred_language);
          }
        }}
        currentLanguage={currentLanguage}
        sessions={sessions}
        onRevokeSession={revokeSession}
      />

      <SystemArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />

      {/* Real-Time WebRTC Call Modal */}
      {activeCall && (
        <CallModal
          call={activeCall}
          currentUser={currentUser}
          onEndCall={endCall}
          onToggleMute={toggleCallMute}
          onToggleCamera={toggleCallCamera}
          onToggleScreenShare={toggleCallScreenShare}
          onToggleMinimize={toggleCallMinimize}
        />
      )}

      {/* Floating Incoming Call Alert Toast */}
      {incomingCall && (
        <IncomingCallToast
          incomingCall={incomingCall}
          onAccept={acceptCall}
          onDecline={declineCall}
        />
      )}

      {/* Global Application Footer with Official Brand Attribution */}
      <footer className="border-t border-slate-900 bg-slate-950/90 text-slate-500 text-[11px] px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 font-sans">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-300">TalkFlow</span>
          <span className="text-slate-600 hidden sm:inline">&bull;</span>
          <span className="italic text-slate-400">&ldquo;Distance shouldn&rsquo;t be the reason a friendship fades.&rdquo;</span>
        </div>
        <div className="flex items-center gap-3 text-slate-400 font-mono text-[10px]">
          <span>Created by <strong className="text-slate-200">GIHOZO Aime</strong></span>
          <span className="text-slate-600">&bull;</span>
          <span>Developed by <strong className="text-indigo-400">Aime IT Department</strong></span>
          <span className="text-slate-600">&bull;</span>
          <span>&copy; 2026 TalkFlow</span>
        </div>
      </footer>
    </div>
  );
}
