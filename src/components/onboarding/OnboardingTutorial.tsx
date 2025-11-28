import { useState } from "react";
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
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { OnboardingStep } from "./OnboardingStep";

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
  },
  {
    id: 2,
    title: "Créez vos projets",
    description: "Ajoutez et gérez vos projets facilement.",
    content: "Depuis le tableau de bord, cliquez sur 'Nouveau projet' pour créer un projet. Renseignez les informations essentielles et suivez son avancement.",
    icon: "folder-plus",
  },
  {
    id: 3,
    title: "Suivez l'avancement",
    description: "Visualisez la météo et les indicateurs clés.",
    content: "Chaque projet affiche sa météo (ensoleillé, nuageux, orageux) et son pourcentage d'avancement pour un suivi visuel instantané.",
    icon: "trending-up",
  },
  {
    id: 4,
    title: "Réalisez des revues",
    description: "Mettez à jour régulièrement vos projets.",
    content: "Les revues de projet permettent de suivre l'évolution, d'identifier les difficultés et de planifier les actions à venir.",
    icon: "clipboard-check",
  },
  {
    id: 5,
    title: "C'est parti !",
    description: "Vous êtes prêt à utiliser Meteor.",
    content: "Vous pouvez maintenant explorer l'application. Ce tutoriel reste accessible à tout moment depuis votre profil utilisateur.",
    icon: "check-circle",
  },
];

/**
 * Props pour le composant OnboardingTutorial
 */
interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: (dontShowAgain: boolean) => void;
}

/**
 * Composant OnboardingTutorial
 * 
 * Affiche un tutoriel interactif de prise en main pour les nouveaux utilisateurs.
 * Le tutoriel se présente sous forme de carousel avec navigation entre les étapes.
 * L'utilisateur peut choisir de ne plus afficher le tutoriel via une case à cocher.
 * 
 * @param {boolean} isOpen - Indique si le tutoriel doit être affiché
 * @param {Function} onClose - Fonction callback appelée à la fermeture (avec option "ne plus afficher")
 */
export const OnboardingTutorial = ({ isOpen, onClose }: OnboardingTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  /**
   * Gère la navigation vers l'étape suivante
   */
  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
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
   * Transmet l'état de la case "ne plus afficher" au parent
   */
  const handleClose = () => {
    onClose(dontShowAgain);
    setCurrentStep(0);
    setDontShowAgain(false);
  };

  /**
   * Synchronise l'état actuel avec le carousel
   */
  const handleCarouselSelect = () => {
    if (!carouselApi) return;
    setCurrentStep(carouselApi.selectedScrollSnap());
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleClose();
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-6">
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
              {ONBOARDING_STEPS.map((step, index) => (
                <CarouselItem key={step.id}>
                  <OnboardingStep
                    title={step.title}
                    description={step.description}
                    content={step.content}
                    icon={step.icon}
                    stepNumber={index + 1}
                    totalSteps={ONBOARDING_STEPS.length}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Indicateurs de points (dots) */}
          <div className="flex justify-center gap-2 my-4">
            {ONBOARDING_STEPS.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentStep(index);
                  carouselApi?.scrollTo(index);
                }}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "w-8 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Aller à l'étape ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Pied de page avec case à cocher et boutons - fixe */}
        <div className="flex flex-col gap-4 pt-4 border-t mt-4">
          {/* Case à cocher "Ne plus afficher" */}
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

          {/* Boutons de navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Précédent
            </Button>

            {currentStep < ONBOARDING_STEPS.length - 1 ? (
              <Button onClick={handleNext}>
                Suivant
              </Button>
            ) : (
              <Button onClick={handleClose}>
                Terminer
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
