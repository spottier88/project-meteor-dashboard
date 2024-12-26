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
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: "admin" | "direction" | "chef_projet" | "direction_operationnelle";
}

export const UserManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      if (!profile || profile.role !== "admin") {
        navigate("/");
        throw new Error("Accès non autorisé");
      }

      return profile;
    },
  });

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
    enabled: !!currentUser,
  });

  const handleRoleChange = async (userId: string, newRole: Profile["role"]) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le rôle de l'utilisateur",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Succès",
        description: "Le rôle a été mis à jour",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour au tableau de bord
      </Button>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Prénom</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles?.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell>{profile.email}</TableCell>
                <TableCell>{profile.first_name || "-"}</TableCell>
                <TableCell>{profile.last_name || "-"}</TableCell>
                <TableCell>{profile.role}</TableCell>
                <TableCell>
                  <select
                    className="border rounded p-1"
                    value={profile.role}
                    onChange={(e) => handleRoleChange(profile.id, e.target.value as Profile["role"])}
                    disabled={profile.id === currentUser?.id}
                  >
                    <option value="admin">Admin</option>
                    <option value="direction">Direction</option>
                    <option value="chef_projet">Chef de projet</option>
                    <option value="direction_operationnelle">Direction opérationnelle</option>
                  </select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};