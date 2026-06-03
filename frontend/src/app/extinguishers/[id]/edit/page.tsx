'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useParams } from 'next/navigation';
import { z } from 'zod';
import AppLayout from '@/components/Layout';
import BackLink from '@/components/BackLink';
import { extinguisherSchema } from '@/lib/validators';
import { api, ApiError } from '@/lib/api';
import { minCalendarIsoDate, maxExpiryIsoDate, todayIsoDate } from '@/lib/dates';
import { Input, Select, Button, Alert, Card } from '@/components/ui';
import { InspectorSelect } from '@/components/InspectorSelect';

type FormData = z.infer<typeof extinguisherSchema>;

export default function EditExtinguisherPage() {
  const { id } = useParams();
  const router = useRouter();
  const [error, setError] = useState('');
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(extinguisherSchema),
  });

  useEffect(() => {
    if (id) {
      api.get<FormData & { id: string; assignedInspectorId?: string | null }>(`/extinguishers/${id}`).then((d) => {
        reset({
          serialNumber: d.serialNumber,
          location: d.location,
          type: d.type as FormData['type'],
          size: d.size as FormData['size'],
          installationDate: d.installationDate,
          expiryDate: d.expiryDate,
          status: (d.status as FormData['status']) || 'ACTIVE',
          assignedInspectorId: d.assignedInspectorId || '',
        });
      });
    }
  }, [id, reset]);

  const onSubmit = async (data: FormData) => {
    setError('');
    const payload = {
      ...data,
      assignedInspectorId: data.assignedInspectorId || null,
    };
    try {
      await api.put(`/extinguishers/${id}`, payload);
      router.push(`/extinguishers/${id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Update failed');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this extinguisher?')) return;
    await api.delete(`/extinguishers/${id}`);
    router.push('/extinguishers');
  };

  return (
    <AppLayout>
      <BackLink href={`/extinguishers/${id}`} label="Back to details" />
      <h1 className="page-title mb-6">Edit Extinguisher</h1>
      <Card className="max-w-lg">
        {error && <Alert message={error} />}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Input label="Serial Number" {...register('serialNumber')} error={errors.serialNumber?.message} />
          <Input label="Location" {...register('location')} error={errors.location?.message} />
          <Select label="Type" options={[
            { value: 'WATER', label: 'Water' }, { value: 'CO2', label: 'CO₂' },
            { value: 'FOAM', label: 'Foam' }, { value: 'DRY_CHEMICAL', label: 'Dry Chemical' },
          ]} {...register('type')} />
          <Select label="Size" options={[
            { value: 'LB_1_5', label: '1.5 lb' }, { value: 'LB_5', label: '5 lb' },
            { value: 'LB_9', label: '9 lb' }, { value: 'LB_12', label: '12 lb' },
          ]} {...register('size')} />
          <Input
            label="Installation Date"
            type="date"
            min={minCalendarIsoDate()}
            max={todayIsoDate()}
            {...register('installationDate')}
            error={errors.installationDate?.message}
          />
          <Input
            label="Expiry Date"
            type="date"
            min={minCalendarIsoDate()}
            max={maxExpiryIsoDate()}
            {...register('expiryDate')}
            error={errors.expiryDate?.message}
          />
          <Select label="Status" options={[
            { value: 'ACTIVE', label: 'Active' }, { value: 'EXPIRED', label: 'Expired' },
            { value: 'MAINTENANCE', label: 'Maintenance' }, { value: 'DECOMMISSIONED', label: 'Decommissioned' },
          ]} {...register('status')} />
          <InspectorSelect register={register('assignedInspectorId')} />
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>Update</Button>
            <Button type="button" variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </form>
      </Card>
    </AppLayout>
  );
}
