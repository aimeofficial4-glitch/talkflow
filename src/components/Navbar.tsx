import React, { useState } from 'react';
import {
  Layers,
  Wifi,
  WifiOff,
  Globe,
  Radio,
  UserCheck,
  UserPlus,
  Sliders,
  Smartphone,
  ChevronDown,
  Info,
  MessageSquare,
  Users,
  KeyRound,
  Phone,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { LOCALES, LocaleKey, getT } from '../utils/i18n.ts';
import { UserProfile } from '../hooks/useTalkFlow.ts';

export type AppViewPage =
  | 'chats'
  | 'calls'
  | 'stories'
  | 'channels'
  | 'friends'
  | 'sessions'
  | 'auth'
  | 'settings'
  | 'architecture'
  | 'admin';

interface NavbarProps {
  currentUser: UserProfile | null;
  socketStatus: 'connected' | 'connecting' | 'reconnecting' | 'offline';
  isSimulatedOffline: boolean;
  onToggleOffline: () => void;
  onSwitchUser: (userId: string) => void;
  onSelectLanguage: (lang: LocaleKey) => void;
  currentLanguage: LocaleKey;
  onOpenAddFriend: () => void;
  onOpenSettings: () => void;
  onOpenArchitecture: () => void;
  outboxCount: number;
  isLowAiMode: boolean;
  onToggleLowAiMode: () => void;
  activePage: AppViewPage;
  onChangePage: (page: AppViewPage) => void;
}

const DEMO_USERS = [
  { id: 'usr_mrhacher', name: 'Mr.hacher', role: 'admin', country: '🇷🇼 Rwanda (East Africa)', lang: 'en', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' },
  { id: 'usr_alex', name: 'Alex Rivera', role: 'admin', country: '🇺🇸 United States', lang: 'en', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { id: 'usr_amina', name: 'Amina Osei', role: 'admin', country: '🇰🇪 Kenya (East Africa)', lang: 'sw', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80' },
  { id: 'usr_jeanpaul', name: 'Jean-Paul Habimana', role: 'user', country: '🇷🇼 Rwanda (East Africa)', lang: 'en', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { id: 'usr_neema', name: 'Neema Mwangi', role: 'user', country: '🇹🇿 Tanzania (East Africa)', lang: 'sw', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
  { id: 'usr_david_ug', name: 'David Mukasa', role: 'user', country: '🇺🇬 Uganda (East Africa)', lang: 'en', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: 'usr_maya', name: 'Maya Chen (マヤ)', role: 'user', country: '🇯🇵 Japan', lang: 'ja', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { id: 'usr_omar', name: 'عمر المنصور (Omar)', role: 'user', country: '🇪🇬 Egypt (RTL)', lang: 'ar', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: 'usr_elena', name: 'Elena Ramos', role: 'user', country: '🇪🇸 Spain', lang: 'es', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
  { id: 'usr_zhihao', name: '王志豪 (Zhihao Wang)', role: 'user', country: '🇨🇳 China', lang: 'zh', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80' },
  { id: 'usr_priya', name: 'प्रिया शर्मा (Priya Sharma)', role: 'user', country: '🇮🇳 India', lang: 'hi', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
  { id: 'usr_fatima', name: 'فاطمه شیرازی (Fatima)', role: 'user', country: '🇮🇷 Iran (RTL)', lang: 'fa', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
  { id: 'usr_lucas', name: 'Lucas Silva', role: 'user', country: '🇧🇷 Brazil', lang: 'pt', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
  { id: 'usr_minjun', name: '김민준 (Min-jun Kim)', role: 'user', country: '🇰🇷 South Korea', lang: 'ko', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: 'usr_tariq', name: 'طارق میر (Tariq Mir)', role: 'user', country: '🇵🇰 Pakistan (RTL)', lang: 'ur', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  socketStatus,
  isSimulatedOffline,
  onToggleOffline,
  onSwitchUser,
  onSelectLanguage,
  currentLanguage,
  onOpenAddFriend,
  onOpenSettings,
  onOpenArchitecture,
  outboxCount,
  isLowAiMode,
  onToggleLowAiMode,
  activePage,
  onChangePage,
}) => {
  const t = getT(currentLanguage);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const NAV_ITEMS: Array<{ id: AppViewPage; label: string; icon: React.FC<{ className?: string }>; highlight?: boolean }> = [
    { id: 'chats', label: t('chats') || 'Chats', icon: MessageSquare },
    { id: 'calls', label: 'Calls', icon: Phone },
    { id: 'stories', label: 'Stories', icon: Sparkles },
    { id: 'channels', label: 'Channels', icon: Radio },
    { id: 'friends', label: t('friends') || 'Friends', icon: Users },
    { id: 'admin', label: 'Admin Portal', icon: ShieldCheck, highlight: true },
    { id: 'sessions', label: 'Devices', icon: Smartphone },
    { id: 'auth', label: 'Auth & Personas', icon: KeyRound },
    { id: 'settings', label: t('settings') || 'Settings', icon: Sliders },
    { id: 'architecture', label: 'Console', icon: Layers },
  ];

  return (
    <div className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-md sticky top-0 z-40">
      <header className="px-4 md:px-6 py-2.5 flex items-center justify-between">
        {/* Brand & Connection Status */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => onChangePage('chats')}
            className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0 cursor-pointer"
          >
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                onClick={() => onChangePage('chats')}
                className="font-bold text-base text-white tracking-tight cursor-pointer hover:text-indigo-300 transition-colors"
              >
                TalkFlow
              </span>
              {/* Status Pill */}
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                  socketStatus === 'connected' && !isSimulatedOffline
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : socketStatus === 'reconnecting'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                {socketStatus === 'connected' && !isSimulatedOffline ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="hidden sm:inline">{t('connected')} (WSS)</span>
                  </>
                ) : socketStatus === 'reconnecting' ? (
                  <>
                    <Radio className="w-3 h-3 animate-spin text-amber-400" />
                    <span className="hidden sm:inline">{t('reconnecting')}</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-rose-400" />
                    <span className="hidden sm:inline">{t('offline')}</span>
                  </>
                )}
              </div>

              {outboxCount > 0 && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono">
                  {outboxCount} Outbox
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {t('appSubtitle')}
            </p>
          </div>
        </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Low AI Mode Toggle Button */}
        <button
          onClick={onToggleLowAiMode}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            isLowAiMode
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
              : 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30'
          }`}
          title={
            isLowAiMode
              ? 'Low AI Mode Active: Minimal token usage, lightweight neural translation & battery/data saver'
              : 'Standard AI Mode Active: Gemini-powered contextual neural translations'
          }
        >
          <span className="text-xs">⚡</span>
          <span className="font-semibold">{isLowAiMode ? 'Low AI' : 'Gemini AI'}</span>
        </button>

        {/* Offline Simulator Button */}
        <button
          onClick={onToggleOffline}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            isSimulatedOffline
              ? 'bg-rose-600/20 text-rose-300 border-rose-500/40 hover:bg-rose-600/30'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
          title="Simulate losing network connection to test offline queue and sequence catch-up upon reconnecting"
        >
          {isSimulatedOffline ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden md:inline">{t('goOnline')}</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">{t('simOffline')}</span>
            </>
          )}
        </button>

        {/* Switch Persona Dropdown (Test 2-way chat) */}
        <div className="relative">
          <button
            onClick={() => {
              setUserDropdownOpen(!userDropdownOpen);
              setLangDropdownOpen(false);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200"
          >
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt="Avatar" className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span className="max-w-[90px] truncate hidden md:inline font-semibold">{currentUser?.displayName}</span>
            {currentUser?.role === 'admin' && (
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono font-bold shrink-0">
                ADMIN
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
              <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Switch Active Persona</span>
                <span className="text-[9px] font-mono text-emerald-400">14 Personas</span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {DEMO_USERS.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUser(u.id);
                        setUserDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors ${
                        isCurrent ? 'bg-indigo-600/20 text-indigo-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                        <div className="min-w-0">
                          <div className="leading-tight truncate flex items-center gap-1">
                            <span className="truncate">{u.name}</span>
                            {u.role === 'admin' && (
                              <span className="text-[8px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1 rounded font-mono font-bold shrink-0">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">{u.country}</div>
                        </div>
                      </div>
                      {isCurrent && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Language Selector Dropdown (RTL Support) */}
        <div className="relative">
          <button
            onClick={() => {
              setLangDropdownOpen(!langDropdownOpen);
              setUserDropdownOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200"
            title="Change interface language (supports Arabic RTL layout)"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono">{LOCALES[currentLanguage]?.flag}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {langDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 max-h-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 flex flex-col">
              <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>{t('allLanguagesTitle') || 'All Country Languages'}</span>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded font-mono">
                  {Object.keys(LOCALES).length}
                </span>
              </div>
              <div className="overflow-y-auto max-h-80 py-1">
                {(Object.keys(LOCALES) as LocaleKey[]).map((code) => {
                  const item = LOCALES[code];
                  const isSelected = currentLanguage === code;
                  return (
                    <button
                      key={code}
                      onClick={() => {
                        onSelectLanguage(code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors ${
                        isSelected ? 'bg-indigo-600/20 text-indigo-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{item.flag}</span>
                        <div>
                          <div className="leading-tight font-medium text-white">{item.nativeLabel}</div>
                          <div className="text-[10px] text-slate-400">{item.label} • {item.region}</div>
                        </div>
                      </div>
                      {item.dir === 'rtl' && (
                        <span className="text-[10px] text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800 font-mono font-bold">
                          RTL
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Add Friend Button */}
        <button
          onClick={onOpenAddFriend}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('addFriend')}</span>
        </button>

        {/* Architecture Inspector */}
        <button
          onClick={onOpenArchitecture}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Inspect System Architecture, Postgres DDL & Redis Config"
        >
          <Info className="w-4 h-4" />
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title={t('settings')}
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    </header>

    {/* Primary System Navigation Bar (Page Switcher) */}
    <nav className="border-t border-slate-800/80 px-4 md:px-6 bg-slate-900/60 flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activePage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChangePage(item.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              isActive
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  </div>
);
};
