
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { FrameworkNoteCollection, FrameworkNoteSection, SectionType } from "@/types/framework-note";

export const useFrameworkNotes = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Récupérer toutes les collections de l'utilisateur
  const { data: collections, isLoading: isLoadingCollections, error: collectionsError } = useQuery({
    queryKey: ["frameworkNoteCollections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("framework_note_collections")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as FrameworkNoteCollection[];
    }
  });

  // Récupérer une collection spécifique avec ses sections
  const getCollectionWithSections = async (collectionId: string) => {
    const { data: collection, error: collectionError } = await supabase
      .from("framework_note_collections")
      .select("*")
      .eq("id", collectionId)
      .single();
    
    if (collectionError) throw collectionError;
    
    const { data: sections, error: sectionsError } = await supabase
      .from("framework_note_sections")
      .select("*")
      .eq("collection_id", collectionId)
      .order("created_at", { ascending: true });
    
    if (sectionsError) throw sectionsError;
    
    return {
      collection: collection as FrameworkNoteCollection,
      sections: sections as FrameworkNoteSection[]
    };
  };

  // Créer une nouvelle collection
  const createCollectionMutation = useMutation({
    mutationFn: async (newCollection: { title: string; description?: string }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Vous devez être connecté pour créer une note de cadrage");
      }
      
      const { data, error } = await supabase
        .from("framework_note_collections")
        .insert({
          title: newCollection.title,
          description: newCollection.description || null,
          created_by: sessionData.session.user.id,
          status: "draft"
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as FrameworkNoteCollection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["frameworkNoteCollections"] });
      toast({
        title: "Collection créée",
        description: "La note de cadrage a été créée avec succès"
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Erreur lors de la création de la note de cadrage"
      });
    }
  });

  // Mettre à jour une collection
  const updateCollectionMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FrameworkNoteCollection> & { id: string }) => {
      const { data, error } = await supabase
        .from("framework_note_collections")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as FrameworkNoteCollection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["frameworkNoteCollections"] });
      toast({
        title: "Collection mise à jour",
        description: "La note de cadrage a été mise à jour avec succès"
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour de la note de cadrage"
      });
    }
  });

  // Supprimer une collection
  const deleteCollectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("framework_note_collections")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["frameworkNoteCollections"] });
      toast({
        title: "Collection supprimée",
        description: "La note de cadrage a été supprimée avec succès"
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression de la note de cadrage"
      });
    }
  });

  // Ajouter une section à une collection
  const addSectionMutation = useMutation({
    mutationFn: async ({ collectionId, sectionType, content }: { collectionId: string; sectionType: SectionType; content: string }) => {
      const { data, error } = await supabase
        .from("framework_note_sections")
        .insert({
          collection_id: collectionId,
          section_type: sectionType,
          content: content
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as FrameworkNoteSection;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["frameworkNoteCollection", data.collection_id] });
      toast({
        title: "Section ajoutée",
        description: "La section a été ajoutée avec succès"
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Erreur lors de l'ajout de la section"
      });
    }
  });

  // Mettre à jour une section
  const updateSectionMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { data, error } = await supabase
        .from("framework_note_sections")
        .update({ content })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as FrameworkNoteSection;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["frameworkNoteCollection", data.collection_id] });
      toast({
        title: "Section mise à jour",
        description: "La section a été mise à jour avec succès"
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour de la section"
      });
    }
  });

  // Supprimer une section
  const deleteSectionMutation = useMutation({
    mutationFn: async ({ id, collectionId }: { id: string; collectionId: string }) => {
      const { error } = await supabase
        .from("framework_note_sections")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return { id, collectionId };
    },
    onSuccess: ({ collectionId }) => {
      queryClient.invalidateQueries({ queryKey: ["frameworkNoteCollection", collectionId] });
      toast({
        title: "Section supprimée",
        description: "La section a été supprimée avec succès"
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression de la section"
      });
    }
  });

  return {
    collections,
    isLoadingCollections,
    collectionsError,
    getCollectionWithSections,
    createCollection: createCollectionMutation.mutate,
    isCreatingCollection: createCollectionMutation.isLoading,
    updateCollection: updateCollectionMutation.mutate,
    isUpdatingCollection: updateCollectionMutation.isLoading,
    deleteCollection: deleteCollectionMutation.mutate,
    isDeletingCollection: deleteCollectionMutation.isLoading,
    addSection: addSectionMutation.mutate,
    isAddingSection: addSectionMutation.isLoading,
    updateSection: updateSectionMutation.mutate,
    isUpdatingSection: updateSectionMutation.isLoading,
    deleteSection: deleteSectionMutation.mutate,
    isDeletingSection: deleteSectionMutation.isLoading
  };
};
