'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AppLayout from '@/components/Layout';
import { profileSchema, changePasswordSchema } from '@/lib/validators';
import { api, ApiError } from '@/lib/api';
import { setAuth, getRefreshToken } from '@/lib/auth';
import { Input, PasswordInput, Button, Alert, Card } from '@/components/ui';

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof changePasswordSchema>;

export default function ProfilePage() {
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(changePasswordSchema) });

  useEffect(() => {
    api.get<ProfileForm & { email: string }>('/users/me').then((u) => {
      profileForm.reset({ firstName: u.firstName, lastName: u.lastName, email: u.email });
    });
  }, [profileForm]);

  const onProfile = async (data: ProfileForm) => {
    setErr('');
    try {
      const updated = await api.put<{
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: 'ADMIN' | 'INSPECTOR' | 'USER';
      }>('/users/me', data);
      const token = localStorage.getItem('fems_access_token')!;
      const refresh = getRefreshToken()!;
      setAuth(token, refresh, {
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        role: updated.role,
      });
      setMsg('Profile updated');
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Update failed');
    }
  };

  const onPassword = async (data: PasswordForm) => {
    setErr('');
    try {
      await api.put('/users/me/password', data);
      setMsg('Password changed');
      passwordForm.reset();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Password change failed');
    }
  };

  return (
    <AppLayout>
      <h1 className="page-title mb-6">Profile</h1>
      {msg && <Alert message={msg} type="success" />}
      {err && <Alert message={err} />}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Update Profile</h2>
          <form onSubmit={profileForm.handleSubmit(onProfile)}>
            <Input label="First Name" {...profileForm.register('firstName')} error={profileForm.formState.errors.firstName?.message} />
            <Input label="Last Name" {...profileForm.register('lastName')} error={profileForm.formState.errors.lastName?.message} />
            <Input label="Email" type="email" {...profileForm.register('email')} error={profileForm.formState.errors.email?.message} />
            <Button type="submit">Save Profile</Button>
          </form>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">Change Password</h2>
          <form onSubmit={passwordForm.handleSubmit(onPassword)}>
            <PasswordInput label="Current Password" autoComplete="current-password" {...passwordForm.register('currentPassword')} />
            <PasswordInput label="New Password" autoComplete="new-password" {...passwordForm.register('newPassword')} error={passwordForm.formState.errors.newPassword?.message} />
            <Button type="submit">Change Password</Button>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
