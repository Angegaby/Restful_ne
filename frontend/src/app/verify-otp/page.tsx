'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { z } from 'zod';
import { api, ApiError, LoginResponse } from '@/lib/api';
import { setAuth } from '@/lib/auth';
import AuthShell from '@/components/AuthShell';
import { Input, Button, Alert, Card } from '@/components/ui';

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'Enter the 6-digit code').regex(/^\d{6}$/, 'Code must be 6 digits'),
});

type FormData = z.infer<typeof schema>;

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') || '';
  const devMode = params.get('dev') === '1';
  const [error, setError] = useState('');
  const [info, setInfo] = useState(
    devMode
      ? 'SMTP is not configured yet. Check the backend terminal for your 6-digit code.'
      : 'Enter the 6-digit code sent to your email.'
  );

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email },
    mode: 'onSubmit',
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const res = await api.post<LoginResponse>('/auth/verify-otp', data, false);
      setAuth(res.accessToken, res.refreshToken, res.user);
      router.push('/dashboard');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Verification failed');
    }
  };

  const resend = async () => {
    setError('');
    try {
      const res = await api.post<{ message: string; devMode?: boolean }>(
        '/auth/resend-otp',
        { email },
        false
      );
      setInfo(res.message);
      if (res.devMode) {
        setInfo('New code generated — check the backend terminal console.');
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not resend code');
    }
  };

  return (
    <Card>
      <p className="mb-4 text-sm text-muted">{info}</p>
      {error && <Alert message={error} />}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Email"
          id="email"
          type="email"
          readOnly
          {...register('email')}
          error={errors.email?.message}
        />
        <Input
          label="Verification Code"
          id="code"
          placeholder="123456"
          maxLength={6}
          inputMode="numeric"
          autoComplete="one-time-code"
          {...register('code')}
          error={errors.code?.message}
        />
        <Button type="submit" disabled={isSubmitting} className="mb-2 w-full">
          {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
        </Button>
      </form>
      <button type="button" onClick={resend} className="text-link text-sm">
        Resend code
      </button>
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-link">
          Back to login
        </Link>
      </p>
    </Card>
  );
}

export default function VerifyOtpPage() {
  return (
    <AuthShell title="Verify email" subtitle="Confirm your account to continue">
      <Suspense fallback={<Card><p className="text-muted">Loading...</p></Card>}>
        <VerifyForm />
      </Suspense>
    </AuthShell>
  );
}
