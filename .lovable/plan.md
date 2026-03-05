

# Conserver la page de pagination au retour vers la liste des projets

## Constat

La pagination est deja sauvegardee dans `localStorage` (`projectsCurrentPage`). Cependant, le `useEffect` dans `ProjectList.tsx` (ligne 45-47) **remet systematiquement la page a 1** des que `projects.length` change — ce qui se produit a chaque chargement de la page Index, y compris au retour depuis la synthese projet.

## Solution

Distinguer un changement de filtre actif (qui doit remettre a la page 1) d'un simple rechargement de page (qui doit conserver la page sauvegardee).

### Modification unique : `src/components/project/ProjectList.tsx`

Remplacer la dependance `projects.length` par un mecanisme qui ne se declenche qu'apres le premier rendu :

- Utiliser un `useRef` pour stocker la longueur precedente des projets
- Ne remettre a la page 1 que si la longueur change **apres le rendu initial** (= changement de filtre), pas au premier montage du composant

```text
Avant :
  useEffect(() => { setCurrentPage(1); }, [projects.length]);

Apres :
  const isFirstRender = useRef(true);
  const prevLength = useRef(projects.length);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevLength.current = projects.length;
      return;
    }
    if (prevLength.current !== projects.length) {
      setCurrentPage(1);
      prevLength.current = projects.length;
    }
  }, [projects.length]);
```

Ainsi :
- **Premier montage** (retour depuis synthese) → page restauree depuis localStorage
- **Changement de filtre** (nombre de projets change) → remise a page 1

### Fichier concerne

| Fichier | Modification |
|---------|-------------|
| `src/components/project/ProjectList.tsx` | Ajouter `useRef` pour ignorer le reset au premier rendu |

Aucune autre modification necessaire. La sauvegarde localStorage et la navigation existante restent inchangees.

