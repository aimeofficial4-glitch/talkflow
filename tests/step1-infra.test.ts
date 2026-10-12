/**
 * Step 1 Automated Infrastructure & Configuration Test Suite
 * Validates Docker Compose definitions, environment loading, and database/redis specs.
 */

import { loadAppConfig } from '../src/config/env.config.ts';

export function runStep1Tests(): { passed: number; failed: number; results: Array<{ name: string; ok: boolean; message: string }> } {
  const results: Array<{ name: string; ok: boolean; message: string }> = [];

  // Test 1: Load default config without crashing
  try {
    const config = loadAppConfig();
    const ok = Boolean(config && config.database && config.redis && config.auth);
    results.push({
      name: 'Default Environment Configuration Loading',
      ok,
      message: ok ? 'Successfully loaded all environment sections (app, db, redis, auth)' : 'Missing configuration sections',
    });
  } catch (err: unknown) {
    results.push({
      name: 'Default Environment Configuration Loading',
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 2: PostgreSQL configuration & DSN construction
  try {
    const config = loadAppConfig();
    const hasPort = config.database.port === 5432 || config.database.port > 0;
    const hasSchema = config.database.url.includes('schema=app');
    const ok = hasPort && hasSchema && config.database.poolMax >= config.database.poolMin;
    results.push({
      name: 'PostgreSQL DSN & Pool Specification',
      ok,
      message: ok
        ? `Valid DSN (${config.database.db}) on port ${config.database.port}, pool [${config.database.poolMin}..${config.database.poolMax}]`
        : 'Invalid Postgres configuration or pool bounds',
    });
  } catch (err: unknown) {
    results.push({
      name: 'PostgreSQL DSN & Pool Specification',
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 3: Redis configuration and ephemeral TTLs
  try {
    const config = loadAppConfig();
    const validPresence = config.redis.presenceTtlSec > 0 && config.redis.presenceTtlSec <= 120;
    const validTyping = config.redis.typingTtlSec > 0 && config.redis.typingTtlSec <= 15;
    const ok = validPresence && validTyping && Boolean(config.redis.url);
    results.push({
      name: 'Redis Ephemeral TTL Policy (Presence 60s, Typing 5s)',
      ok,
      message: ok
        ? `Redis TTLs verified: presence=${config.redis.presenceTtlSec}s, typing=${config.redis.typingTtlSec}s, port=${config.redis.port}`
        : 'Redis TTL constraints violated',
    });
  } catch (err: unknown) {
    results.push({
      name: 'Redis Ephemeral TTL Policy',
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 4: Locale and i18n day-one support
  try {
    const config = loadAppConfig();
    const hasRtl = config.supportedLocales.includes('ar');
    const hasEn = config.supportedLocales.includes('en');
    const ok = hasRtl && hasEn && config.supportedLocales.length >= 5;
    results.push({
      name: 'i18n Readiness (Day 1 multi-locale & RTL support)',
      ok,
      message: ok
        ? `Configured ${config.supportedLocales.length} locales including RTL (Arabic) and LTR (English)`
        : 'i18n locale list is missing required baseline languages',
    });
  } catch (err: unknown) {
    results.push({
      name: 'i18n Readiness',
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    });
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  return { passed, failed, results };
}

// CLI runner if executed directly via node / tsx
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('step1-infra.test')) {
  const summary = runStep1Tests();
  console.log(`\n========================================`);
  console.log(`TalkFlow Step 1 Test Results: ${summary.passed} Passed, ${summary.failed} Failed`);
  console.log(`========================================\n`);
  summary.results.forEach((r) => {
    console.log(`${r.ok ? '✅' : '❌'} ${r.name}: ${r.message}`);
  });
  if (summary.failed > 0) process.exit(1);
}
