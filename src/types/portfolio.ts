
export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  strategic_objectives?: string;
  budget_total?: number;
  start_date?: string;
  end_date?: string;
  status: 'actif' | 'suspendu' | 'termine';
  created_by: string;
  created_at: string;
  updated_at: string;
  project_count?: number;
  completed_projects?: number;
  average_completion?: number;
}

export interface PortfolioManager {
  id: string;
  portfolio_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'viewer';
  created_at: string;
}

export interface CreatePortfolioData {
  name: string;
  description?: string;
  strategic_objectives?: string;
  budget_total?: number;
  start_date?: string;
  end_date?: string;
  status?: 'actif' | 'suspendu' | 'termine';
}

export interface UpdatePortfolioData extends Partial<CreatePortfolioData> {
  id: string;
}
