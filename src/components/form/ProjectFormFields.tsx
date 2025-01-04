import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/user";
import { OrganizationFields } from "./OrganizationFields";
import { BasicProjectFields } from "./BasicProjectFields";

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
  poleId: string;
  setPoleId: (value: string) => void;
  directionId: string;
  setDirectionId: (value: string) => void;
  serviceId: string;
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
  ownerId,
  setOwnerId,
  poleId,
  setPoleId,
  directionId,
  setDirectionId,
  serviceId,
  setServiceId,
}: ProjectFormFieldsProps) => {
  const { data: projectManagers } = useQuery({
    queryKey: ["projectManagers"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("email");

      if (error) throw error;

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

  return (
    <div className="grid gap-4 py-4">
      <BasicProjectFields
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        projectManager={projectManager}
        setProjectManager={setProjectManager}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        priority={priority}
        setPriority={setPriority}
        suiviDgs={suiviDgs}
        setSuiviDgs={setSuiviDgs}
        isAdmin={isAdmin}
      />

      <OrganizationFields
        poleId={poleId}
        setPoleId={setPoleId}
        directionId={directionId}
        setDirectionId={setDirectionId}
        serviceId={serviceId}
        setServiceId={setServiceId}
      />
    </div>
  );
};