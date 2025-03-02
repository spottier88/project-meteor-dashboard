
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ParentTaskSelectorProps {
  parentTaskId: string | undefined;
  setParentTaskId: (value: string | undefined) => void;
  projectTasks: Array<{ id: string; title: string }> | undefined;
  tasksLoading: boolean;
}

export const ParentTaskSelector = ({
  parentTaskId,
  setParentTaskId,
  projectTasks,
  tasksLoading
}: ParentTaskSelectorProps) => {
  return (
    <div className="grid gap-2">
      <label htmlFor="parent-task" className="text-sm font-medium">
        Tâche parente (optionnel)
      </label>
      <Select 
        value={parentTaskId || "none"} 
        onValueChange={value => setParentTaskId(value === "none" ? undefined : value)}
        disabled={tasksLoading}
      >
        <SelectTrigger>
          <SelectValue placeholder="Sélectionner une tâche parente (optionnel)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Aucune (tâche de premier niveau)</SelectItem>
          {Array.isArray(projectTasks) && projectTasks.length > 0 ? (
            projectTasks.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.title}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="loading" disabled>
              {tasksLoading ? "Chargement des tâches..." : "Aucune tâche disponible"}
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Une tâche parent aura sa date d'échéance automatiquement ajustée en fonction des sous-tâches.
      </p>
    </div>
  );
};
