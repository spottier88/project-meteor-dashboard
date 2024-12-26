import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type UserRole = Database["public"]["Enums"]["user_role"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const roleLabels: Record<UserRole, string> = {
  admin: "Administrateur",
  direction: "Direction",
  chef_projet: "Chef de projet",
  direction_operationnelle: "Direction Opérationnelle",
};

export const UserManagement = () => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  
  const { data: users, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data as Profile[];
    },
  });

  if (isLoading) return <div>Chargement des utilisateurs...</div>;
  if (error) return <div>Une erreur est survenue lors du chargement des utilisateurs.</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Gestion des Utilisateurs</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Prénom</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Rôle</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user) => (
            <TableRow 
              key={user.id} 
              className="cursor-pointer hover:bg-muted"
              onClick={() => setSelectedUser(user.id)}
            >
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.first_name}</TableCell>
              <TableCell>{user.last_name}</TableCell>
              <TableCell>{user.role ? roleLabels[user.role] : "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {selectedUser && <div className="mt-4">Détails de l'utilisateur {selectedUser}</div>}
    </div>
  );
};

export default UserManagement;