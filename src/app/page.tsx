'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, ChevronDown, X, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Token {
  id: string;
  token_name: string;
  token_symbol: string;
  player_name: string;
  award_type: string;
  contract_address: string;
  platform: string;
  launched_at: string;
  metadata?: any;
}

export default function HomePage() {
  const [scrambledText, setScrambledText] = useState('AEONSPORTS');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const text = 'AEONSPORTS';
    const chars = '◈◎▤◷╳╱╲│─┤├┴┬';
    let iteration = 0;

    const interval = setInterval(() => {
      setScrambledText(
        text
          .split('')
          .map((char, index) => {
            if (index < iteration) {
              return text[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );

      if (iteration >= text.length) {
        clearInterval(interval);
      }

      iteration += 1 / 3;
    }, 30);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const response = await fetch('/api/tokens');
      const data = await response.json();
      setTokens(data.tokens || []);
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToTokens = () => {
    document.getElementById('tokens')?.scrollIntoView({ behavior: 'smooth' });
  };

  const copyToClipboard = () => {
    const skillsUrl = `${window.location.origin}/SKILLS.md`;
    navigator.clipboard.writeText(skillsUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate orbital positions for tokens
  const getOrbitalPosition = (index: number, total: number) => {
    const orbits = Math.ceil(total / 12); // Max 12 tokens per orbit
    const orbitIndex = Math.floor(index / 12);
    const positionInOrbit = index % 12;
    const angle = (positionInOrbit / 12) * Math.PI * 2;
    const radius = 150 + orbitIndex * 120; // Increasing radius for each orbit

    return {
      x: 50 + Math.cos(angle) * (radius / 10), // Convert to percentage
      y: 50 + Math.sin(angle) * (radius / 10),
      orbitIndex,
    };
  };

  const getTokenColor = (award_type: string) => {
    switch (award_type) {
      case 'mvp':
        return 'from-yellow-500 to-orange-500';
      case 'best_defender':
        return 'from-blue-500 to-cyan-500';
      case 'most_assists':
        return 'from-purple-500 to-pink-500';
      default:
        return 'from-gray-500 to-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa]">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        <div className="absolute inset-0 opacity-5">
          <div className="dither-pattern" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-7xl md:text-9xl font-bold tracking-tight mb-4">
              {scrambledText}
            </h1>
            <div className="h-1 w-32 bg-[#d24b40] mx-auto" />
          </div>

          <p className="text-xl md:text-2xl text-gray-400 mb-4 max-w-2xl mx-auto leading-relaxed">
            AI-powered sports tokenization platform
          </p>

          <p className="text-sm text-gray-500 mb-12 font-mono">
            Transform player performance into tradeable on-chain assets
          </p>

          <div className="w-full max-w-3xl mx-auto">
            <div className="bg-[#111] border border-gray-800 rounded-lg p-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-white mb-2">Trading Guide</h3>
                <p className="text-sm text-gray-400">
                  Complete guide for AI agents to trade player tokens
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 bg-black border border-gray-800 rounded px-4 py-3 overflow-hidden">
                  <code className="text-sm text-gray-300 font-mono break-all">
                    {typeof window !== 'undefined' ? `${window.location.origin}/SKILLS.md` : '/SKILLS.md'}
                  </code>
                </div>

                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                  {!copied && <ArrowRight className="w-4 h-4" />}
                  {copied && <span>✓</span>}
                </button>
              </div>
            </div>
          </div>

          <button onClick={scrollToTokens} className="mt-20 animate-bounce">
            <ChevronDown className="w-6 h-6 text-gray-600 mx-auto" />
          </button>
        </div>
      </section>

      {/* Tokens Orbital Visualization */}
      <section id="tokens" className="py-32 px-6 border-t border-gray-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm text-gray-500 mb-4 font-mono">◎ LAUNCHED TOKENS</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Token Galaxy</h2>
            <p className="text-gray-400">Click any token to view details</p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block w-8 h-8 border-2 border-gray-700 border-t-white rounded-full animate-spin" />
              <p className="text-gray-500 mt-4">Loading tokens...</p>
            </div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500">No tokens launched yet</p>
            </div>
          ) : (
            <div className="relative w-full aspect-video max-w-6xl mx-auto">
              {/* Dotted grid background */}
              <div className="absolute inset-0">
                <svg className="w-full h-full" style={{ opacity: 0.1 }}>
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <circle cx="1" cy="1" r="1" fill="#fff" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              {/* Orbital rings */}
              {[1, 2, 3].map((orbit) => (
                <svg
                  key={orbit}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ opacity: 0.1 }}
                >
                  <ellipse
                    cx="50%"
                    cy="50%"
                    rx={`${15 + orbit * 12}%`}
                    ry={`${15 + orbit * 12}%`}
                    fill="none"
                    stroke="#d24b40"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                </svg>
              ))}

              {/* Center focal point */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-[#d24b40] to-orange-600 flex items-center justify-center shadow-lg shadow-[#d24b40]/50">
                <div className="text-3xl font-bold">⚽</div>
              </div>

              {/* Tokens */}
              {tokens.map((token, index) => {
                const position = getOrbitalPosition(index, tokens.length);
                const colorClass = getTokenColor(token.award_type);

                return (
                  <button
                    key={token.id}
                    onClick={() => setSelectedToken(token)}
                    className="absolute group cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 hover:z-10"
                    style={{
                      left: `${position.x}%`,
                      top: `${position.y}%`,
                    }}
                  >
                    {/* Token icon */}
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-lg border-2 border-white/20 hover:border-white/50 transition-all`}>
                      <span className="text-2xl font-bold text-white">
                        {token.player_name?.charAt(0) || '?'}
                      </span>
                    </div>

                    {/* Hover label */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      <div className="bg-black/90 px-3 py-1 rounded text-xs text-white border border-gray-700">
                        {token.token_symbol}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Token Detail Modal */}
      {selectedToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-800">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getTokenColor(selectedToken.award_type)} flex items-center justify-center text-2xl font-bold`}>
                  {selectedToken.player_name?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{selectedToken.token_name}</h3>
                  <p className="text-gray-400 text-sm font-mono">{selectedToken.token_symbol}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedToken(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Player Info */}
              <div>
                <div className="text-sm text-gray-500 mb-2 font-mono">PLAYER</div>
                <div className="text-xl font-bold">{selectedToken.player_name}</div>
              </div>

              {/* Award Type */}
              <div>
                <div className="text-sm text-gray-500 mb-2 font-mono">AWARD TYPE</div>
                <div className="inline-block px-4 py-2 bg-[#d24b40] bg-opacity-10 border border-[#d24b40] border-opacity-30 rounded-lg">
                  {(selectedToken.award_type ?? '').replace(/_/g, ' ').toUpperCase() || '—'}
                </div>
              </div>

              {/* Platform */}
              <div>
                <div className="text-sm text-gray-500 mb-2 font-mono">PLATFORM</div>
                <div className="text-lg capitalize">{selectedToken.platform}</div>
              </div>

              {/* Contract Address */}
              <div>
                <div className="text-sm text-gray-500 mb-2 font-mono">CONTRACT ADDRESS</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-black/50 px-4 py-2 rounded border border-gray-800 text-sm font-mono overflow-x-auto">
                    {selectedToken.contract_address}
                  </code>
                  <a
                    href={`https://basescan.org/address/${selectedToken.contract_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-white/5 rounded transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>

              {/* Launch Time */}
              <div>
                <div className="text-sm text-gray-500 mb-2 font-mono">LAUNCHED AT</div>
                <div className="text-lg">
                  {new Date(selectedToken.launched_at).toLocaleString()}
                </div>
              </div>

              {/* Metadata */}
              {selectedToken.metadata && (
                <div>
                  <div className="text-sm text-gray-500 mb-2 font-mono">METADATA</div>
                  <pre className="bg-black/50 p-4 rounded border border-gray-800 text-xs overflow-x-auto">
                    {JSON.stringify(selectedToken.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <a
                  href={`https://basescan.org/address/${selectedToken.contract_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded hover:bg-gray-200 transition-colors"
                >
                  <span>View on BaseScan</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
