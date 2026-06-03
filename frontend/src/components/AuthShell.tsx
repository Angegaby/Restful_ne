'use client';

import { ReactNode } from 'react';

export default function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden w-[42%] overflow-hidden bg-brand lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 80%, #e8a838 0%, transparent 45%), radial-gradient(circle at 80% 20%, #1a7a7a 0%, transparent 40%)',
          }}
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent/90">TZW LTD</p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-white">
            Fire Extinguisher Management
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">
            Track inventory, inspections, maintenance, and compliance from one secure workspace.
          </p>
        </div>
        <ul className="relative space-y-3 text-sm text-white/60">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Role-based access for admin, inspector, and staff
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Real-time reports with CSV and PDF export
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Inspection and maintenance audit trail
          </li>
        </ul>
      </aside>

      <div className="flex flex-1 flex-col items-center justify-center bg-canvas p-6 sm:p-10">
        <div className="mb-8 text-center lg:hidden">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">TZW LTD</p>
          <p className="font-display text-xl font-bold text-brand">FEMS</p>
        </div>
        <div className="w-full max-w-md">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
