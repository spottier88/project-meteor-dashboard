import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, History, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectStatus } from "../ProjectCard";
import { StatusIcon } from "./StatusIcon";

interface ProjectCardHeaderProps {
  title: string;
  status: ProjectStatus;
  suivi_dgs?: boolean;
  onEdit: (id: string) => void;
  onViewHistory: (id: string, title: string) => void;
  id: string;
}

export const ProjectCardHeader = ({
  title,
  status,
  suivi_dgs,
  onEdit,
  onViewHistory,
  id,
}: ProjectCardHeaderProps) => {
  return (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="flex items-center gap-2">
        {suivi_dgs && (
          <Star className="h-4 w-4 text-yellow-500" aria-label="Suivi DGS" />
        )}
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(id);
          }}
          className="h-8 w-8"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onViewHistory(id, title);
          }}
          className="h-8 w-8"
        >
          <History className="h-4 w-4" />
        </Button>
        <StatusIcon status={status} />
      </div>
    </CardHeader>
  );
};