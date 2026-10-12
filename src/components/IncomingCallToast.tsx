import React, { useEffect } from 'react';
import { Phone, PhoneOff, Video, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../hooks/useTalkFlow.ts';
import { LOCALES } from '../utils/i18n.ts';

export interface IncomingCallData {
  callId: string;
  caller: UserProfile;
  callType: 'audio' | 'video';
  offer?: any;
}

interface IncomingCallToastProps {
  incomingCall: IncomingCallData;
  onAccept: (callType: 'audio' | 'video') => void;
  onDecline: () => void;
}

// Gentle Web Audio synthesizer for incoming ringtone
function playRingtoneBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
    osc.frequency.setValueAtTime(480, ctx.currentTime + 0.15); // A4+

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.46);
  } catch (e) {
    // Autoplay policy bypass
  }
}

export const IncomingCallToast: React.FC<IncomingCallToastProps> = ({
  incomingCall,
  onAccept,
  onDecline,
}) => {
  const flag = LOCALES[incomingCall.caller.preferredLanguage]?.flag || '🌍';

  useEffect(() => {
    playRingtoneBeep();
    const interval = setInterval(() => {
      playRingtoneBeep();
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-6 right-6 z-50 max-w-sm w-full bg-slate-900/95 border border-indigo-500/40 rounded-3xl p-5 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-top-4 duration-300">
      <div className="flex items-center gap-4">
        {/* Pulsing Avatar */}
        <div className="relative shrink-0">
          <div className="absolute -inset-1.5 rounded-full bg-indigo-500/30 animate-ping" />
          <img
            src={incomingCall.caller.avatarUrl}
            alt={incomingCall.caller.displayName}
            className="relative w-14 h-14 rounded-full object-cover border-2 border-indigo-500"
          />
          <span className="absolute bottom-0 right-0 text-sm drop-shadow">{flag}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
            {incomingCall.callType === 'video' ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
            <span>Incoming {incomingCall.callType} Call</span>
          </div>
          <h4 className="text-base font-bold text-white truncate">{incomingCall.caller.displayName}</h4>
          <p className="text-xs text-slate-400 truncate">@{incomingCall.caller.username}</p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
        {/* Decline */}
        <button
          onClick={onDecline}
          className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-rose-950/50 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-700/60 font-semibold text-xs transition-all flex items-center justify-center gap-2"
        >
          <PhoneOff className="w-4 h-4 text-rose-400" />
          <span>Decline</span>
        </button>

        {/* Accept */}
        <button
          onClick={() => onAccept(incomingCall.callType)}
          className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
        >
          {incomingCall.callType === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
          <span>Accept</span>
        </button>
      </div>
    </div>
  );
};
