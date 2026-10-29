'use client';

import { useFormStatus } from 'react-dom';
import type { ComponentProps } from 'react';
import { LoaderCircle } from 'lucide-react';

export default function PendingSubmitButton({ children, className, disabled, ...props }: ComponentProps<'button'>) {
  const { pending } = useFormStatus();
  return <button {...props} type="submit" disabled={disabled || pending} aria-busy={pending} className={`${className ?? ''} disabled:opacity-60 disabled:cursor-wait`}>
    <span className="inline-flex items-center gap-2">{pending && <LoaderCircle size={15} aria-hidden="true" className="motion-safe:animate-spin" />}{pending ? 'Processando…' : children}</span>
  </button>;
}
