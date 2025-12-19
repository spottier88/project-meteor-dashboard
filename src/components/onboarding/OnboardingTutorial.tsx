/**
 * @component OnboardingTutorial
 * @description Tutoriel interactif de prise en main pour les nouveaux utilisateurs.
 * Affiche un carousel avec les étapes de découverte de l'application
 * et inclut une étape obligatoire de complétion du profil si celui-ci est incomplet.
 */

import { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { OnboardingStep } from "./OnboardingStep";
import { OnboardingProfileStep } from "./OnboardingProfileStep";
import { useIncompleteProfile } from "@/hooks/useIncompleteProfile";

/**
 * Définition des étapes du tutoriel de prise en main
 */
const ONBOARDING_STEPS = [
  {
    id: 1,
    title: "Bienvenue dans Meteor ! 🚀",
    description: "Votre outil de gestion de projets simplifié.",
    content: "Découvrez les fonctionnalités principales en quelques étapes pour bien démarrer avec l'application.",
    icon: "rocket",
    type: "info" as const,
  },
  {
    id: 2,
    title: "Complétez votre profil",
    description: "Quelques informations pour personnaliser votre expérience.",
    content: "",
    icon: "user",
    type: "profile" as const,
  },
  {
    id: 3,
    title: "Créez vos projets",
    description: "Ajoutez et gérez vos projets facilement.",
    content: "Depuis le tableau de bord, cliquez sur 'Nouveau projet' pour créer un projet. Renseignez les informations essentielles et suivez son avancement.",
    icon: "folder-plus",
    type: "info" as const,
  },
  {
    id: 4,
    title: "Suivez l'avancement",
    description: "Visualisez la météo et les indicateurs clés.",
    content: "Chaque projet affiche sa météo (ensoleillé, nuageux, orageux) et son pourcentage d'avancement pour un suivi visuel instantané.",
    icon: "trending-up",
    type: "info" as const,
  },
  {
    id: 5,
    title: "Réalisez des revues",
    description: "Mettez à jour régulièrement vos projets.",
    content: "Les revues de projet permettent de suivre l'évolution, d'identifier les difficultés et de planifier les actions à venir.",
    icon: "clipboard-check",
    type: "info" as const,
  },
  {
    id: 6,
    title: "C'est parti !",
    description: "Vous êtes prêt à utiliser Meteor.",
    content: "Vous pouvez maintenant explorer l'application. Ce tutoriel reste accessible à tout moment depuis votre profil utilisateur.",
    icon: "check-circle",
    type: "info" as const,
  },
];

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: (dontShowAgain: boolean) => void;
}

/**
 * Composant principal du tutoriel d'onboarding.
 * Gère la navigation entre les étapes et la validation du profil.
 * Masque l'étape profil si les données sont déjà complètes.
 */
export const OnboardingTutorial = ({ isOpen, onClose }: OnboardingTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [isProfileValid, setIsProfileValid] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Vérifier si le profil est complet (prénom, nom, affectation)
  const { completionStatus, isLoading: profileLoading } = useIncompleteProfile();

  /**
   * Filtrer les étapes : exclure l'étape profil si le profil est déjà complet
   */
  const visibleSteps = useMemo(() => {
    if (completionStatus.isComplete) {
      return ONBOARDING_STEPS.filter(step => step.type !== "profile");
    }
    return ONBOARDING_STEPS;
  }, [completionStatus.isComplete]);

  /**
   * Calculer l'index de l'étape profil dans les étapes visibles (-1 si masquée)
   */
  const profileStepIndex = useMemo(() => {
    return visibleSteps.findIndex(step => step.type === "profile");
  }, [visibleSteps]);

  /**
   * Vérifie si on est sur l'étape profil
   */
  const isOnProfileStep = profileStepIndex !== -1 && currentStep === profileStepIndex;

  /**
   * Vérifie si on peut passer à l'étape suivante
   */
  const canProceed = useCallback(() => {
    // Bloquer seulement si on est sur l'étape profil et qu'il n'est pas sauvegardé
    if (isOnProfileStep && !profileSaved) {
      return false;
    }
    return true;
  }, [isOnProfileStep, profileSaved]);

  /**
   * Gère la navigation vers l'étape suivante
   */
  const handleNext = () => {
    if (!canProceed()) return;
    
    if (currentStep < visibleSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      carouselApi?.scrollTo(nextStep);
    }
  };

  /**
   * Gère la navigation vers l'étape précédente
   */
  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      carouselApi?.scrollTo(prevStep);
    }
  };

  /**
   * Gère la fermeture du tutoriel
   */
  const handleClose = () => {
    onClose(dontShowAgain);
    setCurrentStep(0);
    setDontShowAgain(false);
    setIsProfileValid(false);
    setProfileSaved(false);
  };

  /**
   * Callback quand le profil est sauvegardé
   */
  const handleProfileSaved = () => {
    setProfileSaved(true);
  };

  /**
   * Callback pour la validité du profil
   */
  const handleProfileValidityChange = (isValid: boolean) => {
    setIsProfileValid(isValid);
  };

  const isLastStep = currentStep === visibleSteps.length - 1;

  // Afficher un loader pendant le chargement du statut du profil
  if (profileLoading) {
    return (
      <Dialog open={isOpen}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Empêcher la fermeture si on est sur l'étape profil et qu'il n'est pas sauvegardé
      if (!open && isOnProfileStep && !profileSaved) {
        return;
      }
      if (!open) {
        handleClose();
      }
    }}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] flex flex-col p-6"
        onPointerDownOutside={(e) => {
          // Empêcher la fermeture par clic extérieur si profil non sauvegardé
          if (isOnProfileStep && !profileSaved) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Tutoriel de prise en main</DialogTitle>
          <DialogDescription>
            Découvrez les fonctionnalités principales de Meteor
          </DialogDescription>
        </DialogHeader>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {/* Carousel des étapes */}
          <Carousel
            setApi={setCarouselApi}
            className="w-full"
            opts={{ watchDrag: false }}
          >
            <CarouselContent>
              {visibleSteps.map((step, index) => (
                <CarouselItem key={step.id}>
                  {step.type === "profile" ? (
                    <OnboardingProfileStep
                      onValidityChange={handleProfileValidityChange}
                      onProfileSaved={handleProfileSaved}
                    />
                  ) : (
                    <OnboardingStep
                      title={step.title}
                      description={step.description}
                      content={step.content}
                      icon={step.icon}
                      stepNumber={index + 1}
                      totalSteps={visibleSteps.length}
                    />
                  )}
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Indicateurs de points (dots) */}
          <div className="flex justify-center gap-2 my-4">
            {visibleSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  // Empêcher la navigation si profil non sauvegardé et on essaie d'avancer
                  if (isOnProfileStep && !profileSaved && index > profileStepIndex) {
                    return;
                  }
                  setCurrentStep(index);
                  carouselApi?.scrollTo(index);
                }}
                disabled={isOnProfileStep && !profileSaved && index > profileStepIndex}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "w-8 bg-primary"
                    : isOnProfileStep && !profileSaved && index > profileStepIndex
                    ? "w-2 bg-muted-foreground/20 cursor-not-allowed"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Aller à l'étape ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Pied de page avec case à cocher et boutons */}
        <div className="flex flex-col gap-4 pt-4 border-t mt-4">
          {/* Message d'avertissement sur l'étape profil */}
          {isOnProfileStep && !profileSaved && (
            <p className="text-sm text-muted-foreground text-center">
              Veuillez enregistrer votre profil pour continuer.
            </p>
          )}

          {/* Case à cocher "Ne plus afficher" (seulement si pas sur étape profil) */}
          {!isOnProfileStep && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dont-show-again"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked === true)}
              />
              <label
                htmlFor="dont-show-again"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Ne plus afficher ce tutoriel
              </label>
            </div>
          )}

          {/* Boutons de navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Précédent
            </Button>

            {isLastStep ? (
              <Button onClick={handleClose}>
                Terminer
              </Button>
            ) : (
              <Button 
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Suivant
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};