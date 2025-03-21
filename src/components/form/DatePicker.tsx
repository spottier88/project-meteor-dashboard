
import * as React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface DatePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  label: string;
  placeholder?: string;
  minDate?: Date;
  className?: string;
}

export function DatePicker({
  date,
  onDateChange,
  label,
  placeholder = "Sélectionner une date",
  minDate,
  className,
}: DatePickerProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "dd/MM/yyyy", { locale: fr }) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={onDateChange}
            onDateSelect={onDateChange}
            disabled={minDate ? (date) => date < minDate : undefined}
            initialFocus
            locale={fr}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
