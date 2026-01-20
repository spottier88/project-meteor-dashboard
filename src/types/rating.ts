/**
 * @file Types pour le système d'évaluation de l'application
 * @description Définit les interfaces TypeScript pour les évaluations utilisateur
 */

/**
 * Évaluation de l'application par un utilisateur
 */
export interface AppRating {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Évaluation avec les informations du profil utilisateur (pour l'admin)
 */
export interface AppRatingWithUser extends AppRating {
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

/**
 * Statistiques des évaluations
 */
export interface RatingsStats {
  totalRatings: number;
  averageRating: number;
  distribution: {
    [key: number]: number; // 1-5 étoiles -> nombre d'évaluations
  };
}
