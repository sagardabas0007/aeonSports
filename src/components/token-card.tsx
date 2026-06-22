'use client';

import { Token } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Copy } from 'lucide-react';

interface TokenCardProps {
  token: Token;
}

export function TokenCard({ token }: TokenCardProps) {
  const getPlatformColor = () => {
    switch (token.launch_platform) {
      case 'clanker':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'flaunch':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(token.contract_address);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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

  const getExplorerUrl = () => {
    return `https://basescan.org/address/${token.contract_address}`;
  };

  return (
    <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border-white/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <Badge className={getPlatformColor()}>
            {token.launch_platform.toUpperCase()}
          </Badge>
          <span className="text-xs text-gray-400">{formatDate(token.launched_at)}</span>
        </div>
        <CardTitle className="text-lg text-white">{token.token_name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-gray-400 mb-1">Symbol</p>
          <p className="text-white font-semibold">{token.token_symbol}</p>
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-1">Description</p>
          <p className="text-sm text-gray-300">{token.description}</p>
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-1">Contract Address</p>
          <div className="flex items-center gap-2">
            <code className="text-xs text-white bg-black/30 px-2 py-1 rounded">
              {formatAddress(token.contract_address)}
            </code>
            <button
              onClick={copyAddress}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="Copy address"
            >
              <Copy className="w-4 h-4 text-gray-400" />
            </button>
            <a
              href={getExplorerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="View on BaseScan"
            >
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
