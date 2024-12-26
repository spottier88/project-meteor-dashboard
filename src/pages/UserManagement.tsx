import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

const roleLabels: Record<UserRole, string> = {
  admin: "Administrateur",
  direction: "Direction",
  chef_projet: "Chef de projet",
  direction_operationnelle: "Direction Opérationnelle",
};

const UserManagement = () => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const { data: users, isLoading, error } = useQuery(["users"], async () => {
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) throw error;
    return data;
  });

  if (isLoading) return <div>Chargement des utilisateurs...</div>;
  if (error) return <div>Une erreur est survenue lors du chargement des utilisateurs.</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold">Gestion des Utilisateurs</h1>
      <ul>
        {users?.map((user) => (
          <li key={user.id} onClick={() => setSelectedUser(user.id)}>
            {user.email} - {roleLabels[user.role]}
          </li>
        ))}
      </ul>
      {selectedUser && <div>Détails de l'utilisateur {selectedUser}</div>}
    </div>
  );
};

export default UserManagement;
