import pptxgen from "pptxgenjs";
import { pptxStyles, pptxColors, pptxLayout } from "./PPTXStyles";

interface ProjectData {
  project: {
    title: string;
    status: "sunny" | "cloudy" | "stormy";
    progress: "better" | "stable" | "worse";
    completion: number;
    project_manager?: string;
    last_review_date: string;
    start_date?: string;
    end_date?: string;
    description?: string;
    pole_name?: string;
    direction_name?: string;
    service_name?: string;
  };
  lastReview?: {
    weather: "sunny" | "cloudy" | "stormy";
    progress: "better" | "stable" | "worse";
    comment?: string;
    created_at: string;
  };
  risks: Array<{
    description: string;
    probability: "low" | "medium" | "high";
    severity: "low" | "medium" | "high";
    status: "open" | "in_progress" | "resolved";
    mitigation_plan?: string;
  }>;
  tasks: Array<{
    title: string;
    description?: string;
    status: "todo" | "in_progress" | "done";
    assignee?: string;
    due_date?: string;
  }>;
}

const weatherIcons = {
  sunny: "☀️",
  cloudy: "☁️",
  stormy: "⛈️",
};

const progressIcons = {
  better: "↗️",
  stable: "➡️",
  worse: "↘️",
};

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

  for (const data of projectsData) {
    const slide = pptx.addSlide({ masterName: "MAIN_MASTER" });

    // En-tête avec titre et description
    slide.addText([
      { text: data.project.title, options: { bold: true, color: "FFFFFF", fontSize: 16 } },
      { text: "\n" },
      { text: data.project.description || "", options: { color: "FFFFFF", fontSize: 12 } },
      { text: "\n" },
      { text: [
          data.project.pole_name,
          data.project.direction_name,
          data.project.service_name
        ].filter(Boolean).join(" / "), 
        options: { color: "FFFFFF", fontSize: 12 } 
      }
    ], { x: 0.5, y: 0.1, w: 8, h: 0.8,align: "left",valign: "top" });

    // Date de revue
    if (data.lastReview?.created_at) {
      slide.addText(new Date(data.lastReview.created_at).toLocaleDateString("fr-FR"), {
        x: 7, y: 0.1, h: 0.3, w: 1.5,
        color: "FFFFFF",
        fontSize: 12,
        align: "right"
      });
    }

    // Grille principale avec espacement optimisé et hauteurs réduites
    const grid = {
      x: 0.5,
      y: 1.0,
      w: 9,
      h: 5,
      columnGap: 0.1,
      rowGap: 0.1
    };

    // Situation (Météo)
    slide.addShape("rect", {
      x: grid.x,
      y: grid.y,
      w: 1.5,
      h: 1,
      fill: { color: "F5F5F5" },
    });

    slide.addText("SITUATION", {
      x: grid.x,
      y: grid.y,
      w: 1.5,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: "FFFFFF",
      fill: { color: "000000" },
      align: "center",
    });

    slide.addText(weatherIcons[data.lastReview?.weather || "cloudy"], {
      x: grid.x,
      y: grid.y + 0.3,
      w: 1.5,
      h: 0.7,
      fontSize: 24,
      align: "center",
      valign: "middle"
    });

    // Evolution
    slide.addShape("rect", {
      x: grid.x + 1.6,
      y: grid.y,
      w: 1.5,
      h: 1,
      fill: { color: "F5F5F5" },
    });

    slide.addText("EVOLUTION", {
      x: grid.x + 1.6,
      y: grid.y,
      w: 1.5,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: "FFFFFF",
      fill: { color: "000000" },
      align: "center",
    });

    slide.addText(progressIcons[data.lastReview?.progress || "stable"], {
      x: grid.x + 1.6,
      y: grid.y + 0.3,
      w: 1.5,
      h: 0.7,
      fontSize: 24,
      align: "center",
      valign: "middle"
    });

    // Situation générale - ajustement de la zone de texte
    slide.addShape("rect", {
      x: grid.x + 3.2,
      y: grid.y,
      w: 4.5,
      h: 1,
      fill: { color: "F5F5F5" },
    });

    slide.addText("SITUATION GÉNÉRALE", {
      x: grid.x + 3.2,
      y: grid.y,
      w: 4.5,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: "FFFFFF",
      fill: { color: "000000" },
      align: "center",
    });

    slide.addText(data.lastReview?.comment || "Pas de commentaire", {
      x: grid.x + 3.2,
      y: grid.y + 0.3,
      w: 4.5,
      h: 0.7, // Ajusté pour remplir l'espace restant
      fontSize: 11,
      color: "363636",
      align: "left",
      valign: "top"
    });

    // Fin cible
    slide.addShape("rect", {
      x: grid.x + 7.8,
      y: grid.y,
      w: 1.5,
      h: 1,
      fill: { color: "F5F5F5" },
    });

    slide.addText("FIN CIBLE", {
      x: grid.x + 7.8,
      y: grid.y,
      w: 1.5,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: "FFFFFF",
      fill: { color: "000000" },
      align: "center",
    });

    slide.addText(
      data.project.end_date 
        ? new Date(data.project.end_date).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
        : "Non définie", 
      {
        x: grid.x + 7.8,
        y: grid.y + 0.3,
        w: 1.5,
        h: 0.6,
        fontSize: 11,
        color: "363636",
        align: "center",
        valign: "middle"
      }
    );

    // Tâches avec hauteur ajustée
    const tasksY = grid.y + 1.2;
    const taskBoxHeight = 1.6;
    const titleHeight = 0.3;
    const contentHeight = taskBoxHeight - titleHeight;
    
    // Zone des tâches terminées
    slide.addShape("rect", {
      x: grid.x,
      y: tasksY,
      w: 4.5,
      h: taskBoxHeight,
      fill: { color: "F5F5F5" },
    });

    slide.addText("TÂCHES TERMINÉES", {
      x: grid.x,
      y: tasksY,
      w: 4.5,
      h: titleHeight,
      fontSize: 11,
      bold: true,
      color: "FFFFFF",
      fill: { color: "000000" },
      align: "center",
    });

    const completedTasks = data.tasks.filter(t => t.status === "done");
    if (completedTasks.length > 0) {
      slide.addText(
        completedTasks.map(t => t.title).join("\n"),
        {
          x: grid.x + 0.2,
          y: tasksY + titleHeight,
          w: 4.1,
          h: contentHeight,
          fontSize: 10,
          color: "363636",
          valign: "top",
          bullet: { type: "number" }
        }
      );
    } else {
      slide.addText("Aucune tâche terminée", {
        x: grid.x + 0.2,
        y: tasksY + titleHeight,
        w: 4.1,
        h: contentHeight,
        fontSize: 10,
        valign: "top",
        color: "666666"
      });
    }

    // Zone des tâches à venir
    slide.addShape("rect", {
      x: grid.x + 4.6,
      y: tasksY,
      w: 4.7,
      h: taskBoxHeight,
      fill: { color: "F5F5F5" },
    });

    slide.addText("TÂCHES À VENIR", {
      x: grid.x + 4.6,
      y: tasksY,
      w: 4.7,
      h: titleHeight,
      fontSize: 11,
      bold: true,
      color: "FFFFFF",
      fill: { color: "000000" },
      align: "center",
    });

    const todoTasks = data.tasks.filter(t => t.status === "todo");
    if (todoTasks.length > 0) {
      slide.addText(
        todoTasks.map(t => t.title).join("\n"),
        {
          x: grid.x + 4.8,
          y: tasksY + titleHeight,
          w: 4.3,
          h: contentHeight,
          fontSize: 10,
          color: "363636",
          valign: "top",
          bullet: { type: "number" }
        }
      );
    } else {
      slide.addText("Aucune tâche à venir", {
        x: grid.x + 4.8,
        y: tasksY + titleHeight,
        w: 4.3,
        h: contentHeight,
        fontSize: 10,
        valign: "top",
        color: "666666"
      });
    }

    // Risques avec hauteur réduite
    const risksY = tasksY + 1.8;
    const riskBoxHeight = 1.4;
    const riskContentHeight = riskBoxHeight - titleHeight;

    // Zone des risques identifiés
    slide.addShape("rect", {
      x: grid.x,
      y: risksY,
      w: 4.5,
      h: riskBoxHeight,
      fill: { color: "F5F5F5" },
    });

    slide.addText("RISQUES IDENTIFIÉS", {
      x: grid.x,
      y: risksY,
      w: 4.5,
      h: titleHeight,
      fontSize: 11,
      bold: true,
      color: "FFFFFF",
      fill: { color: "000000" },
      align: "center",
    });

    if (data.risks.length > 0) {
      slide.addText(
        data.risks.map(r => r.description).join("\n"),
        {
          x: grid.x + 0.2,
          y: risksY + titleHeight,
          w: 4.1,
          h: riskContentHeight,
          fontSize: 10,
          color: "363636",
          valign: "top",
          bullet: { type: "number" }
        }
      );
    } else {
      slide.addText("Aucun risque identifié", {
        x: grid.x + 0.2,
        y: risksY + titleHeight,
        w: 4.1,
        h: riskContentHeight,
        fontSize: 10,
        valign: "top",
        color: "666666"
      });
    }

    // Zone des actions de mitigation
    slide.addShape("rect", {
      x: grid.x + 4.6,
      y: risksY,
      w: 4.7,
      h: riskBoxHeight,
      fill: { color: "F5F5F5" },
    });

    slide.addText("ACTIONS DE MITIGATION", {
      x: grid.x + 4.6,
      y: risksY,
      w: 4.7,
      h: titleHeight,
      fontSize: 11,
      bold: true,
      color: "FFFFFF",
      fill: { color: "000000" },
      align: "center",
    });

    const risksWithMitigation = data.risks.filter(r => r.mitigation_plan);
    if (risksWithMitigation.length > 0) {
      slide.addText(
        risksWithMitigation.map(r => r.mitigation_plan).join("\n"),
        {
          x: grid.x + 4.8,
          y: risksY + titleHeight,
          w: 4.3,
          h: riskContentHeight,
          fontSize: 10,
          color: "363636",
          valign: "top",
          bullet: { type: "number" }
        }
      );
    } else {
      slide.addText("Aucune action de mitigation définie", {
        x: grid.x + 4.8,
        y: risksY + titleHeight,
        w: 4.3,
        h: riskContentHeight,
        fontSize: 10,
        valign: "top",
        color: "666666"
      });
    }
  }

  const fileName = `projets-export-${new Date().toISOString().split("T")[0]}.pptx`;
  await pptx.writeFile({ fileName });
};
