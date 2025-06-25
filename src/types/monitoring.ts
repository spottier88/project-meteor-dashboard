export type MonitoringLevel = 'none' | 'dgs' | 'pole' | 'direction';

export interface ProjectMonitoring {
  id: string;
  project_id: string;
  monitoring_level: MonitoringLevel;
  monitoring_entity_id: string | null;
  created_at?: string;
}