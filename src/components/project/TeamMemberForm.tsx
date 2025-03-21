
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

interface FormValues {
  userId: string;
}

interface User {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
}

export const TeamMemberForm = ({ isOpen, onClose, projectId }: TeamMemberFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<FormValues>();
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  // Réinitialiser le formulaire et la recherche à chaque ouverture du dialog
  useEffect(() => {
    if (isOpen) {
      form.reset();
      setSearchQuery("");
      setShowResults(false);
      // Force le rechargement des données des membres disponibles
      queryClient.invalidateQueries({ queryKey: ["availableMembers", projectId] });
    }
  }, [isOpen, form, queryClient, projectId]);

  const { data: availableUsers } = useQuery({
    queryKey: ["availableMembers", projectId],
    queryFn: async () => {
      // Get existing team members
      const { data: existingMembers } = await supabase
        .from("project_members")
        .select("user_id")
        .eq("project_id", projectId);

      const existingUserIds = existingMembers?.map(m => m.user_id) || [];

      // Get users with 'membre' role who are not already team members
      const { data: users } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          first_name,
          last_name,
          user_roles!inner(role)
        `)
        .eq('user_roles.role', 'membre')
        .not('id', 'in', `(${existingUserIds.join(",") || '00000000-0000-0000-0000-000000000000'})`)
        .order('first_name');

      return users || [];
    },
    enabled: isOpen, // N'exécute la requête que lorsque le dialogue est ouvert
  });

  const addMemberMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { error } = await supabase
        .from("project_members")
        .insert({
          project_id: projectId,
          user_id: values.userId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectMembers", projectId] });
      toast({
        title: "Membre ajouté",
        description: "Le membre a été ajouté à l'équipe avec succès.",
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout du membre.",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    addMemberMutation.mutate(values);
  };

  const filteredUsers = availableUsers?.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleUserSelect = (userId: string) => {
    form.setValue("userId", userId);
    setShowResults(false);
    const selectedUser = availableUsers?.find(user => user.id === userId);
    if (selectedUser) {
      setSearchQuery(`${selectedUser.first_name} ${selectedUser.last_name} (${selectedUser.email})`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un membre</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem className="relative">
                  <FormLabel>Rechercher un utilisateur</FormLabel>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <FormControl>
                      <Input
                        placeholder="Rechercher par nom ou email..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowResults(true);
                        }}
                        className="pl-10"
                        onFocus={() => setShowResults(true)}
                      />
                    </FormControl>
                  </div>
                  {showResults && searchQuery && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredUsers?.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-500">
                          Aucun résultat trouvé
                        </div>
                      ) : (
                        filteredUsers?.map((user) => (
                          <div
                            key={user.id}
                            className={cn(
                              "px-4 py-2 text-sm cursor-pointer hover:bg-gray-100",
                              field.value === user.id && "bg-gray-100"
                            )}
                            onClick={() => handleUserSelect(user.id)}
                          >
                            {user.first_name} {user.last_name} ({user.email})
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={!form.getValues("userId")}>
                Ajouter
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
