
/**
 * @component HelpButton
 * @description Bouton d'aide accessible depuis plusieurs endroits de l'application.
 * Récupère l'URL de la documentation depuis les paramètres de l'application et
 * ouvre cette documentation dans un nouvel onglet lors du clic.
 * Affiche un tooltip explicatif au survol.
 */

import React, { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const HelpButton = () => {
  const { data: documentationUrl } = useQuery({
    queryKey: ["documentationUrl"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("application_settings")
        .select("value")
        .eq("type", "documentation")
        .eq("key", "documentation_url")
        .single();

      if (error) {
        console.error("Erreur lors de la récupération de l'URL de documentation:", error);
        return null;
      }

      return data?.value;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleHelpClick = () => {
    if (documentationUrl) {
      window.open(documentationUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={handleHelpClick}
            className="rounded-full h-8 w-8"
            disabled={!documentationUrl}
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Accéder à la documentation</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
