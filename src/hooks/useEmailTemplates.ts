/**
 * @hook useEmailTemplates
 * @description Hook pour gérer les modèles d'email.
 * Fournit les opérations CRUD et la gestion du cache via React Query.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

// Interface pour un modèle d'email
export interface EmailTemplate {
  id: string;
  code: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string | null;
  variables: Array<{ name: string; description: string }>;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Interface pour la création/modification d'un modèle
export interface EmailTemplateInput {
  code: string;
  name: string;
  subject: string;
  body_html: string;
  body_text?: string | null;
  variables?: Array<{ name: string; description: string }>;
  description?: string | null;
  is_active?: boolean;
}

export const useEmailTemplates = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupération de tous les modèles d'email
  const {
    data: templates,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["emailTemplates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      
      // Parser les variables JSON pour chaque template
      return (data || []).map(template => ({
        ...template,
        variables: Array.isArray(template.variables) 
          ? template.variables 
          : JSON.parse(template.variables as string || '[]')
      })) as EmailTemplate[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Récupération d'un modèle par son ID
  const getTemplateById = async (id: string): Promise<EmailTemplate | null> => {
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Erreur récupération template:", error);
      return null;
    }

    return {
      ...data,
      variables: Array.isArray(data.variables) 
        ? data.variables 
        : JSON.parse(data.variables as string || '[]')
    } as EmailTemplate;
  };

  // Création d'un modèle
  const createMutation = useMutation({
    mutationFn: async (input: EmailTemplateInput) => {
      const { data, error } = await supabase
        .from("email_templates")
        .insert({
          ...input,
          variables: JSON.stringify(input.variables || [])
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      toast({
        title: "Succès",
        description: "Modèle d'email créé avec succès",
      });
    },
    onError: (error: Error) => {
      console.error("Erreur création template:", error);
      toast({
        title: "Erreur",
        description: error.message.includes("duplicate key") 
          ? "Un modèle avec ce code existe déjà"
          : "Erreur lors de la création du modèle",
        variant: "destructive",
      });
    },
  });

  // Mise à jour d'un modèle
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: EmailTemplateInput & { id: string }) => {
      const { data, error } = await supabase
        .from("email_templates")
        .update({
          ...input,
          variables: JSON.stringify(input.variables || [])
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      toast({
        title: "Succès",
        description: "Modèle d'email mis à jour",
      });
    },
    onError: (error: Error) => {
      console.error("Erreur mise à jour template:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du modèle",
        variant: "destructive",
      });
    },
  });

  // Suppression d'un modèle
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("email_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      toast({
        title: "Succès",
        description: "Modèle d'email supprimé",
      });
    },
    onError: (error: Error) => {
      console.error("Erreur suppression template:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression du modèle",
        variant: "destructive",
      });
    },
  });

  // Activation/désactivation d'un modèle
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("email_templates")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      toast({
        title: "Succès",
        description: variables.is_active ? "Modèle activé" : "Modèle désactivé",
      });
    },
    onError: (error: Error) => {
      console.error("Erreur toggle template:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors du changement d'état",
        variant: "destructive",
      });
    },
  });

  return {
    templates,
    isLoading,
    error,
    refetch,
    getTemplateById,
    createTemplate: createMutation.mutate,
    updateTemplate: updateMutation.mutate,
    deleteTemplate: deleteMutation.mutate,
    toggleActive: toggleActiveMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
