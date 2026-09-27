'use client';

import { cn } from '@/lib/utils';
import { avatarOf } from '@/lib/astronaut';

/** Astronaut avatar — emoji in a glowing helmet ring, reused everywhere. */
export default function AstronautAvatar({ avatarId, size = 'md', className, glow = false }) {
  const avatar = avatarOf(avatarId);
  const sizes = {
    sm: 'text-xl size-9',
    md: 'text-3xl size-14',
    lg: 'text-6xl size-28',
    xl: 'text-7xl size-36',
  };
  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-full border-2 border-neon/40 bg-gradient-to-br from-azur/25 to-lav/20 backdrop-blur-sm',
        glow && 'shadow-[0_0_24px_rgba(63,216,255,0.45)]',
        sizes[size] ?? sizes.md,
        className
      )}
    >
      {avatar.emoji}
    </span>
  );
}
