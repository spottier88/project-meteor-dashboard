
import pptxgen from "pptxgenjs";
import { ProjectData } from "./types";
import { weatherIcons, progressIcons } from "./constants";
import { pptxStyles, pptxColors } from "./PPTXStyles";
import { lifecycleStatusLabels } from "@/types/project";

export const generateSummarySlide = (pptx: pptxgen, projectsData: ProjectData[]) => {
  const slide = pptx.addSlide({ masterName: "MAIN_MASTER" });
  
  addHeader(slide);
  addSummaryTable(slide, projectsData);
};

const addHeader = (slide: pptxgen.Slide) => {
  slide.addText([
    { text: "Synthèse des projets", options: { bold: true, color: "FFFFFF", fontSize: 24 } },
    { text: "\n" },
    { text: new Date().toLocaleDateString("fr-FR"), options: { color: "FFFFFF", fontSize: 14 } }
  ], { x: 0.5, y: 0, w: 9, h: 0.8 });
};

const addSummaryTable = (slide: pptxgen.Slide, projectsData: ProjectData[]) => {
  const tableRows = [
    [
      { text: "Projet", options: { bold: true, fill: { color: pptxColors.secondary }, color: "FFFFFF" } },
      { text: "Météo", options: { bold: true, fill: { color: pptxColors.secondary }, color: "FFFFFF" } },
      { text: "Évolution", options: { bold: true, fill: { color: pptxColors.secondary }, color: "FFFFFF" } },
      { text: "Commentaire", options: { bold: true, fill: { color: pptxColors.secondary }, color: "FFFFFF" } }
    ],
    ...projectsData.map((data, idx) => [
      { text: data.project.title, options: { fill: { color: idx % 2 === 0 ? "F5F5F5" : "FFFFFF" }, fontSize: 11 } },
      { text: weatherIcons[data.lastReview?.weather || "cloudy"], options: { fill: { color: idx % 2 === 0 ? "F5F5F5" : "FFFFFF" }, fontSize: 11, align: "center" as pptxgen.HAlign } },
      { text: progressIcons[data.lastReview?.progress || "stable"], options: { fill: { color: idx % 2 === 0 ? "F5F5F5" : "FFFFFF" }, fontSize: 11, align: "center" as pptxgen.HAlign } },
      { text: data.lastReview?.comment || "-", options: { fill: { color: idx % 2 === 0 ? "F5F5F5" : "FFFFFF" }, fontSize: 11 } }
    ])
  ];

  slide.addTable(tableRows, {
    x: 0.5,
    y: 1.0,
    w: 9,
    colW: [3, 1, 1, 4],
  });
};

export const generateProjectSlide = (pptx: pptxgen, data: ProjectData) => {
  const slide = pptx.addSlide({ masterName: "MAIN_MASTER" });
  
  addProjectHeader(slide, data);
  addProjectGrid(slide, data);
};

const addProjectHeader = (slide: pptxgen.Slide, data: ProjectData) => {
  slide.addText([
    { text: data.project.title, options: { bold: true, color: "FFFFFF", fontSize: 16 } },
    { text: " - ", options: { color: "FFFFFF", fontSize: 16 } },
    { text: lifecycleStatusLabels[data.project.lifecycle_status], options: { color: "FFFFFF", fontSize: 12, italic: true } },
    { text: "\n" },
    { text: data.project.description || "", options: { color: "FFFFFF", fontSize: 10 } },
    { text: "\n" }
  ], { x: 0, y: 0, w: 8, h: 0.8, align: "left", valign: "top" });

  if (data.lastReview?.created_at) {
    slide.addText(new Date(data.lastReview.created_at).toLocaleDateString("fr-FR"), {
      x: 8, y: 0, h: 0.3, w: 1.5,
      color: "FFFFFF",
      fontSize: 12,
      align: "right"
    });
  }

  // Ajout du chef de projet principal
  slide.addText([
    { text: "Chef de projet: ", options: { bold: true, color: "FFFFFF", fontSize: 8 } },
    { text: data.project.project_manager || "Non défini", options: { color: "FFFFFF", fontSize: 8 } }
  ], { x: 7, y: 0.3, w: 3, h: 0.2, align: "right", valign: "top" });

  // Calcul de la position Y suivante (dépend si on affiche les CDP secondaires)
  const secondaryPMs = data.project.secondary_managers?.map(sm => sm.name).join(", ");
  let nextY = 0.45;

  // Affichage des chefs de projet secondaires (si présents)
  if (secondaryPMs) {
    slide.addText([
      { text: "CDP secondaire(s): ", options: { bold: true, color: "FFFFFF", fontSize: 7 } },
      { text: secondaryPMs, options: { color: "FFFFFF", fontSize: 7 } }
    ], { x: 7, y: nextY, w: 3, h: 0.15, align: "right", valign: "top" });
    nextY = 0.58;
  }

  const hierarchyText = [
    data.project.pole_name,
    data.project.direction_name,
    data.project.service_name
  ].filter(Boolean).join(" / ");

  slide.addText([
    { text: hierarchyText, options: { color: "FFFFFF", fontSize: 8 } }
  ], { x: 7, y: nextY, w: 3, h: 0.2, align: "right", valign: "top" });
};

const addProjectGrid = (slide: pptxgen.Slide, data: ProjectData) => {
  const grid = { x: 0.3, y: 1.0, w: 9, h: 5, columnGap: 0.1, rowGap: 0.1 };
  
  addSituationSection(slide, data, grid);
  addEvolutionSection(slide, data, grid);
  addGeneralSituationSection(slide, data, grid);
  addTargetEndSection(slide, data, grid);
  addTasksSections(slide, data, grid);
  addDifficultiesAndActionsSection(slide, data, grid);
};

const addSituationSection = (slide: pptxgen.Slide, data: ProjectData, grid: any) => {
  addSection(slide, "SITUATION", grid.x, grid.y, 1.5, 1);
  slide.addText(weatherIcons[data.lastReview?.weather || "cloudy"], {
    x: grid.x,
    y: grid.y + 0.3,
    w: 1.5,
    h: 0.7,
    fontSize: 24,
    align: "center",
    valign: "middle"
  });
};

const addEvolutionSection = (slide: pptxgen.Slide, data: ProjectData, grid: any) => {
  addSection(slide, "EVOLUTION", grid.x + 1.6, grid.y, 1.5, 1);
  slide.addText(progressIcons[data.lastReview?.progress || "stable"], {
    x: grid.x + 1.6,
    y: grid.y + 0.3,
    w: 1.5,
    h: 0.7,
    fontSize: 24,
    align: "center",
    valign: "middle"
  });
};

const addGeneralSituationSection = (slide: pptxgen.Slide, data: ProjectData, grid: any) => {
  addSection(slide, "SITUATION GÉNÉRALE", grid.x + 3.2, grid.y, 4.5, 1);
  slide.addText(data.lastReview?.comment || "Pas de commentaire", {
    x: grid.x + 3.2,
    y: grid.y + 0.3,
    w: 4.5,
    h: 0.7,
    fontSize: 11,
    color: "363636",
    align: "left",
    valign: "top"
  });
};

const addTargetEndSection = (slide: pptxgen.Slide, data: ProjectData, grid: any) => {
  addSection(slide, "FIN CIBLE", grid.x + 7.8, grid.y, 1.5, 1);
  const endDate = data.project.end_date 
    ? new Date(data.project.end_date).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : "Non définie";
    
  slide.addText(endDate, {
    x: grid.x + 7.8,
    y: grid.y + 0.3,
    w: 1.5,
    h: 0.6,
    fontSize: 11,
    color: "363636",
    align: "center",
    valign: "middle"
  });
};

const addTasksSections = (slide: pptxgen.Slide, data: ProjectData, grid: any) => {
  const tasksY = grid.y + 1.2;
  const taskBoxHeight = 1.6;
  const titleHeight = 0.3;
  const columnWidth = 3;
  const spacing = 0.1;
  
  // Tâches terminées (1/3 de la largeur)
  addTasksSection(slide, "TÂCHES TERMINÉES", 
    data.tasks.filter(t => t.status === "done"),
    grid.x, tasksY, columnWidth, taskBoxHeight, titleHeight);
  
  // Tâches en cours (1/3 de la largeur)
  addTasksSection(slide, "TÂCHES EN COURS",
    data.tasks.filter(t => t.status === "in_progress"),
    grid.x + columnWidth + spacing, tasksY, columnWidth, taskBoxHeight, titleHeight);
  
  // Tâches à venir (1/3 de la largeur)
  addTasksSection(slide, "TÂCHES À VENIR",
    data.tasks.filter(t => t.status === "todo"),
    grid.x + (columnWidth + spacing) * 2, tasksY, columnWidth, taskBoxHeight, titleHeight);
};

const addDifficultiesAndActionsSection = (slide: pptxgen.Slide, data: ProjectData, grid: any) => {
  const sectionY = grid.y + 3.0;
  const boxHeight = 1.4;
  const titleHeight = 0.3;
  
  // Section Difficultés en cours (remplace Risques identifiés)
  addSection(slide, "DIFFICULTÉS EN COURS", grid.x, sectionY, 4.5, boxHeight);
  
  // Afficher les difficultés si présentes, sinon afficher les risques (rétrocompatibilité)
  if (data.lastReview?.difficulties) {
    slide.addText(data.lastReview.difficulties, {
      x: grid.x + 0.2,
      y: sectionY + titleHeight,
      w: 4.1,
      h: boxHeight - titleHeight,
      fontSize: 10,
      color: "363636",
      valign: "top"
    });
  } else {
    // Fallback sur les risques si pas de difficultés renseignées
    addBulletList(slide, data.risks.map(r => r.description), 
      grid.x + 0.2, sectionY + titleHeight, 4.1, boxHeight - titleHeight);
  }
    
  // Section Actions correctives (inchangée)
  addSection(slide, "ACTIONS CORRECTIVES", grid.x + 4.6, sectionY, 4.7, boxHeight);

  // Récupérer les descriptions des actions correctives s'il y en a
  const actionDescriptions = data.lastReview?.actions?.map(a => a.description) || [];
  
  addBulletList(slide, actionDescriptions, 
    grid.x + 4.8, sectionY + titleHeight, 4.3, boxHeight - titleHeight);
};

const addSection = (slide: pptxgen.Slide, title: string, x: number, y: number, w: number, h: number) => {
  slide.addShape("rect", { x, y, w, h, fill: { color: "F5F5F5" } });
  slide.addText(title, {
    x, y, w, h: 0.3,
    fontSize: 11,
    bold: true,
    color: "FFFFFF",
    fill: { color: "000000" },
    align: "center",
  });
};

const addTasksSection = (
  slide: pptxgen.Slide, 
  title: string, 
  tasks: Array<{ title: string }>,
  x: number, 
  y: number, 
  w: number, 
  h: number,
  titleHeight: number
) => {
  addSection(slide, title, x, y, w, h);
  addBulletList(slide, tasks.map(t => t.title), x + 0.2, y + titleHeight, w - 0.4, h - titleHeight);
};

const addBulletList = (
  slide: pptxgen.Slide, 
  items: string[], 
  x: number, 
  y: number, 
  w: number, 
  h: number
) => {
  if (items.length > 0) {
    slide.addText(items.join("\n"), {
      x, y, w, h,
      fontSize: 10,
      color: "363636",
      valign: "top",
      bullet: { type: "number" }
    });
  } else {
    slide.addText("Aucun élément", {
      x, y, w, h,
      fontSize: 10,
      valign: "top",
      color: "666666"
    });
  }
};
