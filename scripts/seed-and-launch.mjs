/**
 * AeonSports - World Cup 2026 Seed & Token Launch Script
 *
 * Seeds the last 5 WC 2026 matches into Supabase (matches, players, awards)
 * then calls the local Next.js API to launch tokens for each award.
 *
 * Usage: node scripts/seed-and-launch.mjs
 *        (Run while `npm run dev` is running on port 3000)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local from project root
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf8');
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

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─────────────────────────────────────────────────────────────────────────────
// Match data — last 5 World Cup 2026 group-stage fixtures
// Sources: ESPN, Al Jazeera, Opta Analyst, NBC Sports (June 21-22 2026)
// ─────────────────────────────────────────────────────────────────────────────
const MATCHES = [
  {
    external_id: 'wc2026-arg-aut-0622',
    home_team: 'Argentina',
    away_team: 'Austria',
    home_score: 2,
    away_score: 0,
    match_date: '2026-06-22T22:00:00Z',
    league: 'FIFA World Cup 2026',
    season: '2026',
    venue: 'AT&T Stadium, Dallas',
    match_data: {
      group: 'Group E',
      attendance: 68000,
      referee: 'Szymon Marciniak',
      goals: [
        { player: 'Lionel Messi', team: 'Argentina', minute: 38 },
        { player: 'Lionel Messi', team: 'Argentina', minute: 90 },
      ],
    },
    awards: [
      {
        category: 'MVP',
        player: {
          external_id: 'wc2026-messi-arg',
          name: 'Lionel Messi',
          team: 'Argentina',
          position: 'Forward',
          nationality: 'Argentine',
        },
        analysis:
          'Lionel Messi delivered a masterclass performance against Austria, scoring twice to claim the all-time men\'s World Cup scoring record with 18 goals. His 38th-minute opener — a precise bottom-corner finish off Medina\'s assist — was followed by a poacher\'s goal deep in stoppage time. Messi now stands alone as the greatest scorer in World Cup history, surpassing Miroslav Klose.',
        statistics: {
          goals: 2,
          assists: 0,
          shots: 4,
          shots_on_target: 2,
          dribbles_completed: 3,
          passes_completed: 32,
          rating: 9.5,
          record: 'All-time WC leading scorer (18 goals)',
        },
      },
      {
        category: 'Best Defender',
        player: {
          external_id: 'wc2026-martinez-arg',
          name: 'Lisandro Martínez',
          team: 'Argentina',
          position: 'Defender',
          nationality: 'Argentine',
        },
        analysis:
          'Lisandro Martínez was immovable at the heart of Argentina\'s defence, marshalling a clean sheet and snuffing out every Austrian attack. The Manchester United centre-back won all his aerial duels, made three crucial interceptions and kept Marko Arnautovic scoreless throughout.',
        statistics: {
          goals: 0,
          assists: 0,
          clearances: 5,
          interceptions: 3,
          aerial_duels_won: 4,
          tackles: 3,
          clean_sheet: true,
          rating: 8.1,
        },
      },
      {
        category: 'Most Assists',
        player: {
          external_id: 'wc2026-medina-arg',
          name: 'Facundo Medina',
          team: 'Argentina',
          position: 'Defender',
          nationality: 'Argentine',
        },
        analysis:
          'Facundo Medina\'s powerful quick touch from deep played in Lionel Messi for the record-breaking opener. The RC Lens defender showed his technical quality, combining long-range distribution with an incisive through-ball that unlocked the Austrian backline at a crucial moment.',
        statistics: {
          goals: 0,
          assists: 1,
          key_passes: 2,
          passes_completed: 54,
          pass_accuracy: 91,
          rating: 7.8,
        },
      },
    ],
  },

  {
    external_id: 'wc2026-fra-ira-0622',
    home_team: 'France',
    away_team: 'Iraq',
    home_score: 1,
    away_score: 0,
    match_date: '2026-06-22T19:00:00Z',
    league: 'FIFA World Cup 2026',
    season: '2026',
    venue: 'MetLife Stadium, New Jersey',
    match_data: {
      group: 'Group D',
      attendance: 82500,
      goals: [
        { player: 'Kylian Mbappé', team: 'France', minute: 14 },
      ],
    },
    awards: [
      {
        category: 'MVP',
        player: {
          external_id: 'wc2026-mbappe-fra',
          name: 'Kylian Mbappé',
          team: 'France',
          position: 'Forward',
          nationality: 'French',
        },
        analysis:
          'Kylian Mbappé was the difference-maker for France, firing a vicious left-footed shot from just outside the area in the 14th minute after being set up by Michael Olise. The goal was Mbappé\'s 15th at World Cups, placing him alongside Cristiano Ronaldo in the all-time rankings and cementing his status as the heir apparent to the world-record scorer Messi.',
        statistics: {
          goals: 1,
          assists: 0,
          shots: 5,
          shots_on_target: 3,
          dribbles_completed: 4,
          key_passes: 2,
          world_cup_goals: 15,
          rating: 8.8,
        },
      },
      {
        category: 'Best Defender',
        player: {
          external_id: 'wc2026-upamecano-fra',
          name: 'Dayot Upamecano',
          team: 'France',
          position: 'Defender',
          nationality: 'French',
        },
        analysis:
          'Dayot Upamecano delivered a dominant defensive display, anchoring France\'s back line and keeping Iraq\'s attack completely shut out. The Bayern Munich centre-back won every aerial battle, completed 95% of his passes and showcased the commanding physicality that makes France\'s defence among the best in the tournament.',
        statistics: {
          goals: 0,
          assists: 0,
          clearances: 6,
          interceptions: 4,
          aerial_duels_won: 5,
          tackles: 4,
          clean_sheet: true,
          rating: 8.3,
        },
      },
      {
        category: 'Most Assists',
        player: {
          external_id: 'wc2026-olise-fra',
          name: 'Michael Olise',
          team: 'France',
          position: 'Midfielder',
          nationality: 'French',
        },
        analysis:
          'Michael Olise provided the assist for Mbappé\'s opener, threading a precise ball from the right wing that the striker converted. The Bayern Munich winger was a constant menace throughout, combining quick feet and incisive passing to stretch Iraq\'s defensive shape.',
        statistics: {
          goals: 0,
          assists: 1,
          key_passes: 4,
          dribbles_completed: 5,
          chances_created: 3,
          passes_completed: 38,
          rating: 7.9,
        },
      },
    ],
  },

  {
    external_id: 'wc2026-ned-swe-0621',
    home_team: 'Netherlands',
    away_team: 'Sweden',
    home_score: 5,
    away_score: 1,
    match_date: '2026-06-21T01:00:00Z',
    league: 'FIFA World Cup 2026',
    season: '2026',
    venue: 'Houston Stadium',
    match_data: {
      group: 'Group F',
      attendance: 68900,
      goals: [
        { player: 'Brian Brobbey', team: 'Netherlands', minute: 5 },
        { player: 'Brian Brobbey', team: 'Netherlands', minute: 17 },
        { player: 'Cody Gakpo', team: 'Netherlands', minute: 53 },
        { player: 'Cody Gakpo', team: 'Netherlands', minute: 61 },
        { player: 'Crysencio Summerville', team: 'Netherlands', minute: 89 },
        { player: 'Anthony Elanga', team: 'Sweden', minute: 94 },
      ],
    },
    awards: [
      {
        category: 'MVP',
        player: {
          external_id: 'wc2026-brobbey-ned',
          name: 'Brian Brobbey',
          team: 'Netherlands',
          position: 'Forward',
          nationality: 'Dutch',
        },
        analysis:
          'Brian Brobbey delivered one of the tournament\'s most explosive opening performances, netting in the 5th and 17th minutes to record the fourth-fastest World Cup brace since 1986 — only behind Lukas Podolski (2006), Ronaldo Nazário (2002) and Gary Lineker (1986). The Ajax striker\'s predatory finishing and relentless pressing set the tone for the Dutch rout.',
        statistics: {
          goals: 2,
          assists: 0,
          shots: 5,
          shots_on_target: 3,
          brace_time_minutes: 12,
          historical_rank: '4th fastest WC brace since 1986',
          rating: 9.2,
        },
      },
      {
        category: 'Best Defender',
        player: {
          external_id: 'wc2026-verbruggen-ned',
          name: 'Bart Verbruggen',
          team: 'Netherlands',
          position: 'Goalkeeper',
          nationality: 'Dutch',
        },
        analysis:
          'Bart Verbruggen was commanding in the Dutch goal, making three crucial saves to keep the scoreline respectable until deep injury time. The Brighton goalkeeper directed his defensive line with authority, contributing to a near-clean sheet that underlined the Netherlands\' defensive solidity alongside their attacking firepower.',
        statistics: {
          goals_conceded: 1,
          saves: 3,
          clean_sheet: false,
          rating: 7.6,
        },
      },
      {
        category: 'Most Assists',
        player: {
          external_id: 'wc2026-gakpo-ned',
          name: 'Cody Gakpo',
          team: 'Netherlands',
          position: 'Forward',
          nationality: 'Dutch',
        },
        analysis:
          'Cody Gakpo was the architect of the Dutch avalanche, setting up Brian Brobbey\'s opener before going on to score twice himself. His tally of five World Cup group-stage goals equals Robin van Persie\'s Dutch record. Gakpo combined creative link-up play with a clinical finish, making him equally the tournament\'s top assist threat and goalscorer.',
        statistics: {
          goals: 2,
          assists: 1,
          key_passes: 3,
          shots: 4,
          shots_on_target: 3,
          dutch_wc_group_record: '5 goals, equals van Persie',
          rating: 9.0,
        },
      },
    ],
  },

  {
    external_id: 'wc2026-ger-civ-0621',
    home_team: 'Germany',
    away_team: "Côte d'Ivoire",
    home_score: 2,
    away_score: 1,
    match_date: '2026-06-21T22:00:00Z',
    league: 'FIFA World Cup 2026',
    season: '2026',
    venue: 'Toronto Stadium',
    match_data: {
      group: 'Group B',
      attendance: 61000,
      goals: [
        { player: 'Franck Kessié', team: "Côte d'Ivoire", minute: 30 },
        { player: 'Deniz Undav', team: 'Germany', minute: 68 },
        { player: 'Deniz Undav', team: 'Germany', minute: 94 },
      ],
    },
    awards: [
      {
        category: 'MVP',
        player: {
          external_id: 'wc2026-undav-ger',
          name: 'Deniz Undav',
          team: 'Germany',
          position: 'Forward',
          nationality: 'German',
        },
        analysis:
          'Deniz Undav produced one of the tournament\'s most sensational super-sub performances, coming on as part of a 60th-minute triple substitution and scoring twice in 34 minutes to give Germany a dramatic comeback win. His goal contributions as a substitute (3 goals, 2 assists in this WC) are the joint most at a single tournament since Roger Milla\'s legendary 1990 campaign. He is the first German player to score on both of his first two WC appearances since Miroslav Klose in 2002.',
        statistics: {
          goals: 2,
          assists: 0,
          minutes_played: 34,
          goals_per_90_as_sub: '5.3',
          super_sub_record: 'Joint most sub goal contributions since Milla 1990',
          rating: 9.6,
        },
      },
      {
        category: 'Best Defender',
        player: {
          external_id: 'wc2026-diomande-civ',
          name: 'Yan Diomandé',
          team: "Côte d'Ivoire",
          position: 'Midfielder',
          nationality: 'Ivorian',
        },
        analysis:
          'Yan Diomandé was Ivory Coast\'s standout performer, driving forward from midfield and winning the ball back relentlessly. He orchestrated the defensive phases that kept Germany at bay for 68 minutes, and his high press won the ball that led to Kessié\'s opener. A combative, technically assured display that drew praise from the German camp.',
        statistics: {
          goals: 0,
          assists: 0,
          tackles: 7,
          interceptions: 4,
          balls_won: 9,
          duels_won: 11,
          rating: 7.8,
        },
      },
      {
        category: 'Most Assists',
        player: {
          external_id: 'wc2026-amiri-ger',
          name: 'Nadiem Amiri',
          team: 'Germany',
          position: 'Midfielder',
          nationality: 'German',
        },
        analysis:
          'Nadiem Amiri came on as a substitute and immediately sparked Germany\'s comeback, providing the precise assist for Deniz Undav\'s 68th-minute equaliser. The Bayer Leverkusen midfielder\'s ability to play in tight spaces and pick out runners proved crucial in unlocking Ivory Coast\'s organised defensive block.',
        statistics: {
          goals: 0,
          assists: 1,
          key_passes: 3,
          passes_completed: 22,
          minutes_played: 34,
          rating: 7.7,
        },
      },
    ],
  },

  {
    external_id: 'wc2026-jpn-tun-0621',
    home_team: 'Japan',
    away_team: 'Tunisia',
    home_score: 4,
    away_score: 0,
    match_date: '2026-06-21T19:00:00Z',
    league: 'FIFA World Cup 2026',
    season: '2026',
    venue: 'SoFi Stadium, Los Angeles',
    match_data: {
      group: 'Group C',
      attendance: 71000,
      goals: [
        { player: 'Daichi Kamada', team: 'Japan', minute: 4 },
        { player: 'Ayase Ueda', team: 'Japan', minute: 31 },
        { player: 'Junya Ito', team: 'Japan', minute: 69 },
        { player: 'Ayase Ueda', team: 'Japan', minute: 83 },
      ],
    },
    awards: [
      {
        category: 'MVP',
        player: {
          external_id: 'wc2026-ueda-jpn',
          name: 'Ayase Ueda',
          team: 'Japan',
          position: 'Forward',
          nationality: 'Japanese',
        },
        analysis:
          'Ayase Ueda was Japan\'s most lethal weapon, scoring twice in a commanding 4-0 demolition of Tunisia. The Feyenoord striker\'s 31st-minute opener deflated Tunisian resistance before his 83rd-minute finish sealed the emphatic win. Ueda\'s movement, hold-up play and clinical touch made him unplayable throughout the evening.',
        statistics: {
          goals: 2,
          assists: 0,
          shots: 5,
          shots_on_target: 3,
          dribbles_completed: 2,
          rating: 8.9,
        },
      },
      {
        category: 'Best Defender',
        player: {
          external_id: 'wc2026-itakura-jpn',
          name: 'Ko Itakura',
          team: 'Japan',
          position: 'Defender',
          nationality: 'Japanese',
        },
        analysis:
          'Ko Itakura marshalled Japan\'s backline superbly, ensuring a commanding clean sheet. The Borussia Mönchengladbach centre-back read the game brilliantly, making six clearances and cutting out every dangerous cross into the box. His composure and aggression neutralised Tunisia\'s front line without any hint of danger.',
        statistics: {
          goals: 0,
          assists: 0,
          clearances: 6,
          interceptions: 3,
          aerial_duels_won: 5,
          clean_sheet: true,
          rating: 8.2,
        },
      },
      {
        category: 'Most Assists',
        player: {
          external_id: 'wc2026-kamada-jpn',
          name: 'Daichi Kamada',
          team: 'Japan',
          position: 'Midfielder',
          nationality: 'Japanese',
        },
        analysis:
          'Daichi Kamada opened the scoring himself in the 4th minute and went on to create multiple chances for his teammates. The Crystal Palace midfielder\'s vision and energy set the tempo for Japan\'s dominant performance, providing the assist for Ueda\'s first goal with an incisive through-ball that split Tunisia\'s high defensive line.',
        statistics: {
          goals: 1,
          assists: 1,
          key_passes: 4,
          chances_created: 3,
          passes_completed: 46,
          rating: 8.5,
        },
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function log(emoji, msg) {
  console.log(`${emoji}  ${msg}`);
}

async function upsertMatch(matchInput) {
  const { awards, ...matchData } = matchInput;

  const { data, error } = await supabase
    .from('matches')
    .upsert([{ ...matchData, status: 'finished' }], { onConflict: 'external_id' })
    .select()
    .single();

  if (error) throw new Error(`Match upsert failed: ${error.message}`);
  return data;
}

async function upsertPlayer(playerInput) {
  const { data, error } = await supabase
    .from('players')
    .upsert([{ ...playerInput, player_data: {} }], { onConflict: 'external_id' })
    .select()
    .single();

  if (error) throw new Error(`Player upsert failed: ${error.message}`);
  return data;
}

async function upsertAward(matchId, playerId, category, analysis, statistics) {
  const awardTypeMap = {
    MVP: 'mvp',
    'Best Defender': 'best_defender',
    'Most Assists': 'most_assists',
  };

  const { data, error } = await supabase
    .from('match_awards')
    .upsert(
      [
        {
          match_id: matchId,
          player_id: playerId,
          award_type: awardTypeMap[category],
          analysis,
          statistics,
        },
      ],
      { onConflict: 'match_id,award_type' }
    )
    .select()
    .single();

  if (error) throw new Error(`Award upsert failed: ${error.message}`);
  return data;
}

async function launchTokenViaAPI(matchId, playerName, category) {
  const res = await fetch(`${API_BASE}/api/tokens/launch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matchId, playerName, category }),
  });

  const json = await res.json();
  return json;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  AeonSports — World Cup 2026 Seed & Token Launch');
  console.log('═══════════════════════════════════════════════════════\n');

  // Check the local dev server is up
  try {
    const health = await fetch(`${API_BASE}/api/matches`);
    log('✅', `Dev server is running (status ${health.status})`);
  } catch {
    console.error('❌  Cannot reach http://localhost:3000 — is `npm run dev` running?');
    process.exit(1);
  }

  const allTokenResults = [];

  for (const matchInput of MATCHES) {
    const matchLabel = `${matchInput.home_team} ${matchInput.home_score}-${matchInput.away_score} ${matchInput.away_team}`;
    console.log(`\n─── ${matchLabel} ───`);

    // 1. Upsert match
    log('⚽', `Seeding match...`);
    const match = await upsertMatch(matchInput);
    log('✅', `Match ID: ${match.id}`);

    // 2. For each award — upsert player + award, then launch token
    for (const award of matchInput.awards) {
      console.log(`\n  [${award.category}] ${award.player.name}`);

      // Upsert player
      const player = await upsertPlayer(award.player);
      log('  👤', `Player ID: ${player.id}`);

      // Upsert award
      await upsertAward(match.id, player.id, award.category, award.analysis, award.statistics);
      log('  🏆', `Award stored`);

      // Launch token via API
      log('  🚀', `Launching token...`);
      try {
        const result = await launchTokenViaAPI(match.id, award.player.name, award.category);

        if (result.success) {
          log('  ✅', `Token launched!`);
          if (result.platforms?.clanker?.contractAddress) {
            log('  🔗', `Clanker: ${result.platforms.clanker.contractAddress}`);
          }
          if (result.platforms?.flaunch?.contractAddress) {
            log('  🔗', `Flaunch: ${result.platforms.flaunch.contractAddress}`);
          }
        } else {
          log('  ⚠️ ', `Launch partial/failed: ${result.error || 'unknown error'}`);
          if (result.platforms) {
            const { clanker, flaunch } = result.platforms;
            if (clanker?.error) log('  ℹ️ ', `Clanker error: ${clanker.error}`);
            if (flaunch?.error) log('  ℹ️ ', `Flaunch error: ${flaunch.error}`);
          }
        }

        allTokenResults.push({
          match: matchLabel,
          player: award.player.name,
          category: award.category,
          result,
        });
      } catch (err) {
        log('  ❌', `Launch threw: ${err.message}`);
        allTokenResults.push({
          match: matchLabel,
          player: award.player.name,
          category: award.category,
          error: err.message,
        });
      }
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('  LAUNCH SUMMARY');
  console.log('═══════════════════════════════════════════════════════');

  let launched = 0;
  let failed = 0;

  for (const r of allTokenResults) {
    const ok = r.result?.success;
    const icon = ok ? '✅' : '❌';
    const cAddr = r.result?.platforms?.clanker?.contractAddress ?? '—';
    const fAddr = r.result?.platforms?.flaunch?.contractAddress ?? '—';
    console.log(`${icon}  ${r.match} | ${r.player} (${r.category})`);
    if (ok) {
      console.log(`     Clanker: ${cAddr}`);
      console.log(`     Flaunch: ${fAddr}`);
      launched++;
    } else {
      console.log(`     Error: ${r.result?.error || r.error || 'unknown'}`);
      failed++;
    }
  }

  console.log(`\n  Launched: ${launched}   Failed: ${failed}   Total: ${allTokenResults.length}`);
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
