'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { registerSchema } from '@/lib/validators';
import { z } from 'zod';
import { api, ApiError } from '@/lib/api';
import AuthShell from '@/components/AuthShell';
import { Input, PasswordInput, Button, Alert, Card } from '@/components/ui';

type FormData = z.infer<typeof registerSchema>;

interface RegisterResponse {
  requiresVerification: boolean;
  email: string;
  message: string;
  devMode?: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(registerSchema), mode: 'onSubmit' });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const res = await api.post<RegisterResponse>('/auth/register', data, false);
      const params = new URLSearchParams({ email: res.email });
      if (res.devMode) params.set('dev', '1');
      router.push(`/verify-otp?${params.toString()}`);
    } catch (e) {
      if (e instanceof ApiError && e.errors?.length) {
        setError(e.errors.map((x) => x.message).join(', '));
      } else {
        setError(e instanceof ApiError ? e.message : 'Registration failed');
      }
    }
  };

  return (
    <AuthShell title="Create account" subtitle="Register as staff to request inspections">
      <Card>
        {error && <Alert message={error} />}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input
            label="First Name"
            id="firstName"
            autoComplete="given-name"
            {...register('firstName')}
            error={errors.firstName?.message}
          />
          <Input
            label="Last Name"
            id="lastName"
            autoComplete="family-name"
            {...register('lastName')}
            error={errors.lastName?.message}
          />
          <Input
            label="Email"
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            error={errors.email?.message}
          />
          <PasswordInput
            label="Password"
            id="password"
            autoComplete="new-password"
            {...register('password')}
            error={errors.password?.message}
          />
          <p className="mb-4 text-xs text-muted">
            Password: 8+ chars, uppercase, lowercase, and a number
          </p>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Creating account...' : 'Register'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="text-link">
            Already have an account? Sign in
          </Link>
        </p>
      </Card>
    </AuthShell>
  );
}
