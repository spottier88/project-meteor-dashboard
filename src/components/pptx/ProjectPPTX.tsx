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

const statusLabels = {
  sunny: "Ensoleillé",
  cloudy: "Nuageux",
  stormy: "Orageux",
};

const progressLabels = {
  better: "En amélioration",
  stable: "Stable",
  worse: "En dégradation",
};

export const generateProjectPPTX = async (projectsData: ProjectData[]) => {
  const pptx = new pptxgen();

  for (const data of projectsData) {
    // Title Slide
    const titleSlide = pptx.addSlide();
    titleSlide.addText(data.project.title, {
      ...pptxStyles.title,
      x: pptxLayout.margin,
      y: 2,
      w: pptxLayout.width,
      align: "center",
    });
    titleSlide.addText(new Date().toLocaleDateString("fr-FR"), {
      ...pptxStyles.date,
      x: pptxLayout.margin,
      y: 5,
      w: pptxLayout.width,
      align: "center",
    });

    // Project Info Slide
    const infoSlide = pptx.addSlide();
    infoSlide.addText("Informations générales", {
      ...pptxStyles.sectionTitle,
      x: pptxLayout.margin,
      y: 0.5,
    });

    const infoContent = [
      ["Chef de projet", data.project.project_manager || "-"],
      ["Date de début", data.project.start_date ? new Date(data.project.start_date).toLocaleDateString("fr-FR") : "-"],
      ["Date de fin", data.project.end_date ? new Date(data.project.end_date).toLocaleDateString("fr-FR") : "-"],
      ["Avancement", `${data.project.completion}%`],
      ["Pôle", data.project.pole_name || "-"],
      ["Direction", data.project.direction_name || "-"],
      ["Service", data.project.service_name || "-"],
    ];

    if (data.project.description) {
      infoSlide.addText("Description", {
        ...pptxStyles.text,
        x: pptxLayout.margin,
        y: 1.5,
        bold: true,
      });
      infoSlide.addText(data.project.description, {
        ...pptxStyles.text,
        x: pptxLayout.margin,
        y: 2,
        w: pptxLayout.width,
      });
    }

    infoSlide.addTable(infoContent, {
      x: pptxLayout.margin,
      y: data.project.description ? 3 : 1.5,
      w: pptxLayout.width,
      colW: [2, 6],
      fontSize: 12,
    });

    // Last Review Slide
    if (data.lastReview) {
      const reviewSlide = pptx.addSlide();
      reviewSlide.addText("Dernière revue", {
        ...pptxStyles.sectionTitle,
        x: pptxLayout.margin,
        y: 0.5,
      });

      const reviewContent = [
        ["Date", new Date(data.lastReview.created_at).toLocaleDateString("fr-FR")],
        ["Météo", statusLabels[data.lastReview.weather]],
        ["Progression", progressLabels[data.lastReview.progress]],
      ];

      reviewSlide.addTable(reviewContent, {
        x: pptxLayout.margin,
        y: 1.5,
        w: pptxLayout.width,
        colW: [2, 6],
        fontSize: 12,
      });

      if (data.lastReview.comment) {
        reviewSlide.addText("Commentaire", {
          ...pptxStyles.text,
          x: pptxLayout.margin,
          y: 3.5,
          bold: true,
        });
        reviewSlide.addText(data.lastReview.comment, {
          ...pptxStyles.text,
          x: pptxLayout.margin,
          y: 4,
          w: pptxLayout.width,
        });
      }
    }

    // Tasks Slide
    if (data.tasks.length > 0) {
      const taskSlide = pptx.addSlide();
      taskSlide.addText("Tâches", {
        ...pptxStyles.sectionTitle,
        x: pptxLayout.margin,
        y: 0.5,
      });

      const taskStats = {
        todo: data.tasks.filter(t => t.status === "todo").length,
        in_progress: data.tasks.filter(t => t.status === "in_progress").length,
        done: data.tasks.filter(t => t.status === "done").length,
      };

      // Add task distribution chart
      taskSlide.addChart(pptx.ChartType.pie, [
        {
          name: "À faire",
          labels: ["À faire"],
          values: [taskStats.todo],
          color: pptxColors.warning,
        },
        {
          name: "En cours",
          labels: ["En cours"],
          values: [taskStats.in_progress],
          color: pptxColors.info,
        },
        {
          name: "Terminé",
          labels: ["Terminé"],
          values: [taskStats.done],
          color: pptxColors.success,
        },
      ], {
        x: 1,
        y: 1.5,
        w: 4,
        h: 3,
        showLegend: true,
        legendPos: "r",
      });

      // Add task list
      const taskContent = data.tasks.map(task => [
        task.title,
        task.status === "todo" ? "À faire" : task.status === "in_progress" ? "En cours" : "Terminé",
        task.assignee || "-",
        task.due_date ? new Date(task.due_date).toLocaleDateString("fr-FR") : "-",
      ]);

      taskSlide.addTable([
        ["Titre", "Statut", "Assigné à", "Date limite"],
        ...taskContent,
      ], {
        x: pptxLayout.margin,
        y: 5,
        w: pptxLayout.width,
        fontSize: 10,
      });
    }

    // Risks Slide
    if (data.risks.length > 0) {
      const riskSlide = pptx.addSlide();
      riskSlide.addText("Risques", {
        ...pptxStyles.sectionTitle,
        x: pptxLayout.margin,
        y: 0.5,
      });

      // Risk matrix
      const matrix = [
        ["Élevée", "", "", ""],
        ["Moyenne", "", "", ""],
        ["Faible", "", "", ""],
        ["", "Faible", "Moyenne", "Élevée"],
      ];

      riskSlide.addTable(matrix, {
        x: 1,
        y: 1.5,
        w: 4,
        h: 3,
        border: { pt: 1, color: "363636" },
        align: "center",
      });

      // Risk list
      const riskContent = data.risks.map(risk => [
        risk.description,
        risk.probability === "low" ? "Faible" : risk.probability === "medium" ? "Moyenne" : "Élevée",
        risk.severity === "low" ? "Faible" : risk.severity === "medium" ? "Moyenne" : "Élevée",
        risk.status === "open" ? "Ouvert" : risk.status === "in_progress" ? "En cours" : "Résolu",
      ]);

      riskSlide.addTable([
        ["Description", "Probabilité", "Gravité", "Statut"],
        ...riskContent,
      ], {
        x: pptxLayout.margin,
        y: 5,
        w: pptxLayout.width,
        fontSize: 10,
      });
    }
  }

  // Save the presentation
  await pptx.writeFile(`projets-export-${new Date().toISOString().split("T")[0]}.pptx`);
};