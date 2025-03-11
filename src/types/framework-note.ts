
export interface FrameworkNoteCollection {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: "draft" | "final";
}

export interface FrameworkNoteSection {
  id: string;
  collection_id: string;
  section_type: SectionType;
  content: string;
  created_at: string;
  updated_at: string;
}

export type SectionType = "objectifs" | "contexte" | "cibles" | "resultats_attendus" | "risques" | "enjeux" | "general";

export const SECTION_LABELS: Record<SectionType, string> = {
  objectifs: "Objectifs",
  contexte: "Contexte",
  cibles: "Cibles",
  resultats_attendus: "Résultats attendus",
  risques: "Risques",
  enjeux: "Enjeux",
  general: "Général"
};
