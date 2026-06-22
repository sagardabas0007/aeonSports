'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Play, Eye } from 'lucide-react';
import { showToast } from '@/components/toast';
import Link from 'next/link';

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/matches');
      const data = await response.json();
      setMatches(data.matches || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
      showToast('error', 'Error', 'Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  };

  const rerunAnalysis = async (matchId: string) => {
    setProcessing(matchId);
    try {
      const response = await fetch('/api/matches/analyze-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId }),
      });

      if (response.ok) {
        showToast('success', 'Analysis Started', 'Match analysis is running');
      } else {
        showToast('error', 'Error', 'Failed to start analysis');
      }
    } catch (error) {
      showToast('error', 'Error', 'Failed to start analysis');
    } finally {
      setProcessing(null);
    }
  };

  const triggerWorkflow = async (matchId: string) => {
    setProcessing(matchId);
    try {
      const response = await fetch('/api/workflow/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, priority: 10 }),
      });

      if (response.ok) {
        showToast('success', 'Workflow Queued', 'Full workflow has been queued');
      } else {
        showToast('error', 'Error', 'Failed to queue workflow');
      }
    } catch (error) {
      showToast('error', 'Error', 'Failed to queue workflow');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      live: 'bg-green-500/20 text-green-400 border-green-500/30',
      upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      finished: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    };
    return colors[status as keyof typeof colors] || '';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Matches</h1>
        <Button onClick={fetchMatches} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white">All Matches</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : matches.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No matches found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-400">Match</TableHead>
                  <TableHead className="text-gray-400">Score</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Date</TableHead>
                  <TableHead className="text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((match: any) => (
                  <TableRow key={match.id}>
                    <TableCell className="text-white">
                      {match.home_team} vs {match.away_team}
                    </TableCell>
                    <TableCell className="text-white">
                      {match.home_score ?? '-'} - {match.away_score ?? '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(match.status)}>
                        {match.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {new Date(match.match_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/matches/${match.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        {match.status === 'finished' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => rerunAnalysis(match.id)}
                              disabled={processing === match.id}
                            >
                              Re-analyze
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => triggerWorkflow(match.id)}
                              disabled={processing === match.id}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Full Workflow
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
