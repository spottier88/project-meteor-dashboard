
Objectif: traiter le bug persistant “Erreur lors de l’ouverture Word” en couvrant d’autres causes que la sanitization (volume, limites docxtemplater, structure template, intégrité fichier).

Constats déjà vérifiés
- Le projet `3d884915-4a55-45df-87f7-bf1ed578177d` n’a pas un volume extrême (≈3 147 caractères de cadrage), donc le volume brut seul n’explique pas l’échec.
- Les caractères “exotiques” existent (notamment U+202F) mais sont déjà traités côté sanitization.
- Le problème restant est donc probablement lié à la combinaison **template complexe + rendu docxtemplater + contexte d’injection** (pas uniquement aux données).

Plan de correction efficace (en 4 lots)

1) Diagnostic technique instrumenté (priorité haute)
- Fichier: `src/utils/framingMailMerge.ts`
- Ajouter une validation post-render du DOCX (scan des `word/*.xml` dans le zip et parse XML).
- Si XML invalide: remonter une erreur explicite (partie XML fautive) au lieu de télécharger un fichier corrompu.
- Logger des métriques: `templateId`, taille template, taille output, nb de sauts de ligne par champ, champs longs.

2) Isolation automatique du champ/format qui casse
- Toujours dans `framingMailMerge.ts`, ajouter un mode debug:
  - rendu “base” puis rendu incrémental par groupe de champs (`contexte`, `objectifs`, `gouvernance`, etc.)
  - détection du premier groupe qui rend le XML invalide.
- But: identifier rapidement si le problème vient des champs multi-lignes, des listes, ou d’un placeholder spécifique du modèle.

3) Durcissement du moteur de fusion (fallback robuste)
- Ajouter options docxtemplater défensives:
  - `nullGetter` (valeurs absentes => chaîne vide)
  - module `fixDocPrCorruption` (cas connus de corruption avec objets Word/forme/images/template riche).
- Stratégie de rendu en 2 passes:
  - Pass 1: mode actuel (`linebreaks: true`)
  - Pass 2 (fallback auto si invalide): mode “safe” pour champs longs (réduction sauts de ligne, suppression triples retours, éventuellement `linebreaks` neutralisé sur champs à risque).
- Si les 2 passes échouent: bloquer le téléchargement + message d’erreur actionnable (pas de DOCX cassé).

4) Contrôle qualité des templates (prévention)
- Côté gestion des modèles (`framing-export-templates`):
  - ajouter un “lint template” à l’upload (warning bloquant ou non):
    - balises dans zones risquées (`w:txbxContent`/text boxes, suivi de révision `w:ins|w:del`, champs Word complexes, etc.)
    - balises fragmentées non réparables.
- Afficher un rapport de compatibilité du template dans l’UI admin.

Tests de validation (obligatoires)
- Reproduire avec:
  - projet KO: `3d884915-4a55-45df-87f7-bf1ed578177d` + “Modèle complet”
  - projet OK de contrôle + “Modèle complet”
  - “Modèle démo”
- Vérifier:
  - ouverture Word desktop
  - absence de fichier corrompu silencieux
  - fallback déclenché correctement si mode principal échoue.

Décisions produit à trancher (3 max)
1. En cas d’échec du rendu “riche”, on préfère:
   - A) fallback automatique (contenu un peu moins formaté)  
   - B) blocage export avec message clair ?
2. Le lint template doit-il être:
   - A) bloquant à l’upload  
   - B) avertissement non bloquant ?
3. Souhaitez-vous un mode “diagnostic export” activable uniquement pour les admins (logs détaillés) ?

Portée de modification prévue
- Principalement `src/utils/framingMailMerge.ts`
- Secondairement composants d’admin templates (`src/components/framing-export-templates/*`) pour le lint/rapport.
