'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AppLayout from '@/components/Layout';
import { inspectionSchema } from '@/lib/validators';
import { api, ApiError, applyApiFieldErrors, formatApiErrors } from '@/lib/api';
import { maxExpiryIsoDate, todayIsoDate } from '@/lib/dates';
import { getUser } from '@/lib/auth';
import { Paginated, paginatedQuery } from '@/lib/pagination';
import Pagination from '@/components/Pagination';
import { Card, Button, Badge, Alert, Input, Select, Textarea } from '@/components/ui';

type FormData = z.infer<typeof inspectionSchema>;

interface Inspection {
  id: string;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
  notes?: string;
  extinguisher?: { serialNumber: string; location: string };
}

interface Extinguisher {
  id: string;
  serialNumber: string;
}

const emptyPage: Paginated<Inspection> = {
  items: [],
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};

export default function InspectionsPage() {
  const user = getUser();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<Inspection>>(emptyPage);
  const [extinguishers, setExtinguishers] = useState<Extinguisher[]>([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = () =>
    api
      .get<Paginated<Inspection>>(`/inspections?${paginatedQuery(page, 10)}`)
      .then(setData)
      .catch(() => setData(emptyPage));

  useEffect(() => {
    load();
  }, [page]);

  useEffect(() => {
    api
      .get<Paginated<Extinguisher>>('/extinguishers?limit=100&page=1')
      .then((r) => setExtinguishers(r.items));
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(inspectionSchema),
    mode: 'onSubmit',
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await api.post('/inspections', data);
      reset();
      setShowForm(false);
      load();
    } catch (e) {
      if (e instanceof ApiError) {
        applyApiFieldErrors<FormData>(e, setFieldError);
        setError(formatApiErrors(e));
      } else {
        setError('Failed to submit inspection request');
      }
    }
  };

  const complete = async (id: string) => {
    await api.patch(`/inspections/${id}/complete`, { status: 'COMPLETED' });
    load();
  };

  const statusColor = (s: string) =>
    s === 'COMPLETED' ? 'green' : s === 'OVERDUE' ? 'red' : 'yellow';

  const isUser = user?.role === 'USER';
  const isInspector = user?.role === 'INSPECTOR';
  const canSchedule = isUser;
  const formTitle = 'Request Inspection';
  const formHeading = 'Request an inspection for a building extinguisher';

  return (
    <AppLayout>
      <div className="mb-6 flex justify-between">
        <div>
          <h1 className="page-title">Inspections</h1>
          <p className="mt-1 text-sm text-muted">
            {isUser
              ? 'View your requests — personnel are notified when you submit'
              : isInspector
                ? 'Complete inspections on equipment assigned to you'
                : 'View all inspection requests (admins do not schedule inspections)'}
          </p>
        </div>
        {canSchedule && (
          <Button onClick={() => setShowForm(!showForm)}>{formTitle}</Button>
        )}
      </div>

      {showForm && canSchedule && (
        <Card className="mb-6 max-w-lg">
          <h2 className="mb-4 font-semibold">{formHeading}</h2>
          {error && <Alert message={error} />}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Select
              label="Fire Extinguisher"
              options={[
                { value: '', label: 'Select a fire extinguisher...' },
                ...extinguishers.map((e) => ({ value: e.id, label: e.serialNumber })),
              ]}
              {...register('extinguisherId')}
              error={errors.extinguisherId?.message}
            />
            <Input
              label="Date"
              type="date"
              min={todayIsoDate()}
              max={maxExpiryIsoDate()}
              {...register('scheduledDate')}
              error={errors.scheduledDate?.message}
            />
            <Input
              label="Time (HH:MM)"
              placeholder="10:00"
              {...register('scheduledTime')}
              error={errors.scheduledTime?.message}
            />
            <Textarea label="Notes (optional)" {...register('notes')} error={errors.notes?.message} />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit request'}
            </Button>
          </form>
        </Card>
      )}

      <Card>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-muted">
              <th className="pb-3 pr-4">Serial</th>
              <th className="pb-3 pr-4">Location</th>
              <th className="pb-3 pr-4">Date</th>
              <th className="pb-3 pr-4">Time</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((i) => (
              <tr key={i.id} className="border-b">
                <td className="py-3">{i.extinguisher?.serialNumber}</td>
                <td className="py-3">{i.extinguisher?.location}</td>
                <td className="py-3">{i.scheduledDate}</td>
                <td className="py-3">{i.scheduledTime}</td>
                <td className="py-3"><Badge color={statusColor(i.status)}>{i.status}</Badge></td>
                <td className="py-3">
                  {isInspector && i.status !== 'COMPLETED' && (
                    <Button variant="secondary" onClick={() => complete(i.id)}>
                      Mark complete
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
