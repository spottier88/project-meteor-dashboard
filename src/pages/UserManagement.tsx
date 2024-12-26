import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: "admin" | "chef_projet";
};

export const UserManagement = () => {
  const navigate = useNavigate();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Profile[];
    },
  });

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au tableau de bord
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Gestion des Utilisateurs</h1>
        <p className="text-muted-foreground">
          Gérez les utilisateurs et leurs rôles
        </p>
      </div>

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
          {profiles?.map((profile) => (
            <TableRow key={profile.id}>
              <TableCell>{profile.email}</TableCell>
              <TableCell>{profile.first_name || "-"}</TableCell>
              <TableCell>{profile.last_name || "-"}</TableCell>
              <TableCell>
                {profile.role === "admin" ? "Administrateur" : "Chef de projet"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};