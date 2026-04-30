/**
 * @file portfolioSlideGenerators.ts
 * @description Générateurs de slides PowerPoint spécifiques aux portefeuilles.
 * Crée des présentations structurées avec les données et statistiques du portefeuille.
 */

import pptxgen from "pptxgenjs";
import { pptxStyles, pptxColors } from "./PPTXStyles";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PortfolioProject {
  title: string;
  project_manager?: string;
  status?: string;
  lifecycle_status?: string;
  completion?: number;
}

interface PortfolioData {
  id: string;
  name: string;
  description: string | null;
  strategic_objectives: string | null;
  budget_total: number | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  project_count: number;
  average_completion: number;
  projects: PortfolioProject[];
  statusStats: {
    sunny: number;
    cloudy: number;
    stormy: number;
  };
  lifecycleStats: {
    study: number;
    validated: number;
    in_progress: number;
    completed: number;
    suspended: number;
    abandoned: number;
  };
}

export const generatePortfolioTitleSlide = (pptx: pptxgen, portfolioData: PortfolioData) => {
  const slide = pptx.addSlide({ masterName: "MAIN_MASTER" });
  
  // Titre principal
  slide.addText(
    `Portefeuille: ${portfolioData.name}`,
    {
      x: 1,
      y: 2,
      w: 8,
      h: 1.5,
      fontSize: 28,
      color: pptxColors.primary,
      bold: true,
      align: "center"
    }
  );

  // Sous-titre avec informations clés
  const subtitle = `${portfolioData.project_count} projet(s) • Avancement moyen: ${portfolioData.average_completion}%`;
  slide.addText(
    subtitle,
    {
      x: 1,
      y: 3.5,
      w: 8,
      h: 0.8,
      fontSize: 16,
      color: pptxColors.text,
      align: "center"
    }
  );

  // Barre de progression visuelle pour l'avancement moyen
  const progressBarWidth = 6;
  const progressFillWidth = (portfolioData.average_completion / 100) * progressBarWidth;
  
  // Fond de la barre de progression
  slide.addShape(pptx.ShapeType.rect, {
    x: 2,
    y: 4.5,
    w: progressBarWidth,
    h: 0.3,
    fill: { color: "E5E5E5" },
    line: { color: pptxColors.muted, width: 1 }
  });
  
  // Remplissage de la barre de progression
  if (progressFillWidth > 0) {
    const progressColor = portfolioData.average_completion >= 75 ? "22C55E" : 
                         portfolioData.average_completion >= 50 ? "F59E0B" : "EF4444";
    slide.addShape(pptx.ShapeType.rect, {
      x: 2,
      y: 4.5,
      w: progressFillWidth,
      h: 0.3,
      fill: { color: progressColor },
      line: { width: 0 }
    });
  }

  // Indicateurs météo visuels
  const totalProjects = portfolioData.project_count;
  if (totalProjects > 0) {
    const sunnyPercent = Math.round((portfolioData.statusStats.sunny / totalProjects) * 100);
    const cloudyPercent = Math.round((portfolioData.statusStats.cloudy / totalProjects) * 100);
    const stormyPercent = Math.round((portfolioData.statusStats.stormy / totalProjects) * 100);

    // Icônes météo avec pourcentages
    slide.addText("☀️", { x: 2.5, y: 5.2, w: 1, h: 0.8, fontSize: 24, align: "center" });
    slide.addText(`${sunnyPercent}%`, { x: 2.3, y: 5.8, w: 1.4, h: 0.4, fontSize: 12, align: "center", color: "22C55E" });

    slide.addText("☁️", { x: 4.5, y: 5.2, w: 1, h: 0.8, fontSize: 24, align: "center" });
    slide.addText(`${cloudyPercent}%`, { x: 4.3, y: 5.8, w: 1.4, h: 0.4, fontSize: 12, align: "center", color: "F59E0B" });

    slide.addText("⛈️", { x: 6.5, y: 5.2, w: 1, h: 0.8, fontSize: 24, align: "center" });
    slide.addText(`${stormyPercent}%`, { x: 6.3, y: 5.8, w: 1.4, h: 0.4, fontSize: 12, align: "center", color: "EF4444" });
  }

  // Description si disponible
  if (portfolioData.description) {
    slide.addText(
      portfolioData.description,
      {
        x: 1,
        y: 6.5,
        w: 8,
        h: 1,
        fontSize: 14,
        color: pptxColors.text,
        align: "center",
        valign: "middle"
      }
    );
  }
};

export const generatePortfolioOverviewSlide = (pptx: pptxgen, portfolioData: PortfolioData) => {
  const slide = pptx.addSlide({ masterName: "MAIN_MASTER" });
  
  // Titre de la slide
  slide.addText(
    "Vue d'ensemble du portefeuille",
    {
      x: 0.5,
      y: 1,
      w: 9,
      h: 0.8,
      ...pptxStyles.sectionTitle
    }
  );

  // Informations générales en tableau - Format corrigé pour pptxgenjs
  const tableData = [
    [
      { text: "Nom du portefeuille", options: { bold: true } },
      { text: portfolioData.name, options: {} }
    ],
    [
      { text: "Statut", options: { bold: true } },
      { text: portfolioData.status || "Non défini", options: {} }
    ],
    [
      { text: "Nombre de projets", options: { bold: true } },
      { text: portfolioData.project_count.toString(), options: {} }
    ],
    [
      { text: "Avancement moyen", options: { bold: true } },
      { text: `${portfolioData.average_completion}%`, options: {} }
    ],
    [
      { text: "Budget total", options: { bold: true } },
      { text: portfolioData.budget_total ? `${portfolioData.budget_total.toLocaleString('fr-FR')} €` : "Non défini", options: {} }
    ],
    [
      { text: "Date de début", options: { bold: true } },
      { text: portfolioData.start_date ? format(new Date(portfolioData.start_date), 'dd/MM/yyyy', { locale: fr }) : "Non définie", options: {} }
    ],
    [
      { text: "Date de fin", options: { bold: true } },
      { text: portfolioData.end_date ? format(new Date(portfolioData.end_date), 'dd/MM/yyyy', { locale: fr }) : "Non définie", options: {} }
    ]
  ];

  slide.addTable(tableData, {
    x: 0.5,
    y: 2,
    w: 9,
    h: 3.5,
    fontSize: 11,
    border: { type: "solid", color: pptxColors.muted, pt: 1 },
    fill: { color: "FFFFFF" },
    color: pptxColors.text
  });

  // Objectifs stratégiques si disponibles
  if (portfolioData.strategic_objectives) {
    slide.addText(
      "Objectifs stratégiques",
      {
        x: 0.5,
        y: 5.8,
        w: 9,
        h: 0.4,
        ...pptxStyles.sectionTitle
      }
    );

    slide.addText(
      portfolioData.strategic_objectives,
      {
        x: 0.5,
        y: 6.3,
        w: 9,
        h: 1.2,
        ...pptxStyles.text,
        valign: "top"
      }
    );
  }
};

export const generatePortfolioStatisticsSlide = (pptx: pptxgen, portfolioData: PortfolioData) => {
  const slide = pptx.addSlide({ masterName: "MAIN_MASTER" });
  
  // Titre de la slide
  slide.addText(
    "Statistiques du portefeuille",
    {
      x: 0.5,
      y: 1,
      w: 9,
      h: 0.8,
      ...pptxStyles.sectionTitle
    }
  );

  // Graphique en barres pour les statuts météo
  slide.addText(
    "Répartition par statut météo",
    {
      x: 0.5,
      y: 2,
      w: 4,
      h: 0.5,
      fontSize: 12,
      bold: true,
      color: pptxColors.text
    }
  );

  // Données pour le graphique en barres des statuts
  const maxStatusValue = Math.max(portfolioData.statusStats.sunny, portfolioData.statusStats.cloudy, portfolioData.statusStats.stormy);
  const barMaxWidth = 3;
  const barHeight = 0.4;
  const barSpacing = 0.6;

  // Barre Ensoleillé
  const sunnyWidth = maxStatusValue > 0 ? (portfolioData.statusStats.sunny / maxStatusValue) * barMaxWidth : 0;
  slide.addText("☀️", { x: 0.5, y: 2.8, w: 0.4, h: 0.4, fontSize: 16, align: "center" });
  slide.addShape(pptx.ShapeType.rect, {
    x: 1,
    y: 2.8,
    w: sunnyWidth,
    h: barHeight,
    fill: { color: "22C55E" },
    line: { width: 0 }
  });
  slide.addText(portfolioData.statusStats.sunny.toString(), { x: 1 + sunnyWidth + 0.1, y: 2.8, w: 0.5, h: 0.4, fontSize: 10, valign: "middle" });

  // Barre Nuageux
  const cloudyWidth = maxStatusValue > 0 ? (portfolioData.statusStats.cloudy / maxStatusValue) * barMaxWidth : 0;
  slide.addText("☁️", { x: 0.5, y: 2.8 + barSpacing, w: 0.4, h: 0.4, fontSize: 16, align: "center" });
  slide.addShape(pptx.ShapeType.rect, {
    x: 1,
    y: 2.8 + barSpacing,
    w: cloudyWidth,
    h: barHeight,
    fill: { color: "F59E0B" },
    line: { width: 0 }
  });
  slide.addText(portfolioData.statusStats.cloudy.toString(), { x: 1 + cloudyWidth + 0.1, y: 2.8 + barSpacing, w: 0.5, h: 0.4, fontSize: 10, valign: "middle" });

  // Barre Orageux
  const stormyWidth = maxStatusValue > 0 ? (portfolioData.statusStats.stormy / maxStatusValue) * barMaxWidth : 0;
  slide.addText("⛈️", { x: 0.5, y: 2.8 + (barSpacing * 2), w: 0.4, h: 0.4, fontSize: 16, align: "center" });
  slide.addShape(pptx.ShapeType.rect, {
    x: 1,
    y: 2.8 + (barSpacing * 2),
    w: stormyWidth,
    h: barHeight,
    fill: { color: "EF4444" },
    line: { width: 0 }
  });
  slide.addText(portfolioData.statusStats.stormy.toString(), { x: 1 + stormyWidth + 0.1, y: 2.8 + (barSpacing * 2), w: 0.5, h: 0.4, fontSize: 10, valign: "middle" });

  // Diagramme circulaire visuel pour le cycle de vie
  slide.addText(
    "Répartition par cycle de vie",
    {
      x: 5,
      y: 2,
      w: 4.5,
      h: 0.5,
      fontSize: 12,
      bold: true,
      color: pptxColors.text
    }
  );

  // Données du cycle de vie avec représentation visuelle
  const lifecycleData = [
    { label: "À l'étude", value: portfolioData.lifecycleStats.study, color: "94A3B8", emoji: "🔍" },
    { label: "Validé", value: portfolioData.lifecycleStats.validated, color: "3B82F6", emoji: "✅" },
    { label: "En cours", value: portfolioData.lifecycleStats.in_progress, color: "F59E0B", emoji: "🚧" },
    { label: "Terminé", value: portfolioData.lifecycleStats.completed, color: "22C55E", emoji: "🏁" },
    { label: "Suspendu", value: portfolioData.lifecycleStats.suspended, color: "F97316", emoji: "⏸️" },
    { label: "Abandonné", value: portfolioData.lifecycleStats.abandoned, color: "EF4444", emoji: "❌" }
  ];

  let yPos = 2.8;
  lifecycleData.forEach((item, index) => {
    if (item.value > 0) {
      const percentage = Math.round((item.value / portfolioData.project_count) * 100);
      const barWidth = (item.value / portfolioData.project_count) * 3.5;
      
      // Emoji + Label
      slide.addText(item.emoji, { x: 5, y: yPos, w: 0.3, h: 0.3, fontSize: 12, align: "center" });
      slide.addText(item.label, { x: 5.4, y: yPos, w: 1.2, h: 0.3, fontSize: 9, valign: "middle" });
      
      // Barre colorée
      slide.addShape(pptx.ShapeType.rect, {
        x: 6.7,
        y: yPos,
        w: barWidth,
        h: 0.25,
        fill: { color: item.color },
        line: { width: 0 }
      });
      
      // Valeur et pourcentage
      slide.addText(`${item.value} (${percentage}%)`, { 
        x: 6.7 + barWidth + 0.1, 
        y: yPos, 
        w: 1, 
        h: 0.3, 
        fontSize: 8, 
        valign: "middle" 
      });
      
      yPos += 0.4;
    }
  });

  // Indicateur global de santé du portefeuille
  const healthScore = portfolioData.statusStats.sunny / portfolioData.project_count;
  const healthColor = healthScore >= 0.7 ? "22C55E" : healthScore >= 0.4 ? "F59E0B" : "EF4444";
  const healthEmoji = healthScore >= 0.7 ? "😊" : healthScore >= 0.4 ? "😐" : "😟";
  
  slide.addText(
    "Santé globale du portefeuille",
    {
      x: 0.5,
      y: 6,
      w: 9,
      h: 0.4,
      fontSize: 12,
      bold: true,
      color: pptxColors.text,
      align: "center"
    }
  );

  slide.addText(healthEmoji, { x: 4, y: 6.5, w: 1, h: 0.8, fontSize: 32, align: "center" });
  slide.addText(`${Math.round(healthScore * 100)}% de projets en bonne santé`, { 
    x: 2, 
    y: 7.2, 
    w: 6, 
    h: 0.4, 
    fontSize: 14, 
    align: "center", 
    color: healthColor,
    bold: true 
  });
};

/**
 * Génère une slide avec la liste colorée des projets du portefeuille - Correction pour utiliser completion
 */
export const generatePortfolioProjectsSlide = (pptx: pptxgen, portfolioData: PortfolioData) => {
  const slide = pptx.addSlide({ masterName: "MAIN_MASTER" });
  
  // Titre de la slide
  slide.addText(
    "Liste des projets du portefeuille",
    {
      x: 0.5,
      y: 1,
      w: 9,
      h: 0.8,
      ...pptxStyles.sectionTitle
    }
  );

  // Données des projets (limiter à 12 projets pour tenir sur la slide avec le design amélioré)
  const projectsToShow = portfolioData.projects.slice(0, 12);
  
  // En-têtes du tableau avec format corrigé
  const tableData: pptxgen.TableRow[] = [
    [
      { text: "Projet", options: { bold: true, fill: { color: "F3F4F6" } } },
      { text: "Chef de projet", options: { bold: true, fill: { color: "F3F4F6" } } },
      { text: "Météo", options: { bold: true, fill: { color: "F3F4F6" } } },
      { text: "Cycle de vie", options: { bold: true, fill: { color: "F3F4F6" } } },
      { text: "Avancement", options: { bold: true, fill: { color: "F3F4F6" } } }
    ]
  ];

  // Ajouter les lignes de projets
  projectsToShow.forEach(project => {
    const completion = project.completion || 0; // Utilisation de completion au lieu de progress
    const completionColor = completion >= 75 ? "22C55E" : completion >= 50 ? "F59E0B" : "EF4444";
    
    tableData.push([
      { 
        text: project.title.length > 20 ? project.title.substring(0, 20) + "..." : project.title, 
        options: {} 
      },
      { 
        text: project.project_manager || "Non assigné", 
        options: {} 
      },
      { 
        text: project.status === 'sunny' ? '☀️' : project.status === 'cloudy' ? '☁️' : project.status === 'stormy' ? '⛈️' : '-', 
        options: {} 
      },
      { 
        text: project.lifecycle_status === 'study' ? 'Étude' :
               project.lifecycle_status === 'validated' ? 'Validé' :
               project.lifecycle_status === 'in_progress' ? 'En cours' :
               project.lifecycle_status === 'completed' ? 'Terminé' :
               project.lifecycle_status === 'suspended' ? 'Suspendu' :
               project.lifecycle_status === 'abandoned' ? 'Abandonné' : '-', 
        options: {} 
      },
      { 
        text: `${completion}%`, 
        options: { 
          color: completionColor,
          bold: completion >= 75
        } 
      }
    ]);
  });

  slide.addTable(tableData, {
    x: 0.5,
    y: 2,
    w: 9,
    h: 4.5,
    fontSize: 9,
    border: { type: "solid", color: pptxColors.muted, pt: 1 },
    fill: { color: "FFFFFF" },
    color: pptxColors.text
  });

  // Note si plus de projets que ce qui est affiché
  if (portfolioData.projects.length > 12) {
    slide.addText(
      `Note: Seuls les 12 premiers projets sont affichés (${portfolioData.projects.length} projets au total)`,
      {
        x: 0.5,
        y: 6.8,
        w: 9,
        h: 0.3,
        fontSize: 8,
        color: pptxColors.muted,
        italic: true
      }
    );
  }

  // Légende des icônes météo
  slide.addText("Légende:", { x: 0.5, y: 7.2, w: 1, h: 0.3, fontSize: 8, bold: true });
  slide.addText("☀️ Ensoleillé  ☁️ Nuageux  ⛈️ Orageux", { 
    x: 1.5, 
    y: 7.2, 
    w: 4, 
    h: 0.3, 
    fontSize: 8, 
    color: pptxColors.muted 
  });
};

/**
 * Génère une présentation PowerPoint complète pour le portefeuille
 */
export const generatePortfolioPPTX = async (portfolioData: PortfolioData) => {
  console.log('Génération PPTX pour le portefeuille:', portfolioData.name);
  
  const pptx = new pptxgen();
  
  // Configuration de la présentation
  pptx.layout = "LAYOUT_16x9";
  pptx.defineSlideMaster({
    title: "MAIN_MASTER",
    background: { color: "FFFFFF" },
    margin: [0.5, 0.5, 0.5, 0.5],
    objects: [
      { rect: { x: 0, y: 0, w: "100%", h: 0.8, fill: { color: pptxColors.primary } } },
      { rect: { x: 0, y: 6.7, w: "100%", h: 0.1, fill: { color: pptxColors.secondary } } },
    ]
  });

  // Génération des slides
  generatePortfolioTitleSlide(pptx, portfolioData);
  generatePortfolioOverviewSlide(pptx, portfolioData);
  generatePortfolioStatisticsSlide(pptx, portfolioData);
  generatePortfolioProjectsSlide(pptx, portfolioData);

  // Génération et téléchargement du fichier
  const fileName = `portefeuille-${portfolioData.name.replace(/[^a-zA-Z0-9]/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pptx`;
  await pptx.writeFile({ fileName });
  
  console.log('Export PPTX terminé:', fileName);
};
