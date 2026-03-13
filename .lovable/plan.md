
Constat d’analyse (projet `3d884915-4a55-45df-87f7-bf1ed578177d`)  
- Les champs fusionnés ne contiennent pas de caractères de contrôle XML interdits (0x00–0x1F hors CR/LF/TAB) ni de bytes invalides UTF-8.  
- En revanche, ce projet contient des caractères typographiques “exotiques” absents des autres projets testés, surtout dans `project_framing.governance`, `stakeholders`, `timeline` :  
  - `U+202F` (espace fine insécable) : 11 occurrences  
  - `U+8211` (tiret demi-cadratin), `U+8230` (ellipsis), et `&` dans certains blocs multi-lignes  
- Ce profil de données est cohérent avec un DOCX qui peut devenir invalide selon le modèle Word (runs/encodage/linebreaks), même si d’autres projets passent.

Plan de correctif (implémentation)
1) Durcir la sanitization avant `doc.render()` dans `src/utils/framingMailMerge.ts`
- Ajouter une fonction unique `sanitizeForDocx(value: string)` appliquée à toutes les valeurs injectées :
  - normalisation Unicode (`NFC`)
  - `\r\n` / `\r` -> `\n`
  - remplacement des espaces typographiques (`\u00A0`, `\u202F`, `\u2007`) par espace standard
  - suppression des caractères non autorisés XML 1.0 (`[\u0000-\u0008\u000B\u000C\u000E-\u001F\uD800-\uDFFF\uFFFE\uFFFF]`)
- Appliquer cette sanitization sur tout l’objet retourné par `buildMailMergeData`.

2) Ajouter une validation défensive
- Avant rendu, scanner les valeurs et logger les champs contenant des codepoints “à risque” (diagnostic).
- En cas de rendu/fichier invalide, remonter une erreur explicite avec le(s) champ(s) incriminé(s), au lieu d’un DOCX corrompu silencieux.

3) Corriger les données déjà stockées (one-shot)
- Nettoyage ciblé du projet concerné (remplacement de `U+202F` par espace standard dans `project_framing`), puis ré-export.
- Optionnel : script admin de nettoyage global sur tous les projets.

4) Vérification
- Reproduire export avec le modèle “complet” sur ce projet ID.
- Ouvrir le DOCX dans Word desktop (poste utilisateur) + LibreOffice (contrôle).
- Re-tester un projet “simple” pour s’assurer qu’il n’y a pas de régression.

Détail technique clé
- Le problème ne semble pas venir d’un champ vide ou d’un null, mais de la combinaison “caractères typographiques + texte multi-ligne + modèle Word complexe”.
- Le correctif robuste est donc un pipeline de normalisation/sanitization systématique juste avant la fusion.
