/**
 * @component ProjectPPTX
 * @description Gère la génération de présentations PowerPoint (PPTX) pour les projets.
 * Utilise les données du projet, de ses revues, risques et tâches pour créer une
 * présentation structurée avec un style cohérent. Permet d'exporter les informations
 * du projet dans un format facilement partageable.
 */

import pptxgen from "pptxgenjs";
import { pptxStyles, pptxColors } from "./PPTXStyles";
import { ProjectData } from "./types";
import { generateSummarySlide, generateProjectSlide } from "./slideGenerators";

export const generateProjectPPTX = async (projectsData: ProjectData[]) => {
  const pptx = new pptxgen();
  
  pptx.layout = "LAYOUT_16x9";
  pptx.defineSlideMaster({
    title: "MAIN_MASTER",
    background: { color: "FFFFFF" },
    margin: [0.5, 0.5, 0.5, 0.5],
    objects: [
      { rect: { x: 0, y: 0, w: "100%", h: 0.8, fill: { color: "CC0000" } } },
      { rect: { x: 0, y: 6.7, w: "100%", h: 0.1, fill: { color: "000000" } } },
    ]
  });

  if (projectsData.length > 1) {
    generateSummarySlide(pptx, projectsData);
  }

  for (const data of projectsData) {
    generateProjectSlide(pptx, data);
  }

  const fileName = `projets-export-${new Date().toISOString().split("T")[0]}.pptx`;
  await pptx.writeFile({ fileName });
};
