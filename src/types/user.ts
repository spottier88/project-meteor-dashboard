export type UserRole = "admin" | "chef_projet" | "manager" | "membre" | "time_tracker" | "portfolio_manager" | "quality_manager";

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

export interface AccessibleOrganization {
  id: string;
  name: string;
}

export interface AccessibleOrganizations {
  poles: AccessibleOrganization[];
  directions: AccessibleOrganization[];
  services: AccessibleOrganization[];
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

