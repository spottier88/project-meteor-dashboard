/**
 * Filtres pour la revue des droits utilisateurs.
 * Permet de filtrer par rôle, recherche textuelle et managers sans affectation.
 */
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/types/user";

/** Labels lisibles pour chaque rôle */
const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Administrateur" },
  { value: "chef_projet", label: "Chef de projet" },
  { value: "manager", label: "Manager" },
  { value: "membre", label: "Membre" },
  { value: "time_tracker", label: "Suivi activités" },
  { value: "portfolio_manager", label: "Gestionnaire de portefeuille" },
  { value: "quality_manager", label: "Responsable Qualité" },
];

interface PermissionsReviewFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedRoles: UserRole[];
  onRolesChange: (roles: UserRole[]) => void;
  showUnassignedManagers: boolean;
  onUnassignedManagersChange: (value: boolean) => void;
}

export const PermissionsReviewFilters = ({
  searchTerm,
  onSearchChange,
  selectedRoles,
  onRolesChange,
  showUnassignedManagers,
  onUnassignedManagersChange,
}: PermissionsReviewFiltersProps) => {
  /** Ajoute ou retire un rôle de la sélection */
  const toggleRole = (role: UserRole) => {
    if (selectedRoles.includes(role)) {
      onRolesChange(selectedRoles.filter((r) => r !== role));
    } else {
      onRolesChange([...selectedRoles, role]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Recherche textuelle */}
      <Input
        placeholder="Rechercher par nom, prénom ou email..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm"
      />

      {/* Filtres par rôle */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-muted-foreground mr-1">Filtrer par rôle :</span>
        {ROLE_OPTIONS.map((opt) => (
          <Badge
            key={opt.value}
            variant={selectedRoles.includes(opt.value) ? "default" : "outline"}
            className="cursor-pointer select-none"
            onClick={() => toggleRole(opt.value)}
          >
            {opt.label}
          </Badge>
        ))}
      </div>

      {/* Checkbox managers sans affectation */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="unassigned-managers"
          checked={showUnassignedManagers}
          onCheckedChange={(checked) => onUnassignedManagersChange(checked === true)}
        />
        <label htmlFor="unassigned-managers" className="text-sm cursor-pointer">
          Afficher uniquement les managers sans affectation
        </label>
      </div>
    </div>
  );
};
