import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerField } from "./DatePickerField";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/user";

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
  ownerId: string;
  setOwnerId: (value: string) => void;
  poleId?: string;
  setPoleId: (value: string) => void;
  directionId?: string;
  setDirectionId: (value: string) => void;
  serviceId?: string;
  setServiceId: (value: string) => void;
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
  setOwnerId,
  poleId,
  setPoleId,
  directionId,
  setDirectionId,
  serviceId,
  setServiceId,
}: ProjectFormFieldsProps) => {
  // Fetch all project managers (users with chef_projet role)
  const { data: projectManagers } = useQuery({
    queryKey: ["projectManagers"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("email");

      if (error) throw error;

      // Filter profiles to only include those with chef_projet role
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("*")
        .eq("role", "chef_projet");

      if (!userRoles) return [];

      return (profiles as UserProfile[]).filter(profile =>
        userRoles.some(ur => ur.user_id === profile.id)
      );
    },
  });

  // Fetch poles
  const { data: poles } = useQuery({
    queryKey: ["poles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poles")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch directions based on selected pole
  const { data: directions } = useQuery({
    queryKey: ["directions", poleId],
    queryFn: async () => {
      if (!poleId) return [];
      const { data, error } = await supabase
        .from("directions")
        .select("*")
        .eq("pole_id", poleId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!poleId,
  });

  // Fetch services based on selected direction
  const { data: services } = useQuery({
    queryKey: ["services", directionId],
    queryFn: async () => {
      if (!directionId) return [];
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("direction_id", directionId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!directionId,
  });

  const handlePoleChange = (value: string) => {
    setPoleId(value);
    setDirectionId("");
    setServiceId("");
  };

  const handleDirectionChange = (value: string) => {
    setPoleId("");
    setDirectionId(value);
    setServiceId("");
  };

  const handleServiceChange = (value: string) => {
    setPoleId("");
    setDirectionId("");
    setServiceId(value);
  };

  return (
    <div className="grid gap-4 py-4">
      <div className="space-y-4">
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
            Chef de projet *
          </label>
          {isAdmin ? (
            <Select value={projectManager} onValueChange={(email) => {
              setProjectManager(email);
              const selectedProfile = projectManagers?.find(pm => pm.email === email);
              if (selectedProfile) {
                setOwnerId(selectedProfile.id);
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un chef de projet" />
              </SelectTrigger>
              <SelectContent>
                {projectManagers?.map((profile) => (
                  profile.email && (
                    <SelectItem key={profile.email} value={profile.email}>
                      {profile.email}
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

        <div className="grid gap-4">
          <label className="text-sm font-medium">Organisation (choisir un seul niveau)</label>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="pole">Pôle</Label>
              <Select value={poleId} onValueChange={handlePoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un pôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun</SelectItem>
                  {poles?.map((pole) => (
                    <SelectItem key={pole.id} value={pole.id}>
                      {pole.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="direction">Direction</Label>
              <Select value={directionId} onValueChange={handleDirectionChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun</SelectItem>
                  {directions?.map((direction) => (
                    <SelectItem key={direction.id} value={direction.id}>
                      {direction.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="service">Service</Label>
              <Select value={serviceId} onValueChange={handleServiceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun</SelectItem>
                  {services?.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
    </div>
  );
};
