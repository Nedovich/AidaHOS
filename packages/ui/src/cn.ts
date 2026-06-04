import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind-aware className merge, used by all shadcn-style components. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
