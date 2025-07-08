
export interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  strategic_objectives: string | null;
  budget_total: number | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  created_by: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface PortfolioWithStats extends Portfolio {
  project_count: number;
  total_completion: number;
  average_completion: number;
}

export interface PortfolioFormData {
  name: string;
  description?: string;
  strategic_objectives?: string;
  budget_total?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
}
