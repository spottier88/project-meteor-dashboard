
# Plan d'implémentation : Améliorations de la gestion des portefeuilles

## Objectifs
1. Afficher le **nom et prénom** du chef de projet au lieu de l'email dans la liste des projets d'un portefeuille
2. Ajouter une **fonctionnalité de recherche** dans le formulaire d'ajout de gestionnaires de portefeuille

---

## Modification 1 : Afficher le nom du chef de projet

### Problème actuel
Dans l'onglet "Projets" d'un portefeuille, la colonne "Chef de projet" affiche l'adresse email car :
- Le champ `project_manager` de la table `projects` stocke l'email
- Aucune jointure n'est faite vers la table `profiles` pour récupérer le nom/prénom

### Solution proposée
Enrichir les données des projets avec les informations du profil du chef de projet.

### Fichiers à modifier

#### 1. `src/hooks/usePortfolioDetails.ts`
Après avoir récupéré les projets, effectuer une requête supplémentaire pour obtenir les profils des chefs de projet :

```text
Étapes :
1. Extraire les emails uniques des project_manager
2. Requêter la table profiles pour ces emails
3. Créer un Map email → profil (first_name, last_name)
4. Enrichir chaque projet avec les données du profil
```

#### 2. `src/components/portfolio/PortfolioProjectsTable.tsx`
Adapter l'interface `Project` et l'affichage :

```text
Modifications :
1. Ajouter un champ optionnel manager_profile à l'interface Project
2. Créer une fonction formatManagerName() pour afficher Prénom Nom ou email si absent
3. Remplacer l'affichage direct de project_manager par cette fonction
```

### Détails techniques

**Dans usePortfolioDetails.ts** (après ligne 91) :
```typescript
// Récupérer les profils des chefs de projet
const managerEmails = [...new Set(
  projects.map(p => p.project_manager).filter(Boolean)
)] as string[];

const { data: managerProfiles } = await supabase
  .from("profiles")
  .select("email, first_name, last_name")
  .in("email", managerEmails);

// Créer un map email → profil
const managerProfileMap = new Map(
  managerProfiles?.map(p => [p.email, p]) || []
);
```

**Dans PortfolioProjectsTable.tsx** :
```typescript
// Interface enrichie
interface Project {
  // ... champs existants
  manager_profile?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

// Fonction d'affichage
const formatManagerName = (project: Project) => {
  const profile = project.manager_profile;
  if (profile?.first_name || profile?.last_name) {
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
  }
  return project.project_manager || "-";
};

// Dans le rendu (ligne 266)
<TableCell>{formatManagerName(project)}</TableCell>
```

---

## Modification 2 : Recherche dans l'ajout de gestionnaires

### Problème actuel
Le formulaire utilise un `Select` simple qui affiche tous les utilisateurs dans une liste déroulante, ce qui devient difficile à utiliser avec un grand nombre d'utilisateurs.

### Solution proposée
Remplacer le `Select` par un composant `Combobox` basé sur le pattern existant dans `ProjectManagerCombobox.tsx`, utilisant les composants `Command` de shadcn/ui.

### Fichier à modifier

#### `src/components/portfolio/AddPortfolioManagerForm.tsx`

### Détails techniques

**Nouveaux imports** :
```typescript
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
```

**Nouveau state** :
```typescript
const [open, setOpen] = useState(false);
```

**Remplacement du Select** (lignes 100-123) par :
```typescript
<div className="space-y-2">
  <Label htmlFor="user">Utilisateur</Label>
  <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
      >
        {selectedUserId ? (
          <span className="truncate">
            {formatUserName(eligibleUsers?.find(u => u.id === selectedUserId)!)}
          </span>
        ) : (
          <span className="text-muted-foreground">
            Rechercher un utilisateur...
          </span>
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-[350px] p-0" align="start">
      <Command>
        <CommandInput placeholder="Rechercher par nom ou email..." />
        <CommandList>
          {loadingUsers ? (
            <div className="py-6 text-center text-sm">Chargement...</div>
          ) : (
            <>
              <CommandEmpty>Aucun utilisateur disponible</CommandEmpty>
              <CommandGroup>
                {eligibleUsers?.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={`${formatUserName(user)} ${user.email}`}
                    onSelect={() => {
                      setSelectedUserId(user.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedUserId === user.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{formatUserName(user)}</span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</div>
```

---

## Résumé des fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `src/hooks/usePortfolioDetails.ts` | Récupérer les profils des chefs de projet et enrichir les données |
| `src/components/portfolio/PortfolioProjectsTable.tsx` | Afficher le nom au lieu de l'email |
| `src/components/portfolio/AddPortfolioManagerForm.tsx` | Remplacer le Select par un Combobox avec recherche |

---

## Résultat attendu

### Avant / Après

**Liste des projets du portefeuille :**
| Avant | Après |
|-------|-------|
| jean.dupont@example.com | Jean Dupont |
| marie.martin@example.com | Marie Martin |

**Formulaire d'ajout de gestionnaire :**
| Avant | Après |
|-------|-------|
| Liste déroulante simple avec tous les utilisateurs | Champ de recherche avec filtre dynamique |

---

## Avantages
1. **Cohérence** : L'affichage du nom est aligné avec le reste de l'application (revues, exports PPTX)
2. **Ergonomie** : La recherche facilite la sélection même avec un grand nombre d'utilisateurs
3. **Réutilisation** : Le pattern Combobox est déjà utilisé ailleurs dans l'application
