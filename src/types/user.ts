export type UserRole = "admin" | "chef_projet" | "manager";

export interface UserProfile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at?: string | null;
}

export interface UserRoleData {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface ManagerAssignment {
  id: string;
  user_id: string;
  pole_id?: string;
  direction_id?: string;
  service_id?: string;
  created_at?: string;
  poles?: {
    id: string;
    name: string;
  };
  directions?: {
    id: string;
    name: string;
  };
  services?: {
    id: string;
    name: string;
  };
}