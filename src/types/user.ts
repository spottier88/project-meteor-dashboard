import { ProjectStatus, ProgressStatus } from "./project";

export type UserRole = "admin" | "chef_projet" | "manager" | "membre";

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

export interface HierarchyAssignment {
  id: string;
  user_id: string | null;
  entity_id: string;
  entity_type: EntityType;
  created_at?: string;
}

export interface HierarchyAssignmentWithDetails extends HierarchyAssignment {
  entity_details: {
    name: string;
  };
}

export interface HierarchyPath {
  id: string;
  pole_id: string | null;
  direction_id: string | null;
  service_id: string | null;
  path_string: string;
  created_at?: string;
}

export interface ManagerPathAssignment {
  id: string;
  user_id: string | null;
  path_id: string;
  created_at?: string;
}

export interface ManagerAssignment {
  id: string;
  user_id: string | null;
  entity_id: string;
  entity_type: string;
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
  last_review_date: string | null;
  project_manager?: string | null;
  owner_id?: string | null;
  pole_id?: string | null;
  direction_id?: string | null;
  service_id?: string | null;
  created_at?: string | null;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  priority?: string | null;
  suivi_dgs?: boolean | null;
  completion?: number;
}
