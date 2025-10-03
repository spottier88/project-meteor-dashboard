/**
 * @component ProjectFramingExportDOCX
 * @description Composant pour générer et télécharger une note de cadrage de projet au format DOCX.
 * Utilise la bibliothèque docx pour créer un document Word structuré avec formatage Markdown.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';
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
 * Convertit le texte Markdown en paragraphes Word avec formatage
 */
const parseMarkdownToParagraphs = (content: string): Paragraph[] => {
  if (!content) return [];

  const lines = content.split('\n');
  const paragraphs: Paragraph[] = [];
  let orderedListCounter = 0;
  let inOrderedList = false;

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    // Ligne vide
    if (!trimmedLine) {
      paragraphs.push(new Paragraph({ text: '' }));
      inOrderedList = false;
      orderedListCounter = 0;
      return;
    }

    // Titre de niveau 2 (##)
    if (trimmedLine.startsWith('## ')) {
      paragraphs.push(
        new Paragraph({
          text: trimmedLine.substring(3),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
        })
      );
      inOrderedList = false;
      orderedListCounter = 0;
      return;
    }

    // Titre de niveau 3 (###)
    if (trimmedLine.startsWith('### ')) {
      paragraphs.push(
        new Paragraph({
          text: trimmedLine.substring(4),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );
      inOrderedList = false;
      orderedListCounter = 0;
      return;
    }

    // Liste non ordonnée (-, *, +)
    if (/^[-*+]\s/.test(trimmedLine)) {
      const content = trimmedLine.substring(2);
      paragraphs.push(
        new Paragraph({
          children: processInlineFormatting(content),
          bullet: { level: 0 },
          spacing: { before: 60, after: 60 },
        })
      );
      inOrderedList = false;
      orderedListCounter = 0;
      return;
    }

    // Liste ordonnée (1., 2., etc.)
    const orderedMatch = trimmedLine.match(/^(\d+)\.\s/);
    if (orderedMatch) {
      if (!inOrderedList) {
        inOrderedList = true;
        orderedListCounter = 0;
      }
      const content = trimmedLine.substring(orderedMatch[0].length);
      paragraphs.push(
        new Paragraph({
          children: processInlineFormatting(content),
          numbering: { reference: 'default-numbering', level: 0 },
          spacing: { before: 60, after: 60 },
        })
      );
      orderedListCounter++;
      return;
    }

    // Paragraphe normal
    paragraphs.push(
      new Paragraph({
        children: processInlineFormatting(trimmedLine),
        spacing: { before: 120, after: 120 },
        alignment: AlignmentType.JUSTIFIED,
      })
    );
    inOrderedList = false;
    orderedListCounter = 0;
  });

  return paragraphs;
};

/**
 * Traite le formatage inline (gras, italique)
 */
const processInlineFormatting = (text: string): TextRun[] => {
  const parts: TextRun[] = [];
  let currentIndex = 0;
  const regex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Texte avant le match
    if (match.index > currentIndex) {
      parts.push(new TextRun(text.substring(currentIndex, match.index)));
    }

    // Texte formaté
    if (match[1]) {
      // Gras (**texte**)
      parts.push(new TextRun({ text: match[2], bold: true }));
    } else if (match[3]) {
      // Italique (*texte*)
      parts.push(new TextRun({ text: match[4], italics: true }));
    }

    currentIndex = match.index + match[0].length;
  }

  // Reste du texte
  if (currentIndex < text.length) {
    parts.push(new TextRun(text.substring(currentIndex)));
  }

  return parts.length > 0 ? parts : [new TextRun(text)];
};

/**
 * Génère et télécharge la note de cadrage au format DOCX
 */
export const generateProjectFramingDOCX = async (projectData: ProjectData): Promise<void> => {
  try {
    const { project, framing, risks, tasks } = projectData;

    // Créer les sections du document
    const sections: Paragraph[] = [];

    // Page de garde
    sections.push(
      new Paragraph({
        text: 'Note de cadrage',
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { before: 2400, after: 400 },
      }),
      new Paragraph({
        text: project.title,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Code projet : ', bold: true }),
          new TextRun(project.code || 'Non défini'),
        ],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Chef de projet : ', bold: true }),
          new TextRun(project.project_manager_name || project.project_manager || 'Non défini'),
        ],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'État : ', bold: true }),
          new TextRun(lifecycleStatusLabels[project.lifecycle_status as ProjectLifecycleStatus] || 'Non défini'),
        ],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Date de début : ', bold: true }),
          new TextRun(formatDate(project.start_date)),
        ],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Date de fin prévue : ', bold: true }),
          new TextRun(formatDate(project.end_date)),
        ],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Organisation : ', bold: true }),
          new TextRun([project.pole_name, project.direction_name, project.service_name].filter(Boolean).join(' > ')),
        ],
        spacing: { after: 800 },
      }),
      new Paragraph({
        text: `Document généré le ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`,
        alignment: AlignmentType.CENTER,
        spacing: { before: 1200 },
      })
    );

    // Saut de page
    sections.push(
      new Paragraph({
        text: '',
        pageBreakBefore: true,
      })
    );

    // Informations générales
    sections.push(
      new Paragraph({
        text: 'Informations générales',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
      }),
      new Paragraph({
        text: project.description || 'Aucune description disponible.',
        spacing: { before: 120, after: 120 },
        alignment: AlignmentType.JUSTIFIED,
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Priorité : ', bold: true }),
          new TextRun(project.priority || 'Non définie'),
        ],
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Avancement : ', bold: true }),
          new TextRun(`${project.completion}%`),
        ],
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Dernière revue : ', bold: true }),
          new TextRun(formatDate(project.last_review_date)),
        ],
        spacing: { after: 240 },
      })
    );

    // Cadrage du projet
    sections.push(
      new Paragraph({
        text: 'Cadrage du projet',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
      })
    );

    if (!framing) {
      sections.push(
        new Paragraph({
          text: 'Aucune information de cadrage disponible.',
          spacing: { before: 120, after: 120 },
        })
      );
    } else {
      // Contexte
      if (framing.context) {
        sections.push(
          new Paragraph({
            text: 'Contexte',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
        sections.push(...parseMarkdownToParagraphs(framing.context));
      }

      // Objectifs
      if (framing.objectives) {
        sections.push(
          new Paragraph({
            text: 'Objectifs',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
        sections.push(...parseMarkdownToParagraphs(framing.objectives));
      }

      // Parties prenantes
      if (framing.stakeholders) {
        sections.push(
          new Paragraph({
            text: 'Parties prenantes',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
        sections.push(...parseMarkdownToParagraphs(framing.stakeholders));
      }

      // Gouvernance
      if (framing.governance) {
        sections.push(
          new Paragraph({
            text: 'Gouvernance',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
        sections.push(...parseMarkdownToParagraphs(framing.governance));
      }

      // Calendrier
      if (framing.timeline) {
        sections.push(
          new Paragraph({
            text: 'Calendrier',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
        sections.push(...parseMarkdownToParagraphs(framing.timeline));
      }

      // Livrables
      if (framing.deliverables) {
        sections.push(
          new Paragraph({
            text: 'Livrables',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
        sections.push(...parseMarkdownToParagraphs(framing.deliverables));
      }
    }

    // Saut de page pour les risques
    sections.push(
      new Paragraph({
        text: '',
        pageBreakBefore: true,
      })
    );

    // Risques identifiés
    sections.push(
      new Paragraph({
        text: 'Risques identifiés',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
      })
    );

    if (risks.length === 0) {
      sections.push(
        new Paragraph({
          text: 'Aucun risque identifié pour ce projet.',
          spacing: { before: 120, after: 120 },
        })
      );
    } else {
      // Tableau des risques (affichage en liste plutôt qu'en tableau pour docx)
      risks.forEach((risk, index) => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `Risque ${index + 1}: `, bold: true }),
              new TextRun(risk.description),
            ],
            spacing: { before: 120, after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Probabilité: ', bold: true }),
              new TextRun(renderRiskProbabilityLabel(risk.probability)),
              new TextRun(' | '),
              new TextRun({ text: 'Sévérité: ', bold: true }),
              new TextRun(renderRiskSeverityLabel(risk.severity)),
              new TextRun(' | '),
              new TextRun({ text: 'Statut: ', bold: true }),
              new TextRun(renderRiskStatusLabel(risk.status)),
            ],
            spacing: { after: 80 },
            indent: { left: 360 },
          })
        );
        if (risk.mitigation_plan) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Plan d\'atténuation: ', bold: true }),
                new TextRun(risk.mitigation_plan),
              ],
              spacing: { after: 120 },
              indent: { left: 360 },
            })
          );
        }
      });
    }

    // Tâches principales
    sections.push(
      new Paragraph({
        text: '',
        pageBreakBefore: true,
      }),
      new Paragraph({
        text: 'Tâches principales',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
      })
    );

    if (tasks.length === 0) {
      sections.push(
        new Paragraph({
          text: 'Aucune tâche définie pour ce projet.',
          spacing: { before: 120, after: 120 },
        })
      );
    } else {
      const todoTasks = tasks.filter((task) => task.status === 'todo' && !task.parent_task_id);
      const inProgressTasks = tasks.filter((task) => task.status === 'in_progress' && !task.parent_task_id);
      const doneTasks = tasks.filter((task) => task.status === 'done' && !task.parent_task_id);

      // À faire
      if (todoTasks.length > 0) {
        sections.push(
          new Paragraph({
            text: 'À faire',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
        todoTasks.forEach((task) => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: task.title, bold: true }),
                new TextRun(` - Date d'échéance: ${formatDate(task.due_date)}`),
              ],
              bullet: { level: 0 },
              spacing: { after: 60 },
            })
          );
          if (task.description) {
            sections.push(
              new Paragraph({
                text: task.description,
                spacing: { before: 40, after: 80 },
                indent: { left: 720 },
              })
            );
          }
        });
      }

      // En cours
      if (inProgressTasks.length > 0) {
        sections.push(
          new Paragraph({
            text: 'En cours',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
        inProgressTasks.forEach((task) => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: task.title, bold: true }),
                new TextRun(` - Date d'échéance: ${formatDate(task.due_date)}`),
              ],
              bullet: { level: 0 },
              spacing: { after: 60 },
            })
          );
          if (task.description) {
            sections.push(
              new Paragraph({
                text: task.description,
                spacing: { before: 40, after: 80 },
                indent: { left: 720 },
              })
            );
          }
        });
      }

      // Terminées
      if (doneTasks.length > 0) {
        sections.push(
          new Paragraph({
            text: 'Terminées',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
        doneTasks.forEach((task) => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: task.title, bold: true }),
                new TextRun(` - Date d'échéance: ${formatDate(task.due_date)}`),
              ],
              bullet: { level: 0 },
              spacing: { after: 60 },
            })
          );
          if (task.description) {
            sections.push(
              new Paragraph({
                text: task.description,
                spacing: { before: 40, after: 80 },
                indent: { left: 720 },
              })
            );
          }
        });
      }
    }

    // Créer le document DOCX
    const doc = new Document({
      numbering: {
        config: [
          {
            reference: 'default-numbering',
            levels: [
              {
                level: 0,
                format: 'decimal',
                text: '%1.',
                alignment: AlignmentType.LEFT,
              },
            ],
          },
        ],
      },
      sections: [
        {
          children: sections,
        },
      ],
    });

    // Générer et télécharger le fichier
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Note_Cadrage_${project.title.replace(/\s+/g, '_')}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erreur lors de la génération du DOCX:', error);
    throw error;
  }
};
