/**
 * Configuration des micro-étapes du wizard assisté.
 * Chaque étape contient un titre principal, un sous-titre explicatif,
 * et un indicateur si elle est optionnelle.
 */

export interface AssistedStepDef {
  /** Titre principal affiché en grand */
  title: string;
  /** Sous-titre explicatif */
  subtitle: string;
  /** L'étape peut être sautée */
  optional: boolean;
  /** Clé unique pour identifier l'étape */
  key: string;
}

export const ASSISTED_STEPS: AssistedStepDef[] = [
  {
    key: "naming",
    title: "Comment s'appelle votre projet ?",
    subtitle: "Donnez un titre et une description à votre projet.",
    optional: false,
  },
  {
    key: "manager",
    title: "Qui pilote ce projet ?",
    subtitle: "Sélectionnez le chef de projet responsable.",
    optional: false,
  },
  {
    key: "dates",
    title: "Quelles sont les dates prévisionnelles ?",
    subtitle: "Définissez les dates de début et de fin du projet.",
    optional: false,
  },
  {
    key: "status",
    title: "Quel est le statut et la priorité ?",
    subtitle: "Définissez l'avancement et le niveau d'urgence.",
    optional: false,
  },
  {
    key: "organization",
    title: "Rattachement et organisation",
    subtitle: "Portefeuilles, tags et lien Teams.",
    optional: false,
  },
  {
    key: "monitoring",
    title: "Niveau de suivi",
    subtitle: "Définissez le niveau de suivi organisationnel du projet.",
    optional: true,
  },
  {
    key: "innovation",
    title: "Score d'innovation",
    subtitle: "Évaluez le caractère innovant de votre projet.",
    optional: true,
  },
  {
    key: "framing",
    title: "Cadrage du projet",
    subtitle: "Décrivez le contexte, les objectifs et les livrables.",
    optional: true,
  },
  {
    key: "entity",
    title: "Entité bénéficiaire et modèle",
    subtitle: "Pour quelle entité ce projet est-il réalisé ?",
    optional: true,
  },
  {
    key: "recap",
    title: "Récapitulatif",
    subtitle: "Vérifiez les informations avant de valider.",
    optional: false,
  },
];

/** Nombre total de micro-étapes */
export const TOTAL_ASSISTED_STEPS = ASSISTED_STEPS.length;
