
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

  const hierarchyText = [
    data.project.pole_name,
    data.project.direction_name,
    data.project.service_name
  ].filter(Boolean).join(" / ");

  slide.addText([
    { text: hierarchyText, options: { color: "FFFFFF", fontSize: 8 } }
  ], { x: 7, y: 0.5, w: 3, h: 0.2, align: "right", valign: "top" });
};

const addProjectGrid = (slide: pptxgen.Slide, data: ProjectData) => {
  const grid = { x: 0.3, y: 1.0, w: 9, h: 5, columnGap: 0.1, rowGap: 0.1 };
  
  addSituationSection(slide, data, grid);
  addEvolutionSection(slide, data, grid);
  addGeneralSituationSection(slide, data, grid);
  addTargetEndSection(slide, data, grid);
  addTasksSections(slide, data, grid);
  addRisksSection(slide, data, grid);
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

const addRisksSection = (slide: pptxgen.Slide, data: ProjectData, grid: any) => {
  const risksY = grid.y + 3.0;
  const riskBoxHeight = 1.4;
  const titleHeight = 0.3;
  
  addSection(slide, "RISQUES IDENTIFIÉS", grid.x, risksY, 4.5, riskBoxHeight);
  addBulletList(slide, data.risks.map(r => r.description), 
    grid.x + 0.2, risksY + titleHeight, 4.1, riskBoxHeight - titleHeight);
    
  addSection(slide, "ACTIONS CORRECTIVES", grid.x + 4.6, risksY, 4.7, riskBoxHeight);
  addBulletList(slide, data.lastReview?.actions?.map(a => a.description) || [], 
    grid.x + 4.8, risksY + titleHeight, 4.3, riskBoxHeight - titleHeight);
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

