import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

// Native disclosure keeps audit details accessible without extra client JavaScript.
export default function AuditEventAccordion({ title, metadata, description, children }: {
  title: ReactNode;
  metadata?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <details className="group min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700">
      <summary className="flex min-h-12 list-none items-start justify-between gap-4 rounded-lg px-4 py-3 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:hover:bg-zinc-800 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 break-words text-sm">
          <span className="block font-semibold text-zinc-900 dark:text-zinc-100">{title}</span>
          {metadata && <span className="mt-1 block text-xs text-zinc-600 dark:text-zinc-400">{metadata}</span>}
          {description && <span className="mt-1 block whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{description}</span>}
        </span>
        <ChevronDown size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-zinc-500 transition-transform group-open:rotate-180 motion-reduce:transition-none dark:text-zinc-400" />
      </summary>
      <div className="space-y-3 break-words border-t border-zinc-200 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">{children}</div>
    </details>
  );
}
