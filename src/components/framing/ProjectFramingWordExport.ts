
/**
 * @file ProjectFramingWordExport.ts
 * @description Génère une note de cadrage au format Word (DOCX) pour un projet
 */

import { Document, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType, Packer } from 'docx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ProjectData } from '@/hooks/use-detailed-projects-data';
import { RiskProbability, RiskSeverity, RiskStatus } from '@/types/risk';
import { ProjectLifecycleStatus, lifecycleStatusLabels } from '@/types/project';

// Fonctions utilitaires
const formatDate = (date: string | null | undefined): string => {
  if (!date) return 'Non défini';
  
  try {
    return format(new Date(date), 'dd MMMM yyyy', { locale: fr });
  } catch (e) {
    return 'Date invalide';
  }
};

const renderRiskProbabilityLabel = (probability: RiskProbability): string => {
  const labels: Record<RiskProbability, string> = {
    low: 'Faible',
    medium: 'Moyenne',
    high: 'Élevée',
  };
  return labels[probability] || 'Inconnue';
};

const renderRiskSeverityLabel = (severity: RiskSeverity): string => {
  const labels: Record<RiskSeverity, string> = {
    low: 'Faible',
    medium: 'Moyenne',
    high: 'Élevée',
  };
  return labels[severity] || 'Inconnue';
};

const renderRiskStatusLabel = (status: RiskStatus): string => {
  const labels: Record<RiskStatus, string> = {
    open: 'Ouvert',
    in_progress: 'En cours de traitement',
    resolved: 'Résolu',
  };
  return labels[status] || 'Inconnu';
};

const renderTaskStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    todo: 'À faire',
    in_progress: 'En cours',
    done: 'Terminé',
  };
  return labels[status] || 'Inconnu';
};

/**
 * Génère et télécharge un document Word de cadrage de projet
 */
export const generateProjectFramingWord = async (projectData: ProjectData): Promise<void> => {
  try {
    // Création du document
    const doc = new Document({
      title: `Note de cadrage - ${projectData.project.title}`,
      description: "Note de cadrage du projet",
      styles: {
        paragraphStyles: [
          {
            id: "Normal",
            name: "Normal",
            run: {
              size: 24, // Equivalent to 12pt
              font: "Calibri",
            },
            paragraph: {
              spacing: {
                after: 120, // 6pt
              },
            },
          },
          {
            id: "Heading1",
            name: "Heading 1",
            basedOn: "Normal",
            next: "Normal",
            run: {
              size: 32, // 16pt
              bold: true,
              color: "2E74B5",
            },
            paragraph: {
              spacing: {
                before: 240, // 12pt
                after: 120, // 6pt
              },
            },
          },
          {
            id: "Heading2",
            name: "Heading 2",
            basedOn: "Normal",
            next: "Normal",
            run: {
              size: 28, // 14pt
              bold: true,
              color: "2E74B5",
            },
            paragraph: {
              spacing: {
                before: 200, // 10pt
                after: 120, // 6pt
              },
            },
          },
        ],
      },
    });

    // Page de titre
    const titleContent = [
      new Paragraph({
        text: "Note de cadrage",
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: {
          before: 3000, // Espacement avant
          after: 400,   // Espacement après
        },
      }),
      new Paragraph({
        text: projectData.project.title,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 800,
        },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Code projet : ", bold: true }),
          new TextRun(projectData.project.code || "Non défini"),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Chef de projet : ", bold: true }),
          new TextRun(projectData.project.project_manager_name || projectData.project.project_manager || "Non défini"),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "État : ", bold: true }),
          new TextRun(lifecycleStatusLabels[projectData.project.lifecycle_status as ProjectLifecycleStatus] || "Non défini"),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Date de début : ", bold: true }),
          new TextRun(formatDate(projectData.project.start_date)),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Date de fin prévue : ", bold: true }),
          new TextRun(formatDate(projectData.project.end_date)),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Organisation : ", bold: true }),
          new TextRun([projectData.project.pole_name, projectData.project.direction_name, projectData.project.service_name].filter(Boolean).join(" > ")),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        text: `Document généré le ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`,
        alignment: AlignmentType.CENTER,
        spacing: { before: 800 },
      }),
      // Saut de page
      new Paragraph({
        text: "",
        pageBreakBefore: true,
      }),
    ];

    // Section d'informations générales
    const generalInfoContent = [
      new Paragraph({
        text: "Informations générales",
        heading: HeadingLevel.HEADING_1,
      }),
      new Paragraph({
        text: projectData.project.description || "Aucune description disponible.",
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Priorité : ", bold: true }),
          new TextRun(projectData.project.priority || "Non définie"),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Avancement : ", bold: true }),
          new TextRun(`${projectData.project.completion}%`),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Dernière revue : ", bold: true }),
          new TextRun(formatDate(projectData.project.last_review_date)),
        ],
        spacing: { after: 100 },
      }),
    ];

    // Section de cadrage
    const framingContent: Paragraph[] = [
      new Paragraph({
        text: "Cadrage du projet",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400 },
      }),
    ];

    if (projectData.framing) {
      // Contexte
      if (projectData.framing.context) {
        framingContent.push(
          new Paragraph({
            text: "Contexte",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300 },
          }),
          new Paragraph({
            text: projectData.framing.context,
          }),
        );
      }

      // Objectifs
      if (projectData.framing.objectives) {
        framingContent.push(
          new Paragraph({
            text: "Objectifs",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300 },
          }),
          new Paragraph({
            text: projectData.framing.objectives,
          }),
        );
      }

      // Parties prenantes
      if (projectData.framing.stakeholders) {
        framingContent.push(
          new Paragraph({
            text: "Parties prenantes",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300 },
          }),
          new Paragraph({
            text: projectData.framing.stakeholders,
          }),
        );
      }

      // Gouvernance
      if (projectData.framing.governance) {
        framingContent.push(
          new Paragraph({
            text: "Gouvernance",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300 },
          }),
          new Paragraph({
            text: projectData.framing.governance,
          }),
        );
      }

      // Calendrier
      if (projectData.framing.timeline) {
        framingContent.push(
          new Paragraph({
            text: "Calendrier",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300 },
          }),
          new Paragraph({
            text: projectData.framing.timeline,
          }),
        );
      }

      // Livrables
      if (projectData.framing.deliverables) {
        framingContent.push(
          new Paragraph({
            text: "Livrables",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300 },
          }),
          new Paragraph({
            text: projectData.framing.deliverables,
          }),
        );
      }
    } else {
      framingContent.push(
        new Paragraph({
          text: "Aucune information de cadrage disponible.",
        }),
      );
    }

    // Saut de page
    framingContent.push(
      new Paragraph({
        text: "",
        pageBreakBefore: true,
      }),
    );

    // Section des risques
    const risksContent: (Paragraph | Table)[] = [
      new Paragraph({
        text: "Risques identifiés",
        heading: HeadingLevel.HEADING_1,
      }),
    ];

    if (projectData.risks.length === 0) {
      risksContent.push(
        new Paragraph({
          text: "Aucun risque identifié pour ce projet.",
        }),
      );
    } else {
      // Tableau des risques
      const risksTable = new Table({
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
        rows: [
          // En-tête du tableau
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({
                width: {
                  size: 50,
                  type: WidthType.PERCENTAGE,
                },
                children: [new Paragraph({ text: "Description", bold: true })],
                shading: {
                  fill: "F2F2F2",
                },
              }),
              new TableCell({
                width: {
                  size: 15,
                  type: WidthType.PERCENTAGE,
                },
                children: [new Paragraph({ text: "Probabilité", bold: true })],
                shading: {
                  fill: "F2F2F2",
                },
              }),
              new TableCell({
                width: {
                  size: 15,
                  type: WidthType.PERCENTAGE,
                },
                children: [new Paragraph({ text: "Sévérité", bold: true })],
                shading: {
                  fill: "F2F2F2",
                },
              }),
              new TableCell({
                width: {
                  size: 20,
                  type: WidthType.PERCENTAGE,
                },
                children: [new Paragraph({ text: "Statut", bold: true })],
                shading: {
                  fill: "F2F2F2",
                },
              }),
            ],
          }),
          // Lignes de données
          ...projectData.risks.map(risk => 
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph(risk.description)],
                }),
                new TableCell({
                  children: [new Paragraph(renderRiskProbabilityLabel(risk.probability))],
                }),
                new TableCell({
                  children: [new Paragraph(renderRiskSeverityLabel(risk.severity))],
                }),
                new TableCell({
                  children: [new Paragraph(renderRiskStatusLabel(risk.status))],
                }),
              ],
            })
          ),
        ],
      });
      
      risksContent.push(risksTable);

      // Plans d'atténuation
      if (projectData.risks.some(risk => risk.mitigation_plan)) {
        risksContent.push(
          new Paragraph({
            text: "Plans d'atténuation",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400 },
          }),
        );

        projectData.risks
          .filter(risk => risk.mitigation_plan)
          .forEach(risk => {
            risksContent.push(
              new Paragraph({
                text: risk.description,
                bold: true,
                spacing: { before: 200 },
              }),
              new Paragraph({
                text: risk.mitigation_plan || "",
              }),
            );
          });
      }
    }

    // Saut de page
    risksContent.push(
      new Paragraph({
        text: "",
        pageBreakBefore: true,
      }),
    );

    // Section des tâches
    const tasksContent: Paragraph[] = [
      new Paragraph({
        text: "Tâches principales",
        heading: HeadingLevel.HEADING_1,
      }),
    ];

    if (projectData.tasks.length === 0) {
      tasksContent.push(
        new Paragraph({
          text: "Aucune tâche définie pour ce projet.",
        }),
      );
    } else {
      // Filtrer les tâches par statut
      const todoTasks = projectData.tasks.filter(task => task.status === 'todo' && !task.parent_task_id);
      const inProgressTasks = projectData.tasks.filter(task => task.status === 'in_progress' && !task.parent_task_id);
      const doneTasks = projectData.tasks.filter(task => task.status === 'done' && !task.parent_task_id);

      // Obtenir les sous-tâches par tâche parente
      const getSubtasks = (parentId: string) => {
        return projectData.tasks.filter(task => task.parent_task_id === parentId);
      };

      // Tâches à faire
      if (todoTasks.length > 0) {
        tasksContent.push(
          new Paragraph({
            text: "À faire",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300 },
          }),
        );

        todoTasks.forEach(task => {
          tasksContent.push(
            new Paragraph({
              text: task.title,
              bold: true,
              spacing: { before: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Date d'échéance: ", bold: true }),
                new TextRun(formatDate(task.due_date)),
              ],
            }),
          );

          if (task.description) {
            tasksContent.push(
              new Paragraph({
                text: task.description,
                spacing: { before: 100 },
              }),
            );
          }

          // Sous-tâches
          const subtasks = getSubtasks(task.id);
          if (subtasks.length > 0) {
            subtasks.forEach(subtask => {
              tasksContent.push(
                new Paragraph({
                  children: [
                    new TextRun("- "),
                    new TextRun(subtask.title),
                    new TextRun(" ("),
                    new TextRun(renderTaskStatusLabel(subtask.status)),
                    new TextRun(")"),
                  ],
                  indent: {
                    left: 400, // Indentation pour les sous-tâches
                  },
                }),
              );
            });
          }
        });
      }

      // Tâches en cours
      if (inProgressTasks.length > 0) {
        tasksContent.push(
          new Paragraph({
            text: "En cours",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300 },
          }),
        );

        inProgressTasks.forEach(task => {
          tasksContent.push(
            new Paragraph({
              text: task.title,
              bold: true,
              spacing: { before: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Date d'échéance: ", bold: true }),
                new TextRun(formatDate(task.due_date)),
              ],
            }),
          );

          if (task.description) {
            tasksContent.push(
              new Paragraph({
                text: task.description,
                spacing: { before: 100 },
              }),
            );
          }

          // Sous-tâches
          const subtasks = getSubtasks(task.id);
          if (subtasks.length > 0) {
            subtasks.forEach(subtask => {
              tasksContent.push(
                new Paragraph({
                  children: [
                    new TextRun("- "),
                    new TextRun(subtask.title),
                    new TextRun(" ("),
                    new TextRun(renderTaskStatusLabel(subtask.status)),
                    new TextRun(")"),
                  ],
                  indent: {
                    left: 400, // Indentation pour les sous-tâches
                  },
                }),
              );
            });
          }
        });
      }

      // Tâches terminées
      if (doneTasks.length > 0) {
        tasksContent.push(
          new Paragraph({
            text: "Terminées",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300 },
          }),
        );

        doneTasks.forEach(task => {
          tasksContent.push(
            new Paragraph({
              text: task.title,
              bold: true,
              spacing: { before: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Date d'échéance: ", bold: true }),
                new TextRun(formatDate(task.due_date)),
              ],
            }),
          );

          if (task.description) {
            tasksContent.push(
              new Paragraph({
                text: task.description,
                spacing: { before: 100 },
              }),
            );
          }

          // Sous-tâches
          const subtasks = getSubtasks(task.id);
          if (subtasks.length > 0) {
            subtasks.forEach(subtask => {
              tasksContent.push(
                new Paragraph({
                  children: [
                    new TextRun("- "),
                    new TextRun(subtask.title),
                    new TextRun(" ("),
                    new TextRun(renderTaskStatusLabel(subtask.status)),
                    new TextRun(")"),
                  ],
                  indent: {
                    left: 400, // Indentation pour les sous-tâches
                  },
                }),
              );
            });
          }
        });
      }
    }

    // Ajouter tous les contenus au document
    doc.addSection({
      children: [
        ...titleContent,
        ...generalInfoContent,
        ...framingContent,
        ...risksContent,
        ...tasksContent,
      ],
    });

    // Générer le blob
    const buffer = await Packer.toBlob(doc);
    
    // Sauvegarder le fichier
    saveAs(buffer, `Note_Cadrage_${projectData.project.title.replace(/\s+/g, '_')}.docx`);
    
    return Promise.resolve();
  } catch (error) {
    console.error("Erreur lors de la génération du document Word:", error);
    throw new Error("Impossible de générer le document Word");
  }
};
