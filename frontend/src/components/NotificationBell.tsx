'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Paginated, paginatedQuery } from '@/lib/pagination';
import { NOTIFICATIONS_REFRESH_EVENT } from '@/lib/notifications';

interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
}

function BellIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.454 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
      />
    </svg>
  );
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const [countRes, listRes] = await Promise.all([
        api.get<{ count: number }>('/notifications/unread-count'),
        api.get<Paginated<Notification>>(`/notifications?${paginatedQuery(1, 15)}&unread=true`),
      ]);
      setCount(countRes.count);
      setItems(listRes.items);
    } catch {
      setCount(0);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    const onRefresh = () => refresh();
    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, onRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, onRefresh);
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const markRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`, {});
    refresh();
  };

  const openPanel = async () => {
    setOpen((v) => !v);
    if (!open) {
      setLoading(true);
      try {
        const listRes = await api.get<Paginated<Notification>>(
          `/notifications?${paginatedQuery(1, 15)}`
        );
        setItems(listRes.items);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={openPanel}
        className="relative rounded-xl border border-border bg-surface-elevated p-2 text-ink-soft transition hover:bg-canvas hover:text-ink"
        aria-label={`Notifications${count > 0 ? `, ${count} unread` : ''}`}
      >
        <BellIcon />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-brand-dark">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-card sm:w-96">
          <div className="border-b border-border px-4 py-3">
            <p className="font-semibold text-ink">Notifications</p>
            <p className="text-xs text-muted">
              {count > 0 ? `${count} unread` : 'All caught up'}
            </p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading && <p className="px-4 py-6 text-sm text-muted">Loading...</p>}
            {!loading && items.length === 0 && (
              <p className="px-4 py-6 text-sm text-muted">No notifications yet</p>
            )}
            {!loading &&
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    if (!n.read) markRead(n.id);
                  }}
                  className={`block w-full border-b border-border/60 px-4 py-3 text-left text-sm transition hover:bg-canvas ${
                    n.read ? 'text-muted' : 'bg-brand/5 font-medium text-ink'
                  }`}
                >
                  <p>{n.message}</p>
                  <p className="mt-1 text-xs text-faint">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </button>
              ))}
          </div>
          <div className="border-t border-border px-4 py-2">
            <Link
              href="/inspections"
              className="text-link text-xs"
              onClick={() => setOpen(false)}
            >
              View inspections →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
