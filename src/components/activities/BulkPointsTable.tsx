import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ActivityType } from "@/types/activity";

/**
 * Interface pour une entrée de point en masse
 */
export interface BulkPointEntry {
  id: string;
  project_id: string;
  project_title: string;
  activity_type?: string;
  points: number;
  description?: string;
  pole_name?: string;
  direction_name?: string;
  service_name?: string;
}

interface BulkPointsTableProps {
  entries: BulkPointEntry[];
  activityTypes: ActivityType[];
  updateEntry: (id: string, field: string, value: any) => void;
  quotaRemaining: number;
}

/**
 * Tableau de saisie en masse des points sur les projets
 */
export const BulkPointsTable: React.FC<BulkPointsTableProps> = ({
  entries,
  activityTypes,
  updateEntry,
  quotaRemaining,
}) => {
  // Calculer le total des points saisis
  const totalPoints = entries.reduce((sum, entry) => sum + (entry.points || 0), 0);
  const quotaExceeded = totalPoints > quotaRemaining;

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Projet</TableHead>
              <TableHead className="w-[20%]">Type d'activité</TableHead>
              <TableHead className="w-[15%]">Points *</TableHead>
              <TableHead className="w-[35%]">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Aucun projet trouvé avec les filtres appliqués
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{entry.project_title}</div>
                      <div className="text-xs text-muted-foreground">
                        {entry.pole_name && <span>{entry.pole_name}</span>}
                        {entry.direction_name && (
                          <span>
                            {entry.pole_name && " > "}
                            {entry.direction_name}
                          </span>
                        )}
                        {entry.service_name && (
                          <span>
                            {(entry.pole_name || entry.direction_name) && " > "}
                            {entry.service_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={entry.activity_type || "none"}
                      onValueChange={(value) =>
                        updateEntry(entry.id, "activity_type", value === "none" ? undefined : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">Aucun</span>
                        </SelectItem>
                        {activityTypes.map((type) => (
                          <SelectItem key={type.code} value={type.code}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: type.color }}
                              />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={entry.points || ""}
                      onChange={(e) =>
                        updateEntry(entry.id, "points", parseInt(e.target.value, 10) || 0)
                      }
                      placeholder="0"
                      className={entry.points > 0 ? "font-medium" : ""}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      value={entry.description || ""}
                      onChange={(e) => updateEntry(entry.id, "description", e.target.value)}
                      placeholder="Description..."
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer avec total et quota */}
      <div className="flex justify-between items-center p-4 rounded-md border bg-muted/50">
        <div className="space-y-1">
          <div className="text-sm font-medium">Total des points saisis</div>
          <div className="text-xs text-muted-foreground">
            Quota hebdomadaire : {quotaRemaining} points restants
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{totalPoints}</span>
          <Badge variant={quotaExceeded ? "destructive" : totalPoints > quotaRemaining * 0.8 ? "default" : "secondary"}>
            {quotaExceeded
              ? `Dépassement de ${totalPoints - quotaRemaining} pts`
              : `${quotaRemaining - totalPoints} pts restants`}
          </Badge>
        </div>
      </div>
    </div>
  );
};
