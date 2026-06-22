/**
 * Retry failed token launches for Germany and Japan matches.
 * Adds 20s delay between each launch to avoid Clanker / Flaunch rate limits.
 *
 * Usage: node scripts/retry-failed.mjs
 *        (Run while `npm run dev` is running on port 3000)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env vars
const envContent = readFileSync(join(__dirname, '..', '.env.local'), 'utf8');
envContent.split('\n').forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const idx = trimmed.indexOf('=');
  if (idx === -1) return;
  const key = trimmed.slice(0, idx).trim();
  const val = trimmed.slice(idx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_BASE = 'http://localhost:3000';
const DELAY_MS = 25_000; // 25 seconds between launches

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Failed tokens from the previous run — Germany & Japan
const FAILED_TOKENS = [
  { externalId: 'wc2026-ger-civ-0621', playerName: 'Deniz Undav', category: 'MVP' },
  { externalId: 'wc2026-ger-civ-0621', playerName: 'Yan Diomandé', category: 'Best Defender' },
  { externalId: 'wc2026-ger-civ-0621', playerName: 'Nadiem Amiri', category: 'Most Assists' },
  { externalId: 'wc2026-jpn-tun-0621', playerName: 'Ayase Ueda', category: 'MVP' },
  { externalId: 'wc2026-jpn-tun-0621', playerName: 'Ko Itakura', category: 'Best Defender' },
  { externalId: 'wc2026-jpn-tun-0621', playerName: 'Daichi Kamada', category: 'Most Assists' },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(icon, msg) {
  console.log(`${icon}  ${msg}`);
}

async function getMatchId(externalId) {
  const { data, error } = await supabase
    .from('matches')
    .select('id, home_team, away_team, home_score, away_score')
    .eq('external_id', externalId)
    .single();
  if (error || !data) throw new Error(`Match not found for external_id: ${externalId}`);
  return data;
}

async function launchToken(matchId, playerName, category) {
  const res = await fetch(`${API_BASE}/api/tokens/launch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matchId, playerName, category }),
  });
  return res.json();
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  AeonSports — Retry Failed Token Launches');
  console.log('═══════════════════════════════════════════════════════\n');
  log('ℹ️ ', `${FAILED_TOKENS.length} tokens to retry — ${DELAY_MS / 1000}s delay between each`);

  const results = [];

  for (let i = 0; i < FAILED_TOKENS.length; i++) {
    const { externalId, playerName, category } = FAILED_TOKENS[i];

    if (i > 0) {
      log('⏳', `Waiting ${DELAY_MS / 1000}s before next launch...`);
      await sleep(DELAY_MS);
    }

    const match = await getMatchId(externalId);
    const label = `${match.home_team} ${match.home_score}-${match.away_score} ${match.away_team}`;
    console.log(`\n[${i + 1}/${FAILED_TOKENS.length}] ${label} | ${playerName} (${category})`);

    log('🚀', 'Launching...');
    try {
      const result = await launchToken(match.id, playerName, category);

      if (result.success) {
        log('✅', 'Token launched!');
        const cAddr = result.platforms?.clanker?.contractAddress;
        const fAddr = result.platforms?.flaunch?.contractAddress;
        if (cAddr) log('🔗', `Clanker: ${cAddr}`);
        if (fAddr) log('🔗', `Flaunch: ${fAddr}`);
      } else {
        log('⚠️ ', `Partial/failed: ${result.error || 'see platform errors below'}`);
        if (result.platforms?.clanker?.error) log('ℹ️ ', `Clanker: ${result.platforms.clanker.error}`);
        if (result.platforms?.flaunch?.error) log('ℹ️ ', `Flaunch: ${result.platforms.flaunch.error}`);
      }

      results.push({ label, playerName, category, result });
    } catch (err) {
      log('❌', `Error: ${err.message}`);
      results.push({ label, playerName, category, error: err.message });
    }
  }

  // Summary
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('  RETRY SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  let ok = 0, fail = 0;
  for (const r of results) {
    const success = r.result?.success;
    console.log(`${success ? '✅' : '❌'}  ${r.label} | ${r.playerName} (${r.category})`);
    if (success) {
      console.log(`     Clanker: ${r.result?.platforms?.clanker?.contractAddress ?? '—'}`);
      console.log(`     Flaunch: ${r.result?.platforms?.flaunch?.contractAddress ?? '—'}`);
      ok++;
    } else {
      console.log(`     Error: ${r.result?.error || r.error || 'unknown'}`);
      fail++;
    }
  }
  console.log(`\n  Launched: ${ok}   Failed: ${fail}`);
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
