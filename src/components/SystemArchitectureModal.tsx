import React, { useState } from 'react';
import { X, Layers, Database, Cpu, ShieldCheck, Globe, GitBranch, Terminal, FileCode } from 'lucide-react';

interface SystemArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemArchitectureModal: React.FC<SystemArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [selectedTopic, setSelectedTopic] = useState<'flow' | 'sql' | 'rules' | 'docker'>('flow');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">TalkFlow Full System Architecture</h3>
              <p className="text-xs text-slate-400">Step 1 to 7 Implementation Blueprint</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-800 gap-2 shrink-0">
          {[
            { id: 'flow', label: 'Message Flow & Seq Protocol', icon: GitBranch },
            { id: 'sql', label: 'PostgreSQL 16 Schema (Step 2)', icon: Database },
            { id: 'rules', label: 'Reliability & Dedup Rules', icon: ShieldCheck },
            { id: 'docker', label: 'Docker Compose Stack (Step 1)', icon: Cpu },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedTopic === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTopic(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
                  isSelected
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto space-y-4 text-xs text-slate-300">
          {selectedTopic === 'flow' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 font-mono">
                <div className="text-indigo-400 font-bold">1. Client Message Generation</div>
                <p className="text-slate-400">
                  Client produces UUID: <code className="text-indigo-300">client_msg_id = cmsg_9f82b1...</code>
                  <br />Message placed in optimistic state + offline outbox queue.
                </p>

                <div className="text-cyan-400 font-bold">2. Server Deduplication & Monotonic Ordering</div>
                <p className="text-slate-400">
                  Server verifies <code className="text-cyan-300">uq_client_msg_id(conversation_id, client_msg_id)</code>.
                  <br />Increments per-conversation sequence counter: <code className="text-cyan-300">seq = current_seq + 1</code>.
                  <br />Eliminates client clock drift across Tokyo, Cairo, SF, and Madrid.
                </p>

                <div className="text-emerald-400 font-bold">3. Database Write Before ACK</div>
                <p className="text-slate-400">
                  Message committed to PostgreSQL <code className="text-emerald-300">app.messages</code> BEFORE dispatching network ACK to sender.
                  <br />Sender receives <code className="text-emerald-300">msg_ack</code> with assigned <code className="text-emerald-300">seq</code>.
                </p>

                <div className="text-amber-400 font-bold">4. Redis Pub/Sub Fanout & Push Notification Fallback</div>
                <p className="text-slate-400">
                  Server fans out message to all recipient gateway sockets via Redis channel.
                  <br />If recipient has zero open sockets: FCM / APNs background push notification is triggered.
                </p>

                <div className="text-rose-400 font-bold">5. Reconnection Catch-Up via last_seen_seq</div>
                <p className="text-slate-400">
                  Client sends <code className="text-rose-300">sync_request(conversation_id, last_seen_seq=12)</code>.
                  <br />Gateway streams all messages where <code className="text-rose-300">seq &gt; 12</code> ordered monotonically.
                </p>
              </div>
            </div>
          )}

          {selectedTopic === 'sql' && (
            <div className="space-y-3">
              <p className="text-slate-400">
                PostgreSQL migration file generated in <code className="text-indigo-300">database/migrations/001_initial_schema.sql</code>:
              </p>
              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-96">
{`-- Core Tables
CREATE TABLE app.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(32) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    preferred_language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC'
);

CREATE TABLE app.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app.users(id) ON DELETE CASCADE,
    device_name VARCHAR(100) NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE TABLE app.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) DEFAULT 'direct',
    current_seq BIGINT DEFAULT 0 NOT NULL
);

CREATE TABLE app.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_msg_id VARCHAR(64) NOT NULL,
    conversation_id UUID REFERENCES app.conversations(id),
    seq BIGINT NOT NULL,
    sender_id UUID REFERENCES app.users(id),
    body TEXT NOT NULL,
    CONSTRAINT uq_client_msg_id UNIQUE (conversation_id, client_msg_id),
    CONSTRAINT uq_conversation_seq UNIQUE (conversation_id, seq)
);

CREATE TABLE app.translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES app.messages(id) ON DELETE CASCADE,
    target_lang VARCHAR(10) NOT NULL,
    translated_text TEXT NOT NULL,
    CONSTRAINT uq_msg_target_lang UNIQUE (message_id, target_lang)
);`}
              </pre>
            </div>
          )}

          {selectedTopic === 'rules' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="font-semibold text-indigo-400">Strict Monotonic Sequence (seq)</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Never use timestamps for message ordering. Network jitter and client clock skew cause out-of-order bugs. TalkFlow uses a strictly ascending integer per conversation.
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="font-semibold text-cyan-400">Ephemeral Presence & Typing</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Redis keys with 60s TTL for presence and 5s TTL for typing indicators. Never write ephemeral states to PostgreSQL tables.
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="font-semibold text-emerald-400">Original Text Preservation</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Translated messages are cached in `app.translations`. The original message body in `app.messages` is 100% immutable and never overwritten.
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="font-semibold text-amber-400">Offline Outbox & Catchup</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    When socket drops, messages queue in memory/IndexedDB. Reconnection drains outbox with exponential backoff and syncs missed messages from `last_seen_seq`.
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedTopic === 'docker' && (
            <div className="space-y-3">
              <p className="text-slate-400">
                Single-region MVP with multi-region scaling readiness:
              </p>
              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto leading-relaxed max-h-96">
{`services:
  postgres:
    image: postgres:16-alpine
    container_name: talkflow-postgres
    ports: ["5432:5432"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U talkflow_admin -d talkflow"]

  redis:
    image: redis:7.2-alpine
    container_name: talkflow-redis
    command: >
      redis-server
      --requirepass talkflow_redis_secret_pass_2026
      --appendonly yes
      --maxmemory 512mb
      --maxmemory-policy volatile-lru
    ports: ["6379:6379"]`}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
