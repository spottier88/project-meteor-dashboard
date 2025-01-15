import { ProjectStatus, ProgressStatus } from "./project";

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

export type EntityType = 'pole' | 'direction' | 'service';

export interface ManagerAssignment {
  id: string;
  user_id: string | null;
  entity_id: string;
  entity_type: EntityType;
  created_at?: string;
}

export interface ManagerAssignmentWithDetails extends ManagerAssignment {
  entity_details: {
    name: string;
  };
}

export interface Project {
  id: string;
  title: string;
  status: ProjectStatus | null;
  progress: ProgressStatus | null;
  lastReviewDate: string | null;
  project_manager?: string;
  owner_id?: string;
  pole_id?: string;
  direction_id?: string;
  service_id?: string;
}