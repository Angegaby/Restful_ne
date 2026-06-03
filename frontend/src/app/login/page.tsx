'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { loginSchema } from '@/lib/validators';
import { z } from 'zod';
import { api, ApiError, LoginResponse } from '@/lib/api';
import { setAuth } from '@/lib/auth';
import AuthShell from '@/components/AuthShell';
import { Input, PasswordInput, Button, Alert, Card } from '@/components/ui';

type FormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const res = await api.post<LoginResponse>('/auth/login', data, false);
      setAuth(res.accessToken, res.refreshToken, res.user);
      router.push('/dashboard');
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('Login failed');
      }
    }
  };

  return (
    <AuthShell title="Sign in" subtitle="Access your fire safety workspace">
      <Card>
        {error && <Alert message={error} />}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input label="Email" id="email" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
          <PasswordInput label="Password" id="password" autoComplete="current-password" {...register('password')} error={errors.password?.message} />
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          <Link href="/forgot-password" className="text-link">
            Forgot password?
          </Link>
          {' · '}
          <Link href="/register" className="text-link">
            Register
          </Link>
        </p>
      </Card>
    </AuthShell>
  );
}
