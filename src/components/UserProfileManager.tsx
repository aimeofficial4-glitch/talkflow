import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Clock,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Camera,
  Image as ImageIcon,
  Heart,
  MessageSquare,
  Trash2,
  Plus,
  Check,
  CheckCircle2,
  AlertTriangle,
  Download,
  Share2,
  ExternalLink,
  Sliders,
  History,
  Tag,
  KeyRound,
  FileText,
  UserX,
  RefreshCw,
  Copy
} from 'lucide-react';
import { CompleteUserProfile, PostMedia, calculateAge, calculateProfileCompleteness } from '../types/userProfile.ts';
import { LOCALES, LocaleKey } from '../utils/i18n.ts';
import { EAST_AFRICAN_COUNTRIES, GLOBAL_COUNTRIES } from '../utils/countries.ts';

interface UserProfileManagerProps {
  accessToken: string;
  currentUserId?: string;
  onProfileUpdated?: () => void;
}

export const UserProfileManager: React.FC<UserProfileManagerProps> = ({
  accessToken,
  currentUserId,
  onProfileUpdated,
}) => {
  const [profile, setProfile] = useState<CompleteUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newInterestInput, setNewInterestInput] = useState('');
  
  // Verification dialog states
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [isVerifyingId, setIsVerifyingId] = useState(false);
  const [verificationCode, setVerificationCode] = useState('123456');

  // New Post Dialog
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [newPostType, setNewPostType] = useState<'photo' | 'reel'>('photo');
  const [newPostUrl, setNewPostUrl] = useState('');
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostVisibility, setNewPostVisibility] = useState<'public' | 'friends'>('public');

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchProfile = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const res = await fetch('/api/v1/users/me/complete-profile', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      } else {
        showToast('error', 'Could not load complete profile.');
      }
    } catch (e) {
      showToast('error', 'Failed to connect to profile service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [accessToken]);

  const handleSaveProfile = async () => {
    if (!profile || !accessToken) return;
    setSaving(true);
    try {
      const res = await fetch('/api/v1/users/me/complete-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data.profile);
        showToast('success', 'Profile updated successfully across all categories!');
        if (onProfileUpdated) onProfileUpdated();
      } else {
        showToast('error', data.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Network error.');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyEmail = async () => {
    try {
      const res = await fetch('/api/v1/users/me/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ code: verificationCode }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', 'Email successfully verified with timestamp!');
        setIsVerifyingEmail(false);
        fetchProfile();
      } else {
        showToast('error', data.error || 'Verification failed.');
      }
    } catch (e) {
      showToast('error', 'Verification service error.');
    }
  };

  const handleVerifyPhone = async () => {
    try {
      const res = await fetch('/api/v1/users/me/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ code: verificationCode }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', 'Phone number successfully verified via SMS!');
        setIsVerifyingPhone(false);
        fetchProfile();
      } else {
        showToast('error', data.error || 'Verification failed.');
      }
    } catch (e) {
      showToast('error', 'Verification service error.');
    }
  };

  const handleVerifyNationalId = async () => {
    try {
      const res = await fetch('/api/v1/users/me/verify-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          national_id_number: profile?.national_id_number || 'ID-99882200',
          id_type: profile?.id_type || 'national_id',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', 'Government ID verified & encrypted under compliance standard.');
        setIsVerifyingId(false);
        fetchProfile();
      } else {
        showToast('error', data.error || 'ID verification failed.');
      }
    } catch (e) {
      showToast('error', 'Compliance verification error.');
    }
  };

  const handleExportData = async () => {
    try {
      const res = await fetch('/api/v1/users/me/request-export', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        // Trigger client download of GDPR JSON export package
        const blob = new Blob([JSON.stringify(data.export_package, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `talkflow-data-export-${profile?.username || 'user'}.json`;
        a.click();
        showToast('success', 'GDPR Data Export package downloaded!');
        fetchProfile();
      } else {
        showToast('error', data.error || 'Export failed.');
      }
    } catch (e) {
      showToast('error', 'Export request failed.');
    }
  };

  const handleRequestDeletion = async () => {
    if (!confirm('Are you sure you want to request permanent account deletion? This action follows legal compliance review.')) return;
    try {
      const res = await fetch('/api/v1/users/me/request-deletion', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', 'Permanent account deletion scheduled.');
        fetchProfile();
      } else {
        showToast('error', data.error || 'Could not schedule deletion.');
      }
    } catch (e) {
      showToast('error', 'Deletion request failed.');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostUrl.trim()) return;
    try {
      const res = await fetch('/api/v1/users/me/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          type: newPostType,
          media_url: newPostUrl.trim(),
          caption: newPostCaption.trim(),
          visibility: newPostVisibility,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', `${newPostType === 'reel' ? 'Reel' : 'Photo'} published to your profile!`);
        setIsCreatePostOpen(false);
        setNewPostUrl('');
        setNewPostCaption('');
        fetchProfile();
      } else {
        showToast('error', data.error || 'Failed to publish post.');
      }
    } catch (e) {
      showToast('error', 'Post publishing error.');
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const res = await fetch(`/api/v1/users/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        fetchProfile();
      }
    } catch (e) {}
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Delete this post?')) return;
    try {
      const res = await fetch(`/api/v1/users/me/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        showToast('success', 'Post removed.');
        fetchProfile();
      }
    } catch (e) {}
  };

  const addInterest = () => {
    if (!newInterestInput.trim() || !profile) return;
    const item = newInterestInput.trim();
    if (!profile.interests.includes(item)) {
      setProfile({ ...profile, interests: [...profile.interests, item] });
    }
    setNewInterestInput('');
  };

  const removeInterest = (item: string) => {
    if (!profile) return;
    setProfile({ ...profile, interests: profile.interests.filter((i) => i !== item) });
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-mono text-xs flex flex-col items-center gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
        <span>Loading 9-Category User Profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center text-rose-400 text-xs bg-rose-950/20 border border-rose-800 rounded-2xl">
        Failed to load complete user profile. Please ensure you are authenticated.
      </div>
    );
  }

  const age = calculateAge(profile.date_of_birth);
  const completeness = profile.profile_completeness_pct ?? calculateProfileCompleteness(profile);

  const CATEGORY_TABS = [
    { num: 1, label: '1. Core Identity', desc: 'Handles, DOB & Timezone' },
    { num: 2, label: '2. Contact & Verification', desc: '18+ Gates & ID' },
    { num: 3, label: '3. Personal & Discovery', desc: 'Occupation & Tags' },
    { num: 4, label: '4. Privacy Controls', desc: 'Audience Visibility' },
    { num: 5, label: '5. Customization', desc: 'Themes & Banner' },
    { num: 6, label: '6. Content (Reels/Photos)', desc: 'Posts & Media' },
    { num: 7, label: '7. System / Moderation', desc: 'Admin & Device Counts' },
    { num: 8, label: '8. Additional Fields', desc: 'GDPR Export & TOS' },
    { num: 9, label: '9. Commonly Missed', desc: 'Recovery & Block Queries' },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500 text-rose-200'
          }`}
        >
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Top Profile Summary Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {/* Banner header image */}
        <div
          className="h-28 w-full bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 relative"
          style={
            profile.profile_banner_url
              ? { backgroundImage: `url(${profile.profile_banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : undefined
          }
        >
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <span
              className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-bold border backdrop-blur-md ${
                profile.is_adult
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50'
                  : 'bg-amber-950/80 text-amber-300 border-amber-600/50'
              }`}
            >
              {profile.is_adult ? '🔞 Adult (18+ Verified)' : '👶 Minor (<18 Guardian Linked)'}
            </span>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-950/80 text-slate-300 border border-slate-700 backdrop-blur-md">
              Age: {age} yrs
            </span>
          </div>
        </div>

        {/* Profile Details Bar */}
        <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 -mt-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={profile.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=avatar'}
                alt={profile.display_name}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-slate-900 shadow-xl bg-slate-800"
              />
              <span
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px]"
                style={{ backgroundColor: profile.theme_color || '#6366f1' }}
              >
                ★
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{profile.display_name}</h2>
                <span className="text-xs text-slate-400 font-mono">@{profile.username}</span>
              </div>
              <p className="text-xs text-slate-400 max-w-md line-clamp-1">{profile.bio || 'No bio specified.'}</p>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-1">
                <span>ID: {profile.user_id.slice(0, 12)}...</span>
                <span>•</span>
                <span>{profile.location_country || 'Global'}</span>
              </div>
            </div>
          </div>

          {/* Completeness Meter */}
          <div className="w-full md:w-56 space-y-1.5 self-end md:self-center">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium">Profile Completeness</span>
              <span className="text-indigo-400 font-mono font-bold">{completeness}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${completeness}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 block">
              {completeness === 100 ? 'All 10 completeness milestones reached!' : 'Fill in fields to reach 100%'}
            </span>
          </div>
        </div>
      </div>

      {/* 9 Category Tabs Navigation */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800">
        {CATEGORY_TABS.map((cat) => (
          <button
            key={cat.num}
            onClick={() => setActiveCategoryTab(cat.num)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex flex-col items-start gap-0.5 ${
              activeCategoryTab === cat.num
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>{cat.label}</span>
            <span className={`text-[10px] font-normal ${activeCategoryTab === cat.num ? 'text-indigo-200' : 'text-slate-500'}`}>
              {cat.desc}
            </span>
          </button>
        ))}
      </div>

      {/* CATEGORY 1: CORE IDENTITY */}
      {activeCategoryTab === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                <span>Category 1: Core Identity (Everyone)</span>
              </h3>
              <p className="text-xs text-slate-400">Unique public handle, computed age gating, and localization defaults.</p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800">
              Public Handle + Private DOB
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1 font-medium">Username (Unique handle)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">@</span>
                <input
                  type="text"
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value.toLowerCase().trim() })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1 font-medium">Display Name (Shown name)</label>
              <input
                type="text"
                value={profile.display_name}
                onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Date of Birth (Used to compute age - never a self reported checkbox) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-400 font-medium">Date of Birth (YYYY-MM-DD)</label>
                <span className="text-[10px] font-mono text-indigo-400">Strict Age Enforcement</span>
              </div>
              <input
                type="date"
                value={profile.date_of_birth}
                onChange={(e) => {
                  const newDob = e.target.value;
                  const newAge = calculateAge(newDob);
                  setProfile({
                    ...profile,
                    date_of_birth: newDob,
                    is_adult: newAge >= 18,
                  });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Calculated Age: <strong className="text-slate-200">{age} years old</strong> • Adult status:{' '}
                <strong className={profile.is_adult ? 'text-emerald-400' : 'text-amber-400'}>
                  {profile.is_adult ? 'ADULT (18+)' : 'MINOR (<18)'}
                </strong>
              </span>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1 font-medium">Avatar URL</label>
              <input
                type="text"
                value={profile.avatar_url}
                onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1 font-medium">Bio (Short description)</label>
            <textarea
              rows={2}
              value={profile.bio || ''}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Tell others about yourself..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1 font-medium">Preferred UI & Translation Language</label>
              <select
                value={profile.preferred_language}
                onChange={(e) => setProfile({ ...profile, preferred_language: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
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
              <label className="text-xs text-slate-400 block mb-1 font-medium">Timezone (For local time display)</label>
              <input
                type="text"
                value={profile.timezone}
                onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-500 font-mono text-[11px]">
            <div>Internal User ID: <span className="text-slate-300">{profile.user_id}</span></div>
            <div>Account Created: <span className="text-slate-300">{new Date(profile.created_at).toLocaleDateString()}</span></div>
            <div>Last Active: <span className="text-slate-300">{new Date(profile.last_active_at).toLocaleTimeString()}</span></div>
          </div>
        </div>
      )}

      {/* CATEGORY 2: CONTACT & VERIFICATION */}
      {activeCategoryTab === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Category 2: Contact & Verification (18+ Gated)</span>
              </h3>
              <p className="text-xs text-slate-400">Email, SMS verified phone, encrypted National ID, and COPPA guardian links.</p>
            </div>
            <span className="text-[11px] font-mono text-indigo-400 bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-800">
              Server-Gated Boolean
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email Verification Card */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Email Verification</span>
                </span>
                {profile.email_verified_at ? (
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    VERIFIED
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                    UNVERIFIED
                  </span>
                )}
              </div>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500 font-mono">
                  {profile.email_verified_at ? `Verified: ${new Date(profile.email_verified_at).toLocaleDateString()}` : 'Code required'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsVerifyingEmail(true)}
                  className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition-all"
                >
                  Verify Email
                </button>
              </div>
            </div>

            {/* Phone Verification Card */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Phone Number (SMS Verified)</span>
                </span>
                {profile.phone_verified_at ? (
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    SMS CONFIRMED
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                    SMS PENDING
                  </span>
                )}
              </div>
              <input
                type="text"
                value={profile.phone_number}
                onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                placeholder="+254 700 000000"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500 font-mono">
                  {profile.phone_verified_at ? `Verified: ${new Date(profile.phone_verified_at).toLocaleDateString()}` : 'SMS OTP required'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsVerifyingPhone(true)}
                  className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] transition-all"
                >
                  Verify SMS
                </button>
              </div>
            </div>

            {/* Government ID & Compliance Card */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  <span>Government ID Verification (Encrypted at rest, compliance-only)</span>
                </span>
                {profile.national_id_verified_at ? (
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    ID VERIFIED
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    NOT SUBMITTED
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1 uppercase font-mono">ID Type</label>
                  <select
                    value={profile.id_type || 'national_id'}
                    onChange={(e) => setProfile({ ...profile, id_type: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="national_id">National ID Card</option>
                    <option value="passport">International Passport</option>
                    <option value="drivers_license">Driver's License</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block mb-1 uppercase font-mono">Encrypted ID Number</label>
                  <input
                    type="text"
                    value={profile.national_id_number || ''}
                    onChange={(e) => setProfile({ ...profile, national_id_number: e.target.value })}
                    placeholder="••••••••4921"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block mb-1 uppercase font-mono">Action</label>
                  <button
                    type="button"
                    onClick={() => setIsVerifyingId(true)}
                    className="w-full py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow"
                  >
                    Verify Compliance ID
                  </button>
                </div>
              </div>

              {!profile.is_adult && (
                <div className="p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-lg text-xs space-y-1">
                  <span className="font-bold text-amber-300">COPPA Minor Compliance Guardian Link:</span>
                  <input
                    type="email"
                    value={profile.guardian_contact_email || ''}
                    onChange={(e) => setProfile({ ...profile, guardian_contact_email: e.target.value })}
                    placeholder="parent_or_guardian@family.org"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY 3: PERSONAL & DISCOVERY */}
      {activeCategoryTab === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-cyan-400" />
                <span>Category 3: Personal & Discovery Details (Optional Visibility)</span>
              </h3>
              <p className="text-xs text-slate-400">Occupation, separate country/city toggles, interests tags, and relationship status.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1 font-medium">Occupation / Profession</label>
              <input
                type="text"
                value={profile.occupation || ''}
                onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                placeholder="Software Architect / Designer"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1 font-medium">Gender (Never required)</label>
              <select
                value={profile.gender || 'prefer_not_to_say'}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non_binary">Non-binary</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1 font-medium">Location Country (Always preserved)</label>
              <select
                value={profile.location_country || '🇰🇪 Kenya (East Africa)'}
                onChange={(e) => setProfile({ ...profile, location_country: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <optgroup label="🌍 East African Community">
                  {EAST_AFRICAN_COUNTRIES.map((c) => (
                    <option key={c.code} value={`${c.flag} ${c.name} (East Africa)`}>
                      {c.flag} {c.name} — East Africa
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🌐 Global Countries">
                  {GLOBAL_COUNTRIES.map((c) => (
                    <option key={c.code} value={`${c.flag} ${c.name}`}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1 font-medium">Location City (Can be hidden independently)</label>
              <input
                type="text"
                value={profile.location_city || ''}
                onChange={(e) => setProfile({ ...profile, location_city: e.target.value })}
                placeholder="e.g. Nairobi, Kigali, Tokyo"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1 font-medium">Relationship Status</label>
              <select
                value={profile.relationship_status || 'single'}
                onChange={(e) => setProfile({ ...profile, relationship_status: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="single">Single</option>
                <option value="in_a_relationship">In a relationship</option>
                <option value="engaged">Engaged</option>
                <option value="married">Married</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* Interests & Discovery Tags */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-xs text-slate-400 block font-medium">Interests &amp; Discovery Tags (Used for Friend Discovery)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {profile.interests?.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg bg-indigo-950 border border-indigo-700/60 text-indigo-300 text-xs flex items-center gap-1.5"
                >
                  <span>#{tag}</span>
                  <button onClick={() => removeInterest(tag)} className="text-indigo-400 hover:text-white text-xs">
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newInterestInput}
                onChange={(e) => setNewInterestInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                placeholder="Add interest (e.g. WebRTC, DistributedSystems, Swahili)..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={addInterest}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow"
              >
                Add Tag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY 4: PRIVACY & VISIBILITY CONTROLS */}
      {activeCategoryTab === 4 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Category 4: Privacy & Visibility Controls</span>
              </h3>
              <p className="text-xs text-slate-400">Strict granular switches governing who can discover, view, and message you.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-white block">Location Visibility</label>
              <p className="text-[11px] text-slate-400">Control who can view your city and country in your profile card.</p>
              <select
                value={profile.location_visibility}
                onChange={(e) => setProfile({ ...profile, location_visibility: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
              >
                <option value="public">Public (Everyone)</option>
                <option value="friends">Friends only</option>
                <option value="hidden">Hidden completely</option>
              </select>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-white block">Occupation Visibility</label>
              <p className="text-[11px] text-slate-400">Determine who can see your job title and profession.</p>
              <select
                value={profile.occupation_visibility}
                onChange={(e) => setProfile({ ...profile, occupation_visibility: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
              >
                <option value="public">Public (Everyone)</option>
                <option value="friends">Friends only</option>
                <option value="hidden">Hidden completely</option>
              </select>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-white block">Who Can Find Me</label>
              <p className="text-[11px] text-slate-400">Governs discovery algorithm and phone/username searches.</p>
              <select
                value={profile.who_can_find_me}
                onChange={(e) => setProfile({ ...profile, who_can_find_me: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
              >
                <option value="everyone">Everyone</option>
                <option value="friends_of_friends">Friends of friends</option>
                <option value="nobody">Nobody</option>
              </select>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-white block">Who Can Message Me</label>
              <p className="text-[11px] text-slate-400">Direct message permissions barrier.</p>
              <select
                value={profile.who_can_message_me}
                onChange={(e) => setProfile({ ...profile, who_can_message_me: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
              >
                <option value="everyone">Everyone</option>
                <option value="friends">Friends only</option>
              </select>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 sm:col-span-2">
              <label className="text-xs font-bold text-white block">Who Can See Reels &amp; Photos</label>
              <p className="text-[11px] text-slate-400">Audience filtering for Category 6 content.</p>
              <select
                value={profile.who_can_see_reels}
                onChange={(e) => setProfile({ ...profile, who_can_see_reels: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
              >
                <option value="public">Public (All users)</option>
                <option value="friends">Friends only</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY 5: CUSTOMIZATION */}
      {activeCategoryTab === 5 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span>Category 5: Customization &amp; Branding</span>
              </h3>
              <p className="text-xs text-slate-400">Accent theme color, banner header image, and external social media links.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1 font-medium">Theme Accent Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={profile.theme_color || '#6366f1'}
                  onChange={(e) => setProfile({ ...profile, theme_color: e.target.value })}
                  className="w-10 h-10 rounded-xl bg-transparent border border-slate-700 cursor-pointer"
                />
                <input
                  type="text"
                  value={profile.theme_color || '#6366f1'}
                  onChange={(e) => setProfile({ ...profile, theme_color: e.target.value })}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1 font-medium">Profile Header Banner URL</label>
              <input
                type="text"
                value={profile.profile_banner_url || ''}
                onChange={(e) => setProfile({ ...profile, profile_banner_url: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">Social Links</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1 font-mono uppercase">Twitter / X</label>
                <input
                  type="text"
                  value={profile.social_links?.twitter || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, social_links: { ...profile.social_links, twitter: e.target.value } })
                  }
                  placeholder="@handle"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1 font-mono uppercase">GitHub</label>
                <input
                  type="text"
                  value={profile.social_links?.github || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, social_links: { ...profile.social_links, github: e.target.value } })
                  }
                  placeholder="username"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1 font-mono uppercase">Website</label>
                <input
                  type="text"
                  value={profile.social_links?.website || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, social_links: { ...profile.social_links, website: e.target.value } })
                  }
                  placeholder="https://mysite.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY 6: CONTENT (REELS & PHOTOS) */}
      {activeCategoryTab === 6 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                <span>Category 6: Content (Reels &amp; Photos Table)</span>
              </h3>
              <p className="text-xs text-slate-400">Stored in dedicated posts table with engagement metrics.</p>
            </div>
            <button
              onClick={() => setIsCreatePostOpen(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Post</span>
            </button>
          </div>

          {/* Posts Grid */}
          {profile.posts && profile.posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {profile.posts.map((post) => (
                <div key={post.id} className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow group">
                  <div className="h-44 relative bg-slate-900 overflow-hidden">
                    <img src={post.media_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/70 text-white uppercase backdrop-blur-md">
                      {post.type}
                    </span>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 transition-all opacity-0 group-hover:opacity-100"
                      title="Delete post"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-3 space-y-1.5">
                    {post.caption && <p className="text-xs text-slate-200 line-clamp-2">{post.caption}</p>}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                      <button
                        onClick={() => handleLikePost(post.id)}
                        className={`flex items-center gap-1 transition-colors ${post.is_liked ? 'text-rose-400' : 'hover:text-rose-300'}`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${post.is_liked ? 'fill-current' : ''}`} />
                        <span>{post.likes}</span>
                      </button>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl space-y-2">
              <Camera className="w-8 h-8 text-slate-600 mx-auto" />
              <p>No photos or reels published yet. Click "Create Post" to publish to your profile.</p>
            </div>
          )}
        </div>
      )}

      {/* CATEGORY 7: SYSTEM / MODERATION FIELDS */}
      {activeCategoryTab === 7 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Category 7: System / Moderation Fields (Admin-visible only)</span>
              </h3>
              <p className="text-xs text-slate-400">Account status, block reasons, admin accountability, report thresholds, and active sessions.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase">Account Status</span>
              <div className="text-sm font-bold text-emerald-400">{profile.account_status.toUpperCase()}</div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase">Report Count</span>
              <div className="text-sm font-bold text-indigo-300">{profile.report_count} reports</div>
              <span className="text-[10px] text-slate-500 font-sans">Triggers review at 5</span>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase">Device Sessions Count</span>
              <div className="text-sm font-bold text-cyan-300">{profile.device_sessions_count || 1} active devices</div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase">Blocked By Admin ID</span>
              <div className="text-xs text-slate-400">{profile.blocked_by_admin_id || 'None (In good standing)'}</div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase">Blocked Reason</span>
              <div className="text-xs text-slate-400">{profile.blocked_reason || 'N/A'}</div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase">Role Authorization</span>
              <div className="text-sm font-bold text-white">{profile.role.toUpperCase()}</div>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY 8: ADDITIONAL FIELDS OFTEN MISSED */}
      {activeCategoryTab === 8 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Category 8: Additional Fields Often Missed</span>
              </h3>
              <p className="text-xs text-slate-400">GDPR "Download My Data" export, reversible deactivation, and consent records.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* GDPR Data Export Card */}
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Download className="w-4 h-4 text-indigo-400" />
                <span>GDPR "Download My Data" Export</span>
              </div>
              <p className="text-xs text-slate-400">
                Generate an immediate full JSON package containing your chats, profile data, privacy settings, and activity logs.
              </p>
              <button
                type="button"
                onClick={handleExportData}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Request &amp; Download Data Package</span>
              </button>
              {profile.data_export_requested_at && (
                <span className="text-[10px] text-slate-500 font-mono block">
                  Last export: {new Date(profile.data_export_requested_at).toLocaleString()}
                </span>
              )}
            </div>

            {/* Permanent Account Deletion with Legal Hold Card */}
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <UserX className="w-4 h-4 text-rose-400" />
                <span>Permanent Account Deletion (Legal Hold Guarded)</span>
              </div>
              <p className="text-xs text-slate-400">
                Self-deletion will be cleanly rejected by the server if your account is currently flagged under an active legal hold.
              </p>
              <button
                type="button"
                onClick={handleRequestDeletion}
                className="w-full py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold text-xs shadow flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Schedule Account Deletion</span>
              </button>
              {profile.deletion_requested_at && (
                <span className="text-[10px] text-rose-400 font-mono block">
                  Deletion requested on {new Date(profile.deletion_requested_at).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Consent Records */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <span className="text-slate-500 text-[10px] block uppercase">Terms of Service Consent</span>
              <span className="text-slate-300">Accepted {profile.tos_accepted_at ? new Date(profile.tos_accepted_at).toLocaleDateString() : 'Yes'} (v{profile.tos_version || '2026.1'})</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block uppercase">Privacy Policy Consent</span>
              <span className="text-slate-300">Accepted {profile.privacy_policy_accepted_at ? new Date(profile.privacy_policy_accepted_at).toLocaleDateString() : 'Yes'} (v{profile.privacy_policy_version || '2026.1'})</span>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY 9: ALSO COMMONLY MISSED */}
      {activeCategoryTab === 9 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                <span>Category 9: Also Commonly Missed (Recovery, History &amp; Dual Blocks)</span>
              </h3>
              <p className="text-xs text-slate-400">Account recovery paths, past username resolution, two-way block lists, and legal hold flags.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Account Recovery Path */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                <span>Account Recovery Path (When phone/email lost)</span>
              </span>
              <p className="text-[11px] text-slate-400">
                Configured backup recovery codes and secondary contact for lockout prevention.
              </p>
              <div className="p-2.5 bg-slate-900 rounded-lg text-xs font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Method:</span>
                  <span className="text-emerald-400 font-bold">{profile.account_recovery_path?.method || 'backup_email'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Remaining Codes:</span>
                  <span className="text-slate-200">{profile.account_recovery_path?.backup_codes_remaining ?? 8} unused</span>
                </div>
              </div>
            </div>

            {/* Legal Hold Flag */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Legal Hold Flag</span>
              </span>
              <p className="text-[11px] text-slate-400">
                When active, self-deletion is blocked to comply with statutory legal inquiries.
              </p>
              <div className="p-2.5 bg-slate-900 rounded-lg text-xs font-mono flex items-center justify-between">
                <span>Hold Status:</span>
                <span className={`font-bold ${profile.legal_hold ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {profile.legal_hold ? 'ACTIVE LEGAL HOLD' : 'CLEARED (No Holds)'}
                </span>
              </div>
            </div>

            {/* Username History */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-cyan-400" />
                <span>Username History</span>
              </span>
              <p className="text-[11px] text-slate-400">
                Preserved so friend search and reports tied to past handles continue to resolve.
              </p>
              <div className="space-y-1 font-mono text-xs">
                {profile.username_history && profile.username_history.length > 0 ? (
                  profile.username_history.map((h, idx) => (
                    <div key={idx} className="p-2 bg-slate-900 rounded flex justify-between text-[11px]">
                      <span className="text-slate-300">@{h.old_username}</span>
                      <span className="text-slate-500">{new Date(h.changed_at).toLocaleDateString()}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-slate-500 italic p-2 bg-slate-900 rounded">No handle changes recorded</div>
                )}
              </div>
            </div>

            {/* Separate Block Lists */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <UserX className="w-3.5 h-3.5 text-rose-400" />
                <span>Dual Block Query Separation</span>
              </span>
              <p className="text-[11px] text-slate-400">
                Separate queries: who I blocked vs who blocked me.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-slate-900 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 block">Who I Blocked</span>
                  <span className="text-sm font-bold text-rose-300">{profile.blocking_list?.length || 0} users</span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 block">Who Blocked Me</span>
                  <span className="text-sm font-bold text-amber-300">{profile.blocked_by_list?.length || 0} users</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button Bar */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
        <span className="text-xs text-slate-400">
          All modifications are saved directly to TalkFlow's user profile database with audit timestamping.
        </span>

        <button
          type="button"
          onClick={handleSaveProfile}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          <span>{saving ? 'Saving Profile Changes...' : 'Save Profile Changes'}</span>
        </button>
      </div>

      {/* Modal: Email Verification */}
      {isVerifyingEmail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-white">Enter Email Verification Code</h3>
            <p className="text-xs text-slate-400">
              A 6-digit confirmation code was dispatched to <strong className="text-slate-200">{profile.email}</strong>.
            </p>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="123456"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-center text-sm font-mono tracking-widest text-white"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setIsVerifyingEmail(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyEmail}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white"
              >
                Confirm Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: SMS Verification */}
      {isVerifyingPhone && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-white">Enter SMS Code</h3>
            <p className="text-xs text-slate-400">
              An SMS OTP was dispatched to <strong className="text-slate-200">{profile.phone_number}</strong>.
            </p>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="123456"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-center text-sm font-mono tracking-widest text-white"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setIsVerifyingPhone(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyPhone}
                className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white"
              >
                Verify Phone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: National ID Verification */}
      {isVerifyingId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-white">Government ID Compliance Verification</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              In accordance with international identity verification standards, National ID documents are salted, hashed, and stored encrypted at rest.
            </p>
            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">ID Number:</label>
                <input
                  type="text"
                  defaultValue="ID-KE-8849201"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsVerifyingId(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyNationalId}
                className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white"
              >
                Verify &amp; Encrypt ID
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Post (Category 6 Content) */}
      {isCreatePostOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreatePost} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-white">Create Profile Post (Photo / Reel)</h3>
            <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setNewPostType('photo')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${newPostType === 'photo' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                Photo
              </button>
              <button
                type="button"
                onClick={() => setNewPostType('reel')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${newPostType === 'reel' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                Reel Video
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Media URL</label>
              <input
                type="text"
                required
                value={newPostUrl}
                onChange={(e) => setNewPostUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Caption</label>
              <textarea
                rows={2}
                value={newPostCaption}
                onChange={(e) => setNewPostCaption(e.target.value)}
                placeholder="Describe your moment..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Audience Visibility</label>
              <select
                value={newPostVisibility}
                onChange={(e) => setNewPostVisibility(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="public">Public</option>
                <option value="friends">Friends only</option>
              </select>
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
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-xs font-bold text-white shadow"
              >
                Publish Post
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
