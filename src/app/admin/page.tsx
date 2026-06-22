'use client';

import { useEffect, useState } from 'react';
import { Trophy, Coins, Activity, TrendingUp, DollarSign, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalMatches: 0,
    finishedMatches: 0,
    totalTokens: 0,
    pendingJobs: 0,
  });

  const [fees, setFees] = useState({
    total_fees: '0.00',
    total_tokens_launched: 0,
    last_updated: new Date().toISOString(),
  });

  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchFees();

    // Auto-refresh stats every 5 seconds
    const statsInterval = setInterval(fetchStats, 5000);

    // Auto-refresh fees every 3 seconds for live updates
    const feesInterval = setInterval(fetchFees, 3000);

    return () => {
      clearInterval(statsInterval);
      clearInterval(feesInterval);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchFees = async () => {
    try {
      const response = await fetch('/api/admin/fees');
      const data = await response.json();
      setFees(data);
      setIsLive(true);

      // Blink effect when updated
      setTimeout(() => setIsLive(false), 500);
    } catch (error) {
      console.error('Error fetching fees:', error);
    }
  };

  const statCards = [
    {
      title: 'Total Matches',
      value: stats.totalMatches,
      icon: Trophy,
      label: 'All time',
    },
    {
      title: 'Finished Matches',
      value: stats.finishedMatches,
      icon: TrendingUp,
      label: 'Completed',
    },
    {
      title: 'Tokens Launched',
      value: stats.totalTokens,
      icon: Coins,
      label: 'On-chain',
    },
    {
      title: 'Pending Jobs',
      value: stats.pendingJobs,
      icon: Activity,
      label: 'In queue',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-900 pb-6">
        <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">System overview and metrics</p>
      </div>

      {/* Live Fees Section */}
      <div className="bg-[#111] border border-gray-900 p-8 hover:border-gray-800 transition-colors">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-6 h-6 text-[#d24b40]" />
              <h2 className="text-xl font-bold text-white">Total Fees Collected</h2>
              <span className={`ml-2 flex h-2 w-2 transition-opacity ${isLive ? 'opacity-100' : 'opacity-0'}`}>
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono">LIVE • Updates every 3s</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="text-5xl font-bold text-white mb-2">
              ${fees.total_fees}
            </div>
            <div className="text-sm text-gray-400">
              From {fees.total_tokens_launched} token launches
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500 font-mono">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>LIVE TRACKING</span>
            </div>
            <div>
              LAST UPDATE: {new Date(fees.last_updated).toLocaleTimeString()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-900">
            <div>
              <div className="text-xs text-gray-500 mb-1 font-mono">AVG FEE/TOKEN</div>
              <div className="text-2xl font-bold text-white">
                ${fees.total_tokens_launched > 0
                  ? (Number(fees.total_fees) / fees.total_tokens_launched).toFixed(2)
                  : '0.00'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1 font-mono">STATUS</div>
              <div className="text-2xl font-bold text-green-500">
                {Number(fees.total_fees) > 0 ? 'ACTIVE' : 'PENDING'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-[#111] border border-gray-900 p-6 hover:border-gray-800 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-sm font-mono text-gray-500">{stat.title.toUpperCase()}</div>
              <stat.icon className="w-5 h-5 text-gray-600" />
            </div>
            <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="border-t border-gray-900 pt-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-2">Quick Actions</h2>
          <p className="text-sm text-gray-400">Navigate to key sections</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/matches"
            className="group bg-[#111] border border-gray-900 p-6 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <Trophy className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" />
              <ExternalLink className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Manage Matches</h3>
            <p className="text-sm text-gray-400">View and control all matches</p>
          </Link>

          <Link
            href="/admin/tokens"
            className="group bg-[#111] border border-gray-900 p-6 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <Coins className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" />
              <ExternalLink className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Manage Tokens</h3>
            <p className="text-sm text-gray-400">View and delete tokens</p>
          </Link>

          <Link
            href="/admin/logs"
            className="group bg-[#111] border border-gray-900 p-6 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <Activity className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" />
              <ExternalLink className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">View Logs</h3>
            <p className="text-sm text-gray-400">Monitor system activity</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
