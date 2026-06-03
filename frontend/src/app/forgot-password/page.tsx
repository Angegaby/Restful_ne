'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { z } from 'zod';
import { api, ApiError } from '@/lib/api';
import AuthShell from '@/components/AuthShell';
import { Input, Button, Alert, Card } from '@/components/ui';

const schema = z.object({ email: z.string().email() });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    setMessage('');
    try {
      const res = await api.post<{ message: string; devMode?: boolean }>(
        '/auth/forgot-password',
        data,
        false
      );
      setMessage(res.message);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Request failed');
    }
  };

  return (
    <AuthShell title="Forgot password" subtitle="We will email reset instructions if the account exists">
      <Card>
        {error && <Alert message={error} />}
        {message && <Alert message={message} type="success" />}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Button type="submit" disabled={isSubmitting}>
            Send Reset Link
          </Button>
        </form>
        <Link href="/login" className="text-link mt-4 inline-block text-sm">
          Back to login
        </Link>
      </Card>
    </AuthShell>
  );
}
