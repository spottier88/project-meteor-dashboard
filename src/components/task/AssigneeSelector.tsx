
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";

interface AssigneeSelectorProps {
  assignee: string;
  setAssignee: (value: string) => void;
  assignmentMode: "free" | "member";
  setAssignmentMode: (value: "free" | "member") => void;
  projectMembers: Array<{
    user_id: string;
    profiles: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
    }
  }> | null | undefined;
}

export const AssigneeSelector = ({
  assignee,
  setAssignee,
  assignmentMode,
  setAssignmentMode,
  projectMembers
}: AssigneeSelectorProps) => {
  // Définir automatiquement le mode "member" si des membres sont disponibles
  useEffect(() => {
    if (projectMembers && projectMembers.length > 0 && !assignee) {
      setAssignmentMode("member");
    }
  }, [projectMembers, assignee, setAssignmentMode]);

  // Afficher un message de debug dans la console
  useEffect(() => {
    if (projectMembers) {
      console.log(`AssigneeSelector: ${projectMembers.length} membres disponibles`, 
        projectMembers.map(m => `${m.profiles.first_name} ${m.profiles.last_name} (${m.profiles.email})`));
    }
  }, [projectMembers]);

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">
        Responsable
      </label>
      <Tabs value={assignmentMode} onValueChange={(value: "free" | "member") => setAssignmentMode(value)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="free">Saisie libre</TabsTrigger>
          <TabsTrigger value="member">Membre du projet</TabsTrigger>
        </TabsList>
        <TabsContent value="free">
          <Input
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="Nom du responsable"
          />
        </TabsContent>
        <TabsContent value="member">
          <Select
            value={assignee}
            onValueChange={setAssignee}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un membre" />
            </SelectTrigger>
            <SelectContent>
              {projectMembers?.map((member) => (
                <SelectItem key={member.user_id} value={member.profiles.email}>
                  {member.profiles.first_name} {member.profiles.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TabsContent>
      </Tabs>
    </div>
  );
};
