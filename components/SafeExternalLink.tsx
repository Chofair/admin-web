import type { ReactNode } from 'react';

function getSafeHttpsUrl(value?: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export default function SafeExternalLink({
  href,
  children,
  className,
  fallback = null,
}: {
  href?: string | null;
  children: ReactNode;
  className?: string;
  fallback?: ReactNode;
}) {
  const safeHref = getSafeHttpsUrl(href);
  if (!safeHref) return fallback;

  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}
