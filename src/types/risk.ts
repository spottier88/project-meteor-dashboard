export type RiskProbability = "low" | "medium" | "high";
export type RiskSeverity = "low" | "medium" | "high";
export type RiskStatus = "open" | "in_progress" | "resolved";

export interface Risk {
  id: string;
  description: string;
  probability: RiskProbability;
  severity: RiskSeverity;
  status: RiskStatus;
  mitigation_plan?: string;
}