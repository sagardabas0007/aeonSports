'use client';

import { useParams, useRouter } from 'next/navigation';
import { AwardType } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TokenCard } from '@/components/token-card';
import { Trophy, Shield, Target, ArrowLeft, Sparkles } from 'lucide-react';
import { useRealtimeMatchDetail } from '@/hooks/useRealtime';
import { showToast } from '@/components/toast';
import { useEffect, useRef } from 'react';

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { matchData, loading, error } = useRealtimeMatchDetail(params.id as string);
  const prevTokenCountRef = useRef(0);

  // Detect new tokens and show notification
  useEffect(() => {
    if (!matchData?.awards) return;

    const currentTokenCount = matchData.awards.reduce(
      (sum: number, award: any) => sum + (award.tokens?.length || 0),
      0
    );

    if (prevTokenCountRef.current > 0 && currentTokenCount > prevTokenCountRef.current) {
      showToast(
        'success',
        'New Token Launched!',
        'A new player token just appeared'
      );
    }

    prevTokenCountRef.current = currentTokenCount;
  }, [matchData]);

  const getAwardIcon = (awardType: AwardType) => {
    switch (awardType) {
      case 'mvp':
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 'best_defender':
        return <Shield className="w-5 h-5 text-blue-400" />;
      case 'most_assists':
        return <Target className="w-5 h-5 text-green-400" />;
    }
  };

  const getAwardLabel = (awardType: AwardType) => {
    switch (awardType) {
      case 'mvp':
        return 'Most Valuable Player';
      case 'best_defender':
        return 'Best Defender';
      case 'most_assists':
        return 'Most Assists';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <p className="text-white mt-4">Loading match details...</p>
        </div>
      </div>
    );
  }

  if (error || !matchData?.match) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-400">
          {error || 'Match not found'}
        </div>
      </div>
    );
  }

  const match = matchData.match;

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => router.push('/')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to matches
      </button>

      {/* Real-time indicator */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-green-400 animate-pulse" />
        <span className="text-sm text-green-400">Real-time updates active</span>
      </div>

      {/* Match Header */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10 mb-8">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              {match.league}
            </Badge>
            <span className="text-gray-400 text-sm">
              {new Date(match.match_date).toLocaleDateString()}
            </span>
          </div>
          <CardTitle className="text-3xl text-white text-center">
            {match.home_team} vs {match.away_team}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-8 py-4">
            <div className="text-center">
              <p className="text-gray-400 mb-2">{match.home_team}</p>
              <p className="text-6xl font-bold text-white">{match.home_score ?? 0}</p>
            </div>
            <span className="text-4xl text-gray-400">-</span>
            <div className="text-center">
              <p className="text-gray-400 mb-2">{match.away_team}</p>
              <p className="text-6xl font-bold text-white">{match.away_score ?? 0}</p>
            </div>
          </div>
          {match.venue && (
            <p className="text-center text-gray-400 mt-4">{match.venue}</p>
          )}
        </CardContent>
      </Card>

      {/* Match Summary */}
      {matchData.analysis && (
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Match Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300">
              {matchData.analysis.full_analysis?.matchSummary || 'No summary available'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Awards */}
      {matchData.awards && matchData.awards.length > 0 ? (
        <div className="space-y-8">
          {matchData.awards.map((award: any) => (
            <div key={award.id} className="animate-in fade-in slide-in-from-bottom duration-500">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 mb-4">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {getAwardIcon(award.award_type)}
                    <CardTitle className="text-white">
                      {getAwardLabel(award.award_type)}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold text-white mb-2">
                      {award.player?.name}
                    </p>
                    <p className="text-gray-400">{award.player?.team}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Analysis</p>
                    <p className="text-gray-300">{award.analysis}</p>
                  </div>
                  {award.statistics && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Key Statistics</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(award.statistics).map(([key, value]) => (
                          <div
                            key={key}
                            className="bg-black/30 rounded p-3 text-center"
                          >
                            <p className="text-xs text-gray-400 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                            <p className="text-lg font-bold text-white">{String(value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tokens for this award */}
              {award.tokens && award.tokens.length > 0 && (
                <div>
                  <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                    Launched Tokens
                    <span className="text-sm text-gray-400">({award.tokens.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {award.tokens.map((token: any) => (
                      <div key={token.id} className="animate-in fade-in slide-in-from-left duration-700">
                        <TokenCard token={token} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardContent className="py-8 text-center text-gray-400">
            <div className="inline-block animate-pulse mb-2">
              <Sparkles className="w-8 h-8 text-gray-500" />
            </div>
            <p>Waiting for match analysis...</p>
            <p className="text-sm mt-2">Awards and tokens will appear here automatically</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
