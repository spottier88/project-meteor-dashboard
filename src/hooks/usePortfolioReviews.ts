/**
 * @file usePortfolioReviews.ts
 * @description Hook pour gérer les revues de portefeuille (organisation, CRUD, notifications)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Type d'une revue de portefeuille
 */
export interface PortfolioReview {
  id: string;
  portfolio_id: string;
  subject: string;
  review_date: string;
  status: "planned" | "in_progress" | "completed" | "cancelled";
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Type pour la création d'une revue
 */
export interface CreatePortfolioReviewInput {
  portfolio_id: string;
  subject: string;
  review_date: string;
  notes?: string;
}

/**
 * Type pour la mise à jour d'une revue
 */
export interface UpdatePortfolioReviewInput {
  id: string;
  subject?: string;
  review_date?: string;
  status?: "planned" | "in_progress" | "completed" | "cancelled";
  notes?: string;
}

/**
 * Type pour l'historique des notifications
 */
export interface PortfolioReviewNotification {
  id: string;
  portfolio_review_id: string;
  sent_by: string | null;
  sent_at: string;
  recipient_count: number;
  message: string | null;
}

/**
 * Hook principal pour gérer les revues de portefeuille
 */
export const usePortfolioReviews = (portfolioId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupération des revues du portefeuille
  const {
    data: reviews,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["portfolio-reviews", portfolioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolio_reviews")
        .select("*")
        .eq("portfolio_id", portfolioId)
        .order("review_date", { ascending: false });

      if (error) throw error;
      return data as PortfolioReview[];
    },
    enabled: !!portfolioId,
  });

  // Création d'une revue
  const createReviewMutation = useMutation({
    mutationFn: async (input: CreatePortfolioReviewInput) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("portfolio_reviews")
        .insert({
          portfolio_id: input.portfolio_id,
          subject: input.subject,
          review_date: input.review_date,
          notes: input.notes || null,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as PortfolioReview;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-reviews", portfolioId] });
      toast({
        title: "Revue créée",
        description: "La revue de projet a été organisée avec succès.",
      });
    },
    onError: (error: Error) => {
      console.error("Erreur lors de la création de la revue:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer la revue.",
      });
    },
  });

  // Mise à jour d'une revue
  const updateReviewMutation = useMutation({
    mutationFn: async (input: UpdatePortfolioReviewInput) => {
      const { id, ...updateData } = input;
      
      const { data, error } = await supabase
        .from("portfolio_reviews")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as PortfolioReview;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-reviews", portfolioId] });
      toast({
        title: "Revue mise à jour",
        description: "La revue a été modifiée avec succès.",
      });
    },
    onError: (error: Error) => {
      console.error("Erreur lors de la mise à jour de la revue:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de modifier la revue.",
      });
    },
  });

  // Suppression d'une revue
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from("portfolio_reviews")
        .delete()
        .eq("id", reviewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-reviews", portfolioId] });
      toast({
        title: "Revue supprimée",
        description: "La revue a été supprimée avec succès.",
      });
    },
    onError: (error: Error) => {
      console.error("Erreur lors de la suppression de la revue:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer la revue.",
      });
    },
  });

  return {
    reviews: reviews || [],
    isLoading,
    error,
    refetch,
    createReview: createReviewMutation.mutate,
    updateReview: updateReviewMutation.mutate,
    deleteReview: deleteReviewMutation.mutate,
    isCreating: createReviewMutation.isPending,
    isUpdating: updateReviewMutation.isPending,
    isDeleting: deleteReviewMutation.isPending,
  };
};

/**
 * Interface pour les paramètres d'envoi de notifications
 */
interface SendNotificationsParams {
  reviewId: string;
  projectManagerIds: string[];
  message: string;
  templateId?: string | null;
  portfolioName?: string;
  reviewSubject?: string;
  reviewDate?: string;
}

/**
 * Hook pour envoyer des notifications de revue aux chefs de projet
 * Supporte les modèles d'email avec fusion de variables
 */
export const useSendReviewNotifications = (portfolioId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      projectManagerIds,
      message,
      templateId,
      portfolioName,
      reviewSubject,
      reviewDate,
    }: SendNotificationsParams) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error("Utilisateur non connecté");

      // Récupérer les informations des chefs de projet
      const { data: managers, error: managersError } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name")
        .in("id", projectManagerIds);

      if (managersError) throw managersError;

      // Récupérer les projets par chef de projet
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id, title, project_manager_id")
        .eq("portfolio_id", portfolioId)
        .in("project_manager_id", projectManagerIds);

      if (projectsError) throw projectsError;

      // Créer un mapping chef de projet -> titres de projets
      const managerProjectsMap = new Map<string, string[]>();
      projects?.forEach((project) => {
        if (project.project_manager_id) {
          const existing = managerProjectsMap.get(project.project_manager_id) || [];
          existing.push(project.title);
          managerProjectsMap.set(project.project_manager_id, existing);
        }
      });

      // Créer les entrées dans la file de notifications avec les données enrichies
      const notifications = managers?.map((manager) => {
        const managerName = [manager.first_name, manager.last_name]
          .filter(Boolean)
          .join(" ") || manager.email || "Cher collaborateur";
        
        const projectTitles = managerProjectsMap.get(manager.id) || [];

        return {
          user_id: manager.id,
          event_type: "portfolio_review",
          event_data: {
            review_id: reviewId,
            portfolio_id: portfolioId,
            message,
            template_id: templateId || null,
            // Variables pour le template
            manager_name: managerName,
            manager_email: manager.email,
            portfolio_name: portfolioName || "",
            review_subject: reviewSubject || "",
            review_date: reviewDate || "",
            project_titles: projectTitles,
          },
        };
      }) || [];

      // Insérer dans la file de notifications
      const { error: insertError } = await supabase
        .from("email_notification_queue")
        .insert(notifications);

      if (insertError) throw insertError;

      // Logger l'envoi dans portfolio_review_notifications
      const { error: logError } = await supabase
        .from("portfolio_review_notifications")
        .insert({
          portfolio_review_id: reviewId,
          sent_by: userData.user.id,
          recipient_count: projectManagerIds.length,
          message,
          email_template_id: templateId || null,
        });

      if (logError) throw logError;

      return { recipientCount: projectManagerIds.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-reviews", portfolioId] });
      toast({
        title: "Notifications envoyées",
        description: `${data.recipientCount} chef(s) de projet notifié(s).`,
      });
    },
    onError: (error: Error) => {
      console.error("Erreur lors de l'envoi des notifications:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'envoyer les notifications.",
      });
    },
  });
};
