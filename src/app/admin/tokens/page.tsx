'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RefreshCw, Trash2, ExternalLink, Plus } from 'lucide-react';
import { showToast } from '@/components/toast';

export default function AdminTokensPage() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [launchDialog, setLaunchDialog] = useState(false);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/tokens');
      const data = await response.json();
      setTokens(data.tokens || []);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      showToast('error', 'Error', 'Failed to fetch tokens');
    } finally {
      setLoading(false);
    }
  };

  const deleteToken = async (tokenId: string) => {
    try {
      const response = await fetch(`/api/admin/tokens/${tokenId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast('success', 'Deleted', 'Token deleted successfully');
        fetchTokens();
      } else {
        showToast('error', 'Error', 'Failed to delete token');
      }
    } catch (error) {
      showToast('error', 'Error', 'Failed to delete token');
    } finally {
      setDeleteDialog(null);
    }
  };

  const getPlatformBadge = (platform: string) => {
    const colors = {
      clanker: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      flaunch: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
    return colors[platform as keyof typeof colors] || '';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Tokens</h1>
        <div className="flex gap-2">
          <Button onClick={() => setLaunchDialog(true)} variant="secondary">
            <Plus className="w-4 h-4 mr-2" />
            Launch Token
          </Button>
          <Button onClick={fetchTokens} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white">All Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No tokens found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-400">Token Name</TableHead>
                  <TableHead className="text-gray-400">Symbol</TableHead>
                  <TableHead className="text-gray-400">Platform</TableHead>
                  <TableHead className="text-gray-400">Contract Address</TableHead>
                  <TableHead className="text-gray-400">Launched</TableHead>
                  <TableHead className="text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((token: any) => (
                  <TableRow key={token.id}>
                    <TableCell className="text-white">{token.token_name}</TableCell>
                    <TableCell className="text-white">{token.token_symbol}</TableCell>
                    <TableCell>
                      <Badge className={getPlatformBadge(token.launch_platform)}>
                        {token.launch_platform}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      <code className="text-xs">{token.contract_address.slice(0, 10)}...</code>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {new Date(token.launched_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <a
                          href={`https://basescan.org/address/${token.contract_address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="outline">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </a>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteDialog(token.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Confirm Delete</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this token? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialog && deleteToken(deleteDialog)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Launch Token Dialog */}
      <Dialog open={launchDialog} onOpenChange={setLaunchDialog}>
        <DialogContent className="bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Launch Token</DialogTitle>
            <DialogDescription className="text-gray-400">
              Manual token launch (coming soon)
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
