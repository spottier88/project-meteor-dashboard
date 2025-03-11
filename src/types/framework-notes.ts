
export type FrameworkNoteSectionType = 
  | 'objectifs'
  | 'contexte'
  | 'perimetre'
  | 'parties_prenantes'
  | 'risques'
  | 'budget'
  | 'planning'
  | 'organisation'
  | 'livrables'
  | 'communication'
  | 'decision';

export type FrameworkNoteStatus = 'draft' | 'published' | 'archived';

export interface FrameworkNoteSection {
  id: string;
  collection_id: string;
  section_type: FrameworkNoteSectionType;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface FrameworkNoteCollection {
  id: string;
  title: string;
  description: string | null;
  status: FrameworkNoteStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  sections?: FrameworkNoteSection[];
}

export interface ProjectFrameworkNote {
  id: string;
  project_id: string;
  content: Record<string, any>; // JSON content
  version: number;
  status: FrameworkNoteStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
