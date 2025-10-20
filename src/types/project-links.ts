/**
 * @file project-links.ts
 * @description Types TypeScript pour le système de liaison de projets
 */

export interface ProjectLink {
  id: string;
  master_project_id: string;
  linked_project_id: string;
  created_at: string;
  created_by: string | null;
}

export interface LinkedProject {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  lifecycle_status: string;
  project_manager: string | null;
  created_at: string;
}
