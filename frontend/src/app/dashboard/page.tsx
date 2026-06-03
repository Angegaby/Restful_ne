'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/Layout';
import { Card, Badge } from '@/components/ui';
import { BarChart, DonutChart, HorizontalBarChart, ChartItem } from '@/components/charts';
import { api } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { chartColors } from '@/lib/theme';
import Link from 'next/link';

interface DashboardData {
  extinguishers: { total: number };
  inspections: {
    pending: number;
    overdue: number;
    completed: number;
    total: number;
  };
  compliance: {
    percent: number;
    expired: number;
    upcoming: number;
    status: string;
  };
  charts: {
    inspectionStatus: ChartItem[];
    extinguisherStatus: ChartItem[];
    extinguisherByType: ChartItem[];
  };
}

const emptyStats: DashboardData = {
  extinguishers: { total: 0 },
  inspections: { pending: 0, overdue: 0, completed: 0, total: 0 },
  compliance: { percent: 0, expired: 0, upcoming: 0, status: 'COMPLIANT' },
  charts: {
    inspectionStatus: [
      { label: 'Pending', value: 0, color: chartColors.pending },
      { label: 'Overdue', value: 0, color: chartColors.overdue },
      { label: 'Completed', value: 0, color: chartColors.completed },
    ],
    extinguisherStatus: [],
    extinguisherByType: [],
  },
};

export default function DashboardPage() {
  const user = getUser();
  const [stats, setStats] = useState<DashboardData>(emptyStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DashboardData>('/reports/dashboard')
      .then(setStats)
      .catch(() => setStats(emptyStats))
      .finally(() => setLoading(false));
  }, []);

  const complianceColor =
    stats.compliance.percent >= 90 ? 'green' : stats.compliance.percent >= 70 ? 'yellow' : 'red';

  const complianceStatClass =
    stats.compliance.percent >= 90
      ? 'stat-value-ok'
      : stats.compliance.percent >= 70
        ? 'stat-value-warn'
        : 'stat-value-danger';

  const inspectionsLinkSubtitle =
    user?.role === 'USER'
      ? 'Request and track inspections'
      : user?.role === 'INSPECTOR'
        ? 'Complete assigned inspections'
        : 'View inspection requests';

  return (
    <AppLayout>
      <h1 className="page-title mb-2">Dashboard</h1>
      <p className="page-subtitle mb-6">
        Welcome, {user?.firstName}! <Badge color="blue">{user?.role}</Badge>
      </p>

      {loading ? (
        <p className="text-muted">Loading dashboard...</p>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card>
              <p className="text-sm text-muted">Total Extinguishers</p>
              <p className="stat-value-neutral">{stats.extinguishers.total}</p>
            </Card>
            <Card>
              <p className="text-sm text-muted">Pending Inspections</p>
              <p className="stat-value-warn">{stats.inspections.pending}</p>
            </Card>
            <Card>
              <p className="text-sm text-muted">Overdue Inspections</p>
              <p className="stat-value-danger">{stats.inspections.overdue}</p>
            </Card>
            <Card>
              <p className="text-sm text-muted">Completed Inspections</p>
              <p className="stat-value-ok">{stats.inspections.completed}</p>
            </Card>
            <Card>
              <p className="text-sm text-muted">Compliance</p>
              <p className={complianceStatClass}>{stats.compliance.percent}%</p>
            </Card>
          </div>

          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            <Card>
              <BarChart
                title="Inspections by Status"
                data={stats.charts.inspectionStatus}
                emptyMessage="No inspections scheduled yet"
              />
            </Card>
            <Card>
              <DonutChart
                title="Extinguisher Status"
                data={stats.charts.extinguisherStatus}
                centerLabel="Total"
                emptyMessage="No extinguishers registered"
              />
            </Card>
          </div>

          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            <Card>
              <HorizontalBarChart
                title="Extinguishers by Type"
                data={stats.charts.extinguisherByType}
                emptyMessage="No extinguishers registered"
              />
            </Card>
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-ink-soft">Compliance Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-canvas p-4">
                  <span className="text-sm text-muted">Compliance rate</span>
                  <Badge color={complianceColor}>{stats.compliance.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border p-4 text-center">
                    <p className="text-2xl font-bold text-stat-danger">{stats.compliance.expired}</p>
                    <p className="text-xs text-muted">Expired units</p>
                  </div>
                  <div className="rounded-xl border border-border p-4 text-center">
                    <p className="text-2xl font-bold text-stat-warn">{stats.compliance.upcoming}</p>
                    <p className="text-xs text-muted">Expiring in 30 days</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/extinguishers" className="surface-card">
          <h3 className="font-semibold text-ink">Extinguishers</h3>
          <p className="text-sm text-muted">View and manage inventory</p>
        </Link>
        <Link href="/inspections" className="surface-card">
          <h3 className="font-semibold text-ink">Inspections</h3>
          <p className="text-sm text-muted">{inspectionsLinkSubtitle}</p>
        </Link>
        <Link href="/reports" className="surface-card">
          <h3 className="font-semibold text-ink">Reports</h3>
          <p className="text-sm text-muted">Real-time compliance reports</p>
        </Link>
      </div>
    </AppLayout>
  );
}
