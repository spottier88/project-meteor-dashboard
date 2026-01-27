/**
 * Hook pour gérer le processus de clôture d'un projet
 * Gère les étapes, la validation et la soumission des données
 * Inclut la détection et suppression des données de clôture existantes
 */

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { 
  ClosureStep, 
  ClosureState, 
  FinalReviewFormData, 
  EvaluationFormData 
} from "@/types/project-closure";

/**
 * Interface pour les données de clôture existantes
 * Permet de savoir si une revue finale ou évaluation existe déjà
 */
interface ExistingClosureData {
  hasFinalReview: boolean;
  hasEvaluation: boolean;
  finalReviewId?: string;
  evaluationId?: string;
}

interface UseProjectClosureProps {
  projectId: string;
  onClosureComplete?: () => void;
}

export const useProjectClosure = ({ projectId, onClosureComplete }: UseProjectClosureProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // État initial de la clôture
  const [closureState, setClosureState] = useState<ClosureState>({
    currentStep: 'intro',
    finalReviewData: null,
    evaluationData: null,
    isSubmitting: false,
  });

  // État pour la vérification des données existantes
  const [existingData, setExistingData] = useState<ExistingClosureData | null>(null);
  const [checkingExistingData, setCheckingExistingData] = useState(false);

  // Navigation entre les étapes
  const goToStep = useCallback((step: ClosureStep) => {
    setClosureState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const goToNextStep = useCallback(() => {
    const steps: ClosureStep[] = ['intro', 'final_review', 'method_evaluation', 'confirmation'];
    const currentIndex = steps.indexOf(closureState.currentStep);
    if (currentIndex < steps.length - 1) {
      goToStep(steps[currentIndex + 1]);
    }
  }, [closureState.currentStep, goToStep]);

  const goToPreviousStep = useCallback(() => {
    const steps: ClosureStep[] = ['intro', 'final_review', 'method_evaluation', 'confirmation'];
    const currentIndex = steps.indexOf(closureState.currentStep);
    if (currentIndex > 0) {
      goToStep(steps[currentIndex - 1]);
    }
  }, [closureState.currentStep, goToStep]);

  // Sauvegarder les données du bilan final
  const saveFinalReviewData = useCallback((data: FinalReviewFormData) => {
    setClosureState(prev => ({ ...prev, finalReviewData: data }));
    goToNextStep();
  }, [goToNextStep]);

  // Sauvegarder les données de l'évaluation de méthode
  const saveEvaluationData = useCallback((data: EvaluationFormData) => {
    setClosureState(prev => ({ ...prev, evaluationData: data }));
    goToNextStep();
  }, [goToNextStep]);

  // Reporter l'évaluation (marque le projet comme terminé mais évaluation en attente)
  const postponeEvaluation = async () => {
    if (!closureState.finalReviewData) {
      toast({
        title: "Erreur",
        description: "Le bilan du projet doit être complété avant de reporter l'évaluation.",
        variant: "destructive",
      });
      return false;
    }

    setClosureState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      // 1. Créer la revue finale
      const { error: reviewError } = await supabase.from("reviews").insert({
        project_id: projectId,
        weather: closureState.finalReviewData.weather,
        progress: closureState.finalReviewData.progress,
        completion: 100,
        comment: closureState.finalReviewData.comment,
        difficulties: closureState.finalReviewData.difficulties,
        is_final_review: true,
      });

      if (reviewError) throw reviewError;

      // 2. Mettre à jour le projet
      const { error: projectError } = await supabase
        .from("projects")
        .update({
          lifecycle_status: 'completed',
          closure_status: 'pending_evaluation',
          closed_at: new Date().toISOString(),
          closed_by: userId,
          status: closureState.finalReviewData.weather,
          progress: closureState.finalReviewData.progress,
          last_review_date: new Date().toISOString(),
        })
        .eq("id", projectId);

      if (projectError) throw projectError;

      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["lastReviews", projectId] });

      toast({
        title: "Projet clôturé",
        description: "Le projet a été marqué comme terminé. L'évaluation de la méthode peut être complétée ultérieurement.",
      });

      onClosureComplete?.();
      return true;
    } catch (error) {
      console.error("Erreur lors du report de l'évaluation:", error);
      toast({
        title: "Erreur",
        description: "Impossible de clôturer le projet.",
        variant: "destructive",
      });
      return false;
    } finally {
      setClosureState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // Soumettre la clôture complète
  const submitClosure = async () => {
    if (!closureState.finalReviewData || !closureState.evaluationData) {
      toast({
        title: "Erreur",
        description: "Toutes les données doivent être complétées.",
        variant: "destructive",
      });
      return false;
    }

    setClosureState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      // 1. Créer la revue finale
      const { error: reviewError } = await supabase.from("reviews").insert({
        project_id: projectId,
        weather: closureState.finalReviewData.weather,
        progress: closureState.finalReviewData.progress,
        completion: 100,
        comment: closureState.finalReviewData.comment,
        difficulties: closureState.finalReviewData.difficulties,
        is_final_review: true,
      });

      if (reviewError) throw reviewError;

      // 2. Créer l'évaluation de méthode
      const { error: evalError } = await supabase.from("project_evaluations").insert({
        project_id: projectId,
        what_worked: closureState.evaluationData.what_worked,
        what_was_missing: closureState.evaluationData.what_was_missing,
        improvements: closureState.evaluationData.improvements,
        lessons_learned: closureState.evaluationData.lessons_learned,
        created_by: userId,
      });

      if (evalError) throw evalError;

      // 3. Mettre à jour le projet
      const { error: projectError } = await supabase
        .from("projects")
        .update({
          lifecycle_status: 'completed',
          closure_status: 'completed',
          closed_at: new Date().toISOString(),
          closed_by: userId,
          status: closureState.finalReviewData.weather,
          progress: closureState.finalReviewData.progress,
          last_review_date: new Date().toISOString(),
        })
        .eq("id", projectId);

      if (projectError) throw projectError;

      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["lastReviews", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projectEvaluation", projectId] });

      toast({
        title: "Projet clôturé",
        description: "Le projet a été clôturé avec succès. Le bilan et l'évaluation ont été enregistrés.",
      });

      onClosureComplete?.();
      return true;
    } catch (error) {
      console.error("Erreur lors de la clôture:", error);
      toast({
        title: "Erreur",
        description: "Impossible de clôturer le projet.",
        variant: "destructive",
      });
      return false;
    } finally {
      setClosureState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // Compléter une évaluation en attente
  const completeEvaluation = async (evaluationData: EvaluationFormData) => {
    setClosureState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      // Créer l'évaluation de méthode
      const { error: evalError } = await supabase.from("project_evaluations").insert({
        project_id: projectId,
        what_worked: evaluationData.what_worked,
        what_was_missing: evaluationData.what_was_missing,
        improvements: evaluationData.improvements,
        lessons_learned: evaluationData.lessons_learned,
        created_by: userId,
      });

      if (evalError) throw evalError;

      // Mettre à jour le statut de clôture
      const { error: projectError } = await supabase
        .from("projects")
        .update({ closure_status: 'completed' })
        .eq("id", projectId);

      if (projectError) throw projectError;

      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projectEvaluation", projectId] });

      toast({
        title: "Évaluation complétée",
        description: "L'évaluation de la méthode projet a été enregistrée.",
      });

      onClosureComplete?.();
      return true;
    } catch (error) {
      console.error("Erreur lors de l'évaluation:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer l'évaluation.",
        variant: "destructive",
      });
      return false;
    } finally {
      setClosureState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // Réinitialiser l'état
  const resetClosure = useCallback(() => {
    setClosureState({
      currentStep: 'intro',
      finalReviewData: null,
      evaluationData: null,
      isSubmitting: false,
    });
    setExistingData(null);
    setCheckingExistingData(false);
  }, []);

  /**
   * Vérifie si des données de clôture existent déjà pour ce projet
   * (revue finale et/ou évaluation de méthode)
   */
  const checkExistingClosureData = useCallback(async () => {
    setCheckingExistingData(true);
    try {
      // Vérifier si une revue finale existe
      const { data: finalReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('project_id', projectId)
        .eq('is_final_review', true)
        .maybeSingle();

      // Vérifier si une évaluation existe
      const { data: evaluation } = await supabase
        .from('project_evaluations')
        .select('id')
        .eq('project_id', projectId)
        .maybeSingle();

      setExistingData({
        hasFinalReview: !!finalReview,
        hasEvaluation: !!evaluation,
        finalReviewId: finalReview?.id,
        evaluationId: evaluation?.id,
      });
    } catch (error) {
      console.error("Erreur lors de la vérification des données existantes:", error);
    } finally {
      setCheckingExistingData(false);
    }
  }, [projectId]);

  /**
   * Supprime les données de clôture existantes pour permettre une nouvelle clôture
   * Supprime l'évaluation, la revue finale et réinitialise les champs du projet
   */
  const deleteExistingClosureData = useCallback(async () => {
    if (!existingData) return false;

    try {
      // Supprimer l'évaluation existante si présente
      if (existingData.evaluationId) {
        const { error: evalError } = await supabase
          .from('project_evaluations')
          .delete()
          .eq('id', existingData.evaluationId);
        
        if (evalError) throw evalError;
      }

      // Supprimer la revue finale existante si présente
      if (existingData.finalReviewId) {
        const { error: reviewError } = await supabase
          .from('reviews')
          .delete()
          .eq('id', existingData.finalReviewId);
        
        if (reviewError) throw reviewError;
      }

      // Réinitialiser les champs de clôture du projet
      const { error: projectError } = await supabase
        .from('projects')
        .update({
          closure_status: null,
          closed_at: null,
          closed_by: null,
        })
        .eq('id', projectId);

      if (projectError) throw projectError;

      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projectEvaluation", projectId] });
      queryClient.invalidateQueries({ queryKey: ["lastReviews", projectId] });

      // Réinitialiser le state des données existantes
      setExistingData(null);

      toast({
        title: "Données supprimées",
        description: "Les anciennes données de clôture ont été supprimées.",
      });

      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les anciennes données.",
        variant: "destructive",
      });
      return false;
    }
  }, [existingData, projectId, queryClient, toast]);

  return {
    closureState,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    saveFinalReviewData,
    saveEvaluationData,
    postponeEvaluation,
    submitClosure,
    completeEvaluation,
    resetClosure,
    // Nouvelles fonctions pour la gestion des données existantes
    existingData,
    checkingExistingData,
    checkExistingClosureData,
    deleteExistingClosureData,
  };
};
