// components/ui/date-picker.tsx
"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: string;
  onValueChange?: (date: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
}

export default function DatePicker({
  value,
  onValueChange,
  placeholder = "Select date",
  className,
  disabled = false,
  minDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const selectedDate = value ? new Date(value) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          data-empty={!value}
          className={cn(
            "border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground h-9 w-full justify-start text-left font-normal border bg-transparent px-3 shadow-xs transition-[color,box-shadow] data-[empty=true]:text-muted-foreground",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(new Date(value), "MM/dd/yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              onValueChange?.(format(date, "yyyy-MM-dd"))
              setOpen(false)
            }
          }}
          disabled={(date) => {
            // Disable if minDate is set and date is before minDate
            if (minDate) {
              return date < minDate
            }
            return false
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
