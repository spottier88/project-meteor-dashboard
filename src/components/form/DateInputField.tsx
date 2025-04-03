
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DateInputFieldProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  label: string;
  placeholder?: string;
  minDate?: Date;
  className?: string;
}

export function DateInputField({
  date,
  onDateChange,
  label,
  placeholder = "Sélectionner une date",
  minDate,
  className,
}: DateInputFieldProps) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Met à jour l'input quand la valeur de date change depuis l'extérieur
  useEffect(() => {
    if (date) {
      const formattedDate = format(date, "dd/MM/yyyy", { locale: fr });
      setInputValue(formattedDate);
    } else {
      setInputValue("");
    }
  }, [date]);

  const validateDate = (dateStr: string): boolean => {
    // Si le champ est vide, on considère que c'est valide (pas de date)
    if (!dateStr.trim()) {
      setError(null);
      return true;
    }

    // Vérifie le format JJ/MM/AAAA
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      setError("Format invalide. Utilisez JJ/MM/AAAA");
      return false;
    }

    const [day, month, year] = dateStr.split('/').map(Number);
    
    // Crée la date en utilisant UTC pour éviter les problèmes de fuseau horaire
    const newDate = new Date(Date.UTC(year, month - 1, day));

    // Vérifie si la date est valide en comparant les composants
    if (
      newDate.getUTCDate() !== day ||
      newDate.getUTCMonth() !== month - 1 ||
      newDate.getUTCFullYear() !== year ||
      isNaN(newDate.getTime())
    ) {
      setError("Date invalide");
      return false;
    }

    // Vérifie la date minimum si elle est définie
    if (minDate && newDate < minDate) {
      setError(`La date doit être après le ${minDate.toLocaleDateString('fr-FR')}`);
      return false;
    }

    setError(null);
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Si le champ est vide, on réinitialise
    if (!newValue.trim()) {
      onDateChange(undefined);
      setError(null);
      return;
    }

    // Si la longueur est correcte, on valide
    if (newValue.length === 10 && validateDate(newValue)) {
      const [day, month, year] = newValue.split('/').map(Number);
      // Crée la date en UTC pour garantir la bonne date
      const newDate = new Date(Date.UTC(year, month - 1, day));
      onDateChange(newDate);
    }
  };

  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      onDateChange(selectedDate);
      setPopoverOpen(false);
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Label>{label}</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="JJ/MM/AAAA"
            className={error ? "border-red-500 pr-10" : "pr-10"}
          />
          {error && (
            <span className="text-xs text-red-500 absolute -bottom-5 left-0">
              {error}
            </span>
          )}
        </div>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="px-3"
              onClick={() => setPopoverOpen(true)}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleCalendarSelect}
              onDateSelect={handleCalendarSelect}
              disabled={minDate ? (date) => date < minDate : undefined}
              initialFocus
              locale={fr}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
