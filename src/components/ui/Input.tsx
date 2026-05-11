// components/ui/Input.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, name, helperText, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label htmlFor={name} className="block text-sm font-medium text-navy-deep mb-1">
          {label}
        </label>}
        <input
          type={type}
          name={name}
          id={name}
          className={cn(`flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-grey-placeholder focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-action focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`, error ? 'border-red-alert' : 'border-grey-divider', className)}
          ref={ref}
          {...props}
        />
        {helperText && !error && <p className="text-xs text-grey-subtle mt-1">{helperText}</p>}
        {error && <p className="text-xs text-red-alert mt-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
