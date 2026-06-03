'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';
import AppLayout from '@/components/Layout';
import BackLink from '@/components/BackLink';
import { extinguisherSchema } from '@/lib/validators';
import { api, ApiError } from '@/lib/api';
import { minCalendarIsoDate, maxExpiryIsoDate, todayIsoDate } from '@/lib/dates';
import { Input, Select, Button, Alert, Card } from '@/components/ui';
import { InspectorSelect } from '@/components/InspectorSelect';

type FormData = z.infer<typeof extinguisherSchema>;

const typeOptions = [
  { value: 'WATER', label: 'Water' },
  { value: 'CO2', label: 'CO₂' },
  { value: 'FOAM', label: 'Foam' },
  { value: 'DRY_CHEMICAL', label: 'Dry Chemical' },
];

const sizeOptions = [
  { value: 'LB_1_5', label: '1.5 lb' },
  { value: 'LB_5', label: '5 lb' },
  { value: 'LB_9', label: '9 lb' },
  { value: 'LB_12', label: '12 lb' },
];

export default function NewExtinguisherPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(extinguisherSchema),
    defaultValues: { type: 'CO2', size: 'LB_5', status: 'ACTIVE' },
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    const payload = {
      ...data,
      assignedInspectorId: data.assignedInspectorId || null,
    };
    try {
      await api.post('/extinguishers', payload);
      router.push('/extinguishers');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to create');
    }
  };

  return (
    <AppLayout>
      <BackLink href="/extinguishers" label="Back to extinguishers" />
      <h1 className="page-title mb-6">Register Fire Extinguisher</h1>
      <Card className="max-w-lg">
        {error && <Alert message={error} />}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Input label="Serial Number" {...register('serialNumber')} error={errors.serialNumber?.message} />
          <Input label="Location" {...register('location')} error={errors.location?.message} />
          <Select label="Type" options={typeOptions} {...register('type')} error={errors.type?.message} />
          <Select label="Size" options={sizeOptions} {...register('size')} error={errors.size?.message} />
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
            { value: 'ACTIVE', label: 'Active' },
            { value: 'EXPIRED', label: 'Expired' },
            { value: 'MAINTENANCE', label: 'Maintenance' },
            { value: 'DECOMMISSIONED', label: 'Decommissioned' },
          ]} {...register('status')} />
          <InspectorSelect
            register={register('assignedInspectorId')}
            error={errors.assignedInspectorId?.message}
          />
          <p className="-mt-2 mb-4 text-xs text-muted">
            Assign a field inspector who will perform inspections at this location.
          </p>
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>Save</Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </Card>
    </AppLayout>
  );
}
