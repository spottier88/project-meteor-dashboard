/**
 * @component KpiCard
 * @description Carte d'indicateur compact pour les pages de statistiques.
 */
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  accent?: "default" | "success" | "warning" | "danger";
}

const ACCENT_CLASSES: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  default: "text-foreground",
  success: "text-emerald-600",
  warning: "text-amber-600",
  danger: "text-destructive",
};

export const KpiCard = ({ label, value, hint, icon: Icon, accent = "default" }: KpiCardProps) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={`mt-2 text-2xl font-bold ${ACCENT_CLASSES[accent]}`}>{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
      </div>
    </CardContent>
  </Card>
);
