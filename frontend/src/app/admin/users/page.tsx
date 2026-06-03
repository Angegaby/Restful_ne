'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AppLayout from '@/components/Layout';
import { passwordSchema } from '@/lib/validators';
import { api, ApiError } from '@/lib/api';
import Pagination from '@/components/Pagination';
import { Card, Button, Alert, Input, PasswordInput, Select, Badge } from '@/components/ui';
import { Paginated, paginatedQuery } from '@/lib/pagination';

const createSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: passwordSchema,
  role: z.enum(['ADMIN', 'INSPECTOR', 'USER']),
});

type FormData = z.infer<typeof createSchema>;

interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<UserRow>>({
    items: [],
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = () =>
    api
      .get<Paginated<UserRow>>(`/users?${paginatedQuery(page, 10)}`)
      .then(setData)
      .catch(console.error);
  useEffect(() => {
    load();
  }, [page]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(''), 5000);
    return () => clearTimeout(timer);
  }, [success]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'USER' },
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    setSuccess('');
    try {
      const res = await api.post<{
        inviteEmailSent?: boolean;
        email: string;
        role: string;
      }>('/users', data);
      reset();
      setShowForm(false);
      load();
      const roleName =
        res.role === 'INSPECTOR' ? 'Inspector' : res.role === 'USER' ? 'User' : 'Admin';
      const getsInvite = res.role === 'USER' || res.role === 'INSPECTOR';
      setSuccess(
        res.inviteEmailSent
          ? `${roleName} account created. Invite email with login credentials sent to ${res.email}.`
          : getsInvite
            ? `${roleName} account created. SMTP is not configured — check the backend console for credentials for ${res.email}.`
            : `${roleName} account created.`
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete user?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/users/${id}`);
      load();
      setSuccess('User deleted successfully.');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not delete user.');
    }
  };

  return (
    <AppLayout>
      <div className="mb-6 flex justify-between">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="mt-1 text-sm text-muted">
            Create <strong>User</strong> or <strong>Inspector</strong> accounts — each receives an invite email with login credentials (change password anytime in Profile).
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>Add User</Button>
      </div>
      {error && (
        <div className="mb-4">
          <Alert message={error} />
        </div>
      )}
      {success && (
        <Alert message={success} type="success" />
      )}
      {showForm && (
        <Card className="mb-6 max-w-lg">
          <form onSubmit={handleSubmit(onSubmit)}>
            <Input label="First Name" {...register('firstName')} error={errors.firstName?.message} />
            <Input label="Last Name" {...register('lastName')} error={errors.lastName?.message} />
            <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
            <PasswordInput label="Password" autoComplete="new-password" {...register('password')} error={errors.password?.message} />
            <Select label="Role" options={[
              { value: 'USER', label: 'User' },
              { value: 'INSPECTOR', label: 'Inspector' },
              { value: 'ADMIN', label: 'Admin' },
            ]} {...register('role')} />
            <p className="mb-4 text-xs text-muted">
              Invite emails are sent automatically when you create a <strong>User</strong> or <strong>Inspector</strong>.
            </p>
            <Button type="submit" disabled={isSubmitting}>Create & send invite</Button>
          </form>
        </Card>
      )}
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted">
              <th className="pb-3 text-left">Name</th>
              <th className="pb-3 text-left">Email</th>
              <th className="pb-3 text-left">Role</th>
              <th className="pb-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="py-3">{u.firstName} {u.lastName}</td>
                <td className="py-3">{u.email}</td>
                <td className="py-3"><Badge color="blue">{u.role}</Badge></td>
                <td className="py-3">
                  <button onClick={() => remove(u.id)} className="text-stat-danger text-sm">Delete</button>
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
