import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

export function InstagramIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" focusable="false" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r=".9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function WhatsAppIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" focusable="false" {...props}>
      <path d="M20.5 11.8a8.5 8.5 0 0 1-12.7 7.4L3 20.8l1.6-4.7a8.5 8.5 0 1 1 15.9-4.3Z" />
      <path d="M8 7h2l1 2.5-1.3 1a7 7 0 0 0 3.8 3.8l1-1.3 2.5 1v2c0 .6-.4 1-1 1A10 10 0 0 1 7 8c0-.6.4-1 1-1Z" strokeWidth={1.4} />
    </svg>
  );
}

export function SteeringWheelIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" focusable="false" {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M3.5 9h4l2.5 2M20.5 9h-4L14 11M10 14l-1 6M14 14l1 6" />
    </svg>
  );
}
