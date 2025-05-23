
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ReviewForm } from "@/components/review/types";
import { ReviewFormFields } from "@/components/review/ReviewFormFields";
import { ReviewActionFields } from "@/components/review/ReviewActionFields";
import { Trash2 } from "lucide-react";
import { DeleteReviewDialog } from "./DeleteReviewDialog";

interface ReviewSheetProps {
  projectId: string;
  projectTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted: () => void;
  existingReview?: {
    id: string;
    created_at: string;
  };
}

export const ReviewSheet = ({
  projectId,
  projectTitle,
  isOpen,
  onClose,
  onReviewSubmitted,
  existingReview,
}: ReviewSheetProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Récupération de la dernière revue pour initialiser l'avancement
  const { data: lastReview } = useQuery({
    queryKey: ["lastReview", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("completion")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching last review:", error);
        return null;
      }
      return data;
    },
    enabled: !!projectId,
  });

  const form = useForm<ReviewForm>({
    defaultValues: {
      weather: "cloudy",
      progress: "stable",
      completion: lastReview?.completion || 0,
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
          completion: data.completion,
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

      // Invalider toutes les requêtes liées aux projets
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      
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

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteClose = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleReviewDeleted = () => {
    onReviewSubmitted();
    onClose();
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="flex justify-between items-center pr-8">
            <SheetTitle>Nouvelle Revue - {projectTitle}</SheetTitle>
            {existingReview && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteClick}
                className="h-8"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            )}
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
              <ReviewFormFields form={form} />
              <ReviewActionFields form={form} />
              
              <div className="flex justify-end space-x-2">
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

      {existingReview && isDeleteDialogOpen && (
        <DeleteReviewDialog
          isOpen={isDeleteDialogOpen}
          onClose={handleDeleteClose}
          reviewId={existingReview.id}
          projectId={projectId}
          reviewDate={existingReview.created_at}
          onReviewDeleted={handleReviewDeleted}
        />
      )}
    </>
  );
};
