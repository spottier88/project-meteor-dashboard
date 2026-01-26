
# Plan de remédiation : Conflit Dialog/Popover dans le formulaire de gestionnaires

## Problème identifié

Le composant `AddPortfolioManagerForm.tsx` utilise un **Popover** imbriqué dans un **Dialog**. Cette combinaison crée un conflit de "focus trap" avec Radix UI :
- Le Dialog capture le focus et bloque les événements clavier/souris vers le Popover
- Le champ de recherche `CommandInput` ne reçoit pas les frappes clavier
- Les clics sur `CommandItem` ne sont pas détectés

## Solution recommandée

Adopter le même pattern que `ProjectManagerDialog.tsx` : **remplacer le Popover par une intégration directe** de la recherche dans le Dialog principal.

### Approche : Recherche intégrée dans le formulaire

Au lieu d'ouvrir un Popover escamotable, intégrer directement :
- Un champ de recherche avec l'icône loupe
- Une liste scrollable des utilisateurs filtrés
- Une sélection directe avec feedback visuel (coche)

---

## Fichier à modifier

`src/components/portfolio/AddPortfolioManagerForm.tsx`

### Modifications

#### 1. Supprimer les imports Popover/Command inutiles

Remplacer :
```typescript
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
```

Par :
```typescript
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Users } from "lucide-react";
```

#### 2. Ajouter un state pour la recherche

Ajouter au début du composant :
```typescript
const [searchQuery, setSearchQuery] = useState("");
```

Supprimer le state `open` (plus nécessaire car pas de Popover).

#### 3. Ajouter la logique de filtrage

```typescript
// Filtrer les utilisateurs selon la recherche
const filteredUsers = useMemo(() => {
  if (!eligibleUsers) return [];
  if (!searchQuery.trim()) return eligibleUsers;
  
  const query = searchQuery.toLowerCase();
  return eligibleUsers.filter((user) => {
    const name = formatUserName(user).toLowerCase();
    const email = (user.email || "").toLowerCase();
    return name.includes(query) || email.includes(query);
  });
}, [eligibleUsers, searchQuery]);
```

#### 4. Remplacer le bloc Popover/Command par une interface intégrée

Remplacer les lignes 123-185 par :
```typescript
<div className="space-y-2">
  <Label>Utilisateur</Label>
  
  {/* Champ de recherche */}
  <div className="relative">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      placeholder="Rechercher par nom ou email..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="pl-9"
    />
  </div>

  {/* Liste des utilisateurs */}
  <ScrollArea className="h-48 rounded-md border">
    <div className="p-2">
      {loadingUsers ? (
        <div className="py-6 text-center text-sm text-muted-foreground">
          Chargement...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
          <Users className="h-8 w-8 mb-2" />
          <p className="text-sm">Aucun utilisateur disponible</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredUsers.map((user) => {
            const isSelected = selectedUserId === user.id;
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedUserId(user.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isSelected && "bg-accent text-accent-foreground"
                )}
              >
                <Check
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isSelected ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col min-w-0">
                  <span className="font-medium truncate">
                    {formatUserName(user)}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  </ScrollArea>
</div>
```

#### 5. Réinitialiser la recherche à la fermeture

Mettre à jour le handler `onOpenChange` du Dialog :
```typescript
<Dialog 
  open={isOpen} 
  onOpenChange={(open) => {
    if (!open) {
      setSearchQuery("");
      setSelectedUserId("");
      setSelectedRole("manager");
      onClose();
    }
  }}
>
```

---

## Résumé des changements

| Avant | Après |
|-------|-------|
| Popover escamotable avec Command | Recherche intégrée dans le Dialog |
| Conflit de focus trap | Focus géré par un seul Dialog |
| Interactions bloquées | Interactions fluides |

---

## Imports finaux

```typescript
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAddPortfolioManager } from "@/hooks/usePortfolioManagers";
import { UserProfile } from "@/types/user";
import { Check, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
```

---

## Avantages de cette approche

1. **Cohérence** : Même pattern que `ProjectManagerDialog.tsx` et `PortfolioMultiSelectDialog.tsx`
2. **Fiabilité** : Un seul Dialog = pas de conflit de focus
3. **Meilleure UX** : La recherche et la liste sont toujours visibles, pas d'étape supplémentaire
4. **Maintenabilité** : Pattern documenté et éprouvé dans le projet
