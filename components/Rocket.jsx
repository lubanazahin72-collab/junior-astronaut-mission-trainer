'use client';

import { cn } from '@/lib/utils';

/** SVG rocket used in the intro and launch scenes. */
export default function Rocket({ className }) {
  return (
    <svg viewBox="0 0 64 140" aria-hidden className={cn('block', className)}>
      <defs>
        <linearGradient id="rocketBody" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d7e3ff" />
          <stop offset="0.5" stopColor="#ffffff" />
          <stop offset="1" stopColor="#9fb6e8" />
        </linearGradient>
        <linearGradient id="rocketFlame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd76a" />
          <stop offset="1" stopColor="#ff4d2e" />
        </linearGradient>
      </defs>
      <path
        d="M32 4 C44 26 46 44 46 66 L46 104 L18 104 L18 66 C18 44 20 26 32 4 Z"
        fill="url(#rocketBody)"
        stroke="#5b74b8"
        strokeWidth="1.5"
      />
      <circle cx="32" cy="46" r="8" fill="#0f2a5e" stroke="#8fd8ff" strokeWidth="2.5" />
      <path d="M18 78 L4 112 L18 104 Z" fill="#ff5c7a" />
      <path d="M46 78 L60 112 L46 104 Z" fill="#ff5c7a" />
      <rect x="18" y="104" width="28" height="10" rx="3" fill="#33477f" />
      <path
        className="rocket-flame"
        d="M24 116 C28 134 36 134 40 116 C37 124 27 124 24 116 Z"
        fill="url(#rocketFlame)"
      />
      <path className="rocket-flame" d="M27 116 C30 127 34 127 37 116 Z" fill="#fff3c4" />
    </svg>
  );
}
