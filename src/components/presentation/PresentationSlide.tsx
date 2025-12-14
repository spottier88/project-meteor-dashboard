/**
 * @file PresentationSlide.tsx
 * @description Composant de slide individuel reproduisant le design PPTX
 * avec en-tête rouge, grille de sections et informations projet.
 * Affichage plein écran adaptatif sans troncature de texte ni de listes.
 */

import { ProjectData } from "@/hooks/use-detailed-projects-data";
import { lifecycleStatusLabels } from "@/types/project";
import { Sun, Cloud, CloudRain, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

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
      {/* En-tête rouge compact */}
      <div className="bg-[#CC0000] text-white p-2 flex-shrink-0">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold leading-tight">
              {data.project.title}
              <span className="font-normal text-xs ml-2 opacity-90">
                - {lifecycleStatusLabels[data.project.lifecycle_status]}
              </span>
            </h1>
            {data.project.description && (
              <p className="text-xs opacity-90 mt-0.5">{data.project.description}</p>
            )}
          </div>
          <div className="text-right text-xs flex-shrink-0">
            {data.lastReview?.created_at && (
              <p className="font-medium">{new Date(data.lastReview.created_at).toLocaleDateString("fr-FR")}</p>
            )}
            <p className="opacity-80">
              <span className="font-semibold">CDP: </span>
              {data.project.project_manager || "Non défini"}
            </p>
            {hierarchyText && (
              <p className="opacity-80 text-[10px]">{hierarchyText}</p>
            )}
          </div>
        </div>
      </div>

      {/* Grille de contenu - utilise tout l'espace disponible */}
      <div className="flex-1 p-2 flex flex-col gap-1.5 min-h-0 overflow-hidden">
        {/* Première ligne : Situation, Évolution, Situation générale, Fin cible */}
        <div className="grid grid-cols-12 gap-1.5 flex-shrink-0" style={{ height: '15%' }}>
          {/* Situation (météo) */}
          <div className="col-span-1">
            <Section title="SITUATION">
              <div className="flex items-center justify-center h-full">
                <WeatherIcon className={`h-8 w-8 ${weatherIcons[weather].color}`} />
              </div>
            </Section>
          </div>

          {/* Évolution */}
          <div className="col-span-1">
            <Section title="ÉVOLUTION">
              <div className="flex items-center justify-center h-full">
                <ProgressIcon className={`h-8 w-8 ${progressIcons[progress].color}`} />
              </div>
            </Section>
          </div>

          {/* Situation générale */}
          <div className="col-span-8">
            <Section title="SITUATION GÉNÉRALE" scrollable>
              <p className="text-xs text-muted-foreground">
                {data.lastReview?.comment || "Pas de commentaire"}
              </p>
            </Section>
          </div>

          {/* Fin cible */}
          <div className="col-span-2">
            <Section title="FIN CIBLE">
              <div className="flex items-center justify-center h-full">
                <p className="text-xs font-medium text-center">
                  {formatDate(data.project.end_date)}
                </p>
              </div>
            </Section>
          </div>
        </div>

        {/* Deuxième ligne : Tâches - occupe 45% de l'espace */}
        <div className="grid grid-cols-3 gap-1.5 flex-1 min-h-0" style={{ height: '45%' }}>
          <Section title="TÂCHES TERMINÉES" scrollable>
            <TaskList tasks={tasksDone} />
          </Section>
          <Section title="TÂCHES EN COURS" scrollable>
            <TaskList tasks={tasksInProgress} />
          </Section>
          <Section title="TÂCHES À VENIR" scrollable>
            <TaskList tasks={tasksTodo} />
          </Section>
        </div>

        {/* Troisième ligne : Difficultés et Actions - occupe le reste */}
        <div className="grid grid-cols-2 gap-1.5 flex-1 min-h-0" style={{ height: '40%' }}>
          <Section title="DIFFICULTÉS EN COURS" scrollable>
            {data.lastReview?.difficulties ? (
              <p className="text-xs text-muted-foreground">{data.lastReview.difficulties}</p>
            ) : data.risks.length > 0 ? (
              <BulletList items={data.risks.map((r) => r.description)} />
            ) : (
              <p className="text-xs text-muted-foreground italic">Aucune difficulté signalée</p>
            )}
          </Section>
          <Section title="ACTIONS CORRECTIVES" scrollable>
            {data.lastReview?.actions && data.lastReview.actions.length > 0 ? (
              <BulletList items={data.lastReview.actions.map((a) => a.description)} />
            ) : (
              <p className="text-xs text-muted-foreground italic">Aucune action définie</p>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
};

// Composant Section avec titre noir et scroll optionnel
interface SectionProps {
  title: string;
  children: React.ReactNode;
  scrollable?: boolean;
}

const Section = ({ title, children, scrollable = false }: SectionProps) => (
  <div className="bg-muted/50 rounded overflow-hidden h-full flex flex-col">
    <div className="bg-black text-white text-[10px] font-bold py-0.5 px-1.5 text-center flex-shrink-0">
      {title}
    </div>
    <div className={cn(
      "p-1.5 flex-1 min-h-0",
      scrollable && "overflow-y-auto"
    )}>
      {children}
    </div>
  </div>
);

// Composant liste de tâches - affiche toutes les tâches sans limite
interface TaskListProps {
  tasks: Array<{ title: string }>;
}

const TaskList = ({ tasks }: TaskListProps) => {
  if (tasks.length === 0) {
    return <p className="text-xs text-muted-foreground italic">Aucune tâche</p>;
  }

  return (
    <ol className="text-xs space-y-0.5 list-decimal list-inside">
      {tasks.map((task, index) => (
        <li key={index} className="text-muted-foreground leading-tight">
          {task.title}
        </li>
      ))}
    </ol>
  );
};

// Composant liste à puces - affiche tous les éléments sans limite
interface BulletListProps {
  items: string[];
}

const BulletList = ({ items }: BulletListProps) => {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground italic">Aucun élément</p>;
  }

  return (
    <ol className="text-xs space-y-0.5 list-decimal list-inside">
      {items.map((item, index) => (
        <li key={index} className="text-muted-foreground leading-tight">
          {item}
        </li>
      ))}
    </ol>
  );
};
