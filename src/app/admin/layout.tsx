'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Trophy, Coins, FileText, ArrowLeft, LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/matches', label: 'Matches', icon: Trophy },
    { href: '/admin/tokens', label: 'Tokens', icon: Coins },
    { href: '/admin/logs', label: 'Logs', icon: FileText },
  ];

  const handleLogout = async () => {
    await fetch('/api/admin-logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa]">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-[#111] border-r border-gray-900 flex flex-col">
          <div className="p-6 flex-1">
            <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Site</span>
            </Link>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-1">AEONSPORTS</h2>
              <div className="h-0.5 w-16 bg-[#d24b40]" />
              <p className="text-xs text-gray-500 mt-2 font-mono">ADMIN PANEL</p>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded transition-colors ${
                      isActive
                        ? 'bg-[#d24b40] bg-opacity-10 text-white border-l-2 border-[#d24b40]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Logout button at bottom */}
          <div className="p-6 border-t border-gray-900">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-red-500/10 rounded transition-colors w-full"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
