'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { z } from 'zod';
import { passwordSchema } from '@/lib/validators';
import { api, ApiError } from '@/lib/api';
import AuthShell from '@/components/AuthShell';
import { PasswordInput, Button, Alert, Card } from '@/components/ui';

const schema = z.object({
  password: passwordSchema,
});

type FormData = z.infer<typeof schema>;

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token')?.trim() || '';
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    if (!token) {
      setError('This reset link is invalid. Use the link from your email or request a new one.');
      return;
    }
    try {
      await api.post('/auth/reset-password', { token, password: data.password }, false);
      setSuccess('Password reset. You can now sign in.');
      setTimeout(() => router.push('/login'), 2000);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Reset failed');
    }
  };

  return (
    <Card>
      {!token && (
        <Alert message="Open the reset link from your email to set a new password." />
      )}
      {error && <Alert message={error} />}
      {success && <Alert message={success} type="success" />}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <PasswordInput
          label="New Password"
          id="password"
          autoComplete="new-password"
          {...register('password')}
          error={errors.password?.message}
        />
        <Button type="submit" disabled={isSubmitting || !token} className="w-full">
          {isSubmitting ? 'Saving...' : 'Reset Password'}
        </Button>
      </form>
      <Link href="/forgot-password" className="text-link mt-3 inline-block text-sm">
        Request a new reset link
      </Link>
      <Link href="/login" className="text-link mt-2 block text-sm">
        Back to login
      </Link>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Reset password" subtitle="Choose a new password for your account">
      <Suspense fallback={<Card><p className="text-muted">Loading...</p></Card>}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
