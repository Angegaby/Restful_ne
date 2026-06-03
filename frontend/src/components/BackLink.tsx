'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function BackLink({
  href,
  label = 'Back',
}: {
  href?: string;
  label?: string;
}) {
  const router = useRouter();

  if (href) {
    return (
      <Link href={href} className="text-link mb-4 inline-flex items-center gap-1 text-sm">
        <span aria-hidden>←</span> {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="text-link mb-4 inline-flex items-center gap-1 text-sm"
    >
      <span aria-hidden>←</span> {label}
    </button>
  );
}
