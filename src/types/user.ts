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
  user_id: string | null;
  entity_id: string;
  entity_type: 'pole' | 'direction' | 'service';
  created_at?: string;
}

export interface ManagerAssignmentWithDetails extends ManagerAssignment {
  entity_details: {
    name: string;
  };
}