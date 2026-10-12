import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Radio,
  Activity,
  Globe,
  Search,
  CheckCircle2,
  AlertTriangle,
  Send,
  RefreshCw,
  UserCheck,
  UserX,
  Lock,
  Unlock,
  Sparkles,
  MapPin,
  Clock,
  ArrowRight
} from 'lucide-react';
import { UserProfile } from '../hooks/useTalkFlow.ts';
import { LocaleKey } from '../utils/i18n.ts';
import { EAST_AFRICAN_COUNTRIES } from '../utils/countries.ts';

interface AdminPageProps {
  currentUser: UserProfile | null;
  onSwitchUser: (userId: string) => void;
  fetchAdminUsers: () => Promise<UserProfile[]>;
  updateUserRole: (userId: string, newRole: 'admin' | 'user') => Promise<{ success: boolean; message?: string }>;
  toggleUserStatus: (userId: string, isActive: boolean) => Promise<{ success: boolean; message?: string }>;
  fetchAdminReports: () => Promise<any[]>;
  resolveAdminReport: (reportId: string) => Promise<{ success: boolean }>;
  broadcastAdminMessage: (title: string, message: string) => Promise<{ success: boolean; message?: string }>;
  fetchAdminMetrics: () => Promise<any>;
  currentLanguage: LocaleKey;
  onNavigateToChats: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  currentUser,
  onSwitchUser,
  fetchAdminUsers,
  updateUserRole,
  toggleUserStatus,
  fetchAdminReports,
  resolveAdminReport,
  broadcastAdminMessage,
  fetchAdminMetrics,
  currentLanguage,
  onNavigateToChats,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [activeTab, setActiveTab] = useState<'users' | 'east_africa' | 'reports' | 'broadcast' | 'metrics'>('users');
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [regionFilter, setRegionFilter] = useState<'all' | 'east_africa' | 'global'>('all');

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('Platform System Notice');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastFeedback, setBroadcastFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Status feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [users, reports, stats] = await Promise.all([
        fetchAdminUsers(),
        fetchAdminReports(),
        fetchAdminMetrics(),
      ]);
      setUsersList(users);
      setReportsList(reports);
      setMetrics(stats);
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAllData();
    }
  }, [isAdmin]);

  const handleToggleRole = async (targetUser: UserProfile) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    const res = await updateUserRole(targetUser.id, newRole);
    if (res.success) {
      showToast(`User @${targetUser.username} role changed to ${newRole.toUpperCase()}`);
      loadAllData();
    } else {
      showToast(`Failed: ${res.message}`);
    }
  };

  const handleToggleStatus = async (targetUser: UserProfile) => {
    const newStatus = targetUser.isActive === false ? true : false;
    const res = await toggleUserStatus(targetUser.id, newStatus);
    if (res.success) {
      showToast(`User @${targetUser.username} ${newStatus ? 'activated' : 'suspended'}`);
      loadAllData();
    } else {
      showToast(`Failed: ${res.message}`);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    const res = await resolveAdminReport(reportId);
    if (res.success) {
      showToast('Abuse report dismissed and resolved');
      setReportsList((prev) => prev.filter((r) => r.id !== reportId));
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastBody.trim()) return;
    setIsBroadcasting(true);
    setBroadcastFeedback(null);
    const res = await broadcastAdminMessage(broadcastTitle, broadcastBody);
    setIsBroadcasting(false);
    if (res.success) {
      setBroadcastFeedback({ type: 'success', text: 'Broadcast transmitted to all active users & channels!' });
      setBroadcastBody('');
    } else {
      setBroadcastFeedback({ type: 'error', text: res.message || 'Broadcast failed' });
    }
  };

  // Filter users
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.country || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    const isEastAfrica =
      (u.country || '').includes('East Africa') ||
      EAST_AFRICAN_COUNTRIES.some((c) => (u.country || '').includes(c.name));

    const matchesRegion =
      regionFilter === 'all' ||
      (regionFilter === 'east_africa' && isEastAfrica) ||
      (regionFilter === 'global' && !isEastAfrica);

    return matchesSearch && matchesRole && matchesRegion;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-indigo-400/40 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                  <span>TalkFlow Administration Portal</span>
                  {isAdmin && (
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      ADMIN AUTHORIZED
                    </span>
                  )}
                </h1>
                <p className="text-xs text-slate-400">
                  Global and East African user management, administrator role delegation, moderation, and system broadcast.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAllData}
              disabled={isLoading || !isAdmin}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Refresh administration data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={onNavigateToChats}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
            >
              <span>Back to Chats</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Warning if user is not admin */}
        {!isAdmin && (
          <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-white">Administrator Access Required</div>
                <div className="text-xs text-amber-300/80 mt-0.5">
                  Your current account <code className="bg-amber-900/50 px-1 py-0.5 rounded font-mono font-bold text-white">@{currentUser?.username || 'guest'}</code> has standard <code className="text-white">user</code> privileges. To manage users and roles, switch to a designated system administrator or promote your account.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
              <button
                onClick={() => onSwitchUser('usr_alex')}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow transition-all"
              >
                <span>Switch to @alex (Admin)</span>
              </button>
              <button
                onClick={() => onSwitchUser('usr_amina')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow transition-all"
              >
                <span>Switch to @amina (EA Admin)</span>
              </button>
            </div>
          </div>
        )}

        {/* High-level metrics row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Users</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">{metrics?.totalUsers || usersList.length || 15}</div>
            <div className="text-[11px] text-slate-500 mt-1">Registered worldwide</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Admins</span>
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              {metrics?.adminCount || usersList.filter((u) => u.role === 'admin').length || 2}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Full control privileges</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>East Africa</span>
              <Globe className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400 font-mono">
              {metrics?.eastAfricaCount ||
                usersList.filter((u) => (u.country || '').includes('East Africa')).length ||
                4}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">EAC Community members</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Live Messages</span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-cyan-400 font-mono">{metrics?.totalMessages || 7}</div>
            <div className="text-[11px] text-slate-500 mt-1">Monotonic seq synced</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap border-b border-slate-800 gap-2 sm:gap-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'users' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>User Management ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('east_africa')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'east_africa' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>East African Hub (11 Countries)</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'reports' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Safety & Reports ({reportsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'broadcast' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>System Broadcast</span>
          </button>
        </div>

        {/* TAB 1: USERS DIRECTORY & ROLE MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Filters bar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user, @username, country..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Administrators Only</option>
                  <option value="user">Members Only</option>
                </select>

                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="all">All Regions</option>
                  <option value="east_africa">🌍 East Africa Only</option>
                  <option value="global">🌐 Global Only</option>
                </select>
              </div>
            </div>

            {/* Users Table / List */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Country & Region</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Sessions</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          No users found matching your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isSelf = u.id === currentUser?.id;
                        const isUserAdmin = u.role === 'admin';
                        const isEastAfrica = (u.country || '').includes('East Africa');

                        return (
                          <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={u.avatarUrl}
                                  alt=""
                                  className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                                />
                                <div>
                                  <div className="font-bold text-white flex items-center gap-1.5">
                                    <span>{u.displayName}</span>
                                    {isSelf && (
                                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-mono">
                                        YOU
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono">@{u.username} • {u.email}</div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5 font-medium text-slate-200">
                                <span>{u.country || '🌍 Global'}</span>
                              </div>
                              {isEastAfrica && (
                                <span className="inline-block text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded mt-0.5">
                                  East Africa Community
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              {isUserAdmin ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold font-mono text-[10px]">
                                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                  <span>ADMIN</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono">
                                  <span>MEMBER</span>
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              {u.isActive === false ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-bold font-mono">
                                  SUSPENDED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold font-mono">
                                  ACTIVE
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4 font-mono text-slate-300">
                              {u.sessionCount !== undefined ? u.sessionCount : 1} active
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleToggleRole(u)}
                                  disabled={!isAdmin}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                                    isUserAdmin
                                      ? 'bg-amber-600/15 text-amber-300 border-amber-500/30 hover:bg-amber-600/30'
                                      : 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30'
                                  }`}
                                  title={isUserAdmin ? 'Demote to regular member' : 'Promote to administrator'}
                                >
                                  {isUserAdmin ? 'Demote' : 'Make Admin'}
                                </button>

                                {!isSelf && (
                                  <button
                                    onClick={() => handleToggleStatus(u)}
                                    disabled={!isAdmin}
                                    className={`p-1.5 rounded-lg border transition-all ${
                                      u.isActive === false
                                        ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-600/30'
                                        : 'bg-rose-600/15 text-rose-300 border-rose-500/30 hover:bg-rose-600/25'
                                    }`}
                                    title={u.isActive === false ? 'Unban user' : 'Suspend user'}
                                  >
                                    {u.isActive === false ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EAST AFRICAN HUB */}
        {activeTab === 'east_africa' && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-400" />
                <span>East African Community (EAC) & Greater East Africa</span>
              </h2>
              <p className="text-xs text-slate-400">
                TalkFlow officially includes and prioritizes East African countries. Users can register with their native country, auto-configure local timezones (EAT UTC+3 / CAT UTC+2), and utilize localized Swahili, English, and French translation pipelines.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {EAST_AFRICAN_COUNTRIES.map((country) => {
                const registeredUsers = usersList.filter(
                  (u) => (u.country || '').includes(country.name) || (u.country || '').includes(country.code)
                );
                const hasAdmin = registeredUsers.some((u) => u.role === 'admin');

                return (
                  <div
                    key={country.code}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{country.flag}</span>
                          <div>
                            <div className="font-bold text-sm text-white">{country.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              Dial: {country.dialCode} • Code: {country.code}
                            </div>
                          </div>
                        </div>
                        {hasAdmin && (
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                            Regional Admin
                          </span>
                        )}
                      </div>

                      <div className="mt-3.5 space-y-1.5 text-xs text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-cyan-400" /> Timezone
                          </span>
                          <span className="font-mono text-slate-200">{country.defaultTimezone}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Globe className="w-3 h-3 text-amber-400" /> Default Language
                          </span>
                          <span className="font-semibold text-slate-200 uppercase">{country.defaultLanguage}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">
                        {registeredUsers.length} Registered {registeredUsers.length === 1 ? 'User' : 'Users'}
                      </span>
                      {registeredUsers.length > 0 && (
                        <div className="flex -space-x-2">
                          {registeredUsers.slice(0, 3).map((u) => (
                            <img
                              key={u.id}
                              src={u.avatarUrl}
                              alt=""
                              title={`${u.displayName} (@${u.username})`}
                              className="w-6 h-6 rounded-full border-2 border-slate-900 object-cover"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: SAFETY & ABUSE REPORTS */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span>Safety, Trust & Abuse Moderation Hub</span>
              </h2>
              <p className="text-xs text-slate-400">
                Submitted user reports for spam, harassment, inappropriate media, or harassment. Administrators can review and take immediate action.
              </p>
            </div>

            {reportsList.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/80 border border-slate-800 rounded-2xl">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-white">All Reports Resolved</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Zero active user reports currently pending review. The community is healthy!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reportsList.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-white">Reporter:</span>
                        <span className="text-indigo-300 font-mono">@{rep.reporter?.username || rep.reporter_id}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                        <span className="font-bold text-rose-300">Reported:</span>
                        <span className="text-rose-400 font-mono font-bold">
                          @{rep.reported?.username || rep.reported_id}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300">
                        <span className="font-semibold text-slate-400">Reason: </span>
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-200 border border-rose-500/30 text-[11px] font-medium">
                          {rep.reason}
                        </span>
                        {rep.notes && <span className="ml-2 text-slate-400 italic">"{rep.notes}"</span>}
                      </div>

                      <div className="text-[10px] text-slate-500 font-mono">
                        Reported on: {new Date(rep.created_at).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleResolveReport(rep.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
                      >
                        Dismiss Report
                      </button>
                      {rep.reported && (
                        <button
                          onClick={() => handleToggleStatus(rep.reported)}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow"
                        >
                          Suspend User
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SYSTEM BROADCAST */}
        {activeTab === 'broadcast' && (
          <div className="space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-cyan-400" />
                  <span>Administrative Emergency & System Broadcast</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Transmit an instant announcement across all active conversations and official community broadcast channels.
                </p>
              </div>

              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Broadcast Title</label>
                  <input
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. Scheduled Network Maintenance or New EAC Regions Added"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Broadcast Message Body</label>
                  <textarea
                    rows={4}
                    value={broadcastBody}
                    onChange={(e) => setBroadcastBody(e.target.value)}
                    placeholder="Write announcement body to be distributed system-wide..."
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-500">
                    Will be signed by <code className="text-indigo-300 font-mono">@{currentUser?.username || 'admin'}</code>
                  </span>
                  <button
                    type="submit"
                    disabled={isBroadcasting || !isAdmin || !broadcastBody.trim()}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isBroadcasting ? 'Broadcasting...' : 'Send Broadcast to All'}</span>
                  </button>
                </div>
              </form>

              {broadcastFeedback && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                    broadcastFeedback.type === 'success'
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                      : 'bg-rose-950/60 text-rose-300 border-rose-800/80'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{broadcastFeedback.text}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
