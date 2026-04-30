/**
 * @file custom-types.ts
 * @description Types personnalisés pour les tables Supabase non présentes
 * dans les types auto-générés (types.ts).
 */

/**
 * Représente un enregistrement de la table `framing_export_templates`.
 * Cette table n'est pas incluse dans les types auto-générés par Supabase CLI.
 */
export interface FramingExportTemplate {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  file_name: string;
  is_default: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Payload d'insertion pour `framing_export_templates`.
 */
export interface FramingExportTemplateInsert {
  title: string;
  description?: string | null;
  file_path: string;
  file_name: string;
  is_default?: boolean;
  is_active?: boolean;
  created_by?: string | null;
}

/**
 * Payload de mise à jour pour `framing_export_templates`.
 */
export interface FramingExportTemplateUpdate {
  title?: string;
  description?: string | null;
  file_path?: string;
  file_name?: string;
  is_default?: boolean;
  is_active?: boolean;
  updated_at?: string;
}
