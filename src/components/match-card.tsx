'use client';

import Link from 'next/link';
import { Match } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, TrendingUp } from 'lucide-react';

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const getStatusIcon = () => {
    switch (match.status) {
      case 'live':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'upcoming':
        return <Clock className="w-4 h-4 text-blue-400" />;
      case 'finished':
        return <Trophy className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusColor = () => {
    switch (match.status) {
      case 'live':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'upcoming':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'finished':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Link href={`/matches/${match.id}`}>
      <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-white/20 transition-all cursor-pointer hover:scale-[1.02]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-2">
            <Badge className={getStatusColor()}>
              <span className="flex items-center gap-1">
                {getStatusIcon()}
                {match.status.toUpperCase()}
              </span>
            </Badge>
            <span className="text-xs text-gray-400">{match.league}</span>
          </div>
          <CardTitle className="text-lg text-white">
            {match.home_team} vs {match.away_team}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {match.status === 'finished' || match.status === 'live' ? (
            <div className="flex items-center justify-center gap-4 py-2">
              <div className="text-center">
                <p className="text-sm text-gray-400">{match.home_team}</p>
                <p className="text-3xl font-bold text-white">{match.home_score ?? 0}</p>
              </div>
              <span className="text-2xl text-gray-400">-</span>
              <div className="text-center">
                <p className="text-sm text-gray-400">{match.away_team}</p>
                <p className="text-3xl font-bold text-white">{match.away_score ?? 0}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-gray-400">{formatDate(match.match_date)}</p>
            </div>
          )}
          {match.venue && (
            <p className="text-xs text-gray-500 text-center mt-2">{match.venue}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
