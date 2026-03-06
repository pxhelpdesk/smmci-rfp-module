// components/ui/input-amount.tsx
import { NumericFormat } from 'react-number-format';
import { cn } from '@/lib/utils';

interface InputAmountProps {
  value?: number | string;
  onValueChange?: (value: number | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function InputAmount({
  value,
  onValueChange,
  placeholder = '0.00',
  className,
  disabled = false,
}: InputAmountProps) {
  return (
    <NumericFormat
      value={value}
      onValueChange={(values) => {
        // values.floatValue returns undefined if empty, number otherwise
        onValueChange?.(values.floatValue);
      }}
      thousandSeparator=","
      decimalSeparator="."
      decimalScale={2}
      fixedDecimalScale
      allowNegative={false}
      isAllowed={(values) => {
        const { floatValue } = values;
        // Max 15 digits before decimal (999,999,999,999,999.99)
        return floatValue === undefined || floatValue < 1e15;
      }}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        'border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className
      )}
    />
  );
}
