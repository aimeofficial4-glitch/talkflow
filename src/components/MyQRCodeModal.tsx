import React, { useEffect, useState, useRef } from 'react';
import { QrCode, Copy, Check, Share2, Download, X, Sparkles, ShieldCheck } from 'lucide-react';
import QRCode from 'qrcode';
import { UserProfile } from '../hooks/useTalkFlow.ts';
import { LocaleKey, LOCALES, getT } from '../utils/i18n.ts';

interface MyQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  currentLanguage: LocaleKey;
}

export const MyQRCodeModal: React.FC<MyQRCodeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentLanguage,
}) => {
  const t = getT(currentLanguage);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const inviteUrl = currentUser?.username
    ? `${window.location.origin}/invite/${currentUser.username}`
    : 'https://talkflow.app/invite/user';

  // Generate high-resolution QR code
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    QRCode.toDataURL(inviteUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate QR code', err);
      });
  }, [isOpen, currentUser, inviteUrl]);

  if (!isOpen || !currentUser) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Connect with ${currentUser.displayName} on TalkFlow`,
          text: `Add me on TalkFlow: @${currentUser.username}`,
          url: inviteUrl,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } catch (err) {
        // Share cancelled or unavailable
      }
    } else {
      handleCopy();
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `talkflow-qr-${currentUser.username}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const flag = LOCALES[currentUser.preferredLanguage]?.flag || '🌍';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm sm:max-w-md w-full overflow-hidden shadow-2xl flex flex-col relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Decorative Top Banner */}
        <div className="h-28 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 relative flex items-center justify-center">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/60 backdrop-blur-md text-white text-xs font-semibold shadow">
            <QrCode className="w-3.5 h-3.5 text-cyan-300" />
            <span>My Personal QR Code</span>
          </div>
        </div>

        {/* Card Body */}
        <div ref={cardRef} className="px-6 pb-6 pt-0 space-y-5 -mt-12">
          {/* Avatar & Identity */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="relative">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.displayName}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-slate-900 shadow-xl"
              />
              <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-900 border border-slate-700 text-xs">
                {flag}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-center gap-1.5">
                <h3 className="font-bold text-lg text-white">{currentUser.displayName}</h3>
                {currentUser.role === 'admin' && (
                  <span className="p-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-cyan-400 font-semibold">@{currentUser.username}</p>
              {currentUser.country && (
                <p className="text-[11px] text-slate-400 mt-0.5">{currentUser.country}</p>
              )}
            </div>
          </div>

          {/* QR Code Container */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner space-y-3">
            <div className="p-3 bg-white rounded-2xl shadow-lg relative group">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR code for @${currentUser.username}`}
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                  Generating QR...
                </div>
              )}
            </div>
            <div className="text-center space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-300">
                Scan with camera to connect instantly on TalkFlow
              </span>
              <p className="text-[10px] text-slate-500 font-mono">
                No typing required • Auto-resolves timezone &amp; region
              </p>
            </div>
          </div>

          {/* Shareable Link Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Shareable Invitation Link
            </label>
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1.5">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="bg-transparent text-xs text-slate-300 font-mono flex-1 px-2 focus:outline-none truncate"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow cursor-pointer shrink-0"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleShare}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-700"
            >
              <Share2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{shareSuccess ? 'Shared!' : 'Share Link'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save Image</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
