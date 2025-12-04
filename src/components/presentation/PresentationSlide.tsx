/**
 * @file PresentationSlide.tsx
 * @description Composant de slide individuel reproduisant le design PPTX
 * avec en-tête rouge, grille de sections et informations projet.
 */

import { ProjectData } from "@/hooks/use-detailed-projects-data";
import { lifecycleStatusLabels } from "@/types/project";
import { Sun, Cloud, CloudRain, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PresentationSlideProps {
  data: ProjectData;
}

// Icônes météo
const weatherIcons = {
  sunny: { icon: Sun, color: "text-yellow-500", label: "Ensoleillé" },
  cloudy: { icon: Cloud, color: "text-gray-500", label: "Nuageux" },
  stormy: { icon: CloudRain, color: "text-red-500", label: "Orageux" },
};

// Icônes évolution
const progressIcons = {
  better: { icon: TrendingUp, color: "text-green-500", label: "En amélioration" },
  stable: { icon: Minus, color: "text-gray-500", label: "Stable" },
  worse: { icon: TrendingDown, color: "text-red-500", label: "En dégradation" },
};

export const PresentationSlide = ({ data }: PresentationSlideProps) => {
  const weather = data.lastReview?.weather || "cloudy";
  const progress = data.lastReview?.progress || "stable";
  const WeatherIcon = weatherIcons[weather].icon;
  const ProgressIcon = progressIcons[progress].icon;

  // Formatage de la date
  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return "Non définie";
    return new Date(dateStr).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  };

  // Construction de la hiérarchie
  const hierarchyText = [
    data.project.pole_name,
    data.project.direction_name,
    data.project.service_name,
  ].filter(Boolean).join(" / ");

  // Filtrage des tâches par statut
  const tasksDone = data.tasks.filter((t) => t.status === "done");
  const tasksInProgress = data.tasks.filter((t) => t.status === "in_progress");
  const tasksTodo = data.tasks.filter((t) => t.status === "todo");

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden">
      {/* En-tête rouge */}
      <div className="bg-[#CC0000] text-white p-4 flex-shrink-0">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-xl font-bold">
              {data.project.title}
              <span className="font-normal text-sm ml-2 opacity-90">
                - {lifecycleStatusLabels[data.project.lifecycle_status]}
              </span>
            </h1>
            {data.project.description && (
              <p className="text-sm opacity-90 mt-1 line-clamp-2">{data.project.description}</p>
            )}
          </div>
          <div className="text-right text-sm flex-shrink-0 ml-4">
            {data.lastReview?.created_at && (
              <p>{new Date(data.lastReview.created_at).toLocaleDateString("fr-FR")}</p>
            )}
            <p className="text-xs opacity-80">
              <span className="font-semibold">Chef de projet: </span>
              {data.project.project_manager || "Non défini"}
            </p>
            {hierarchyText && (
              <p className="text-xs opacity-80">{hierarchyText}</p>
            )}
          </div>
        </div>
      </div>

      {/* Grille de contenu */}
      <div className="flex-1 p-4 overflow-auto">
        {/* Première ligne : Situation, Évolution, Situation générale, Fin cible */}
        <div className="grid grid-cols-12 gap-2 mb-2">
          {/* Situation (météo) */}
          <div className="col-span-2">
            <Section title="SITUATION">
              <div className="flex items-center justify-center h-full">
                <WeatherIcon className={`h-12 w-12 ${weatherIcons[weather].color}`} />
              </div>
            </Section>
          </div>

          {/* Évolution */}
          <div className="col-span-2">
            <Section title="ÉVOLUTION">
              <div className="flex items-center justify-center h-full">
                <ProgressIcon className={`h-12 w-12 ${progressIcons[progress].color}`} />
              </div>
            </Section>
          </div>

          {/* Situation générale */}
          <div className="col-span-6">
            <Section title="SITUATION GÉNÉRALE">
              <p className="text-sm text-muted-foreground line-clamp-4">
                {data.lastReview?.comment || "Pas de commentaire"}
              </p>
            </Section>
          </div>

          {/* Fin cible */}
          <div className="col-span-2">
            <Section title="FIN CIBLE">
              <div className="flex items-center justify-center h-full">
                <p className="text-sm font-medium text-center">
                  {formatDate(data.project.end_date)}
                </p>
              </div>
            </Section>
          </div>
        </div>

        {/* Deuxième ligne : Tâches */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <Section title="TÂCHES TERMINÉES">
            <TaskList tasks={tasksDone} />
          </Section>
          <Section title="TÂCHES EN COURS">
            <TaskList tasks={tasksInProgress} />
          </Section>
          <Section title="TÂCHES À VENIR">
            <TaskList tasks={tasksTodo} />
          </Section>
        </div>

        {/* Troisième ligne : Difficultés et Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Section title="DIFFICULTÉS EN COURS">
            {data.lastReview?.difficulties ? (
              <p className="text-sm text-muted-foreground">{data.lastReview.difficulties}</p>
            ) : data.risks.length > 0 ? (
              <BulletList items={data.risks.map((r) => r.description)} />
            ) : (
              <p className="text-sm text-muted-foreground italic">Aucune difficulté signalée</p>
            )}
          </Section>
          <Section title="ACTIONS CORRECTIVES">
            {data.lastReview?.actions && data.lastReview.actions.length > 0 ? (
              <BulletList items={data.lastReview.actions.map((a) => a.description)} />
            ) : (
              <p className="text-sm text-muted-foreground italic">Aucune action définie</p>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
};

// Composant Section avec titre noir
interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section = ({ title, children }: SectionProps) => (
  <div className="bg-muted/50 rounded overflow-hidden h-full flex flex-col">
    <div className="bg-black text-white text-xs font-bold py-1 px-2 text-center">
      {title}
    </div>
    <div className="p-2 flex-1">{children}</div>
  </div>
);

// Composant liste de tâches
interface TaskListProps {
  tasks: Array<{ title: string }>;
}

const TaskList = ({ tasks }: TaskListProps) => {
  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground italic">Aucune tâche</p>;
  }

  return (
    <ol className="text-sm space-y-1 list-decimal list-inside">
      {tasks.slice(0, 5).map((task, index) => (
        <li key={index} className="text-muted-foreground truncate">
          {task.title}
        </li>
      ))}
      {tasks.length > 5 && (
        <li className="text-muted-foreground italic">+{tasks.length - 5} autres...</li>
      )}
    </ol>
  );
};

// Composant liste à puces
interface BulletListProps {
  items: string[];
}

const BulletList = ({ items }: BulletListProps) => {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground italic">Aucun élément</p>;
  }

  return (
    <ol className="text-sm space-y-1 list-decimal list-inside">
      {items.slice(0, 4).map((item, index) => (
        <li key={index} className="text-muted-foreground">
          {item}
        </li>
      ))}
      {items.length > 4 && (
        <li className="text-muted-foreground italic">+{items.length - 4} autres...</li>
      )}
    </ol>
  );
};
