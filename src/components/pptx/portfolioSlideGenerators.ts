
/**
 * @file portfolioSlideGenerators.ts
 * @description Générateurs de slides PowerPoint spécifiques aux portefeuilles.
 * Crée des présentations structurées avec les données et statistiques du portefeuille.
 */

import pptxgen from "pptxgenjs";
import { pptxStyles, pptxColors, pptxLayout } from "./PPTXStyles";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  projects: any[];
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

/**
 * Génère une slide de titre pour le portefeuille
 */
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

  // Description si disponible
  if (portfolioData.description) {
    slide.addText(
      portfolioData.description,
      {
        x: 1,
        y: 4.5,
        w: 8,
        h: 1.5,
        fontSize: 14,
        color: pptxColors.text,
        align: "center",
        valign: "middle"
      }
    );
  }
};

/**
 * Génère une slide avec les informations générales du portefeuille
 */
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

  // Informations générales en tableau
  const tableData = [
    ["Nom du portefeuille", portfolioData.name],
    ["Statut", portfolioData.status || "Non défini"],
    ["Nombre de projets", portfolioData.project_count.toString()],
    ["Avancement moyen", `${portfolioData.average_completion}%`],
    ["Budget total", portfolioData.budget_total ? `${portfolioData.budget_total.toLocaleString('fr-FR')} €` : "Non défini"],
    ["Date de début", portfolioData.start_date ? format(new Date(portfolioData.start_date), 'dd/MM/yyyy', { locale: fr }) : "Non définie"],
    ["Date de fin", portfolioData.end_date ? format(new Date(portfolioData.end_date), 'dd/MM/yyyy', { locale: fr }) : "Non définie"]
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

/**
 * Génère une slide avec les statistiques du portefeuille
 */
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

  // Statistiques par statut
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

  const statusData = [
    ["Statut", "Projets", "%"],
    ["Ensoleillé", portfolioData.statusStats.sunny.toString(), `${Math.round((portfolioData.statusStats.sunny / portfolioData.project_count) * 100)}%`],
    ["Nuageux", portfolioData.statusStats.cloudy.toString(), `${Math.round((portfolioData.statusStats.cloudy / portfolioData.project_count) * 100)}%`],
    ["Orageux", portfolioData.statusStats.stormy.toString(), `${Math.round((portfolioData.statusStats.stormy / portfolioData.project_count) * 100)}%`]
  ];

  slide.addTable(statusData, {
    x: 0.5,
    y: 2.6,
    w: 4,
    h: 2,
    fontSize: 10,
    border: { type: "solid", color: pptxColors.muted, pt: 1 },
    fill: { color: "FFFFFF" },
    color: pptxColors.text
  });

  // Statistiques par cycle de vie
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

  const lifecycleData = [
    ["Cycle de vie", "Projets", "%"],
    ["À l'étude", portfolioData.lifecycleStats.study.toString(), `${Math.round((portfolioData.lifecycleStats.study / portfolioData.project_count) * 100)}%`],
    ["Validé", portfolioData.lifecycleStats.validated.toString(), `${Math.round((portfolioData.lifecycleStats.validated / portfolioData.project_count) * 100)}%`],
    ["En cours", portfolioData.lifecycleStats.in_progress.toString(), `${Math.round((portfolioData.lifecycleStats.in_progress / portfolioData.project_count) * 100)}%`],
    ["Terminé", portfolioData.lifecycleStats.completed.toString(), `${Math.round((portfolioData.lifecycleStats.completed / portfolioData.project_count) * 100)}%`],
    ["Suspendu", portfolioData.lifecycleStats.suspended.toString(), `${Math.round((portfolioData.lifecycleStats.suspended / portfolioData.project_count) * 100)}%`],
    ["Abandonné", portfolioData.lifecycleStats.abandoned.toString(), `${Math.round((portfolioData.lifecycleStats.abandoned / portfolioData.project_count) * 100)}%`]
  ];

  slide.addTable(lifecycleData, {
    x: 5,
    y: 2.6,
    w: 4.5,
    h: 3,
    fontSize: 10,
    border: { type: "solid", color: pptxColors.muted, pt: 1 },
    fill: { color: "FFFFFF" },
    color: pptxColors.text
  });
};

/**
 * Génère une slide avec la liste des projets du portefeuille
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

  // En-tête du tableau
  const projectsHeader = ["Projet", "Chef de projet", "Statut", "Cycle de vie"];
  
  // Données des projets (limiter à 15 projets pour tenir sur la slide)
  const projectsToShow = portfolioData.projects.slice(0, 15);
  const projectsData = [
    projectsHeader,
    ...projectsToShow.map(project => [
      project.title.length > 30 ? project.title.substring(0, 30) + "..." : project.title,
      project.project_manager || "Non assigné",
      project.status === 'sunny' ? '☀️' : project.status === 'cloudy' ? '☁️' : project.status === 'stormy' ? '⛈️' : '-',
      project.lifecycle_status === 'study' ? 'Étude' :
      project.lifecycle_status === 'validated' ? 'Validé' :
      project.lifecycle_status === 'in_progress' ? 'En cours' :
      project.lifecycle_status === 'completed' ? 'Terminé' :
      project.lifecycle_status === 'suspended' ? 'Suspendu' :
      project.lifecycle_status === 'abandoned' ? 'Abandonné' : '-'
    ])
  ];

  slide.addTable(projectsData, {
    x: 0.5,
    y: 2,
    w: 9,
    h: 5,
    fontSize: 9,
    border: { type: "solid", color: pptxColors.muted, pt: 1 },
    fill: { color: "FFFFFF" },
    color: pptxColors.text
  });

  // Note si plus de projets que ce qui est affiché
  if (portfolioData.projects.length > 15) {
    slide.addText(
      `Note: Seuls les 15 premiers projets sont affichés (${portfolioData.projects.length} projets au total)`,
      {
        x: 0.5,
        y: 7.2,
        w: 9,
        h: 0.3,
        fontSize: 8,
        color: pptxColors.muted,
        italic: true
      }
    );
  }
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
