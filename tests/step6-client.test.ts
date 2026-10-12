/**
 * Step 6 Automated Test Suite: Client Internationalization & RTL Bidirectionality
 * Validates language dictionary completeness, RTL detection, and UI layout metadata.
 */

import { LOCALES, TRANSLATIONS, LocaleKey } from '../src/utils/i18n.ts';

export function runStep6Tests(): { passed: number; failed: number; results: Array<{ name: string; ok: boolean; message: string }> } {
  const results: Array<{ name: string; ok: boolean; message: string }> = [];

  // Test 1: Full 24 Country Language Registry Completeness
  const localeCount = Object.keys(LOCALES).length;
  const ok24 = localeCount >= 24;
  results.push({
    name: 'Global Multi-Country Languages Registry (24 locales)',
    ok: ok24,
    message: ok24
      ? `Successfully loaded ${localeCount} country locales covering all world regions`
      : `Expected 24 country languages, found ${localeCount}`,
  });

  // Test 2: Right-to-Left (RTL) Languages Detection
  const rtlLocales: LocaleKey[] = ['ar', 'fa', 'ur', 'he'];
  const allRtlCorrect = rtlLocales.every((code) => LOCALES[code]?.dir === 'rtl');
  results.push({
    name: 'RTL Script Direction Detection (Arabic, Persian, Urdu, Hebrew)',
    ok: allRtlCorrect,
    message: allRtlCorrect
      ? 'Verified dir="rtl" mapping for Arabic (ar), Persian (fa), Urdu (ur), and Hebrew (he)'
      : 'RTL direction detection failure',
  });

  // Test 3: Essential UI Key Localization Completeness
  const requiredKeys = ['appTitle', 'chats', 'friends', 'online', 'offline', 'send', 'translateTo'];
  const missingInAny: string[] = [];

  (Object.keys(TRANSLATIONS) as LocaleKey[]).forEach((lang) => {
    requiredKeys.forEach((key) => {
      if (!TRANSLATIONS[lang] || !TRANSLATIONS[lang][key]) {
        missingInAny.push(`${lang}:${key}`);
      }
    });
  });

  const i18nKeysOk = missingInAny.length === 0;
  results.push({
    name: 'Dictionary Coverage for Core Chat Actions',
    ok: i18nKeysOk,
    message: i18nKeysOk
      ? 'All essential UI action keys localized across language dictionaries'
      : `Missing translations: ${missingInAny.slice(0, 5).join(', ')}`,
  });

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  return { passed, failed, results };
}

if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('step6-client.test')) {
  const summary = runStep6Tests();
  console.log(`\n========================================`);
  console.log(`TalkFlow Step 6 Test Results: ${summary.passed} Passed, ${summary.failed} Failed`);
  console.log(`========================================\n`);
  summary.results.forEach((r) => {
    console.log(`${r.ok ? '✅' : '❌'} ${r.name}: ${r.message}`);
  });
  if (summary.failed > 0) process.exit(1);
}
