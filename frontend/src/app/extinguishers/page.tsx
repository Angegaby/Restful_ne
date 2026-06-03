'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/Layout';
import Pagination from '@/components/Pagination';
import { Card, Button, Badge } from '@/components/ui';
import { api } from '@/lib/api';
import { getUser, isAdmin } from '@/lib/auth';
import { Paginated, paginatedQuery } from '@/lib/pagination';

interface Extinguisher {
  id: string;
  serialNumber: string;
  location: string;
  type: string;
  size: string;
  status: string;
  expiryDate: string;
  assignedInspector?: { firstName: string; lastName: string } | null;
}

const emptyPage: Paginated<Extinguisher> = {
  items: [],
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};

export default function ExtinguishersPage() {
  const user = getUser();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<Extinguisher>>(emptyPage);

  useEffect(() => {
    api
      .get<Paginated<Extinguisher>>(`/extinguishers?${paginatedQuery(page, 10)}`)
      .then(setData)
      .catch(() => setData(emptyPage));
  }, [page]);

  const statusColor = (s: string) =>
    s === 'ACTIVE' ? 'green' : s === 'EXPIRED' ? 'red' : 'yellow';

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="page-title">Fire Extinguishers</h1>
          <p className="mt-1 text-sm text-muted">
            {user?.role === 'INSPECTOR'
              ? 'Equipment assigned to you for field inspections'
              : user?.role === 'USER'
                ? 'View building equipment status'
                : 'Register company assets and assign inspectors'}
          </p>
        </div>
        {isAdmin(user?.role) && (
          <Link href="/extinguishers/new">
            <Button>Register New</Button>
          </Link>
        )}
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-muted">
                <th className="pb-3 pr-4">Serial</th>
                <th className="pb-3 pr-4">Location</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Size</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Expiry</th>
                {isAdmin(user?.role) && <th className="pb-3 pr-4">Inspector</th>}
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((e) => (
                <tr key={e.id} className="border-b border-border">
                  <td className="py-3 pr-4 font-medium">{e.serialNumber}</td>
                  <td className="py-3 pr-4">{e.location}</td>
                  <td className="py-3 pr-4">{e.type}</td>
                  <td className="py-3 pr-4">{e.size.replace('LB_', '')} lb</td>
                  <td className="py-3 pr-4"><Badge color={statusColor(e.status)}>{e.status}</Badge></td>
                  <td className="py-3 pr-4">{e.expiryDate}</td>
                  {isAdmin(user?.role) && (
                    <td className="py-3 pr-4 text-muted">
                      {e.assignedInspector
                        ? `${e.assignedInspector.firstName} ${e.assignedInspector.lastName}`
                        : 'Unassigned'}
                    </td>
                  )}
                  <td className="py-3">
                    <Link href={`/extinguishers/${e.id}`} className="text-link">View</Link>
                    {isAdmin(user?.role) && (
                      <> · <Link href={`/extinguishers/${e.id}/edit`} className="text-link">Edit</Link></>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.items.length === 0 && (
            <p className="py-8 text-center text-muted">No extinguishers found</p>
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
