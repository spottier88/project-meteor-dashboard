/**
 * @component CartographyGroupDetailsSheet
 * @description Panneau latéral listant les projets d'un groupe sélectionné dans
 * la matrice agrégée. Permet de naviguer vers chaque fiche projet.
 */
import { useNavigate } from "react-router";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { CartographyProject } from "@/hooks/useCartographyData";
import { lifecycleStatusLabels } from "@/types/project";
import { resetInteractionLocks } from "@/utils/resetInteractionLocks";

interface CartographyGroupDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupLabel: string;
  projects: CartographyProject[];
}

const WEATHER_ICON: Record<string, string> = { sunny: "☀", cloudy: "☁", stormy: "⛈" };

export const CartographyGroupDetailsSheet = ({
  open,
  onOpenChange,
  groupLabel,
  projects,
}: CartographyGroupDetailsSheetProps) => {
  const navigate = useNavigate();

  const avg =
    projects.length > 0
      ? Math.round(projects.reduce((s, p) => s + p.completion, 0) / projects.length)
      : 0;
  const innovCount = projects.filter((p) => p.is_innovative).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-[420px] sm:max-w-[480px] overflow-y-auto"
        onCloseAutoFocus={() => resetInteractionLocks()}
      >
        <SheetHeader>
          <SheetTitle>{groupLabel}</SheetTitle>
          <SheetDescription>
            {projects.length} projet{projects.length > 1 ? "s" : ""} · avancement moyen {avg}%
            {innovCount > 0 && ` · ${innovCount} innovant${innovCount > 1 ? "s" : ""}`}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onOpenChange(false);
                void navigate(`/projects/${p.id}`);
              }}
              className="w-full text-left rounded-md border bg-card hover:bg-accent transition p-3 space-y-1"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium text-sm flex items-center gap-1">
                  {p.is_innovative && <span>✨</span>}
                  {p.title}
                </div>
                <span className="text-lg leading-none">{p.weather ? WEATHER_ICON[p.weather] : ""}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{lifecycleStatusLabels[p.lifecycle_status]}</Badge>
                <span>{p.completion}%</span>
                {p.direction_name && <span>· {p.direction_name}</span>}
              </div>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
