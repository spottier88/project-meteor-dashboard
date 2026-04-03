/**
 * @file resetInteractionLocks.ts
 * @description Utilitaire pour réinitialiser les verrous d'interaction laissés par
 * les composants Radix UI (Dialog, Sheet, AlertDialog, DropdownMenu).
 * 
 * Radix applique `pointer-events: none` sur le body/html quand un overlay modal
 * est ouvert. Si le composant se démonte ou se ferme de manière incomplète
 * (ex: navigation pendant une transition), ce verrou peut rester actif et
 * bloquer toute interaction sur la page.
 */

export const resetInteractionLocks = () => {
  // Réinitialiser pointer-events sur body et html
  document.body.style.pointerEvents = "";
  document.documentElement.style.pointerEvents = "";

  // Retirer également l'attribut data-scroll-locked ajouté par Radix
  document.body.removeAttribute("data-scroll-locked");
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
};
