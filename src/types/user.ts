export type UserRole = "admin" | "chef_projet";

export interface UserProfile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
}

export interface UserRoleData {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}