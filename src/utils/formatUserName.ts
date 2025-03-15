
/**
 * Formate l'affichage d'un nom d'utilisateur à partir des informations du profil
 * Retourne:
 * - "Prénom Nom" si les deux sont disponibles
 * - "Prénom" ou "Nom" si un seul est disponible
 * - L'email si aucun nom n'est disponible
 */
export const formatUserName = (
  email: string | undefined,
  profiles?: Array<{
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  }> | null
): string => {
  if (!email) return '-';
  
  // Chercher le profil correspondant à l'email
  const profile = profiles?.find(p => p.email === email);
  
  if (!profile) return email;
  
  const { first_name, last_name } = profile;
  
  if (first_name && last_name) {
    return `${first_name} ${last_name}`;
  } else if (first_name) {
    return first_name;
  } else if (last_name) {
    return last_name;
  }
  
  return email;
};
