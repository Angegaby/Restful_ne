'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AppLayout from '@/components/Layout';
import Pagination from '@/components/Pagination';
import { maintenanceSchema } from '@/lib/validators';
import { minCalendarIsoDate, todayIsoDate } from '@/lib/dates';
import { api, ApiError } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { Paginated, paginatedQuery } from '@/lib/pagination';
import { Card, Button, Alert, Input, Select, Textarea } from '@/components/ui';

type FormData = z.infer<typeof maintenanceSchema>;

interface MaintenanceLog {
  id: string;
  maintenanceDate: string;
  actionTaken: string;
  issuesIdentified: string;
  notes: string;
  extinguisher?: { serialNumber: string; location: string };
  inspector?: { firstName: string; lastName: string };
}

const emptyPage: Paginated<MaintenanceLog> = {
  items: [],
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};

export default function MaintenancePage() {
  const user = getUser();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<MaintenanceLog>>(emptyPage);
  const [extinguishers, setExtinguishers] = useState<{ id: string; serialNumber: string }[]>([]);
  const [error, setError] = useState('');

  const load = () =>
    api
      .get<Paginated<MaintenanceLog>>(`/maintenance?${paginatedQuery(page, 10)}`)
      .then(setData)
      .catch(() => setData(emptyPage));

  useEffect(() => {
    load();
  }, [page]);

  useEffect(() => {
    api
      .get<Paginated<{ id: string; serialNumber: string }>>('/extinguishers?limit=100&page=1')
      .then((r) => setExtinguishers(r.items));
  }, []);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(maintenanceSchema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await api.post('/maintenance', data);
      reset();
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to log maintenance');
    }
  };

  if (user?.role !== 'INSPECTOR') {
    return (
      <AppLayout>
        <h1 className="page-title mb-4">Maintenance</h1>
        <p className="text-muted">Only field inspectors can log maintenance activities.</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <h1 className="page-title mb-2">Maintenance Logging</h1>
      <p className="mb-6 text-sm text-muted">
        Log maintenance performed on assigned extinguishers (per inspection workflow).
      </p>
      <Card className="mb-8 max-w-lg">
        <h2 className="mb-4 font-semibold">Log Maintenance Activity</h2>
        {error && <Alert message={error} />}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Select
            label="Fire Extinguisher"
            options={[
              { value: '', label: 'Select...' },
              ...extinguishers.map((e) => ({ value: e.id, label: e.serialNumber })),
            ]}
            {...register('extinguisherId')}
            error={errors.extinguisherId?.message}
          />
          <Input label="Action Taken" {...register('actionTaken')} error={errors.actionTaken?.message} />
          <Input
            label="Date"
            type="date"
            min={minCalendarIsoDate()}
            max={todayIsoDate()}
            {...register('maintenanceDate')}
            error={errors.maintenanceDate?.message}
          />
          <Textarea
            label="Issues Identified"
            {...register('issuesIdentified')}
            error={errors.issuesIdentified?.message}
          />
          <Textarea label="Notes & Recommendations" {...register('notes')} error={errors.notes?.message} />
          <Button type="submit" disabled={isSubmitting}>
            Log Maintenance
          </Button>
        </form>
      </Card>
      <Card>
        <h2 className="mb-4 font-semibold">Maintenance History</h2>
        <div className="space-y-4">
          {data.items.map((m) => (
            <div key={m.id} className="rounded-lg border p-4 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-medium">
                  {m.extinguisher?.serialNumber} — {m.extinguisher?.location}
                </p>
                <span className="text-muted">{m.maintenanceDate}</span>
              </div>
              <p className="mt-1 text-ink-soft">
                <span className="font-medium">Action:</span> {m.actionTaken}
              </p>
              <p className="mt-1 text-muted">
                <span className="font-medium">Issues:</span> {m.issuesIdentified}
              </p>
              <p className="mt-1 text-muted">
                <span className="font-medium">Notes:</span> {m.notes}
              </p>
              {m.inspector && (
                <p className="mt-2 text-xs text-muted">
                  Inspector: {m.inspector.firstName} {m.inspector.lastName}
                </p>
              )}
            </div>
          ))}
          {data.items.length === 0 && (
            <p className="py-6 text-center text-faint">No maintenance logs yet</p>
          )}
        </div>
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          onPageChange={setPage}
        />
      </Card>
    </AppLayout>
  );
}
