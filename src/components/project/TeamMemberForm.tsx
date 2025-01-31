import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";

interface TeamMemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

interface FormValues {
  userId: string;
}

export const TeamMemberForm = ({ isOpen, onClose, projectId }: TeamMemberFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<FormValues>();

  const { data: availableUsers } = useQuery({
    queryKey: ["availableUsers"],
    queryFn: async () => {
      const { data: existingMembers } = await supabase
        .from("project_members")
        .select("user_id")
        .eq("project_id", projectId);

      const existingUserIds = existingMembers?.map(m => m.user_id) || [];

      const { data: users } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name")
        .not("id", "in", `(${existingUserIds.join(",")})`);

      return users || [];
    },
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
                <FormItem>
                  <FormLabel>Utilisateur</FormLabel>
                  <Select onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un utilisateur" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableUsers?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.first_name} {user.last_name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit">Ajouter</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};