import React, { useState } from 'react';
import {
  Smartphone,
  Laptop,
  Trash2,
  ShieldCheck,
  Radio,
  Clock,
  Globe,
  Info,
  Layers,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Fingerprint,
  Shield
} from 'lucide-react';
import { DeviceSessionInfo, UserProfile } from '../hooks/useTalkFlow.ts';
import { LocaleKey, getT } from '../utils/i18n.ts';

interface SessionsPageProps {
  sessions: DeviceSessionInfo[];
  currentUser: UserProfile | null;
  onRevokeSession: (sessionId: string) => void;
  currentLanguage: LocaleKey;
}

export type SessionsTab = 'active' | 'history' | 'trusted';

interface LoginHistoryEntry {
  id: string;
  device: string;
  ip: string;
  location: string;
  timestamp: string;
  status: 'success' | '2fa_verified' | 'suspicious_blocked';
}

export const SessionsPage: React.FC<SessionsPageProps> = ({
  sessions,
  currentUser,
  onRevokeSession,
  currentLanguage,
}) => {
  const t = getT(currentLanguage);
  const [activeTab, setActiveTab] = useState<SessionsTab>('active');
  const [selectedDeviceInfo, setSelectedDeviceInfo] = useState<DeviceSessionInfo | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLogoutAllOther = () => {
    if (!confirm('Logout all other sessions? Only your current device will remain logged in.')) return;
    const others = sessions.filter((s) => !s.isCurrent);
    others.forEach((s) => onRevokeSession(s.id));
    showToast(`Logged out ${others.length} other device sessions. WebSocket control frames dispatched.`);
  };

  const LOGIN_HISTORY: LoginHistoryEntry[] = [
    {
      id: 'lh_1',
      device: 'Chrome 124 / macOS (Sonoma)',
      ip: '197.237.140.22',
      location: 'Nairobi, Kenya',
      timestamp: 'Today at 10:14 AM',
      status: 'success',
    },
    {
      id: 'lh_2',
      device: 'TalkFlow iOS Mobile App / iPhone 15',
      ip: '197.237.140.22',
      location: 'Nairobi, Kenya',
      timestamp: 'Yesterday at 8:30 PM',
      status: '2fa_verified',
    },
    {
      id: 'lh_3',
      device: 'Firefox 125 / Windows 11',
      ip: '196.12.14.88',
      location: 'Kigali, Rwanda',
      timestamp: 'Sep 26, 2026, 3:12 PM',
      status: 'success',
    },
    {
      id: 'lh_4',
      device: 'Unknown Browser / Linux x86_64',
      ip: '185.220.101.5',
      location: 'Frankfurt, Germany (Tor Exit)',
      timestamp: 'Sep 25, 2026, 1:04 AM',
      status: 'suspicious_blocked',
    },
  ];

  const currentDevice = sessions.find((s) => s.isCurrent) || sessions[0];
  const otherDevices = sessions.filter((s) => !s.isCurrent);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="p-3 bg-emerald-950 border border-emerald-500 text-emerald-200 text-xs font-bold rounded-xl shadow-lg flex items-center justify-between">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
              <Smartphone className="w-6 h-6 text-indigo-400" />
              <span>Multi-Device Sessions &amp; Security</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              TalkFlow allows simultaneous real-time messaging across web, mobile, and desktop with sequence-based synchronization.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {otherDevices.length > 0 && (
              <button
                onClick={handleLogoutAllOther}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout All Other Devices</span>
              </button>
            )}

            <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{sessions.length} Active Sessions</span>
            </span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800 text-xs font-semibold w-fit">
          {[
            { id: 'active', label: `Active Sessions (${sessions.length})` },
            { id: 'history', label: `Login History (${LOGIN_HISTORY.length})` },
            { id: 'trusted', label: 'Trusted Devices & Passkeys' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: ACTIVE SESSIONS */}
        {activeTab === 'active' && (
          <div className="space-y-6">
            {/* Concept Banner */}
            <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-800/40 rounded-2xl p-5 shadow-lg space-y-2">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <span>Cryptographic Session Isolation &amp; Remote Revocation</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every connected device maintains an independent cryptographic refresh token hash stored in PostgreSQL table <code className="text-indigo-300 font-mono">app.devices</code>.
                When you click "Revoke", TalkFlow immediately dispatches a <code className="text-cyan-300 font-mono">session_revoked</code> control frame through the WebSocket gateway, terminating socket connectivity instantly.
              </p>
            </div>

            {/* Current Device Highlight */}
            {currentDevice && (
              <div className="p-5 rounded-2xl border bg-indigo-950/20 border-indigo-500/50 shadow-lg shadow-indigo-950/20 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-indigo-600 text-white">
                      {currentDevice.deviceType === 'desktop' ? <Laptop className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white">{currentDevice.deviceName}</h4>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full font-bold">
                          THIS DEVICE (CURRENT)
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 block mt-0.5">{currentDevice.userAgent}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedDeviceInfo(currentDevice)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Info className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Device Info</span>
                  </button>
                </div>

                <div className="pt-3 border-t border-indigo-900/40 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400 font-mono">
                  <div><span className="text-slate-500 block text-[10px]">IP ADDRESS</span><span className="text-slate-200">{currentDevice.ipAddress}</span></div>
                  <div><span className="text-slate-500 block text-[10px]">STATUS</span><span className="text-emerald-400 font-bold">Online &bull; WSS Connected</span></div>
                  <div><span className="text-slate-500 block text-[10px]">AUTH SESSION ID</span><span className="text-slate-300 truncate">{currentDevice.id.slice(0, 10)}...</span></div>
                  <div><span className="text-slate-500 block text-[10px]">LAST ACTIVE</span><span className="text-slate-300">{new Date(currentDevice.lastActiveAt).toLocaleTimeString()}</span></div>
                </div>
              </div>
            )}

            {/* Other Devices */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">
                Other Connected Devices ({otherDevices.length})
              </h3>

              {otherDevices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {otherDevices.map((sess) => (
                    <div
                      key={sess.id}
                      className="p-5 rounded-2xl border bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-slate-800 text-slate-300">
                            {sess.deviceType === 'desktop' ? <Laptop className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white">{sess.deviceName}</h4>
                            <span className="text-xs text-slate-400 block mt-0.5">{sess.userAgent}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedDeviceInfo(sess)}
                            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                            title="Inspect Device"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              onRevokeSession(sess.id);
                              showToast(`Revoked session for ${sess.deviceName}`);
                            }}
                            className="px-2.5 py-1.5 bg-rose-600/15 hover:bg-rose-600/25 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Revoke</span>
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
                        <div><span className="text-slate-500 block text-[10px]">IP:</span><span>{sess.ipAddress}</span></div>
                        <div><span className="text-slate-500 block text-[10px]">LAST ACTIVE:</span><span>{new Date(sess.lastActiveAt).toLocaleString()}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-slate-900/40 rounded-2xl border border-slate-800 text-center text-xs text-slate-500">
                  No other active device sessions. You are currently only logged in on this device.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: LOGIN HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Recent Login History &amp; Suspicious Activity Detection</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Every authentication attempt is hashed, timestamped, and analyzed against geographical IP heuristics.
              </p>
            </div>

            <div className="space-y-2">
              {LOGIN_HISTORY.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${entry.status === 'suspicious_blocked' ? 'bg-rose-950/80 text-rose-400' : 'bg-slate-900 text-slate-300'}`}>
                      {entry.status === 'suspicious_blocked' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <div>
                      <div className="font-bold text-white">{entry.device}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{entry.location} &bull; {entry.ip}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-[11px] self-end sm:self-auto">
                    <span className="text-slate-500">{entry.timestamp}</span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        entry.status === 'success'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : entry.status === '2fa_verified'
                          ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {entry.status === 'success' ? 'Password OK' : entry.status === '2fa_verified' ? '2FA Verified' : 'Blocked (Tor)'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: TRUSTED DEVICES & PASSKEYS */}
        {activeTab === 'trusted' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-emerald-400" />
                <span>Trusted Devices &amp; FIDO2 / WebAuthn Passkeys</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Trusted hardware devices can bypass 2FA challenges using biometric TouchID, FaceID, or hardware security keys.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">Apple MacBook Pro (TouchID)</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    TRUSTED
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Enrolled via WebAuthn platform authenticator on Sep 20, 2026.</p>
                <div className="text-[10px] text-slate-500 font-mono">Key ID: cred_wauthn_99882201</div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">Google Pixel 8 (Biometric Passkey)</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    TRUSTED
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Hardware TPM 2.0 enclave passkey enrolled on Sep 24, 2026.</p>
                <div className="text-[10px] text-slate-500 font-mono">Key ID: cred_wauthn_77331102</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: DEVICE INFORMATION INSPECTOR */}
      {selectedDeviceInfo && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-indigo-400" />
                <span>Device Fingerprint &amp; Technical Telemetry</span>
              </h3>
              <button onClick={() => setSelectedDeviceInfo(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-2.5 bg-slate-950 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase">Device Name</span>
                <span className="text-slate-200 font-bold">{selectedDeviceInfo.deviceName}</span>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase">Client User-Agent</span>
                <span className="text-slate-300 text-[11px] break-all">{selectedDeviceInfo.userAgent}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-950 rounded-xl">
                  <span className="text-[10px] text-slate-500 block uppercase">Transport Security</span>
                  <span className="text-emerald-400 font-bold">TLS 1.3 / AES-256</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl">
                  <span className="text-[10px] text-slate-500 block uppercase">Device Fingerprint</span>
                  <span className="text-cyan-400 font-bold">SHA256:d8a9...41e</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-950 rounded-xl">
                  <span className="text-[10px] text-slate-500 block uppercase">IP Address</span>
                  <span className="text-slate-200">{selectedDeviceInfo.ipAddress}</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl">
                  <span className="text-[10px] text-slate-500 block uppercase">First Connected</span>
                  <span className="text-slate-200">{new Date(selectedDeviceInfo.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedDeviceInfo(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
