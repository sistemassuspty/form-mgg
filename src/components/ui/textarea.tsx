import * as React from 'react';
import { cn } from '@/lib/utils';
import { inputClass } from './input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={cn(inputClass, 'h-auto min-h-24 resize-y', className)} {...props} />,
);
Textarea.displayName = 'Textarea';
