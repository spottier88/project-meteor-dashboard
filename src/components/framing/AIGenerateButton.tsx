/**
 * Composant bouton pour générer du contenu IA
 * 
 * Bouton réutilisable qui affiche un état de chargement pendant la génération
 */

import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AIGenerateButtonProps {
  /**
   * Callback appelé lors du clic
   */
  onClick: () => void;
  
  /**
   * Indique si une génération est en cours
   */
  isGenerating: boolean;
  
  /**
   * Variante du bouton (par défaut: "outline")
   */
  variant?: "default" | "outline" | "ghost" | "secondary";
  
  /**
   * Taille du bouton (par défaut: "sm")
   */
  size?: "default" | "sm" | "lg" | "icon";
  
  /**
   * Texte du bouton (par défaut: "Générer avec l'IA")
   */
  label?: string;
  
  /**
   * Afficher uniquement l'icône (par défaut: false)
   */
  iconOnly?: boolean;
  
  /**
   * Texte du tooltip (par défaut: "Générer du contenu avec l'IA")
   */
  tooltipText?: string;
  
  /**
   * Désactiver le bouton
   */
  disabled?: boolean;
  
  /**
   * Classe CSS supplémentaire
   */
  className?: string;
}

export function AIGenerateButton({
  onClick,
  isGenerating,
  variant = "outline",
  size = "sm",
  label = "Générer avec l'IA",
  iconOnly = false,
  tooltipText = "Générer du contenu avec l'IA",
  disabled = false,
  className = "",
}: AIGenerateButtonProps) {
  const button = (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || isGenerating}
      className={className}
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {!iconOnly && <span className="ml-2">Génération...</span>}
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          {!iconOnly && <span className="ml-2">{label}</span>}
        </>
      )}
    </Button>
  );

  if (iconOnly) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
