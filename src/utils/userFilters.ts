/**
 * Helpers de filtrage des utilisateurs selon leur statut actif.
 *
 * Un utilisateur dont `is_active === false` ne doit plus apparaître dans
 * les listes de sélection (tâches, équipes, notifications, etc.).
 * On considère un profil sans champ `is_active` comme actif (rétro-compat).
 */

export interface ActiveFilterable {
  is_active?: boolean | null;
}

/** Retourne vrai si l'utilisateur est actif (ou si le champ n'est pas renseigné). */
export const isUserActive = (user: ActiveFilterable | null | undefined): boolean => {
  if (!user) return false;
  return user.is_active !== false;
};

/** Filtre une liste pour ne garder que les utilisateurs actifs. */
export const filterActiveUsers = <T extends ActiveFilterable>(users: T[] | null | undefined): T[] => {
  if (!users) return [];
  return users.filter(isUserActive);
};
