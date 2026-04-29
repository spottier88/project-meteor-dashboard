
# Mise à jour de @xmldom/xmldom (0.9.8 → 0.9.10)

## Constat

La bibliothèque concernée est **`@xmldom/xmldom`** (le successeur officiel maintenu de l'ancien package `xmldom`, déprécié depuis 2021). Elle est bien présente dans le projet :

- **Version actuelle installée** : `0.9.8` (visible dans `bun.lock` et `package-lock.json`)
- **Version cible** : `0.9.10` (publiée le 18 avril 2026)
- **Présence dans le code applicatif** : aucune. `rg "xmldom"` ne renvoie aucun résultat dans `src/`.
- **Origine** : dépendance **transitive** introduite par **`docxtemplater@3.68.3`**, qui déclare `"@xmldom/xmldom": "^0.9.8"`.

```text
docxtemplater 3.68.3
└── @xmldom/xmldom ^0.9.8   ← satisfait par 0.9.10 (semver compatible)
```

## Où docxtemplater est utilisé

Une seule chaîne d'utilisation, l'export DOCX du cadrage projet :

- `src/utils/framingMailMerge.ts` — moteur de fusion (mail merge) DOCX
- `src/components/framing/ProjectFramingExportDOCX.tsx` — bouton d'export
- `src/components/framing-export-templates/*` — gestion des modèles DOCX
- `src/utils/templateLinter.ts` — lint des modèles uploadés (utilise `pizzip`, pas xmldom directement)

Aucun autre composant ne dépend transitivement de xmldom.

## Impacts d'une montée de version

La montée 0.9.8 → 0.9.10 est un **bump patch** dans la même branche mineure 0.9.x. D'après le changelog public de xmldom :

- **0.9.9** et **0.9.10** : corrections de bugs et durcissements de sécurité (parsing XML / XHTML), aucune rupture d'API documentée.
- Aucun changement d'API publique consommée par docxtemplater (DOMParser, XMLSerializer).
- Compatible Node ≥ 14.6 (déjà respecté par le projet).

**Risques fonctionnels attendus** : très faibles.
- Le parsing XML peut devenir plus strict sur des modèles DOCX malformés. Or `templateLinter.ts` valide déjà les modèles en amont (révisions, balises fragmentées, text-boxes), ce qui réduit le risque.
- L'export DOCX (cadrage projet) est la seule fonctionnalité utilisateur concernée.

## Comment forcer la mise à jour (la version cible n'étant pas encore exigée par docxtemplater)

`docxtemplater@3.68.3` accepte `^0.9.8` donc `0.9.10` est compatible, mais sans intervention bun/npm garderont éventuellement `0.9.8` figé par le lockfile. Deux options :

1. **Override dans `package.json`** (recommandé, déclaratif et persistant) :
   ```json
   "overrides": {
     "@xmldom/xmldom": "^0.9.10"
   },
   "resolutions": {
     "@xmldom/xmldom": "^0.9.10"
   }
   ```
   `overrides` est lu par npm, `resolutions` par bun/yarn — on met les deux pour rester compatible avec le double lockfile présent (`bun.lock` + `package-lock.json`).

2. **Réinstallation simple** : supprimer l'entrée xmldom des lockfiles puis relancer `bun install` — moins fiable car la résolution peut retomber sur 0.9.8.

L'option 1 sera retenue.

## Plan d'action (à exécuter en mode build)

1. Ajouter les blocs `overrides` et `resolutions` dans `package.json` pour forcer `@xmldom/xmldom@^0.9.10`.
2. Relancer l'installation pour régénérer les lockfiles.
3. Vérifier dans `bun.lock` et `package-lock.json` que la version résolue est bien `0.9.10`.
4. Test fumée manuel à signaler à l'utilisateur : exporter un cadrage projet en DOCX (via `ProjectFramingExportDOCX`) avec un modèle existant pour valider que le rendu reste identique.

## Hors périmètre

- Aucune modification du code applicatif (`src/`) n'est nécessaire.
- L'erreur de build préexistante sur `src/components/task/TaskGantt.tsx` (`@svar-ui/react-core` introuvable) n'est pas liée à xmldom et sera traitée séparément si besoin.
