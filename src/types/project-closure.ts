/**
 * Types pour la clôture de projet et l'évaluation de méthode
 */

// Statut de clôture d'un projet
export type ClosureStatus = 'pending_review' | 'pending_evaluation' | 'completed' | null;

// Données de l'évaluation de méthode (Niveau 2)
export interface ProjectEvaluation {
  id: string;
  project_id: string;
  what_worked: string | null;      // Ce qui a bien fonctionné
  what_was_missing: string | null; // Ce qui a manqué
  improvements: string | null;     // Pistes d'amélioration
  lessons_learned: string | null;  // Enseignements tirés
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// Formulaire d'évaluation de méthode
export interface EvaluationFormData {
  what_worked: string;
  what_was_missing: string;
  improvements: string;
  lessons_learned: string;
}

// Formulaire de bilan final (Niveau 1) - étend le formulaire de revue classique
export interface FinalReviewFormData {
  weather: 'sunny' | 'cloudy' | 'stormy';
  progress: 'better' | 'stable' | 'worse';
  completion: number;
  comment: string;
  difficulties: string;
}

// Étapes du processus de clôture
export type ClosureStep = 'intro' | 'final_review' | 'method_evaluation' | 'confirmation';

// État du processus de clôture
export interface ClosureState {
  currentStep: ClosureStep;
  finalReviewData: FinalReviewFormData | null;
  evaluationData: EvaluationFormData | null;
  isSubmitting: boolean;
}
