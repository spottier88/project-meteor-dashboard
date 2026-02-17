/**
 * Onglet principal de la revue des droits.
 * Charge les données consolidées (profils, rôles, affectations) et
 * assemble filtres, tableau et bouton d'export.
 */
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { UserRole } from "@/types/user";
import { PermissionsReviewFilters } from "./PermissionsReviewFilters";
import { PermissionsReviewTable, PermissionsReviewUser } from "./PermissionsReviewTable";
import { exportPermissionsReview } from "@/utils/permissionsExport";

export const PermissionsReviewTab = () => {
  // --- État des filtres ---
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [showUnassignedManagers, setShowUnassignedManagers] = useState(false);

  // --- Chargement des données ---
  const { data: profiles } = useQuery({
    queryKey: ["permReview-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: roles } = useQuery({
    queryKey: ["permReview-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: assignments } = useQuery({
    queryKey: ["permReview-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manager_path_assignments")
        .select("user_id, path_id, hierarchy_paths(path_string)");
      if (error) throw error;
      return data;
    },
  });

  const { data: lastActivities } = useQuery({
    queryKey: ["permReview-lastActivities"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_users_last_activity");
      if (error) throw error;
      return data.reduce(
        (acc: Record<string, Date>, curr: { user_id: string; last_activity_at: string }) => {
          acc[curr.user_id] = new Date(curr.last_activity_at);
          return acc;
        },
        {}
      );
    },
  });

  // --- Consolidation des données ---
  const consolidatedUsers: PermissionsReviewUser[] = useMemo(() => {
    if (!profiles || !roles) return [];

    return profiles.map((profile) => {
      const userRoles = roles
        .filter((r) => r.user_id === profile.id)
        .map((r) => r.role as UserRole);

      // Chemins hiérarchiques pour les managers
      const paths: string[] = [];
      if (assignments) {
        assignments
          .filter((a) => a.user_id === profile.id)
          .forEach((a) => {
            const hp = a.hierarchy_paths as { path_string: string } | null;
            if (hp?.path_string) paths.push(hp.path_string);
          });
      }

      return {
        id: profile.id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        roles: userRoles,
        hierarchyPaths: paths,
        lastActivity: lastActivities?.[profile.id],
      };
    });
  }, [profiles, roles, assignments, lastActivities]);

  // --- Application des filtres ---
  const filteredUsers = useMemo(() => {
    let result = consolidatedUsers;

    // Recherche textuelle
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (u) =>
          (u.first_name?.toLowerCase() || "").includes(lower) ||
          (u.last_name?.toLowerCase() || "").includes(lower) ||
          (u.email?.toLowerCase() || "").includes(lower)
      );
    }

    // Filtre par rôles sélectionnés
    if (selectedRoles.length > 0) {
      result = result.filter((u) =>
        selectedRoles.some((role) => u.roles.includes(role))
      );
    }

    // Filtre managers sans affectation
    if (showUnassignedManagers) {
      result = result.filter(
        (u) => u.roles.includes("manager") && u.hierarchyPaths.length === 0
      );
    }

    return result;
  }, [consolidatedUsers, searchTerm, selectedRoles, showUnassignedManagers]);

  const isLoading = !profiles || !roles;

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Revue des droits</h2>
        <Button
          variant="outline"
          onClick={() => exportPermissionsReview(filteredUsers)}
          disabled={filteredUsers.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Exporter en Excel
        </Button>
      </div>

      <PermissionsReviewFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedRoles={selectedRoles}
        onRolesChange={setSelectedRoles}
        showUnassignedManagers={showUnassignedManagers}
        onUnassignedManagersChange={setShowUnassignedManagers}
      />

      <PermissionsReviewTable users={filteredUsers} />
    </div>
  );
};
