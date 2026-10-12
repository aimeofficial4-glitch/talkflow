import React, { useState } from 'react';
import { Image as ImageIcon, Type, Sparkles, X, Check } from 'lucide-react';
import { UserProfile } from '../hooks/useTalkFlow.ts';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onCreateStory: (data: { mediaUrl?: string; text?: string; backgroundGradient?: string }) => void;
}

const GRADIENTS = [
  { name: 'Indigo Dream', value: 'from-indigo-900 via-purple-900 to-slate-900' },
  { name: 'Emerald Oasis', value: 'from-emerald-900 via-teal-900 to-slate-900' },
  { name: 'Sunset Warmth', value: 'from-amber-900 via-rose-900 to-slate-900' },
  { name: 'Tokyo Neon', value: 'from-pink-900 via-fuchsia-900 to-slate-900' },
  { name: 'Deep Midnight', value: 'from-blue-950 via-slate-900 to-black' },
];

const PHOTO_PRESETS = [
  {
    title: 'Tokyo City Lights',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'Cairo Sunset',
    url: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'Madrid Tapas & Architecture',
    url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'Bengaluru Morning',
    url: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'San Francisco Bay',
    url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&auto=format&fit=crop&q=80',
  },
];

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onCreateStory,
}) => {
  const [tab, setTab] = useState<'text' | 'photo'>('text');
  const [text, setText] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0].value);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'text' && !text.trim()) return;
    if (tab === 'photo' && !selectedPhoto && !customPhotoUrl.trim()) return;

    if (tab === 'text') {
      onCreateStory({
        text: text.trim(),
        backgroundGradient: selectedGradient,
      });
    } else {
      onCreateStory({
        mediaUrl: customPhotoUrl.trim() || selectedPhoto || undefined,
        text: text.trim() || undefined,
      });
    }

    setText('');
    setSelectedPhoto(null);
    setCustomPhotoUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base text-white">Add 24h Status / Story</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-2 gap-2">
          <button
            onClick={() => setTab('text')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              tab === 'text'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Text Status</span>
          </button>
          <button
            onClick={() => setTab('photo')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              tab === 'photo'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Photo Status</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {tab === 'text' ? (
            /* Text Story Preview & Input */
            <div className="space-y-4">
              <div
                className={`w-full h-44 rounded-2xl bg-gradient-to-br ${selectedGradient} p-5 flex items-center justify-center text-center shadow-inner`}
              >
                <p className="text-white font-bold text-lg md:text-xl drop-shadow leading-relaxed break-words max-w-xs">
                  {text || 'Type your status here...'}
                </p>
              </div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={200}
                placeholder="What's on your mind? Share an update with friends worldwide..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />

              {/* Gradient selector */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">
                  Pick Background Color:
                </span>
                <div className="flex items-center gap-2">
                  {GRADIENTS.map((g, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedGradient(g.value)}
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${g.value} border-2 transition-all ${
                        selectedGradient === g.value
                          ? 'border-white scale-110 shadow-lg'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      title={g.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Photo Story Preview & Input */
            <div className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">
                  Select a Global Preset:
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {PHOTO_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedPhoto(p.url);
                        setCustomPhotoUrl('');
                      }}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                        selectedPhoto === p.url && !customPhotoUrl
                          ? 'border-indigo-500 scale-105 shadow-md'
                          : 'border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={p.url} alt={p.title} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Image URL input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 font-mono uppercase">
                  Or Image URL:
                </label>
                <input
                  type="url"
                  value={customPhotoUrl}
                  onChange={(e) => {
                    setCustomPhotoUrl(e.target.value);
                    setSelectedPhoto(null);
                  }}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Photo Caption */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 font-mono uppercase">
                  Caption (Optional):
                </label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Add a caption..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
            >
              Share Status (24 Hours)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
