'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getUser, clearAuth, AuthUser } from '@/lib/auth';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', roles: ['ADMIN', 'INSPECTOR', 'USER'] },
  { href: '/extinguishers', label: 'Extinguishers', roles: ['ADMIN', 'INSPECTOR', 'USER'] },
  { href: '/inspections', label: 'Inspections', roles: ['ADMIN', 'INSPECTOR', 'USER'] },
  { href: '/maintenance', label: 'Maintenance', roles: ['INSPECTOR'] },
  { href: '/reports', label: 'Reports', roles: ['ADMIN', 'INSPECTOR', 'USER'] },
  { href: '/admin/users', label: 'Users', roles: ['ADMIN'] },
  { href: '/profile', label: 'Profile', roles: ['ADMIN', 'INSPECTOR', 'USER'] },
];

function roleBadgeColor(role: string) {
  if (role === 'ADMIN') return 'blue';
  if (role === 'INSPECTOR') return 'yellow';
  return 'green';
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push('/login');
      return;
    }
    setUser(u);
  }, [router]);

  const handleLogout = async () => {
    await api.logout();
    clearAuth();
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="flex items-center gap-3 text-muted">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          Loading workspace…
        </div>
      </div>
    );
  }

  const filteredNav = navItems.filter((n) => n.roles.includes(user.role));

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-brand-dark shadow-nav">
        <div className="border-b border-white/10 px-6 py-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">TZW LTD</p>
          <h1 className="mt-1 font-display text-lg font-bold text-white">FEMS</h1>
          <p className="text-xs text-white/50">Fire safety operations</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {filteredNav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/10'
                    : 'text-white/70 hover:bg-white/8 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <p className="truncate text-sm font-medium text-white">
            {user.firstName} {user.lastName}
          </p>
          <div className="mt-1">
            <Badge color={roleBadgeColor(user.role)}>{user.role}</Badge>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 w-full rounded-xl border border-white/20 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-surface/90 px-8 py-4 backdrop-blur-md">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            {filteredNav.find((n) => pathname.startsWith(n.href))?.label ?? 'Workspace'}
          </p>
        </header>
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
