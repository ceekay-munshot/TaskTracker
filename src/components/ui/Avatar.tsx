import { useState } from 'react';
import { cn } from '@/utils/cn';

const GRADIENTS = [
  'from-indigo-500 to-violet-500',
  'from-fuchsia-500 to-pink-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-sky-500 to-cyan-500',
  'from-rose-500 to-red-500',
  'from-violet-500 to-purple-500',
  'from-blue-500 to-indigo-500',
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hashIndex(name: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

const SIZES = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
} as const;

interface AvatarProps {
  name: string;
  src?: string;
  size?: keyof typeof SIZES;
  ring?: boolean;
  className?: string;
}

export function Avatar({
  name,
  src,
  size = 'md',
  ring = false,
  className,
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const gradient = GRADIENTS[hashIndex(name, GRADIENTS.length)];
  const showImage = src && !failed;

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-white',
        SIZES[size],
        ring && 'ring-2 ring-white shadow-soft',
        !showImage && `bg-gradient-to-br ${gradient}`,
        className,
      )}
      title={name}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  );
}
