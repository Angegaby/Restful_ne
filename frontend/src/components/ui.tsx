'use client';

import { forwardRef, ReactNode, useState } from 'react';

function EyeIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function EyeOffIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.158 5.009 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-surface-elevated p-6 shadow-card ${className}`}>
      {children}
    </div>
  );
}

export function Button({
  children,
  type = 'button',
  variant = 'primary',
  disabled,
  onClick,
  className = '',
}: {
  children: ReactNode;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const variants = {
    primary:
      'bg-brand text-white shadow-sm hover:bg-brand-dark focus-visible:ring-2 focus-visible:ring-brand-light focus-visible:ring-offset-2',
    secondary:
      'border border-border-strong bg-canvas text-ink-soft hover:bg-border/40 focus-visible:ring-2 focus-visible:ring-brand-light/40',
    danger:
      'bg-stat-danger/10 text-stat-danger hover:bg-stat-danger/20 focus-visible:ring-2 focus-visible:ring-stat-danger/30',
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

const inputStyles =
  'text-ink caret-brand-light placeholder:text-faint selection:bg-brand/10 selection:text-ink';

export const Input = forwardRef<
  HTMLInputElement,
  { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ label, error, className, ...props }, ref) {
  return (
    <div className="mb-4">
      <label htmlFor={props.id || props.name} className="mb-1.5 block text-sm font-medium text-ink-soft">
        {label}
      </label>
      <input
        ref={ref}
        {...props}
        className={`w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-light focus:ring-2 focus:ring-brand-light/25 ${inputStyles} ${
          error ? 'border-stat-danger' : 'border-border-strong'
        } ${className || ''}`}
      />
      {error && <p className="mt-1 text-xs text-stat-danger">{error}</p>}
    </div>
  );
});

export const PasswordInput = forwardRef<
  HTMLInputElement,
  { label: string; error?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>
>(function PasswordInput({ label, error, className, id, name, ...props }, ref) {
  const [visible, setVisible] = useState(false);
  const inputId = id || name;

  return (
    <div className="mb-4">
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink-soft">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={visible ? 'text' : 'password'}
          {...props}
          className={`w-full rounded-xl border bg-surface py-2.5 pl-3.5 pr-10 text-sm outline-none transition focus:border-brand-light focus:ring-2 focus:ring-brand-light/25 ${inputStyles} ${
            error ? 'border-stat-danger' : 'border-border-strong'
          } ${className || ''}`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted hover:bg-canvas hover:text-ink"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-stat-danger">{error}</p>}
    </div>
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  {
    label: string;
    error?: string;
    options: { value: string; label: string }[];
  } & React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ label, error, options, className, ...props }, ref) {
  return (
    <div className="mb-4">
      <label htmlFor={props.id || props.name} className="mb-1.5 block text-sm font-medium text-ink-soft">
        {label}
      </label>
      <select
        ref={ref}
        {...props}
        className={`w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-light focus:ring-2 focus:ring-brand-light/25 ${inputStyles} ${
          error ? 'border-stat-danger' : 'border-border-strong'
        } ${className || ''}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-stat-danger">{error}</p>}
    </div>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  { label: string; error?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ label, error, className, ...props }, ref) {
  return (
    <div className="mb-4">
      <label htmlFor={props.id || props.name} className="mb-1.5 block text-sm font-medium text-ink-soft">
        {label}
      </label>
      <textarea
        ref={ref}
        {...props}
        className={`w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-light focus:ring-2 focus:ring-brand-light/25 ${inputStyles} ${
          error ? 'border-stat-danger' : 'border-border-strong'
        } ${className || ''}`}
      />
      {error && <p className="mt-1 text-xs text-stat-danger">{error}</p>}
    </div>
  );
});

export function Alert({ message, type = 'error' }: { message: string; type?: 'error' | 'success' }) {
  return (
    <div
      className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
        type === 'error'
          ? 'border-stat-danger/30 bg-stat-danger/10 text-stat-danger'
          : 'border-stat-ok/30 bg-stat-ok/10 text-stat-ok'
      }`}
    >
      {message}
    </div>
  );
}

export function Badge({ children, color = 'neutral' }: { children: ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    neutral: 'bg-canvas text-ink-soft ring-1 ring-border',
    green: 'bg-stat-ok/15 text-stat-ok ring-1 ring-stat-ok/25',
    red: 'bg-stat-danger/15 text-stat-danger ring-1 ring-stat-danger/25',
    yellow: 'bg-stat-warn/15 text-stat-warn ring-1 ring-stat-warn/25',
    blue: 'bg-brand/10 text-brand ring-1 ring-brand/20',
    slate: 'bg-canvas text-ink-soft ring-1 ring-border',
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[color] || colors.neutral}`}>
      {children}
    </span>
  );
}
