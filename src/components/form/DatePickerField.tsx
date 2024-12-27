import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

interface DatePickerFieldProps {
  label: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  minDate?: Date;
}

export const DatePickerField = ({ label, value, onChange, minDate }: DatePickerFieldProps) => {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    onChange(date);
    setPopoverOpen(false); // Ferme le popover après la sélection
  };

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">{label}</label>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`justify-start text-left font-normal ${
              !value && "text-muted-foreground"
            }`}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? (
              format(value, "PPP", { locale: fr })
            ) : (
              <span>Choisir une date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            selected={value}
            onSelect={handleDateSelect}
            disabled={minDate ? { before: minDate } : undefined}
            initialFocus
            locale={fr}
            className="rounded-md border"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
