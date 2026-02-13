/**
 * @file PresentationSummary.tsx
 * @description Slide de synthèse affichant un tableau récapitulatif
 * de tous les projets avec météo, évolution et commentaire.
 */

import { ProjectData } from "@/hooks/useDetailedProjectsData";
import { Sun, Cloud, CloudRain, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PresentationSummaryProps {
  projects: ProjectData[];
  onProjectClick: (index: number) => void;
}

// Icônes météo
const weatherIcons = {
  sunny: { icon: Sun, color: "text-yellow-500" },
  cloudy: { icon: Cloud, color: "text-gray-500" },
  stormy: { icon: CloudRain, color: "text-red-500" },
};

// Icônes évolution
const progressIcons = {
  better: { icon: TrendingUp, color: "text-green-500" },
  stable: { icon: Minus, color: "text-gray-500" },
  worse: { icon: TrendingDown, color: "text-red-500" },
};

export const PresentationSummary = ({
  projects,
  onProjectClick,
}: PresentationSummaryProps) => {
  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden">
      {/* En-tête rouge */}
      <div className="bg-[#CC0000] text-white p-4 flex-shrink-0">
        <h1 className="text-xl font-bold">Synthèse des projets</h1>
        <p className="text-sm opacity-90">
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Tableau récapitulatif */}
      <div className="flex-1 overflow-auto p-4">
        <Table>
          <TableHeader>
            <TableRow className="bg-black hover:bg-black">
              <TableHead className="text-white font-bold">Projet</TableHead>
              <TableHead className="text-white font-bold text-center w-24">Météo</TableHead>
              <TableHead className="text-white font-bold text-center w-24">Évolution</TableHead>
              <TableHead className="text-white font-bold">Commentaire</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project, index) => {
              const weather = project.lastReview?.weather || "cloudy";
              const progress = project.lastReview?.progress || "stable";
              const WeatherIcon = weatherIcons[weather].icon;
              const ProgressIcon = progressIcons[progress].icon;

              return (
                <TableRow
                  key={project.project.id}
                  className={`cursor-pointer hover:bg-muted/50 ${
                    index % 2 === 0 ? "bg-muted/20" : ""
                  }`}
                  onClick={() => onProjectClick(index)}
                >
                  <TableCell className="font-medium">
                    {project.project.title}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <WeatherIcon
                        className={`h-6 w-6 ${weatherIcons[weather].color}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <ProgressIcon
                        className={`h-6 w-6 ${progressIcons[progress].color}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-md truncate">
                    {project.lastReview?.comment || "-"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Légende */}
        <div className="mt-6 flex flex-wrap gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="font-medium">Météo :</span>
            <div className="flex items-center gap-1">
              <Sun className="h-4 w-4 text-yellow-500" />
              <span>Ensoleillé</span>
            </div>
            <div className="flex items-center gap-1">
              <Cloud className="h-4 w-4 text-gray-500" />
              <span>Nuageux</span>
            </div>
            <div className="flex items-center gap-1">
              <CloudRain className="h-4 w-4 text-red-500" />
              <span>Orageux</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-medium">Évolution :</span>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>Amélioration</span>
            </div>
            <div className="flex items-center gap-1">
              <Minus className="h-4 w-4 text-gray-500" />
              <span>Stable</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span>Dégradation</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <p className="mt-4 text-sm text-muted-foreground italic">
          Cliquez sur un projet pour accéder à sa fiche détaillée, ou utilisez les flèches pour naviguer.
        </p>
      </div>
    </div>
  );
};
