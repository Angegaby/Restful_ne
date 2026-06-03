'use client';

import { useEffect, useState } from 'react';
import { Select } from '@/components/ui';
import { api } from '@/lib/api';
import { UseFormRegisterReturn } from 'react-hook-form';

interface Inspector {
  id: string;
  firstName: string;
  lastName: string;
}

export function InspectorSelect({
  register,
  error,
  defaultValue,
}: {
  register: UseFormRegisterReturn<'assignedInspectorId'>;
  error?: string;
  defaultValue?: string | null;
}) {
  const [inspectors, setInspectors] = useState<Inspector[]>([]);

  useEffect(() => {
    api.get<Inspector[]>('/users/inspectors').then(setInspectors).catch(() => setInspectors([]));
  }, []);

  return (
    <Select
      label="Assigned Inspector"
      options={[
        { value: '', label: '— Not assigned —' },
        ...inspectors.map((i) => ({
          value: i.id,
          label: `${i.firstName} ${i.lastName}`,
        })),
      ]}
      defaultValue={defaultValue || ''}
      {...register}
      error={error}
    />
  );
}
