// components/ui/date-time-picker.tsx
"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateTimePickerProps {
  value?: string;
  onValueChange?: (datetime: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
  showTime?: boolean;
}

export default function DateTimePicker({
  value,
  onValueChange,
  placeholder = "Select date and time",
  className,
  disabled = false,
  minDate,
  showTime = true,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Parse existing datetime value
  const selectedDate = value ? new Date(value) : undefined
  const [time, setTime] = React.useState(
    selectedDate ? format(selectedDate, "HH:mm") : "00:00"
  )

  const handleDateSelect = (date: Date | undefined) => {
    if (date && showTime) {
      // Combine date with current time
      const [hours, minutes] = time.split(':')
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      onValueChange?.(date.toISOString())
    } else if (date) {
      // Date only
      onValueChange?.(format(date, "yyyy-MM-dd"))
      setOpen(false)
    }
  }

  const handleTimeChange = (newTime: string) => {
    setTime(newTime)
    if (selectedDate) {
      const [hours, minutes] = newTime.split(':')
      const updated = new Date(selectedDate)
      updated.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      onValueChange?.(updated.toISOString())
    }
  }

  const handleApply = () => {
    if (selectedDate && showTime) {
      const [hours, minutes] = time.split(':')
      const updated = new Date(selectedDate)
      updated.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      onValueChange?.(updated.toISOString())
    }
    setOpen(false)
  }

  const displayValue = selectedDate
    ? showTime
      ? `${format(selectedDate, "MM/dd/yyyy")} ${format(selectedDate, "HH:mm")}`
      : format(selectedDate, "MM/dd/yyyy")
    : null

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
          {displayValue ? <span>{displayValue}</span> : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => {
              if (minDate) {
                return date < minDate
              }
              return false
            }}
            initialFocus
          />
          {showTime && (
            <div className="border-t p-3 space-y-2">
              <Label htmlFor="time-picker" className="text-sm">Time</Label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="time-picker"
                  type="time"
                  value={time}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="h-9 flex-1"
                />
              </div>
              <Button
                onClick={handleApply}
                className="w-full h-8"
                size="sm"
              >
                Apply
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
