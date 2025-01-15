import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormControl, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { ReviewForm } from "./types";

interface ReviewActionFieldsProps {
  form: UseFormReturn<ReviewForm>;
}

export const ReviewActionFields = ({ form }: ReviewActionFieldsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <FormLabel>Actions correctives</FormLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const actions = form.getValues("actions");
            form.setValue("actions", [...actions, { description: "" }]);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une action
        </Button>
      </div>
      {form.watch("actions").map((_, index) => (
        <div key={index} className="flex gap-2">
          <FormField
            control={form.control}
            name={`actions.${index}.description`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    placeholder="Description de l'action..."
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          {index > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                const actions = form.getValues("actions");
                form.setValue(
                  "actions",
                  actions.filter((_, i) => i !== index)
                );
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};