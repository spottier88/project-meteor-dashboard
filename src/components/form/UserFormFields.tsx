import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { UserRole } from "@/types/user";

interface UserFormFieldsProps {
  firstName: string;
  setFirstName: (value: string) => void;
  lastName: string;
  setLastName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  roles: UserRole[];
  setRoles: (value: UserRole[]) => void;
  isEditMode: boolean;
}

export const UserFormFields = ({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  roles,
  setRoles,
  isEditMode,
}: UserFormFieldsProps) => {
  const handleRoleToggle = (role: UserRole) => {
    if (roles.includes(role)) {
      setRoles(roles.filter(r => r !== role));
    } else {
      setRoles([...roles, role]);
    }
  };

  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          readOnly={isEditMode}
          className={isEditMode ? "bg-gray-100" : ""}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="firstName">Prénom</Label>
        <Input
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="lastName">Nom</Label>
        <Input
          id="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label>Rôles</Label>
        <div className="flex flex-col gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="admin"
              checked={roles.includes("admin")}
              onCheckedChange={() => handleRoleToggle("admin")}
            />
            <Label htmlFor="admin" className="font-normal">
              Administrateur
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="chef_projet"
              checked={roles.includes("chef_projet")}
              onCheckedChange={() => handleRoleToggle("chef_projet")}
            />
            <Label htmlFor="chef_projet" className="font-normal">
              Chef de projet
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="manager"
              checked={roles.includes("manager")}
              onCheckedChange={() => handleRoleToggle("manager")}
            />
            <Label htmlFor="manager" className="font-normal">
              Manager
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
};