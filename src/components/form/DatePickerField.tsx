import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

interface DatePickerFieldProps {
  label: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  minDate?: Date;
}

export const DatePickerField = ({ label, value, onChange, minDate }: DatePickerFieldProps) => {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Met à jour l'input quand la valeur change
  useEffect(() => {
    if (value) {
      const day = value.getDate().toString().padStart(2, '0');
      const month = (value.getMonth() + 1).toString().padStart(2, '0');
      const year = value.getFullYear();
      setInputValue(`${day}/${month}/${year}`);
    } else {
      setInputValue("");
    }
  }, [value]);

  const validateDate = (dateStr: string): boolean => {
    // Vérifie le format JJ/MM/AAAA
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      setError("Format invalide. Utilisez JJ/MM/AAAA");
      return false;
    }

    const [day, month, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);

    // Vérifie si la date est valide
    if (
      date.getDate() !== day ||
      date.getMonth() !== month - 1 ||
      date.getFullYear() !== year ||
      isNaN(date.getTime())
    ) {
      setError("Date invalide");
      return false;
    }

    // Vérifie la date minimum si elle est définie
    if (minDate && date < minDate) {
      setError(`La date doit être après le ${minDate.toLocaleDateString('fr-FR')}`);
      return false;
    }

    setError(null);
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Si le champ est vide, on réinitialise
    if (!newValue.trim()) {
      onChange(undefined);
      setError(null);
      return;
    }

    // Si la longueur est correcte, on valide
    if (newValue.length === 10 && validateDate(newValue)) {
      const [day, month, year] = newValue.split('/').map(Number);
      onChange(new Date(year, month - 1, day));
    }
  };

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={handleChange}
          placeholder="JJ/MM/AAAA"
          className={error ? "border-red-500" : ""}
        />
        {error && (
          <span className="text-xs text-red-500 absolute -bottom-5 left-0">
            {error}
          </span>
        )}
      </div>
    </div>
  );
};