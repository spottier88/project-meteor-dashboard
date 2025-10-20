/**
 * @file LinkedProjectRedirect.tsx
 * @description Composant de redirection automatique pour les projets liés
 * Affiche un message informatif et redirige vers le projet maître après 3 secondes
 */

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowRight, Link as LinkIcon } from "lucide-react";
import { useProjectLinks } from "@/hooks/useProjectLinks";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LinkedProjectRedirectProps {
  projectId: string;
}

export const LinkedProjectRedirect = ({ projectId }: LinkedProjectRedirectProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromMaster = searchParams.get("fromMaster") === "true";
  const { masterProjectId, isLoadingMaster } = useProjectLinks(projectId);

  // Récupérer les infos du projet maître
  const { data: masterProject } = useQuery({
    queryKey: ["masterProjectInfo", masterProjectId],
    queryFn: async () => {
      if (!masterProjectId) return null;
      
      const { data, error } = await supabase
        .from("projects")
        .select("id, title")
        .eq("id", masterProjectId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!masterProjectId,
  });

  useEffect(() => {
    // Ne pas rediriger si l'utilisateur vient intentionnellement du projet maître
    if (masterProjectId && masterProject && !fromMaster) {
      // Rediriger automatiquement après 3 secondes
      const timeout = setTimeout(() => {
        navigate(`/projects/${masterProjectId}`, { replace: true });
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [masterProjectId, masterProject, navigate, fromMaster]);

  // Ne pas afficher l'alerte si c'est une navigation intentionnelle depuis le maître
  if (isLoadingMaster || !masterProjectId || fromMaster) {
    return null;
  }

  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50">
      <LinkIcon className="h-4 w-4" />
      <AlertTitle>Projet lié</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>
          Ce projet est lié au projet "{masterProject?.title}".
          Redirection automatique...
        </span>
        <ArrowRight className="h-4 w-4 animate-pulse" />
      </AlertDescription>
    </Alert>
  );
};
