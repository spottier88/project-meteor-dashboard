import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerField } from "./DatePickerField";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProjectFormFieldsProps {
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  projectManager: string;
  setProjectManager: (value: string) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  priority: string;
  setPriority: (value: string) => void;
  suiviDgs: boolean;
  setSuiviDgs: (value: boolean) => void;
  isAdmin: boolean;
}

interface Profile {
  email: string | null;
  role: 'admin' | 'chef_projet';
}

export const ProjectFormFields = ({
  title,
  setTitle,
  description,
  setDescription,
  projectManager,
  setProjectManager,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  priority,
  setPriority,
  suiviDgs,
  setSuiviDgs,
  isAdmin,
}: ProjectFormFieldsProps) => {
  // Fetch all users who are either admin or chef_projet
  const { data: profiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("email, role")
        .not("email", "is", null);

      if (error) throw error;
      return data as Profile[];
    },
  });

  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <label htmlFor="title" className="text-sm font-medium">
          Titre *
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nom du projet"
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description du projet"
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="project-manager" className="text-sm font-medium">
          Chef de projet
        </label>
        {isAdmin ? (
          <Select value={projectManager} onValueChange={setProjectManager}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un chef de projet" />
            </SelectTrigger>
            <SelectContent>
              {profiles?.map((profile) => (
                profile.email && (
                  <SelectItem key={profile.email} value={profile.email}>
                    {profile.email} {profile.role === 'admin' ? '(Admin)' : ''}
                  </SelectItem>
                )
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="project-manager"
            value={projectManager}
            readOnly
            className="bg-gray-100"
          />
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <DatePickerField
          label="Date de début"
          value={startDate}
          onChange={setStartDate}
        />
        <DatePickerField
          label="Date de fin"
          value={endDate}
          onChange={setEndDate}
          minDate={startDate}
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="priority" className="text-sm font-medium">
          Priorité
        </label>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">Haute</SelectItem>
            <SelectItem value="medium">Moyenne</SelectItem>
            <SelectItem value="low">Basse</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="suivi-dgs"
          checked={suiviDgs}
          onCheckedChange={setSuiviDgs}
        />
        <Label htmlFor="suivi-dgs">Suivi DGS</Label>
      </div>
    </div>
  );
};