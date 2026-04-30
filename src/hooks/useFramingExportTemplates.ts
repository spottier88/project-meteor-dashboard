/**
 * @hook useFramingExportTemplates
 * @description Hook CRUD pour gérer les modèles d'export de note de cadrage.
 * Permet de lister, créer, modifier et supprimer les modèles,
 * ainsi que d'uploader les fichiers DOCX dans le bucket Storage.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface FramingExportTemplate {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  file_name: string;
  is_default: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const QUERY_KEY = "framing-export-templates";

/**
 * Récupère la liste des modèles d'export actifs
 */
export const useFramingExportTemplates = (activeOnly = false) => {
  return useQuery({
    queryKey: [QUERY_KEY, { activeOnly }],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from("framing_export_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (activeOnly) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as FramingExportTemplate[];
    },
  });
};

/**
 * Crée un nouveau modèle avec upload du fichier DOCX
 */
export const useCreateFramingExportTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      title,
      description,
      file,
    }: {
      title: string;
      description?: string;
      file: File;
    }) => {
      // 1. Uploader le fichier dans le bucket Storage
      const filePath = `${crypto.randomUUID()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("framing-export-templates")
        .upload(filePath, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      // 2. Créer l'entrée en base de données
      const { data: userData } = await supabase.auth.getUser();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("framing_export_templates")
        .insert({
          title,
          description: description || null,
          file_path: filePath,
          file_name: file.name,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({ title: "Modèle créé", description: "Le modèle d'export a été ajouté avec succès." });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });
};

/**
 * Met à jour un modèle existant (métadonnées et/ou fichier)
 */
export const useUpdateFramingExportTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      description,
      is_active,
      is_default,
      file,
      oldFilePath,
    }: {
      id: string;
      title?: string;
      description?: string;
      is_active?: boolean;
      is_default?: boolean;
      file?: File;
      oldFilePath?: string;
    }) => {
      const updates: {
        updated_at: string;
        title?: string;
        description?: string;
        is_active?: boolean;
        is_default?: boolean;
        file_path?: string;
        file_name?: string;
      } = { updated_at: new Date().toISOString() };
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (is_active !== undefined) updates.is_active = is_active;
      if (is_default !== undefined) updates.is_default = is_default;

      // Si nouveau fichier, uploader et supprimer l'ancien
      if (file) {
        const filePath = `${crypto.randomUUID()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("framing-export-templates")
          .upload(filePath, file, { contentType: file.type });

        if (uploadError) throw uploadError;

        updates.file_path = filePath;
        updates.file_name = file.name;

        // Supprimer l'ancien fichier si fourni
        if (oldFilePath) {
          await supabase.storage.from("framing-export-templates").remove([oldFilePath]);
        }
      }

      // Si on marque comme défaut, retirer le défaut des autres
      if (is_default === true) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("framing_export_templates")
          .update({ is_default: false })
          .neq("id", id);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("framing_export_templates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({ title: "Modèle mis à jour" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });
};

/**
 * Supprime un modèle et son fichier associé
 */
export const useDeleteFramingExportTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      // Supprimer le fichier du storage
      await supabase.storage.from("framing-export-templates").remove([filePath]);

      // Supprimer l'entrée en base
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("framing_export_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({ title: "Modèle supprimé" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });
};
