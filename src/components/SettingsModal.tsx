import React, { useState } from 'react';
import { X, Sliders, Globe, Clock, User, Check, Laptop, Shield } from 'lucide-react';
import { UserProfile, DeviceSessionInfo } from '../hooks/useTalkFlow.ts';
import { LOCALES, LocaleKey, getT } from '../utils/i18n.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUpdateSettings: (newSettings: { preferred_language?: LocaleKey; timezone?: string; display_name?: string; bio?: string }) => Promise<void>;
  currentLanguage: LocaleKey;
  sessions: DeviceSessionInfo[];
  onRevokeSession: (sessionId: string) => void;
}

const COMMON_TIMEZONES = [
  'America/Los_Angeles',
  'America/New_York',
  'Europe/London',
  'Europe/Madrid',
  'Africa/Cairo',
  'Asia/Dubai',
  'Asia/Tokyo',
  'Australia/Sydney',
  'UTC',
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateSettings,
  currentLanguage,
  sessions,
  onRevokeSession,
}) => {
  const t = getT(currentLanguage);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [selectedLang, setSelectedLang] = useState<LocaleKey>(currentUser?.preferredLanguage || 'en');
  const [selectedTz, setSelectedTz] = useState(currentUser?.timezone || 'UTC');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSettings({
      display_name: displayName,
      bio,
      preferred_language: selectedLang,
      timezone: selectedTz,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{t('settings')}</h3>
            <p className="text-xs text-slate-400">Profile, localization, and multi-device sessions</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Profile Section */}
          <div className="space-y-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block">
              User Profile
            </span>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Bio / Status</label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Distributed systems enthusiast"
                className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Localization Section */}
          <div className="space-y-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block">
              Internationalization (i18n) & Timezone
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-slate-400" /> {t('language')}
                </label>
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value as LocaleKey)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {(Object.keys(LOCALES) as LocaleKey[]).map((code) => (
                    <option key={code} value={code}>
                      {LOCALES[code].flag} {LOCALES[code].label} ({LOCALES[code].nativeLabel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> {t('timezone')}
                </label>
                <select
                  value={selectedTz}
                  onChange={(e) => setSelectedTz(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : null}
              <span>{isSaved ? 'Settings Saved!' : 'Save Changes'}</span>
            </button>
            <span className="text-[11px] text-slate-500">Persisted across all active devices</span>
          </div>
        </form>

        {/* Sessions overview */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Active Devices ({sessions.length})
          </span>
          <div className="space-y-2 max-h-36 overflow-y-auto">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="font-semibold text-white block leading-tight">{sess.deviceName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{sess.ipAddress}</span>
                  </div>
                </div>
                {sess.isCurrent ? (
                  <span className="text-[10px] text-indigo-400 font-semibold">{t('currentDevice')}</span>
                ) : (
                  <button
                    onClick={() => onRevokeSession(sess.id)}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold px-2 py-0.5 rounded hover:bg-rose-950/40"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
