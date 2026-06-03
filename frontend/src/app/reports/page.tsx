'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/Layout';
import Pagination from '@/components/Pagination';
import { Card, Button, Badge } from '@/components/ui';
import { BarChart, DonutChart, ChartItem } from '@/components/charts';
import { api } from '@/lib/api';
import { paginatedQuery } from '@/lib/pagination';
import { chartColors } from '@/lib/theme';

interface SummaryReport {
  stock: {
    totalInStock: number;
    dailyAdded: number;
    monthlyAdded: number;
    yearlyAdded: number;
    byStatus: { status: string; count: number }[];
    byType: { type: string; count: number }[];
  };
  inspectionStatus: {
    pending: number;
    overdue: number;
    completed: number;
    total: number;
    recent: {
      serialNumber: string;
      location: string;
      scheduledDate: string;
      status: string;
    }[];
  };
  expiredExtinguishers: {
    serialNumber: string;
    location: string;
    expiryDate: string;
    status: string;
  }[];
  expiredCount: number;
  upcomingExpirations: { serialNumber: string; location: string; expiryDate: string }[];
  upcomingExpirationsCount: number;
  compliancePercent: number;
  complianceStatus: string;
  maintenanceHistory: {
    serialNumber: string;
    location: string;
    maintenanceDate: string;
    actionTaken: string;
    issuesIdentified: string;
    notes: string;
    inspector: string;
  }[];
  maintenanceTotalLogs: number;
  maintenanceHistoryPagination: {
    page: number;
    totalPages: number;
    total: number;
  };
}

export default function ReportsPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<SummaryReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<SummaryReport>(`/reports/summary?${paginatedQuery(page, 10)}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [page]);

  const exportFull = (format: 'pdf' | 'csv') => {
    api.download(
      `/reports/summary/export?format=${format}`,
      `fems-comprehensive-report.${format}`
    );
  };

  const statusColor = (s: string) =>
    s === 'ACTIVE' || s === 'COMPLETED' || s === 'COMPLIANT'
      ? 'green'
      : s === 'OVERDUE' || s === 'EXPIRED' || s === 'NON_COMPLIANT'
        ? 'red'
        : 'yellow';

  const inspectionChart: ChartItem[] = data
    ? [
        { label: 'Pending', value: data.inspectionStatus.pending, color: chartColors.pending },
        { label: 'Overdue', value: data.inspectionStatus.overdue, color: chartColors.overdue },
        { label: 'Completed', value: data.inspectionStatus.completed, color: chartColors.completed },
      ]
    : [];

  const stockStatusChart: ChartItem[] =
    data?.stock.byStatus.map((s) => ({
      label: s.status,
      value: s.count,
      color:
        s.status === 'ACTIVE'
          ? chartColors.active
          : s.status === 'EXPIRED'
            ? chartColors.expired
            : chartColors.maintenance,
    })) ?? [];

  return (
    <AppLayout>
      <h1 className="page-title mb-2">Reports</h1>
      <p className="mb-6 text-sm text-muted">
        Real-time compliance: stock totals, inspection status, expired units, and maintenance history.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => exportFull('pdf')}>
          Export PDF
        </Button>
        <Button variant="secondary" onClick={() => exportFull('csv')}>
          Export CSV
        </Button>
      </div>
      <p className="mb-6 text-xs text-muted">
        Downloads include stock totals (daily, monthly, yearly), inspection status, expired
        extinguishers, and full maintenance history.
      </p>

      {loading ? (
        <Card><p className="text-muted">Loading report...</p></Card>
      ) : !data ? (
        <Card><p className="text-muted">Unable to load report</p></Card>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-lg font-semibold">Fire extinguisher stock</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <p className="text-sm text-muted">Total in stock</p>
                <p className="text-3xl font-bold">{data.stock.totalInStock}</p>
              </Card>
              <Card>
                <p className="text-sm text-muted">Added today</p>
                <p className="text-3xl font-bold">{data.stock.dailyAdded}</p>
              </Card>
              <Card>
                <p className="text-sm text-muted">Added this month</p>
                <p className="text-3xl font-bold">{data.stock.monthlyAdded}</p>
              </Card>
              <Card>
                <p className="text-sm text-muted">Added this year</p>
                <p className="text-3xl font-bold">{data.stock.yearlyAdded}</p>
              </Card>
            </div>
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              <Card>
                <DonutChart title="Stock by status" data={stockStatusChart} centerLabel="Units" />
              </Card>
              <Card>
                <BarChart title="Inspection status" data={inspectionChart} />
              </Card>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold">Inspection status</h2>
            <div className="mb-4 grid gap-4 sm:grid-cols-4">
              <Card><p className="text-sm text-muted">Pending</p><p className="text-2xl font-bold text-stat-warn">{data.inspectionStatus.pending}</p></Card>
              <Card><p className="text-sm text-muted">Overdue</p><p className="text-2xl font-bold text-stat-danger">{data.inspectionStatus.overdue}</p></Card>
              <Card><p className="text-sm text-muted">Completed</p><p className="text-2xl font-bold text-stat-ok">{data.inspectionStatus.completed}</p></Card>
              <Card><p className="text-sm text-muted">Total</p><p className="text-2xl font-bold text-ink">{data.inspectionStatus.total}</p></Card>
            </div>
            <Card>
              <h3 className="mb-3 font-medium text-ink-soft">Recent inspections</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted">
                    <th className="pb-2 text-left">Serial</th>
                    <th className="pb-2 text-left">Location</th>
                    <th className="pb-2 text-left">Date</th>
                    <th className="pb-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.inspectionStatus.recent.map((r, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2">{r.serialNumber}</td>
                      <td className="py-2">{r.location}</td>
                      <td className="py-2">{r.scheduledDate}</td>
                      <td className="py-2"><Badge color={statusColor(r.status)}>{r.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold">Expired & compliance</h2>
            <div className="mb-4 flex items-center gap-4">
              <Card className="flex-1">
                <p className="text-sm text-muted">Compliance rate</p>
                <p className="text-3xl font-bold">{data.compliancePercent}%</p>
                <Badge color={statusColor(data.complianceStatus)}>{data.complianceStatus}</Badge>
              </Card>
              <Card className="flex-1">
                <p className="text-sm text-muted">Expired units</p>
                <p className="text-3xl font-bold text-stat-danger">{data.expiredCount}</p>
              </Card>
              <Card className="flex-1">
                <p className="text-sm text-muted">Expiring in 30 days</p>
                <p className="text-3xl font-bold text-stat-warn">{data.upcomingExpirationsCount}</p>
              </Card>
            </div>
            <Card>
              <h3 className="mb-3 font-medium text-brand">Expired extinguishers</h3>
              {data.expiredExtinguishers.length === 0 ? (
                <p className="text-sm text-faint">None</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.expiredExtinguishers.map((e, i) => (
                    <li key={i} className="flex justify-between border-b py-2">
                      <span>{e.serialNumber} — {e.location}</span>
                      <span className="text-stat-danger">{e.expiryDate}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold">Maintenance history</h2>
            <p className="mb-4 text-sm text-muted">
              Total logs: {data.maintenanceTotalLogs}
            </p>
            <Card>
              <div className="space-y-4">
                {data.maintenanceHistory.map((m, i) => (
                  <div key={i} className="rounded-lg border p-4 text-sm">
                    <div className="flex justify-between">
                      <p className="font-medium">{m.serialNumber} — {m.location}</p>
                      <span className="text-muted">{m.maintenanceDate}</span>
                    </div>
                    <p className="mt-1"><span className="font-medium">Action:</span> {m.actionTaken}</p>
                    <p className="mt-1"><span className="font-medium">Issues:</span> {m.issuesIdentified}</p>
                    <p className="mt-1"><span className="font-medium">Notes:</span> {m.notes}</p>
                    <p className="mt-1 text-xs text-muted">Inspector: {m.inspector}</p>
                  </div>
                ))}
                {data.maintenanceHistory.length === 0 && (
                  <p className="py-6 text-center text-faint">No maintenance records</p>
                )}
              </div>
              <Pagination
                page={data.maintenanceHistoryPagination.page}
                totalPages={data.maintenanceHistoryPagination.totalPages}
                total={data.maintenanceHistoryPagination.total}
                onPageChange={setPage}
              />
            </Card>
          </section>
        </div>
      )}
    </AppLayout>
  );
}
