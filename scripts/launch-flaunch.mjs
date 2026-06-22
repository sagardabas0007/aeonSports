/**
 * Launch all 9 existing Clanker tokens on Flaunch as well.
 * Reads match_awards from Supabase and calls /api/tokens/launch
 * for each award that doesn't yet have a Flaunch token.
 *
 * Usage: node scripts/launch-flaunch.mjs
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
const DELAY_MS = 20_000; // 20s between launches to avoid rate limits

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function log(icon, msg) { console.log(`${icon}  ${msg}`); }

async function getAwardsMissingFlaunch() {
  // Get all awards that have a Clanker token but no Flaunch token
  const { data: awards, error } = await supabase
    .from('match_awards')
    .select(`
      id,
      award_type,
      match_id,
      player:players(name),
      tokens(id, launch_platform)
    `);

  if (error) throw new Error(`Awards fetch failed: ${error.message}`);

  return (awards ?? []).filter((award) => {
    const platforms = (award.tokens ?? []).map((t) => t.launch_platform);
    return !platforms.includes('flaunch');
  });
}

async function getMatchById(matchId) {
  const { data, error } = await supabase
    .from('matches')
    .select('id, home_team, away_team, home_score, away_score')
    .eq('id', matchId)
    .single();
  if (error) throw new Error(`Match fetch failed: ${error.message}`);
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

const AWARD_TYPE_TO_CATEGORY = {
  mvp: 'MVP',
  best_defender: 'Best Defender',
  most_assists: 'Most Assists',
};

async function main() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  AeonSports — Flaunch Token Launch');
  console.log('═══════════════════════════════════════════════════════\n');

  // Check dev server
  try {
    await fetch(`${API_BASE}/api/matches`);
    log('✅', 'Dev server reachable');
  } catch {
    console.error('❌  Dev server not running on port 3000');
    process.exit(1);
  }

  const awards = await getAwardsMissingFlaunch();
  log('ℹ️ ', `${awards.length} awards need Flaunch launch`);

  if (awards.length === 0) {
    log('✅', 'All tokens already launched on Flaunch!');
    return;
  }

  const results = [];

  for (let i = 0; i < awards.length; i++) {
    const award = awards[i];
    const playerName = award.player?.name;
    const category = AWARD_TYPE_TO_CATEGORY[award.award_type];
    const match = await getMatchById(award.match_id);
    const label = `${match.home_team} ${match.home_score}-${match.away_score} ${match.away_team}`;

    if (i > 0) {
      log('⏳', `Waiting ${DELAY_MS / 1000}s...`);
      await sleep(DELAY_MS);
    }

    console.log(`\n[${i + 1}/${awards.length}] ${label} | ${playerName} (${category})`);
    log('🚀', 'Launching on Flaunch...');

    try {
      const result = await launchToken(match.id, playerName, category);
      const flaunch = result.platforms?.flaunch;

      if (flaunch?.success) {
        log('✅', 'Flaunch success!');
        log('🔗', `Contract: ${flaunch.contractAddress}`);
        log('🔗', `Tx: ${flaunch.transactionHash}`);
      } else {
        log('⚠️ ', `Flaunch failed: ${flaunch?.error || result.error || 'unknown'}`);
      }

      results.push({ label, playerName, category, flaunch });
    } catch (err) {
      log('❌', `Error: ${err.message}`);
      results.push({ label, playerName, category, error: err.message });
    }
  }

  // Summary
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('  FLAUNCH SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  let ok = 0, fail = 0;
  for (const r of results) {
    const success = r.flaunch?.success;
    console.log(`${success ? '✅' : '❌'}  ${r.label} | ${r.playerName} (${r.category})`);
    if (success) {
      console.log(`     Contract: ${r.flaunch?.contractAddress ?? '—'}`);
      ok++;
    } else {
      console.log(`     Error: ${r.flaunch?.error || r.error || 'unknown'}`);
      fail++;
    }
  }
  console.log(`\n  Launched: ${ok}   Failed: ${fail}   Total: ${results.length}`);
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
