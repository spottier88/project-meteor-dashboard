/**
 * @file PresentationSlide.tsx
 * @description Composant de slide individuel reproduisant le design PPTX
 * avec en-tête rouge, grille de sections et informations projet.
 * Affichage plein écran adaptatif avec troncature et bouton loupe pour les contenus longs.
 */

import { useState } from "react";
import { ProjectData } from "@/hooks/use-detailed-projects-data";
import { lifecycleStatusLabels } from "@/types/project";
import { Sun, Cloud, CloudRain, TrendingUp, TrendingDown, Minus, Expand } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionDetailDialog } from "./SectionDetailDialog";

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
      {/* En-tête rouge étendu */}
      <div className="bg-[#CC0000] text-white p-3 flex-shrink-0">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-tight">
              {data.project.title}
              <span className="font-normal text-sm ml-3 opacity-90">
                - {lifecycleStatusLabels[data.project.lifecycle_status]}
              </span>
            </h1>
            {data.project.description && (
              <p className="text-sm opacity-90 mt-1 line-clamp-1">{data.project.description}</p>
            )}
          </div>
          <div className="text-right text-sm flex-shrink-0">
            {data.lastReview?.created_at && (
              <p className="font-medium text-base">{new Date(data.lastReview.created_at).toLocaleDateString("fr-FR")}</p>
            )}
            <p className="opacity-80">
              <span className="font-semibold">CDP: </span>
              {data.project.project_manager_name || "Non défini"}
            </p>
            {data.project.secondary_managers && data.project.secondary_managers.length > 0 && (
              <p className="opacity-80 text-xs">
                <span className="font-semibold">CDP secondaire(s): </span>
                {data.project.secondary_managers.map(sm => sm.name).join(", ")}
              </p>
            )}
            {hierarchyText && (
              <p className="opacity-80 text-xs">{hierarchyText}</p>
            )}
          </div>
        </div>
      </div>

      {/* Grille de contenu - utilise tout l'espace disponible */}
      <div className="flex-1 p-2 flex flex-col gap-1.5 min-h-0 overflow-hidden">
        {/* Première ligne : Situation, Évolution, Situation générale, Fin cible */}
        <div className="grid grid-cols-12 gap-1.5" style={{ height: '20%', minHeight: 0 }}>
          {/* Situation (météo) */}
          <div className="col-span-1">
            <Section title="SITUATION">
              <div className="flex items-center justify-center h-full">
                <WeatherIcon className={`h-10 w-10 ${weatherIcons[weather].color}`} />
              </div>
            </Section>
          </div>

          {/* Évolution */}
          <div className="col-span-1">
            <Section title="ÉVOLUTION">
              <div className="flex items-center justify-center h-full">
                <ProgressIcon className={`h-10 w-10 ${progressIcons[progress].color}`} />
              </div>
            </Section>
          </div>

          {/* Situation générale */}
          <div className="col-span-8">
            <Section 
              title="SITUATION GÉNÉRALE" 
              expandable
              fullContent={
                <p className="whitespace-pre-wrap">
                  {data.lastReview?.comment || "Pas de commentaire"}
                </p>
              }
            >
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
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
        <div className="grid grid-cols-3 gap-1.5" style={{ height: '40%', minHeight: 0 }}>
          <Section 
            title="TÂCHES TERMINÉES" 
            expandable
            fullContent={<TaskListFull tasks={tasksDone} />}
          >
            <TaskList tasks={tasksDone} maxItems={5} />
          </Section>
          <Section 
            title="TÂCHES EN COURS" 
            expandable
            fullContent={<TaskListFull tasks={tasksInProgress} />}
          >
            <TaskList tasks={tasksInProgress} maxItems={5} />
          </Section>
          <Section 
            title="TÂCHES À VENIR" 
            expandable
            fullContent={<TaskListFull tasks={tasksTodo} />}
          >
            <TaskList tasks={tasksTodo} maxItems={5} />
          </Section>
        </div>

        {/* Troisième ligne : Difficultés et Actions */}
        <div className="grid grid-cols-2 gap-1.5" style={{ height: '35%', minHeight: 0 }}>
          <Section 
            title="DIFFICULTÉS EN COURS" 
            expandable
            fullContent={
              data.lastReview?.difficulties ? (
                <p className="whitespace-pre-wrap">{data.lastReview.difficulties}</p>
              ) : data.risks.length > 0 ? (
                <BulletListFull items={data.risks.map((r) => r.description)} />
              ) : (
                <p className="italic">Aucune difficulté signalée</p>
              )
            }
          >
            {data.lastReview?.difficulties ? (
              <p className="text-xs text-muted-foreground line-clamp-4">{data.lastReview.difficulties}</p>
            ) : data.risks.length > 0 ? (
              <BulletList items={data.risks.map((r) => r.description)} maxItems={4} />
            ) : (
              <p className="text-xs text-muted-foreground italic">Aucune difficulté signalée</p>
            )}
          </Section>
          <Section 
            title="ACTIONS CORRECTIVES" 
            expandable
            fullContent={
              data.lastReview?.actions && data.lastReview.actions.length > 0 ? (
                <BulletListFull items={data.lastReview.actions.map((a) => a.description)} />
              ) : (
                <p className="italic">Aucune action définie</p>
              )
            }
          >
            {data.lastReview?.actions && data.lastReview.actions.length > 0 ? (
              <BulletList items={data.lastReview.actions.map((a) => a.description)} maxItems={4} />
            ) : (
              <p className="text-xs text-muted-foreground italic">Aucune action définie</p>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
};

// Composant Section avec titre noir, détection de débordement et bouton loupe
interface SectionProps {
  title: string;
  children: React.ReactNode;
  /** Active la possibilité d'étendre le contenu via un bouton loupe */
  expandable?: boolean;
  /** Contenu complet à afficher dans le dialogue (si différent de children) */
  fullContent?: React.ReactNode;
}

const Section = ({ title, children, expandable = false, fullContent }: SectionProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Afficher le bouton loupe pour toutes les sections expandables
  // (le line-clamp CSS masque le débordement réel, donc on affiche toujours le bouton)
  const showExpandButton = expandable;

  return (
    <>
      <div className="bg-muted/50 rounded overflow-hidden h-full flex flex-col">
        <div className="bg-black text-white text-[10px] font-bold py-0.5 px-1.5 text-center flex-shrink-0 relative">
          {title}
          {showExpandButton && (
            <button
              onClick={() => setIsDialogOpen(true)}
              className="absolute right-1 top-1/2 -translate-y-1/2 hover:bg-white/20 rounded p-0.5 transition-colors"
              title="Voir le contenu complet"
            >
              <Expand className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="p-1.5 flex-1 min-h-0 overflow-hidden">
          {children}
        </div>
      </div>
      {expandable && (
        <SectionDetailDialog
          title={title}
          content={fullContent || children}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </>
  );
};

// Composant liste de tâches avec limite
interface TaskListProps {
  tasks: Array<{ title: string }>;
  maxItems?: number;
}

const TaskList = ({ tasks, maxItems = 5 }: TaskListProps) => {
  if (tasks.length === 0) {
    return <p className="text-xs text-muted-foreground italic">Aucune tâche</p>;
  }

  const displayedTasks = tasks.slice(0, maxItems);
  const remaining = tasks.length - maxItems;

  return (
    <ol className="text-xs space-y-0.5 list-decimal list-inside">
      {displayedTasks.map((task, index) => (
        <li key={index} className="text-muted-foreground leading-tight truncate">
          {task.title}
        </li>
      ))}
      {remaining > 0 && (
        <li className="text-muted-foreground/60 italic list-none">
          +{remaining} autre{remaining > 1 ? 's' : ''}...
        </li>
      )}
    </ol>
  );
};

// Composant liste de tâches complète pour le dialogue
const TaskListFull = ({ tasks }: { tasks: Array<{ title: string }> }) => {
  if (tasks.length === 0) {
    return <p className="italic">Aucune tâche</p>;
  }

  return (
    <ol className="space-y-1 list-decimal list-inside">
      {tasks.map((task, index) => (
        <li key={index} className="leading-relaxed">
          {task.title}
        </li>
      ))}
    </ol>
  );
};

// Composant liste à puces avec limite
interface BulletListProps {
  items: string[];
  maxItems?: number;
}

const BulletList = ({ items, maxItems = 4 }: BulletListProps) => {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground italic">Aucun élément</p>;
  }

  const displayedItems = items.slice(0, maxItems);
  const remaining = items.length - maxItems;

  return (
    <ol className="text-xs space-y-0.5 list-decimal list-inside">
      {displayedItems.map((item, index) => (
        <li key={index} className="text-muted-foreground leading-tight line-clamp-2">
          {item}
        </li>
      ))}
      {remaining > 0 && (
        <li className="text-muted-foreground/60 italic list-none">
          +{remaining} autre{remaining > 1 ? 's' : ''}...
        </li>
      )}
    </ol>
  );
};

// Composant liste à puces complète pour le dialogue
const BulletListFull = ({ items }: { items: string[] }) => {
  if (items.length === 0) {
    return <p className="italic">Aucun élément</p>;
  }

  return (
    <ol className="space-y-2 list-decimal list-inside">
      {items.map((item, index) => (
        <li key={index} className="leading-relaxed">
          {item}
        </li>
      ))}
    </ol>
  );
};
