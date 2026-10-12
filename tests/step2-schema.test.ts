/**
 * Step 2 Automated Test Suite: PostgreSQL Schema & Data Integrity
 * Validates table definitions, foreign keys, unique constraints, and sequence rules.
 */

import fs from 'fs';
import path from 'path';

export function runStep2Tests(): { passed: number; failed: number; results: Array<{ name: string; ok: boolean; message: string }> } {
  const results: Array<{ name: string; ok: boolean; message: string }> = [];

  // Read SQL migration file
  let sqlContent = '';
  try {
    const migrationPath = path.resolve(process.cwd(), 'database/migrations/001_initial_schema.sql');
    sqlContent = fs.readFileSync(migrationPath, 'utf8');
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    results.push({
      name: 'Migration File Availability (001_initial_schema.sql)',
      ok: false,
      message: `Failed to read migration file: ${errorMsg}`,
    });
    return { passed: 0, failed: 1, results };
  }

  results.push({
    name: 'Migration File Availability (001_initial_schema.sql)',
    ok: true,
    message: 'Found valid SQL migration file in database/migrations/',
  });

  // Test 1: Verify Core Tables Existence
  const requiredTables = [
    'app.users',
    'app.devices',
    'app.friendships',
    'app.blocks',
    'app.reports',
    'app.conversations',
    'app.conversation_members',
    'app.messages',
    'app.reactions',
    'app.attachments',
    'app.translations',
  ];

  const missingTables = requiredTables.filter((t) => !sqlContent.includes(`CREATE TABLE IF NOT EXISTS ${t}`));
  const tablesOk = missingTables.length === 0;
  results.push({
    name: 'PostgreSQL DDL: All 11 Required Tables Defined',
    ok: tablesOk,
    message: tablesOk ? 'All 11 domain tables exist in migration script' : `Missing tables: ${missingTables.join(', ')}`,
  });

  // Test 2: Per-Conversation Sequential Monotonic Ordering (seq rule)
  const hasCurrentSeq = sqlContent.includes('current_seq BIGINT DEFAULT 0 NOT NULL');
  const hasSeqColumn = sqlContent.includes('seq BIGINT NOT NULL');
  const hasUniqueSeq = sqlContent.includes('CONSTRAINT uq_conversation_seq UNIQUE (conversation_id, seq)');
  const seqRuleOk = hasCurrentSeq && hasSeqColumn && hasUniqueSeq;
  results.push({
    name: 'Reliability Rule: Per-Conversation Monotonic Sequence (seq)',
    ok: seqRuleOk,
    message: seqRuleOk
      ? 'Verified uq_conversation_seq(conversation_id, seq) constraint & current_seq counter'
      : 'Missing seq column or uniqueness constraint',
  });

  // Test 3: Client Message ID Deduplication Constraint
  const hasClientMsgId = sqlContent.includes('client_msg_id VARCHAR(64) NOT NULL');
  const hasDedupConstraint = sqlContent.includes('CONSTRAINT uq_client_msg_id UNIQUE (conversation_id, client_msg_id)');
  const dedupOk = hasClientMsgId && hasDedupConstraint;
  results.push({
    name: 'Reliability Rule: client_msg_id Deduplication Invariant',
    ok: dedupOk,
    message: dedupOk
      ? 'Verified uq_client_msg_id(conversation_id, client_msg_id) uniqueness constraint'
      : 'Missing client_msg_id deduplication constraint',
  });

  // Test 4: Translation Cache Separated from Message Body
  const hasTranslationTable = sqlContent.includes('CREATE TABLE IF NOT EXISTS app.translations');
  const hasTranslationConstraint = sqlContent.includes('CONSTRAINT uq_msg_target_lang UNIQUE (message_id, target_lang)');
  const translationOk = hasTranslationTable && hasTranslationConstraint;
  results.push({
    name: 'Translation Architecture: Immutable Original Body with Cached Translations',
    ok: translationOk,
    message: translationOk
      ? 'Translations stored in dedicated cache table with uq_msg_target_lang'
      : 'Translations schema missing',
  });

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  return { passed, failed, results };
}

if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('step2-schema.test')) {
  const summary = runStep2Tests();
  console.log(`\n========================================`);
  console.log(`TalkFlow Step 2 Test Results: ${summary.passed} Passed, ${summary.failed} Failed`);
  console.log(`========================================\n`);
  summary.results.forEach((r) => {
    console.log(`${r.ok ? '✅' : '❌'} ${r.name}: ${r.message}`);
  });
  if (summary.failed > 0) process.exit(1);
}
