
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, DayClickEventHandler, CaptionProps } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { fr } from "date-fns/locale";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  onDateSelect?: (date: Date | undefined) => void; // Ajout pour expliciter la gestion des clics
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  onDateSelect,
  ...props
}: CalendarProps) {
  // Gestion du clic sur un jour
  const handleDayClick: DayClickEventHandler = (day, modifiers) => {
    if (modifiers.disabled) {
      return; // Ne rien faire si la journée est désactivée
    }
    onDateSelect?.(day);
  };

  // Composant personnalisé pour l'en-tête du calendrier avec sélection de mois/année
  const CustomCaption = (props: CaptionProps) => {
    // Création de la liste des mois
    const months = Array.from({ length: 12 }, (_, i) => {
      return {
        value: i.toString(),
        label: fr.localize?.month(i, { width: 'wide' }) || `Mois ${i+1}`
      };
    });

    // Création de la liste des années (10 ans avant et après l'année affichée)
    const currentYear = props.displayMonth.getFullYear();
    const years = Array.from({ length: 20 }, (_, i) => {
      const year = currentYear - 10 + i;
      return {
        value: year.toString(),
        label: year.toString()
      };
    });

    return (
      <div className="flex justify-center space-x-1 pt-1 relative items-center">
        <div className="flex items-center space-x-1">
          <Select
            value={props.displayMonth.getMonth().toString()}
            onValueChange={(value) => {
              const newMonth = parseInt(value, 10);
              const newDate = new Date(props.displayMonth);
              newDate.setMonth(newMonth);
              props.onMonthSelect && props.onMonthSelect(newDate);
            }}
          >
            <SelectTrigger className="h-7 w-[90px] text-xs font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-56 overflow-y-auto">
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value} className="text-xs">
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={props.displayMonth.getFullYear().toString()}
            onValueChange={(value) => {
              const newYear = parseInt(value, 10);
              const newDate = new Date(props.displayMonth);
              newDate.setFullYear(newYear);
              props.onMonthSelect && props.onMonthSelect(newDate);
            }}
          >
            <SelectTrigger className="h-7 w-[70px] text-xs font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-56 overflow-y-auto">
              {years.map((year) => (
                <SelectItem key={year.value} value={year.value} className="text-xs">
                  {year.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          onClick={() => {
            const newDate = new Date(props.displayMonth);
            newDate.setMonth(newDate.getMonth() - 1);
            props.onMonthSelect && props.onMonthSelect(newDate);
          }}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1"
          )}
          aria-label="Mois précédent"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            const newDate = new Date(props.displayMonth);
            newDate.setMonth(newDate.getMonth() + 1);
            props.onMonthSelect && props.onMonthSelect(newDate);
          }}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1"
          )}
          aria-label="Mois suivant"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      onDayClick={handleDayClick} // Ajout explicite du gestionnaire de clic
      className={cn("p-3 pointer-events-auto", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium hidden", // Masquer le libellé par défaut
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => null, // Nous n'utilisons pas ces icônes car nous avons notre propre navigation
        IconRight: () => null,
        Caption: CustomCaption
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
