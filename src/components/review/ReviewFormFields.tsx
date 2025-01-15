import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Sun, Cloud, CloudLightning } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { UseFormReturn } from "react-hook-form";
import { ReviewForm } from "./types";

interface ReviewFormFieldsProps {
  form: UseFormReturn<ReviewForm>;
}

export const ReviewFormFields = ({ form }: ReviewFormFieldsProps) => {
  return (
    <>
      <FormField
        control={form.control}
        name="weather"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Météo du projet</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex gap-4"
              >
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <RadioGroupItem value="sunny" />
                  </FormControl>
                  <Sun className="h-5 w-5 text-warning" />
                </FormItem>
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <RadioGroupItem value="cloudy" />
                  </FormControl>
                  <Cloud className="h-5 w-5 text-neutral" />
                </FormItem>
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <RadioGroupItem value="stormy" />
                  </FormControl>
                  <CloudLightning className="h-5 w-5 text-danger" />
                </FormItem>
              </RadioGroup>
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="progress"
        render={({ field }) => (
          <FormItem>
            <FormLabel>État de progression</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex gap-4"
              >
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <RadioGroupItem value="better" />
                  </FormControl>
                  <span className="text-success">Meilleur</span>
                </FormItem>
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <RadioGroupItem value="stable" />
                  </FormControl>
                  <span className="text-neutral">Stable</span>
                </FormItem>
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <RadioGroupItem value="worse" />
                  </FormControl>
                  <span className="text-danger">Moins bien</span>
                </FormItem>
              </RadioGroup>
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="completion"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Avancement (%)</FormLabel>
            <FormControl>
              <div className="flex flex-col space-y-2">
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[field.value]}
                  onValueChange={(values) => field.onChange(values[0])}
                  className="w-full"
                />
                <span className="text-sm text-muted-foreground text-right">
                  {field.value}%
                </span>
              </div>
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="comment"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Commentaires</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Ajoutez vos commentaires ici..."
                className="min-h-[100px]"
                {...field}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </>
  );
};