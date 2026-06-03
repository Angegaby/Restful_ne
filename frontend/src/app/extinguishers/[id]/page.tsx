'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/Layout';
import BackLink from '@/components/BackLink';
import { Card, Badge, Button, Alert } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { getUser, isAdmin } from '@/lib/auth';

interface ExtinguisherDetail {
  id: string;
  serialNumber: string;
  location: string;
  type: string;
  size: string;
  status: string;
  installationDate: string;
  expiryDate: string;
  assignedInspectorId?: string | null;
  assignedInspector?: { firstName: string; lastName: string; email: string } | null;
}

export default function ExtinguisherDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const user = getUser();
  const [item, setItem] = useState<ExtinguisherDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      api.get<ExtinguisherDetail>(`/extinguishers/${id}`).then(setItem).catch(() => setItem(null));
    }
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this extinguisher record permanently?')) return;
    setError('');
    try {
      await api.delete(`/extinguishers/${id}`);
      router.push('/extinguishers');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not delete extinguisher');
    }
  };

  if (!item) {
    return (
      <AppLayout>
        <BackLink href="/extinguishers" label="Back to extinguishers" />
        <p className="text-muted">Loading...</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <BackLink href="/extinguishers" label="Back to extinguishers" />
      {error && (
        <div className="mb-4">
          <Alert message={error} />
        </div>
      )}
      <div className="mb-6 flex flex-wrap justify-between gap-4">
        <h1 className="page-title">{item.serialNumber}</h1>
        {isAdmin(user?.role) && (
          <div className="flex gap-2">
            <Link href={`/extinguishers/${id}/edit`}>
              <Button variant="secondary">Edit</Button>
            </Link>
            <Button variant="danger" onClick={handleDelete}>
              Delete record
            </Button>
          </div>
        )}
      </div>
      <Card className="max-w-lg">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-muted">Location</dt>
            <dd className="font-medium">{item.location}</dd>
          </div>
          <div>
            <dt className="text-muted">Type</dt>
            <dd>{item.type}</dd>
          </div>
          <div>
            <dt className="text-muted">Size</dt>
            <dd>{String(item.size).replace('LB_', '')} lb</dd>
          </div>
          <div>
            <dt className="text-muted">Status</dt>
            <dd><Badge>{item.status}</Badge></dd>
          </div>
          <div>
            <dt className="text-muted">Installation</dt>
            <dd>{item.installationDate}</dd>
          </div>
          <div>
            <dt className="text-muted">Expiry</dt>
            <dd>{item.expiryDate}</dd>
          </div>
          <div>
            <dt className="text-muted">Assigned inspector</dt>
            <dd>
              {item.assignedInspector
                ? `${item.assignedInspector.firstName} ${item.assignedInspector.lastName}`
                : 'Unassigned'}
            </dd>
          </div>
        </dl>
      </Card>
    </AppLayout>
  );
}
