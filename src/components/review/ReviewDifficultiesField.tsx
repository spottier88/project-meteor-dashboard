/**
 * @file ReviewDifficultiesField.tsx
 * @description Composant pour la saisie des difficultés en cours dans une revue de projet.
 * Permet au chef de projet de documenter les obstacles rencontrés pendant l'exécution du projet.
 */

import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { ReviewForm } from "./types";
import { AlertTriangle } from "lucide-react";

interface ReviewDifficultiesFieldProps {
  form: UseFormReturn<ReviewForm>;
}

/**
 * Composant de saisie des difficultés rencontrées lors de la revue
 * @param form - Instance du formulaire React Hook Form
 */
export const ReviewDifficultiesField = ({ form }: ReviewDifficultiesFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="difficulties"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Difficultés en cours
          </FormLabel>
          <FormControl>
            <Textarea
              placeholder="Décrivez les principales difficultés rencontrées lors de cette période..."
              className="min-h-[100px]"
              {...field}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
};
