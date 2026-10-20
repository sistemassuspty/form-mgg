import * as React from 'react';
import { cn } from '@/lib/utils';

const tones = {
  neutral: 'bg-secondary text-secondary-foreground',
  info: 'bg-primary/10 text-primary',
  success: 'bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]',
  warning: 'bg-[hsl(var(--warning)/0.14)] text-[hsl(var(--warning))]',
  danger: 'bg-destructive/10 text-destructive',
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({ tone = 'neutral', className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone], className)} {...props} />;
}
