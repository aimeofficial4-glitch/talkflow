/**
 * TalkFlow Unified Test Suite Runner (Steps 1 through 7)
 * Runs all unit and integration tests across the entire TalkFlow system architecture.
 */

import { runStep1Tests } from './step1-infra.test.ts';
import { runStep2Tests } from './step2-schema.test.ts';
import { runStep3Tests } from './step3-auth.test.ts';
import { runStep4Tests } from './step4-gateway.test.ts';
import { runStep5Tests } from './step5-friends.test.ts';
import { runStep6Tests } from './step6-client.test.ts';
import { runStep7Tests } from './step7-reliability.test.ts';
import { runStep8Tests } from './step8-social.test.ts';
import { runStep9Tests } from './step9-accounts-admin-eastafrica.test.ts';

export function runAllTalkFlowTests() {
  console.log(`\n================================================================`);
  console.log(`🚀 RUNNING FULL TALKFLOW SYSTEM ARCHITECTURE TESTS (STEPS 1 - 9)`);
  console.log(`================================================================\n`);

  const suites = [
    { step: 1, title: 'Project Structure & Docker Compose', fn: runStep1Tests },
    { step: 2, title: 'PostgreSQL 16 Schema & Migrations', fn: runStep2Tests },
    { step: 3, title: 'Auth Module & Multi-Device Sessions', fn: runStep3Tests },
    { step: 4, title: 'WebSocket Gateway & Monotonic Seq Sync', fn: runStep4Tests },
    { step: 5, title: 'Friends & Safety Controls Module', fn: runStep5Tests },
    { step: 6, title: 'React Web Client & 24 Country Languages RTL', fn: runStep6Tests },
    { step: 7, title: 'Reliability, Outbox & Translation Cache', fn: runStep7Tests },
    { step: 8, title: 'Video/Voice Calling, Stories, Channels & Polls', fn: runStep8Tests },
    { step: 9, title: 'Account Creation, Admin Role & East African Countries', fn: runStep9Tests },
  ];

  let totalPassed = 0;
  let totalFailed = 0;

  suites.forEach((suite) => {
    console.log(`----------------------------------------------------------------`);
    console.log(`▶ STEP ${suite.step}: ${suite.title}`);
    console.log(`----------------------------------------------------------------`);
    const result = suite.fn();
    totalPassed += result.passed;
    totalFailed += result.failed;

    result.results.forEach((r) => {
      console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}`);
      console.log(`     ↳ ${r.message}`);
    });
    console.log('');
  });

  console.log(`================================================================`);
  console.log(`📊 TALKFLOW TEST SUMMARY: ${totalPassed} Passed, ${totalFailed} Failed`);
  console.log(`================================================================\n`);

  if (totalFailed > 0) {
    if (typeof process !== 'undefined') process.exit(1);
  }
}

if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('run-all-tests')) {
  runAllTalkFlowTests();
}
