import { 
  Rocket, 
  FolderPlus, 
  TrendingUp, 
  ClipboardCheck, 
  CheckCircle,
  LucideIcon
} from "lucide-react";

/**
 * Props pour le composant OnboardingStep
 */
interface OnboardingStepProps {
  title: string;
  description: string;
  content: string;
  icon: string;
  stepNumber: number;
  totalSteps: number;
}

/**
 * Composant OnboardingStep
 * 
 * Affiche une étape individuelle du tutoriel de prise en main.
 * Chaque étape contient une icône, un titre, une description et un contenu détaillé.
 * 
 * @param {string} title - Titre principal de l'étape
 * @param {string} description - Description courte de l'étape
 * @param {string} content - Contenu détaillé expliquant l'étape
 * @param {string} icon - Nom de l'icône à afficher (rocket, folder-plus, etc.)
 * @param {number} stepNumber - Numéro de l'étape courante
 * @param {number} totalSteps - Nombre total d'étapes dans le tutoriel
 */
export const OnboardingStep = ({ 
  title, 
  description, 
  content, 
  icon, 
  stepNumber, 
  totalSteps 
}: OnboardingStepProps) => {
  // Mapping des noms d'icônes vers les composants Lucide
  const iconMap: Record<string, LucideIcon> = {
    rocket: Rocket,
    "folder-plus": FolderPlus,
    "trending-up": TrendingUp,
    "clipboard-check": ClipboardCheck,
    "check-circle": CheckCircle,
  };

  const IconComponent = iconMap[icon] || Rocket;

  return (
    <div className="flex flex-col items-center text-center px-6 py-8">
      {/* Indicateur de progression */}
      <div className="text-sm text-muted-foreground mb-6">
        Étape {stepNumber} sur {totalSteps}
      </div>
      
      {/* Icône dans un cercle coloré */}
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <IconComponent className="h-12 w-12 text-primary" />
      </div>
      
      {/* Titre de l'étape */}
      <h2 className="text-2xl font-bold mb-3 text-foreground">
        {title}
      </h2>
      
      {/* Description courte */}
      <p className="text-lg text-muted-foreground mb-4 max-w-md">
        {description}
      </p>
      
      {/* Contenu détaillé */}
      <p className="text-sm text-muted-foreground/80 max-w-lg leading-relaxed">
        {content}
      </p>
    </div>
  );
};
