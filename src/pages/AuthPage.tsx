import React, { useState } from 'react';
import {
  Lock,
  User,
  Mail,
  Globe,
  Clock,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Smartphone,
  LogOut,
  Sparkles,
  HelpCircle,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';
import { UserProfile } from '../hooks/useTalkFlow.ts';
import { LOCALES, LocaleKey, getT } from '../utils/i18n.ts';
import { EAST_AFRICAN_COUNTRIES, GLOBAL_COUNTRIES, CountryInfo } from '../utils/countries.ts';

interface AuthPageProps {
  currentUser: UserProfile | null;
  onSwitchUser: (userId: string) => void;
  onLogin: (identifier: string, pass: string) => Promise<{ success: boolean; message: string }>;
  onRegister: (formData: any) => Promise<{ success: boolean; message: string }>;
  onForgotPassword: (email: string) => Promise<{ success: boolean; message: string; resetToken?: string }>;
  onResetPassword: (token: string, newPass: string) => Promise<{ success: boolean; message: string }>;
  onLogout: () => void;
  currentLanguage: LocaleKey;
  onNavigateToChats: () => void;
}

const DEMO_PERSONAS = [
  // Administrator Personas
  { id: 'usr_mrhacher', name: 'Mr.hacher', role: 'admin', country: '🇷🇼 Rwanda (East Africa)', lang: 'en', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', tz: 'Africa/Kigali', username: 'Mr.hacher' },
  { id: 'usr_alex', name: 'Alex Rivera', role: 'admin', country: '🇺🇸 United States', lang: 'en', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', tz: 'America/Los_Angeles' },
  { id: 'usr_amina', name: 'Amina Osei', role: 'admin', country: '🇰🇪 Kenya (East Africa)', lang: 'sw', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80', tz: 'Africa/Nairobi' },

  // East African Community Personas
  { id: 'usr_jeanpaul', name: 'Jean-Paul Habimana', role: 'user', country: '🇷🇼 Rwanda (East Africa)', lang: 'en', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', tz: 'Africa/Kigali' },
  { id: 'usr_neema', name: 'Neema Mwangi', role: 'user', country: '🇹🇿 Tanzania (East Africa)', lang: 'sw', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', tz: 'Africa/Dar_es_Salaam' },
  { id: 'usr_david_ug', name: 'David Mukasa', role: 'user', country: '🇺🇬 Uganda (East Africa)', lang: 'en', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', tz: 'Africa/Kampala' },

  // International Global Personas
  { id: 'usr_maya', name: 'Maya Chen (マヤ)', role: 'user', country: '🇯🇵 Japan', lang: 'ja', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', tz: 'Asia/Tokyo' },
  { id: 'usr_omar', name: 'عمر المنصور (Omar)', role: 'user', country: '🇪🇬 Egypt (RTL)', lang: 'ar', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', tz: 'Africa/Cairo' },
  { id: 'usr_elena', name: 'Elena Ramos', role: 'user', country: '🇪🇸 Spain', lang: 'es', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', tz: 'Europe/Madrid' },
  { id: 'usr_zhihao', name: '王志豪 (Zhihao Wang)', role: 'user', country: '🇨🇳 China', lang: 'zh', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', tz: 'Asia/Shanghai' },
  { id: 'usr_priya', name: 'प्रिया शर्मा (Priya Sharma)', role: 'user', country: '🇮🇳 India', lang: 'hi', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', tz: 'Asia/Kolkata' },
  { id: 'usr_fatima', name: 'فاطمه شیرازی (Fatima)', role: 'user', country: '🇮🇷 Iran (RTL)', lang: 'fa', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', tz: 'Asia/Tehran' },
  { id: 'usr_lucas', name: 'Lucas Silva', role: 'user', country: '🇧🇷 Brazil', lang: 'pt', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', tz: 'America/Sao_Paulo' },
  { id: 'usr_minjun', name: '김민준 (Min-jun Kim)', role: 'user', country: '🇰🇷 South Korea', lang: 'ko', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', tz: 'Asia/Seoul' },
  { id: 'usr_tariq', name: 'طارق میر (Tariq Mir)', role: 'user', country: '🇵🇰 Pakistan (RTL)', lang: 'ur', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', tz: 'Asia/Karachi' },
];

export const AuthPage: React.FC<AuthPageProps> = ({
  currentUser,
  onSwitchUser,
  onLogin,
  onRegister,
  onForgotPassword,
  onResetPassword,
  onLogout,
  currentLanguage,
  onNavigateToChats,
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('Mr.hacher');
  const [loginPassword, setLoginPassword] = useState('1a2i3m4e');

  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'user' | 'admin'>('user');
  const [regCountry, setRegCountry] = useState('🇰🇪 Kenya');
  const [regLang, setRegLang] = useState<LocaleKey>('sw');
  const [regTz, setRegTz] = useState('Africa/Nairobi');
  const [regBio, setRegBio] = useState('');

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2>(1);

  // Status feedback
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCountrySelection = (countryLabel: string) => {
    setRegCountry(countryLabel);
    // Find matching country details to set sensible timezone & default language
    const all = [...EAST_AFRICAN_COUNTRIES, ...GLOBAL_COUNTRIES];
    const match = all.find((c) => countryLabel.includes(c.name) || countryLabel.includes(c.code));
    if (match) {
      setRegTz(match.defaultTimezone);
      if (match.defaultLanguage in LOCALES) {
        setRegLang(match.defaultLanguage as LocaleKey);
      }
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);
    const res = await onLogin(loginIdentifier.trim(), loginPassword);
    setIsSubmitting(false);
    if (res.success) {
      setStatusMessage({ type: 'success', text: 'Login successful! Redirecting to chats...' });
      setTimeout(() => onNavigateToChats(), 800);
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    const res = await onRegister({
      username: regUsername.trim(),
      email: regEmail.trim(),
      display_name: regDisplayName.trim(),
      password: regPassword,
      role: regRole,
      country: regCountry,
      preferred_language: regLang,
      timezone: regTz,
      bio: regBio.trim(),
    });

    setIsSubmitting(false);
    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: `Account created successfully with ${regRole.toUpperCase()} privileges! Redirecting...`,
      });
      setTimeout(() => onNavigateToChats(), 800);
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);
    const res = await onForgotPassword(forgotEmail.trim());
    setIsSubmitting(false);
    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: res.resetToken ? `Reset code generated: ${res.resetToken}` : res.message,
      });
      if (res.resetToken) setResetToken(res.resetToken);
      setResetStep(2);
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);
    const res = await onResetPassword(resetToken.trim(), newPassword);
    setIsSubmitting(false);
    if (res.success) {
      setStatusMessage({ type: 'success', text: 'Password reset! You can now log in.' });
      setTab('login');
      setResetStep(1);
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header & Logged In Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
              <KeyRound className="w-6 h-6 text-indigo-400" />
              <span>TalkFlow Accounts & Access</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Sign up with custom role (Admin or Member), select your country (including East Africa), or quick-switch personas.
            </p>
          </div>

          {currentUser ? (
            <div className="flex items-center gap-3 p-2 px-3 rounded-xl bg-slate-900 border border-slate-800 shadow">
              <img src={currentUser.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-indigo-500/40" />
              <div className="text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white block">{currentUser.displayName}</span>
                  {currentUser.role === 'admin' ? (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                      ADMIN
                    </span>
                  ) : (
                    <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">
                      MEMBER
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">
                  ● @{currentUser.username} • {currentUser.country || 'Global'}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="ml-2 px-2.5 py-1.5 rounded-lg bg-rose-600/15 hover:bg-rose-600/25 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-all"
                title="Log out of this session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <span className="text-xs px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono">
              Not Signed In
            </span>
          )}
        </div>

        {/* Main Grid: Auth Form on Left + Personas on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (Forms): 7 Columns */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
            {/* Form Mode Selector Tabs */}
            <div className="flex border-b border-slate-800 pb-2 gap-6">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setStatusMessage(null);
                }}
                className={`text-sm font-bold pb-2 border-b-2 transition-all flex items-center gap-2 ${
                  tab === 'login' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <KeyRound className="w-4 h-4 text-indigo-400" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setStatusMessage(null);
                }}
                className={`text-sm font-bold pb-2 border-b-2 transition-all flex items-center gap-2 ${
                  tab === 'register' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-4 h-4 text-indigo-400" />
                <span>Create Account</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('forgot');
                  setStatusMessage(null);
                }}
                className={`text-sm font-bold pb-2 border-b-2 transition-all flex items-center gap-2 ${
                  tab === 'forgot' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>Reset Password</span>
              </button>
            </div>

            {/* TAB 1: LOGIN */}
            {tab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Username or Email</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. alex or amina or your custom username"
                      required
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">Password</label>
                    <button
                      type="button"
                      onClick={() => setTab('forgot')}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter password (default: password123)"
                      required
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span>👑 Admin: username <code className="text-emerald-300 font-mono font-bold">Mr.hacher</code> • password <code className="text-indigo-300 font-mono font-bold">1a2i3m4e</code></span>
                  <span className="font-mono text-emerald-400 text-[10px]">SHA-256 Verified</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <span>{isSubmitting ? 'Authenticating...' : 'Sign In to TalkFlow'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* TAB 2: REGISTER / CREATE ACCOUNT */}
            {tab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {/* Account Role Selector Card */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Account Role & Permission Level
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRegRole('user')}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                        regRole === 'user'
                          ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500/50'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <User className={`w-5 h-5 shrink-0 mt-0.5 ${regRole === 'user' ? 'text-indigo-400' : 'text-slate-500'}`} />
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-1.5">
                          <span>Standard Member</span>
                          {regRole === 'user' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Direct chats, HD video calls, stories, polls, and channels.
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRole('admin')}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                        regRole === 'admin'
                          ? 'bg-emerald-600/20 border-emerald-500 ring-1 ring-emerald-500/50'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <ShieldCheck className={`w-5 h-5 shrink-0 mt-0.5 ${regRole === 'admin' ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-1.5">
                          <span>Administrator Role</span>
                          {regRole === 'admin' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Full admin access: manage users, promote roles, safety moderation & broadcasts.
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Username</label>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="e.g. kigali_lead or nairobi_dev"
                      required
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Full Display Name</label>
                    <input
                      type="text"
                      value={regDisplayName}
                      onChange={(e) => setRegDisplayName(e.target.value)}
                      placeholder="e.g. Samuel Mutua"
                      required
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="samuel@domain.com"
                      required
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Create a secure password"
                      required
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Country Selection (Featuring East Africa & Global) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Country / Region</span>
                    </label>
                    <span className="text-[10px] text-emerald-400 font-mono">11 East African Countries Included</span>
                  </div>
                  <select
                    value={regCountry}
                    onChange={(e) => handleCountrySelection(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <optgroup label="🌍 East African Community (EAC) & Greater East Africa">
                      {EAST_AFRICAN_COUNTRIES.map((c) => (
                        <option key={c.code} value={`${c.flag} ${c.name} (East Africa)`}>
                          {c.flag} {c.name} ({c.dialCode}) — East Africa
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🌐 Global Countries">
                      {GLOBAL_COUNTRIES.map((c) => (
                        <option key={c.code} value={`${c.flag} ${c.name}`}>
                          {c.flag} {c.name} ({c.dialCode})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Preferred Language</label>
                    <select
                      value={regLang}
                      onChange={(e) => setRegLang(e.target.value as LocaleKey)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                    >
                      {(Object.keys(LOCALES) as LocaleKey[]).map((code) => {
                        const l = LOCALES[code];
                        return (
                          <option key={code} value={code}>
                            {l.flag} {l.nativeLabel} ({l.label}) {l.dir === 'rtl' ? '— RTL' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Timezone</label>
                    <input
                      type="text"
                      value={regTz}
                      onChange={(e) => setRegTz(e.target.value)}
                      placeholder="e.g. Africa/Nairobi, Africa/Kigali"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Bio / Profile Description (Optional)</label>
                  <input
                    type="text"
                    value={regBio}
                    onChange={(e) => setRegBio(e.target.value)}
                    placeholder="e.g. Software engineer in Nairobi building distributed systems"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2 ${
                    regRole === 'admin'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                  }`}
                >
                  <span>
                    {isSubmitting
                      ? 'Provisioning Account...'
                      : `Create ${regRole === 'admin' ? 'Administrator' : 'Member'} Account & Start Chatting`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* TAB 3: FORGOT / RESET PASSWORD */}
            {tab === 'forgot' && (
              <div className="space-y-4">
                {resetStep === 1 ? (
                  <form onSubmit={handleForgotSubmit} className="space-y-4">
                    <p className="text-xs text-slate-400">
                      Enter the email address registered with your TalkFlow account. We will issue a 6-digit password reset token to authorize updating your password.
                    </p>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">Registered Email</label>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="e.g. alex@talkflow.io"
                        required
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                    >
                      {isSubmitting ? 'Requesting...' : 'Request Password Reset Token'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetSubmit} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">6-Digit Reset Token</label>
                      <input
                        type="text"
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        placeholder="Enter the 6-digit code"
                        required
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none font-mono tracking-widest text-center"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter your new secure password"
                        required
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                    >
                      {isSubmitting ? 'Updating...' : 'Set New Password & Log In'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Status Message */}
            {statusMessage && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                    : 'bg-rose-950/60 text-rose-300 border-rose-800/80'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <HelpCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}
          </div>

          {/* Right Column: 1-Click International & East African Personas: 5 Columns */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>1-Click Switch Persona</span>
              </h3>
              <span className="text-[11px] text-slate-500">14 personas (Admins & EAC)</span>
            </div>
            <p className="text-xs text-slate-400">
              Select any persona below to switch sessions immediately, test Admin console capabilities, East African multi-country chat, and monotonic sequence delivery:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 max-h-[560px] overflow-y-auto pr-1">
              {DEMO_PERSONAS.map((p) => {
                const isCurrent = currentUser?.id === p.id;
                const isPersonaAdmin = p.role === 'admin';
                const isEac = p.country.includes('East Africa');

                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSwitchUser(p.id);
                      setStatusMessage({ type: 'success', text: `Switched session to ${p.name} (${p.role.toUpperCase()})` });
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isCurrent
                        ? 'bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-950/40'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={p.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-white truncate flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {isPersonaAdmin && (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                          <span>{p.country}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      {isCurrent ? (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold font-mono">
                          Active
                        </span>
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 hover:text-slate-400" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
