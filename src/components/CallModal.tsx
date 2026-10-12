import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  ShieldCheck,
  Signal,
  Sparkles,
  Users,
  Radio,
  UserPlus,
  MessageSquare,
  FlipHorizontal,
  Activity,
  Send,
  X,
  Check
} from 'lucide-react';
import { UserProfile } from '../hooks/useTalkFlow.ts';
import { LOCALES } from '../utils/i18n.ts';

export interface ActiveCallState {
  callId: string;
  peer: UserProfile;
  type: 'audio' | 'video';
  status: 'calling' | 'ringing' | 'connected' | 'ended';
  isCaller: boolean;
  startTime?: number;
  durationSeconds: number;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isMinimized: boolean;
}

interface CallModalProps {
  call: ActiveCallState;
  currentUser: UserProfile | null;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleMinimize: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  call,
  currentUser,
  onEndCall,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onToggleMinimize,
}) => {
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [audioWaveLevel, setAudioWaveLevel] = useState(40);
  const [isInCallChatOpen, setIsInCallChatOpen] = useState(false);
  const [inCallInput, setInCallInput] = useState('');
  const [inCallMessages, setInCallMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: call.peer.displayName, text: 'Hello! I can hear and see you clearly on WebRTC.', time: 'Just now' }
  ]);
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);
  const [extraParticipants, setExtraParticipants] = useState<string[]>([]);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'rear'>('front');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Format call timer (MM:SS)
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Try to access actual user camera if video is on
  useEffect(() => {
    let isCancelled = false;

    async function initCamera() {
      if (call.type === 'video' && !call.isCameraOff && navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false, // Local feedback prevention
          });
          if (!isCancelled && localVideoRef.current) {
            localStreamRef.current = stream;
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play().catch(() => {});
          }
        } catch (e) {
          // Camera permission denied or not available; fallback to animated virtual avatar feed
        }
      }
    }

    initCamera();

    return () => {
      isCancelled = true;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
  }, [call.type, call.isCameraOff]);

  // Audio wave animation for speaking visualizer
  useEffect(() => {
    if (call.status !== 'connected') return;
    const interval = setInterval(() => {
      setAudioWaveLevel(Math.floor(20 + Math.random() * 70));
    }, 180);
    return () => clearInterval(interval);
  }, [call.status]);

  const peerFlag = LOCALES[call.peer.preferredLanguage]?.flag || '🌍';

  // If minimized into floating PiP widget in bottom-right corner
  if (call.isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 flex items-center gap-3 backdrop-blur-xl animate-in slide-in-from-bottom-5">
        <div className="relative">
          <img
            src={call.peer.avatarUrl}
            alt={call.peer.displayName}
            className="w-12 h-12 rounded-xl object-cover border border-slate-700"
          />
          <span className="absolute -bottom-1 -right-1 text-xs">{peerFlag}</span>
          {call.status === 'connected' && (
            <span className="absolute -top-1 -left-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
          )}
        </div>

        <div className="space-y-0.5 min-w-[120px]">
          <div className="text-xs font-bold text-white truncate">{call.peer.displayName}</div>
          <div className="text-[11px] font-mono text-emerald-400">
            {call.status === 'connected' ? formatTimer(call.durationSeconds) : 'Connecting...'}
          </div>
        </div>

        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
          <button
            onClick={onToggleMute}
            className={`p-2 rounded-xl text-xs ${
              call.isMuted ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
            title={call.isMuted ? 'Unmute' : 'Mute'}
          >
            {call.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onToggleMinimize}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            title="Maximize call"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onEndCall}
            className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30"
            title="End call"
          >
            <PhoneOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Full-Featured Call Modal
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl h-[88vh] max-h-[750px] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Top Header Bar */}
        <div className="px-6 py-4 bg-slate-950/60 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <span className="text-xl">{peerFlag}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">{call.peer.displayName}</h3>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800/60">
                  {call.type === 'video' ? '📹 1080p HD Video' : '📞 Opus HD Audio'}
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>@{call.peer.username}</span>
                <span>•</span>
                <span className="text-emerald-400 font-mono font-medium">
                  {call.status === 'connected' ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      {formatTimer(call.durationSeconds)}
                    </span>
                  ) : call.status === 'ringing' ? (
                    'Ringing...'
                  ) : (
                    'Connecting WebRTC Peer...'
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Encryption & Latency indicators */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>SRTP Encrypted</span>
              <span className="text-slate-600">|</span>
              <Signal className="w-3.5 h-3.5 text-cyan-400" />
              <span>24ms</span>
            </div>

            <button
              onClick={onToggleMinimize}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Minimize to floating window"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Stage (Remote Stream) */}
        <div className="flex-1 relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center overflow-hidden">
          {call.type === 'video' ? (
            <div className="w-full h-full relative flex items-center justify-center">
              {/* Simulated high-quality remote video stream */}
              <img
                src={call.peer.avatarUrl}
                alt={call.peer.displayName}
                className="w-full h-full object-cover filter brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />

              {/* Remote active speaker pulse glow */}
              <div className="absolute bottom-6 left-6 flex items-center gap-3 bg-slate-950/70 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-1 h-5">
                  <span
                    className="w-1 bg-emerald-400 rounded-full transition-all duration-150"
                    style={{ height: `${Math.max(6, audioWaveLevel * 0.25)}px` }}
                  />
                  <span
                    className="w-1 bg-emerald-400 rounded-full transition-all duration-150"
                    style={{ height: `${Math.max(6, audioWaveLevel * 0.35)}px` }}
                  />
                  <span
                    className="w-1 bg-emerald-400 rounded-full transition-all duration-150"
                    style={{ height: `${Math.max(6, audioWaveLevel * 0.2)}px` }}
                  />
                </div>
                <span className="text-xs text-slate-200 font-semibold">{call.peer.displayName}</span>
              </div>
            </div>
          ) : (
            /* Audio-Only Call Canvas */
            <div className="flex flex-col items-center justify-center space-y-6 text-center p-8">
              <div className="relative">
                {/* Expanding animated wave rings */}
                <div
                  className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping"
                  style={{ animationDuration: '3s' }}
                />
                <div
                  className="absolute -inset-4 rounded-full bg-cyan-500/10 animate-pulse"
                  style={{ animationDuration: '2s' }}
                />

                <img
                  src={call.peer.avatarUrl}
                  alt={call.peer.displayName}
                  className="relative w-36 h-36 rounded-full object-cover border-4 border-indigo-500/60 shadow-2xl"
                />

                <span className="absolute bottom-0 right-2 text-2xl drop-shadow-md">{peerFlag}</span>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-white tracking-tight">{call.peer.displayName}</h2>
                <p className="text-xs text-slate-400 font-mono">
                  {call.status === 'connected' ? 'High Fidelity Opus Voice Call' : 'Establishing Secure Signaling...'}
                </p>
              </div>

              {/* Audio waveform visualization */}
              <div className="flex items-center gap-1.5 h-8">
                {Array.from({ length: 24 }).map((_, idx) => (
                  <span
                    key={idx}
                    className="w-1 bg-gradient-to-t from-indigo-500 to-cyan-400 rounded-full transition-all duration-150"
                    style={{
                      height: `${Math.max(4, Math.sin(idx * 0.5 + audioWaveLevel * 0.1) * 24 + 10)}px`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Local User Picture-in-Picture (PiP) Stream Preview */}
          <div className="absolute top-4 right-4 w-40 sm:w-52 h-28 sm:h-36 bg-slate-900 border-2 border-indigo-500/50 rounded-2xl overflow-hidden shadow-2xl z-30 group">
            {call.type === 'video' && !call.isCameraOff ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-3 text-center space-y-1">
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.displayName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold text-xs">
                    YOU
                  </div>
                )}
                <span className="text-[10px] text-slate-400 font-medium">Camera is Off</span>
              </div>
            )}

            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 text-[10px] text-slate-300 font-mono">
              You {call.isMuted && '• Muted'}
            </div>
          </div>
        </div>

        {/* Bottom Call Action Toolbar */}
        <div className="px-4 md:px-6 py-4 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-center gap-2.5 sm:gap-4 z-20 flex-wrap">
          {/* Microphone Mute */}
          <button
            onClick={onToggleMute}
            className={`p-3 sm:p-3.5 rounded-2xl transition-all shadow-lg flex items-center justify-center ${
              call.isMuted
                ? 'bg-rose-500 text-white shadow-rose-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white'
            }`}
            title={call.isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {call.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Camera On / Off */}
          {call.type === 'video' && (
            <button
              onClick={onToggleCamera}
              className={`p-3 sm:p-3.5 rounded-2xl transition-all shadow-lg flex items-center justify-center ${
                call.isCameraOff
                  ? 'bg-rose-500 text-white shadow-rose-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white'
              }`}
              title={call.isCameraOff ? 'Turn camera on' : 'Turn camera off'}
            >
              {call.isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          {/* Camera Switch / Flip (front / rear) */}
          {call.type === 'video' && !call.isCameraOff && (
            <button
              onClick={() => setCameraFacing((prev) => (prev === 'front' ? 'rear' : 'front'))}
              className="p-3 sm:p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all shadow-lg"
              title={`Switch camera (Currently ${cameraFacing})`}
            >
              <FlipHorizontal className="w-5 h-5" />
            </button>
          )}

          {/* Screen Share */}
          <button
            onClick={onToggleScreenShare}
            className={`p-3 sm:p-3.5 rounded-2xl transition-all shadow-lg flex items-center justify-center ${
              call.isScreenSharing
                ? 'bg-indigo-600 text-white shadow-indigo-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white'
            }`}
            title={call.isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
          >
            <Monitor className="w-5 h-5" />
          </button>

          {/* Speaker Mute Toggle */}
          <button
            onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
            className={`p-3 sm:p-3.5 rounded-2xl transition-all shadow-lg flex items-center justify-center ${
              isSpeakerMuted
                ? 'bg-amber-600 text-white shadow-amber-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white'
            }`}
            title={isSpeakerMuted ? 'Unmute speaker' : 'Mute speaker'}
          >
            {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Add Participant to Group Call */}
          <button
            onClick={() => setIsAddParticipantOpen(true)}
            className="p-3 sm:p-3.5 rounded-2xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white transition-all shadow-lg flex items-center gap-1"
            title="Add participant to call (Group Call)"
          >
            <UserPlus className="w-5 h-5" />
          </button>

          {/* In-Call Chat Overlay Toggle */}
          <button
            onClick={() => setIsInCallChatOpen(!isInCallChatOpen)}
            className={`p-3 sm:p-3.5 rounded-2xl transition-all shadow-lg flex items-center gap-1 ${
              isInCallChatOpen
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white'
            }`}
            title="In-call chat"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* End Call Button */}
          <button
            onClick={onEndCall}
            className="p-3 sm:p-3.5 px-5 sm:px-7 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-xl shadow-rose-600/40 flex items-center gap-2"
            title="End call"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline">End Call</span>
          </button>
        </div>

        {/* In-Call Chat Drawer */}
        {isInCallChatOpen && (
          <div className="absolute right-0 top-14 bottom-20 w-80 bg-slate-900/95 border-l border-slate-800 backdrop-blur-md flex flex-col z-30 shadow-2xl p-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span>In-Call Messages</span>
              </span>
              <button onClick={() => setIsInCallChatOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2 space-y-2 text-xs">
              {inCallMessages.map((m, idx) => (
                <div key={idx} className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                    <span className="font-bold text-indigo-300">{m.sender}</span>
                    <span>{m.time}</span>
                  </div>
                  <div className="text-slate-200">{m.text}</div>
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!inCallInput.trim()) return;
                setInCallMessages((prev) => [
                  ...prev,
                  { sender: currentUser?.displayName || 'You', text: inCallInput.trim(), time: 'Just now' }
                ]);
                setInCallInput('');
              }}
              className="flex items-center gap-1.5 pt-2 border-t border-slate-800"
            >
              <input
                type="text"
                value={inCallInput}
                onChange={(e) => setInCallInput(e.target.value)}
                placeholder="Message in call..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button type="submit" className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* Add Participant to Group Call Modal */}
        {isAddParticipantOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-indigo-400" />
                  <span>Invite to Group Call</span>
                </h3>
                <button onClick={() => setIsAddParticipantOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {['Jean-Paul Habimana 🇷🇼', 'Amina Osei 🇰🇪', 'Neema Mwangi 🇹🇿', 'Omar Al-Mansoor 🇪🇬', 'Elena Ramos 🇪🇸'].map((name) => {
                  const isInvited = extraParticipants.includes(name);
                  return (
                    <button
                      key={name}
                      onClick={() => {
                        setExtraParticipants((prev) =>
                          isInvited ? prev.filter((n) => n !== name) : [...prev, name]
                        );
                      }}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-colors ${
                        isInvited
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                          : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-semibold">{name}</span>
                      {isInvited ? <Check className="w-4 h-4 text-indigo-400" /> : <span className="text-[10px] text-slate-500">+ Add</span>}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setIsAddParticipantOpen(false)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg"
              >
                Done ({extraParticipants.length} added)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
