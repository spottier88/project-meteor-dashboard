import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sun, Cloud, CloudLightning, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ReviewSheetProps {
  projectId: string;
  projectTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted: () => void;
}

interface ReviewForm {
  weather: "sunny" | "cloudy" | "stormy";
  progress: "better" | "stable" | "worse";
  comment: string;
  actions: { description: string }[];
}

export const ReviewSheet = ({
  projectId,
  projectTitle,
  isOpen,
  onClose,
  onReviewSubmitted,
}: ReviewSheetProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReviewForm>({
    defaultValues: {
      weather: "cloudy",
      progress: "stable",
      comment: "",
      actions: [{ description: "" }],
    },
  });

  const onSubmit = async (data: ReviewForm) => {
    setIsSubmitting(true);
    try {
      // Insert the review
      const { data: review, error: reviewError } = await supabase
        .from("reviews")
        .insert({
          project_id: projectId,
          weather: data.weather,
          progress: data.progress,
          comment: data.comment,
        })
        .select()
        .single();

      if (reviewError) throw reviewError;

      // Insert the actions
      const actionsToInsert = data.actions
        .filter((action) => action.description.trim() !== "")
        .map((action) => ({
          review_id: review.id,
          description: action.description,
        }));

      if (actionsToInsert.length > 0) {
        const { error: actionsError } = await supabase
          .from("review_actions")
          .insert(actionsToInsert);

        if (actionsError) throw actionsError;
      }

      // Update the project's last review date and status
      const { error: projectError } = await supabase
        .from("projects")
        .update({
          status: data.weather,
          progress: data.progress,
          last_review_date: new Date().toISOString(),
        })
        .eq("id", projectId);

      if (projectError) throw projectError;

      toast({
        title: "Revue enregistrée",
        description: "La revue du projet a été enregistrée avec succès.",
      });

      onReviewSubmitted();
      onClose();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement de la revue.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nouvelle Revue - {projectTitle}</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
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

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};
