import pptxgen from "pptxgenjs";
import { ProjectData } from "./types";
import { weatherIcons, progressIcons, weatherTypes, progressTypes, weatherColors, progressColors } from "./constants";
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
      { text: "", options: { fill: { color: idx % 2 === 0 ? "F5F5F5" : "FFFFFF" }, fontSize: 11, align: "center" as pptxgen.HAlign } },
      { text: "", options: { fill: { color: idx % 2 === 0 ? "F5F5F5" : "FFFFFF" }, fontSize: 11, align: "center" as pptxgen.HAlign } },
      { text: data.lastReview?.comment || "-", options: { fill: { color: idx % 2 === 0 ? "F5F5F5" : "FFFFFF" }, fontSize: 11 } }
    ])
  ];

  const table = slide.addTable(tableRows, {
    x: 0.5,
    y: 1.0,
    w: 9,
    colW: [3, 1, 1, 4],
  });

  // Ajouter les formes météo et progression dans les cellules appropriées
  projectsData.forEach((data, idx) => {
    const rowY = 1.0 + 0.5 + (idx * 0.5); // Position Y approximative (1.0 est le début du tableau + hauteur de l'en-tête + hauteur de chaque ligne)
    
    // Ajouter l'icône météo
    addWeatherShape(slide, data.lastReview?.weather || "cloudy", 3.0, rowY, 0.4, 0.4);
    
    // Ajouter l'icône progression
    addProgressShape(slide, data.lastReview?.progress || "stable", 4.0, rowY, 0.4, 0.4);
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
  
  // Remplacer l'emoji par une forme PowerPoint native
  addWeatherShape(slide, data.lastReview?.weather || "cloudy", grid.x + 0.55, grid.y + 0.5, 0.6, 0.6);
};

const addEvolutionSection = (slide: pptxgen.Slide, data: ProjectData, grid: any) => {
  addSection(slide, "EVOLUTION", grid.x + 1.6, grid.y, 1.5, 1);
  
  // Remplacer l'emoji par une forme PowerPoint native
  addProgressShape(slide, data.lastReview?.progress || "stable", grid.x + 2.15, grid.y + 0.5, 0.6, 0.6);
};

// Fonction pour ajouter une forme météo
const addWeatherShape = (slide: pptxgen.Slide, weather: string, x: number, y: number, w: number, h: number) => {
  switch(weather) {
    case weatherTypes.sunny:
      // Soleil (cercle jaune)
      slide.addShape('ellipse', { 
        x, y, w, h, 
        fill: { color: weatherColors.sunny },
        line: { color: weatherColors.sunny, width: 1 } 
      });
      
      // Ajouter des rayons autour (8 petits rectangles)
      const rayLength = 0.13 * w;
      const centerX = x + w/2;
      const centerY = y + h/2;
      const rayPositions = [
        { x: centerX, y: y - rayLength, w: 0.06 * w, h: rayLength, angle: 0 },
        { x: centerX + w/3, y: y - rayLength/2, w: 0.06 * w, h: rayLength, angle: 45 },
        { x: x + w, y: centerY, w: rayLength, h: 0.06 * h, angle: 0 },
        { x: x + w - rayLength/2, y: centerY + h/3, w: rayLength, h: 0.06 * h, angle: 45 },
        { x: centerX, y: y + h, w: 0.06 * w, h: rayLength, angle: 0 },
        { x: centerX - w/3, y: y + h - rayLength/2, w: 0.06 * w, h: rayLength, angle: 45 },
        { x: x - rayLength, y: centerY, w: rayLength, h: 0.06 * h, angle: 0 },
        { x: x - rayLength/2, y: centerY - h/3, w: rayLength, h: 0.06 * h, angle: 45 }
      ];
      
      rayPositions.forEach(pos => {
        slide.addShape('rect', {
          x: pos.x,
          y: pos.y,
          w: pos.w,
          h: pos.h,
          fill: { color: weatherColors.sunny },
          rotate: pos.angle
        });
      });
      break;
      
    case weatherTypes.cloudy:
      // Nuage (forme arrondie grise)
      slide.addShape('roundRect', { 
        x, y: y + 0.1 * h, w, h: 0.8 * h, 
        r: 0.3,
        fill: { color: weatherColors.cloudy },
        line: { color: weatherColors.cloudy, width: 1 }
      });
      
      // Deuxième forme arrondie pour l'effet nuage
      slide.addShape('roundRect', { 
        x: x + 0.2 * w, y, w: 0.7 * w, h: 0.7 * h, 
        r: 0.3,
        fill: { color: weatherColors.cloudy },
        line: { color: weatherColors.cloudy, width: 1 }
      });
      break;
      
    case weatherTypes.stormy:
      // Nuage d'orage (forme arrondie gris foncé)
      slide.addShape('roundRect', { 
        x, y: y + 0.1 * h, w, h: 0.6 * h, 
        r: 0.3,
        fill: { color: weatherColors.stormy },
        line: { color: weatherColors.stormy, width: 1 }
      });
      
      // Deuxième forme arrondie pour l'effet nuage
      slide.addShape('roundRect', { 
        x: x + 0.2 * w, y, w: 0.7 * w, h: 0.5 * h, 
        r: 0.3,
        fill: { color: weatherColors.stormy },
        line: { color: weatherColors.stormy, width: 1 }
      });
      
      // Éclair (triangle jaune)
      const points = [
        { x: x + 0.4 * w, y: y + 0.4 * h },  // Sommet haut
        { x: x + 0.6 * w, y: y + 0.6 * h },  // Milieu droit
        { x: x + 0.45 * w, y: y + 0.6 * h }, // Milieu centre
        { x: x + 0.65 * w, y: y + h },       // Bas
        { x: x + 0.35 * w, y: y + 0.7 * h }, // Milieu gauche
        { x: x + 0.5 * w, y: y + 0.7 * h },  // Milieu droit bas
        { x: x + 0.4 * w, y: y + 0.4 * h }   // Retour au sommet
      ];
      
      slide.addShape('custGeom', {
        x, y, w, h,
        fill: { color: weatherColors.sunny },
        points: points.map(p => ({ x: (p.x - x) / w, y: (p.y - y) / h }))
      });
      break;
      
    default:
      // Par défaut, un cercle gris
      slide.addShape('ellipse', { 
        x, y, w, h, 
        fill: { color: 'CCCCCC' } 
      });
  }
};

// Fonction pour ajouter une forme de progression
const addProgressShape = (slide: pptxgen.Slide, progress: string, x: number, y: number, w: number, h: number) => {
  switch(progress) {
    case progressTypes.better:
      // Flèche vers le haut (vert)
      slide.addShape('triangle', { 
        x, y, w, h, 
        fill: { color: progressColors.better },
        rotate: 0 // Pointe vers le haut
      });
      break;
      
    case progressTypes.stable:
      // Flèche horizontale (orange)
      slide.addShape('rect', { 
        x: x + 0.1 * w, y: y + 0.4 * h, w: 0.8 * w, h: 0.2 * h, 
        fill: { color: progressColors.stable }
      });
      
      // Triangle pour la pointe de la flèche
      slide.addShape('triangle', { 
        x: x + 0.6 * w, y: y + 0.25 * h, w: 0.3 * w, h: 0.5 * h, 
        fill: { color: progressColors.stable },
        rotate: 90 // Pointe vers la droite
      });
      break;
      
    case progressTypes.worse:
      // Flèche vers le bas (rouge)
      slide.addShape('triangle', { 
        x, y, w, h, 
        fill: { color: progressColors.worse },
        rotate: 180 // Pointe vers le bas
      });
      break;
      
    default:
      // Par défaut, une flèche horizontale
      slide.addShape('rect', { 
        x: x + 0.1 * w, y: y + 0.4 * h, w: 0.8 * w, h: 0.2 * h, 
        fill: { color: progressColors.stable }
      });
      
      slide.addShape('triangle', { 
        x: x + 0.6 * w, y: y + 0.25 * h, w: 0.3 * w, h: 0.5 * h, 
        fill: { color: progressColors.stable },
        rotate: 90 // Pointe vers la droite
      });
  }
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
