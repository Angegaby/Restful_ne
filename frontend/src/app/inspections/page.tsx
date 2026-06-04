'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import AppLayout from '@/components/Layout';
import { inspectionSchema } from '@/lib/validators';
import { api, ApiError, applyApiFieldErrors, formatApiErrors } from '@/lib/api';
import { maxExpiryIsoDate, todayIsoDate } from '@/lib/dates';
import { getUser } from '@/lib/auth';
import { Paginated, paginatedQuery } from '@/lib/pagination';
import Pagination from '@/components/Pagination';
import { Card, Button, Badge, Alert, Input, Select, Textarea } from '@/components/ui';
import { refreshNotifications } from '@/lib/notifications';

type FormData = z.infer<typeof inspectionSchema>;

interface Inspection {
  id: string;
  extinguisherId: string;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
  notes?: string | null;
  completedAt?: string | null;
  extinguisher?: {
    serialNumber: string;
    location: string;
    assignedInspectorId?: string | null;
  };
  scheduledBy?: { firstName: string; lastName: string; email: string };
}

interface InspectorOption {
  id: string;
  firstName: string;
  lastName: string;
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
  const [details, setDetails] = useState<Inspection | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [assignTarget, setAssignTarget] = useState<Inspection | null>(null);
  const [inspectors, setInspectors] = useState<InspectorOption[]>([]);
  const [selectedInspectorId, setSelectedInspectorId] = useState('');
  const [assigning, setAssigning] = useState(false);

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

  const isUser = user?.role === 'USER';
  const isInspector = user?.role === 'INSPECTOR';
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) {
      api.get<InspectorOption[]>('/users/inspectors').then(setInspectors).catch(() => setInspectors([]));
    }
  }, [isAdmin]);

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
      refreshNotifications();
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
    setActionError('');
    if (!confirm('Mark this inspection as completed?')) return;
    try {
      await api.patch(`/inspections/${id}/complete`, { status: 'COMPLETED' });
      load();
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : 'Could not complete inspection');
    }
  };

  const openDetails = async (id: string) => {
    setActionError('');
    setDetailsLoading(true);
    setDetails(null);
    try {
      const item = await api.get<Inspection>(`/inspections/${id}`);
      setDetails(item);
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : 'Could not load inspection details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const submitAssign = async () => {
    if (!assignTarget || !selectedInspectorId) return;
    setAssigning(true);
    setActionError('');
    try {
      await api.patch(`/inspections/${assignTarget.id}/assign-inspector`, {
        assignedInspectorId: selectedInspectorId,
      });
      setAssignTarget(null);
      setSelectedInspectorId('');
      load();
      refreshNotifications();
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : 'Could not assign inspector');
    } finally {
      setAssigning(false);
    }
  };

  const statusColor = (s: string) =>
    s === 'COMPLETED' ? 'green' : s === 'OVERDUE' ? 'red' : 'yellow';

  const canSchedule = isUser;
  const canComplete = (status: string) =>
    isInspector && status !== 'COMPLETED';

  const needsInspector = (i: Inspection) =>
    isAdmin && i.status !== 'COMPLETED' && !i.extinguisher?.assignedInspectorId;

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

      {actionError && (
        <div className="mb-4">
          <Alert message={actionError} />
        </div>
      )}

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

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="table-head">
              <th className="whitespace-nowrap pr-4">Serial</th>
              <th className="whitespace-nowrap pr-4">Location</th>
              <th className="whitespace-nowrap pr-4">Date</th>
              <th className="whitespace-nowrap pr-4">Time</th>
              <th className="whitespace-nowrap pr-4">Status</th>
              <th className="whitespace-nowrap pr-4">Inspector</th>
              <th className="whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((i) => (
              <tr key={i.id} className="table-row align-middle">
                <td className="whitespace-nowrap py-3 pr-4">{i.extinguisher?.serialNumber}</td>
                <td className="py-3 pr-4">{i.extinguisher?.location}</td>
                <td className="whitespace-nowrap py-3 pr-4">{i.scheduledDate}</td>
                <td className="whitespace-nowrap py-3 pr-4">{i.scheduledTime}</td>
                <td className="whitespace-nowrap py-3 pr-4">
                  <Badge color={statusColor(i.status)}>{i.status}</Badge>
                </td>
                <td className="whitespace-nowrap py-3 pr-4">
                  {needsInspector(i) ? (
                    <Button
                      variant="primary"
                      className="!px-3 !py-1.5 text-xs"
                      onClick={() => {
                        setAssignTarget(i);
                        setSelectedInspectorId('');
                      }}
                    >
                      Assign inspector
                    </Button>
                  ) : i.extinguisher?.assignedInspectorId ? (
                    <span className="text-sm text-stat-ok">Assigned</span>
                  ) : i.status === 'COMPLETED' ? (
                    <span className="text-sm text-faint">—</span>
                  ) : (
                    <span className="text-sm text-muted">Unassigned</span>
                  )}
                </td>
                <td className="whitespace-nowrap py-3">
                  <div className="flex items-center gap-3">
                    {i.extinguisherId && (
                      <Link href={`/extinguishers/${i.extinguisherId}`} className="text-link text-sm">
                        View unit
                      </Link>
                    )}
                    <button
                      type="button"
                      className="text-link text-sm"
                      onClick={() => openDetails(i.id)}
                    >
                      Details
                    </button>
                    {canComplete(i.status) && (
                      <Button
                        variant="secondary"
                        className="!px-2.5 !py-1 text-xs"
                        onClick={() => complete(i.id)}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.items.length === 0 && (
          <p className="py-8 text-center text-muted">No inspections found</p>
        )}
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          onPageChange={setPage}
        />
      </Card>

      {(detailsLoading || details) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inspection-details-title"
        >
          <Card className="max-h-[90vh] w-full max-w-md overflow-y-auto">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 id="inspection-details-title" className="font-display text-lg font-bold text-ink">
                Inspection details
              </h2>
              <button
                type="button"
                className="text-muted hover:text-ink"
                onClick={() => {
                  setDetails(null);
                  setDetailsLoading(false);
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            {detailsLoading && <p className="text-sm text-muted">Loading...</p>}
            {details && !detailsLoading && (
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted">Extinguisher</dt>
                  <dd className="font-medium text-ink">
                    {details.extinguisher?.serialNumber} — {details.extinguisher?.location}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Scheduled</dt>
                  <dd>
                    {details.scheduledDate} at {details.scheduledTime}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Status</dt>
                  <dd>
                    <Badge color={statusColor(details.status)}>{details.status}</Badge>
                  </dd>
                </div>
                {details.scheduledBy && (
                  <div>
                    <dt className="text-muted">Requested by</dt>
                    <dd>
                      {details.scheduledBy.firstName} {details.scheduledBy.lastName}
                      <span className="text-muted"> ({details.scheduledBy.email})</span>
                    </dd>
                  </div>
                )}
                {details.notes && (
                  <div>
                    <dt className="text-muted">Notes</dt>
                    <dd>{details.notes}</dd>
                  </div>
                )}
                {details.completedAt && (
                  <div>
                    <dt className="text-muted">Completed at</dt>
                    <dd>{new Date(details.completedAt).toLocaleString()}</dd>
                  </div>
                )}
                {details.extinguisherId && (
                  <div className="pt-2">
                    <Link href={`/extinguishers/${details.extinguisherId}`} className="text-link">
                      Open extinguisher record →
                    </Link>
                  </div>
                )}
                {isInspector && canComplete(details.status) && (
                  <div className="pt-2">
                    <Button
                      variant="primary"
                      onClick={() => {
                        complete(details.id);
                        setDetails(null);
                      }}
                    >
                      Mark complete
                    </Button>
                  </div>
                )}
              </dl>
            )}
          </Card>
        </div>
      )}

      {assignTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <Card className="w-full max-w-md">
            <h2 className="mb-2 font-display text-lg font-bold text-ink">Assign inspector</h2>
            <p className="mb-4 text-sm text-muted">
              {assignTarget.extinguisher?.serialNumber} — {assignTarget.extinguisher?.location}
              <br />
              Inspection on {assignTarget.scheduledDate} at {assignTarget.scheduledTime}
            </p>
            <Select
              label="Inspector"
              value={selectedInspectorId}
              onChange={(e) => setSelectedInspectorId(e.target.value)}
              options={[
                { value: '', label: 'Select inspector...' },
                ...inspectors.map((insp) => ({
                  value: insp.id,
                  label: `${insp.firstName} ${insp.lastName}`,
                })),
              ]}
            />
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                disabled={!selectedInspectorId || assigning}
                onClick={submitAssign}
              >
                {assigning ? 'Assigning...' : 'Assign & notify'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setAssignTarget(null);
                  setSelectedInspectorId('');
                }}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}
