
/**
 * @component ProjectFramingExport
 * @description Composant pour générer et télécharger une note de cadrage de projet au format PDF.
 * Utilise react-pdf/renderer pour créer un document PDF structuré.
 */

import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  pdf,
  Font 
} from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ProjectData } from '@/hooks/use-detailed-projects-data';
import { RiskProbability, RiskSeverity, RiskStatus } from '@/types/risk';
import { ProjectLifecycleStatus, lifecycleStatusLabels } from '@/types/project';

// Définir les styles pour le PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  coverPage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: 50,
  },
  coverTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  coverSubtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
  },
  coverInfo: {
    marginTop: 20,
    fontSize: 12,
  },
  coverInfoRow: {
    marginBottom: 8,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    paddingBottom: 2,
    borderBottom: '1px solid #ccc',
  },
  sectionContent: {
    marginLeft: 10,
    marginBottom: 10,
  },
  paragraph: {
    marginBottom: 5,
    textAlign: 'justify',
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    marginVertical: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    minHeight: 25,
    paddingVertical: 3,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 4,
    flex: 1,
  },
  tableCellSmall: {
    padding: 4,
    flex: 0.5,
  },
  tableCellLarge: {
    padding: 4,
    flex: 2,
  },
  header: {
    marginBottom: 10,
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  metadata: {
    marginBottom: 20,
    fontSize: 10,
    color: '#666',
  },
  strong: {
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 10,
    // Suppression de display: 'inline' car ce n'est pas un type valide pour Display
  },
  todo: {
    backgroundColor: '#e2e8f0',
    color: '#475569',
  },
  inProgress: {
    backgroundColor: '#dbeafe',
    color: '#2563eb',
  },
  done: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  },
  riskLow: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  },
  riskMedium: {
    backgroundColor: '#fef9c3',
    color: '#ca8a04',
  },
  riskHigh: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },
});

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

// Composant pour la page de couverture
const CoverPage = ({ project }: { project: ProjectData['project'] }) => (
  <Page size="A4" style={styles.coverPage}>
    <Text style={styles.coverTitle}>Note de cadrage</Text>
    <Text style={styles.coverSubtitle}>{project.title}</Text>
    
    <View style={styles.coverInfo}>
      <View style={styles.coverInfoRow}>
        <Text>Code projet : {project.code || 'Non défini'}</Text>
      </View>
      <View style={styles.coverInfoRow}>
        <Text>Chef de projet : {project.project_manager_name || project.project_manager || 'Non défini'}</Text>
      </View>
      <View style={styles.coverInfoRow}>
        <Text>État : {lifecycleStatusLabels[project.lifecycle_status as ProjectLifecycleStatus] || 'Non défini'}</Text>
      </View>
      <View style={styles.coverInfoRow}>
        <Text>Date de début : {formatDate(project.start_date)}</Text>
      </View>
      <View style={styles.coverInfoRow}>
        <Text>Date de fin prévue : {formatDate(project.end_date)}</Text>
      </View>
      <View style={styles.coverInfoRow}>
        <Text>Organisation : {[project.pole_name, project.direction_name, project.service_name].filter(Boolean).join(' > ')}</Text>
      </View>
    </View>
    
    <Text style={styles.footer}>Document généré le {format(new Date(), 'dd MMMM yyyy', { locale: fr })}</Text>
  </Page>
);

// Composant pour les pages de contenu
const ContentPage = ({ children, pageNumber }: { children: React.ReactNode, pageNumber: number }) => (
  <Page size="A4" style={styles.page}>
    <View style={styles.header}>
      <Text>Page {pageNumber}</Text>
    </View>
    {children}
    <View style={styles.footer}>
      <Text>Document généré le {format(new Date(), 'dd MMMM yyyy', { locale: fr })}</Text>
    </View>
  </Page>
);

// Composant pour la section d'information du projet
const ProjectInfoSection = ({ project }: { project: ProjectData['project'] }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Informations générales</Text>
    <View style={styles.sectionContent}>
      <Text style={styles.paragraph}>{project.description || 'Aucune description disponible.'}</Text>
      
      <View style={styles.metadata}>
        <Text>Priorité : {project.priority || 'Non définie'}</Text>
        <Text>Avancement : {project.completion}%</Text>
        <Text>Dernière revue : {formatDate(project.last_review_date)}</Text>
      </View>
    </View>
  </View>
);

// Composant pour la section de cadrage
const FramingSection = ({ framing }: { framing: Record<string, string | null> | null }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Cadrage du projet</Text>
    
    {!framing && (
      <View style={styles.sectionContent}>
        <Text>Aucune information de cadrage disponible.</Text>
      </View>
    )}
    
    {framing && (
      <>
        {framing.context && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontSize: 12 }]}>Contexte</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.paragraph}>{framing.context}</Text>
            </View>
          </View>
        )}
        
        {framing.objectives && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontSize: 12 }]}>Objectifs</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.paragraph}>{framing.objectives}</Text>
            </View>
          </View>
        )}
        
        {framing.stakeholders && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontSize: 12 }]}>Parties prenantes</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.paragraph}>{framing.stakeholders}</Text>
            </View>
          </View>
        )}
        
        {framing.governance && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontSize: 12 }]}>Gouvernance</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.paragraph}>{framing.governance}</Text>
            </View>
          </View>
        )}
        
        {framing.timeline && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontSize: 12 }]}>Calendrier</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.paragraph}>{framing.timeline}</Text>
            </View>
          </View>
        )}
        
        {framing.deliverables && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontSize: 12 }]}>Livrables</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.paragraph}>{framing.deliverables}</Text>
            </View>
          </View>
        )}
      </>
    )}
  </View>
);

// Composant pour la section des risques
const RisksSection = ({ risks }: { risks: ProjectData['risks'] }) => (
  <View style={styles.section} break>
    <Text style={styles.sectionTitle}>Risques identifiés</Text>
    
    {risks.length === 0 && (
      <View style={styles.sectionContent}>
        <Text>Aucun risque identifié pour ce projet.</Text>
      </View>
    )}
    
    {risks.length > 0 && (
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.tableCellLarge}>Description</Text>
          <Text style={styles.tableCell}>Probabilité</Text>
          <Text style={styles.tableCell}>Sévérité</Text>
          <Text style={styles.tableCell}>Statut</Text>
        </View>
        
        {risks.map((risk, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.tableCellLarge}>{risk.description}</Text>
            <Text style={styles.tableCell}>{renderRiskProbabilityLabel(risk.probability)}</Text>
            <Text style={styles.tableCell}>{renderRiskSeverityLabel(risk.severity)}</Text>
            <Text style={styles.tableCell}>{renderRiskStatusLabel(risk.status)}</Text>
          </View>
        ))}
      </View>
    )}
    
    {risks.length > 0 && risks.some(risk => risk.mitigation_plan) && (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: 12 }]}>Plans d'atténuation</Text>
        
        {risks.filter(risk => risk.mitigation_plan).map((risk, index) => (
          <View key={index} style={styles.sectionContent}>
            <Text style={styles.strong}>{risk.description}</Text>
            <Text style={styles.paragraph}>{risk.mitigation_plan}</Text>
          </View>
        ))}
      </View>
    )}
  </View>
);

// Composant pour la section des tâches
const TasksSection = ({ tasks }: { tasks: ProjectData['tasks'] }) => {
  // Séparer les tâches par statut
  const todoTasks = tasks.filter(task => task.status === 'todo' && !task.parent_task_id);
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress' && !task.parent_task_id);
  const doneTasks = tasks.filter(task => task.status === 'done' && !task.parent_task_id);
  
  // Obtenir les sous-tâches par tâche parente
  const getSubtasks = (parentId: string) => {
    return tasks.filter(task => task.parent_task_id === parentId);
  };

  return (
    <View style={styles.section} break>
      <Text style={styles.sectionTitle}>Tâches principales</Text>
      
      {tasks.length === 0 && (
        <View style={styles.sectionContent}>
          <Text>Aucune tâche définie pour ce projet.</Text>
        </View>
      )}
      
      {todoTasks.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: 12 }]}>À faire</Text>
          <View style={styles.table}>
            {todoTasks.map((task, index) => (
              <React.Fragment key={index}>
                <View style={styles.tableRow}>
                  <Text style={styles.tableCellLarge}>{task.title}</Text>
                  <Text style={styles.tableCell}>Date d'échéance: {formatDate(task.due_date)}</Text>
                </View>
                {task.description && (
                  <View style={styles.tableRow}>
                    <Text style={styles.tableCellLarge}>{task.description}</Text>
                    <Text style={styles.tableCell}></Text>
                  </View>
                )}
                {getSubtasks(task.id).map((subtask, subIndex) => (
                  <View key={`${index}-${subIndex}`} style={[styles.tableRow, { marginLeft: 20 }]}>
                    <Text style={styles.tableCellLarge}>- {subtask.title}</Text>
                    <Text style={styles.tableCell}>Status: {renderTaskStatusLabel(subtask.status)}</Text>
                  </View>
                ))}
              </React.Fragment>
            ))}
          </View>
        </View>
      )}
      
      {inProgressTasks.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: 12 }]}>En cours</Text>
          <View style={styles.table}>
            {inProgressTasks.map((task, index) => (
              <React.Fragment key={index}>
                <View style={styles.tableRow}>
                  <Text style={styles.tableCellLarge}>{task.title}</Text>
                  <Text style={styles.tableCell}>Date d'échéance: {formatDate(task.due_date)}</Text>
                </View>
                {task.description && (
                  <View style={styles.tableRow}>
                    <Text style={styles.tableCellLarge}>{task.description}</Text>
                    <Text style={styles.tableCell}></Text>
                  </View>
                )}
                {getSubtasks(task.id).map((subtask, subIndex) => (
                  <View key={`${index}-${subIndex}`} style={[styles.tableRow, { marginLeft: 20 }]}>
                    <Text style={styles.tableCellLarge}>- {subtask.title}</Text>
                    <Text style={styles.tableCell}>Status: {renderTaskStatusLabel(subtask.status)}</Text>
                  </View>
                ))}
              </React.Fragment>
            ))}
          </View>
        </View>
      )}
      
      {doneTasks.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: 12 }]}>Terminées</Text>
          <View style={styles.table}>
            {doneTasks.map((task, index) => (
              <React.Fragment key={index}>
                <View style={styles.tableRow}>
                  <Text style={styles.tableCellLarge}>{task.title}</Text>
                  <Text style={styles.tableCell}>Date d'échéance: {formatDate(task.due_date)}</Text>
                </View>
                {task.description && (
                  <View style={styles.tableRow}>
                    <Text style={styles.tableCellLarge}>{task.description}</Text>
                    <Text style={styles.tableCell}></Text>
                  </View>
                )}
                {getSubtasks(task.id).map((subtask, subIndex) => (
                  <View key={`${index}-${subIndex}`} style={[styles.tableRow, { marginLeft: 20 }]}>
                    <Text style={styles.tableCellLarge}>- {subtask.title}</Text>
                    <Text style={styles.tableCell}>Status: {renderTaskStatusLabel(subtask.status)}</Text>
                  </View>
                ))}
              </React.Fragment>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

// Composant principal pour le document PDF
const ProjectFramingDocument = ({ projectData }: { projectData: ProjectData }) => {
  return (
    <Document>
      {/* Page de couverture */}
      <CoverPage project={projectData.project} />
      
      {/* Page 1: Informations générales et cadrage */}
      <ContentPage pageNumber={1}>
        <ProjectInfoSection project={projectData.project} />
        <FramingSection framing={projectData.framing} />
      </ContentPage>
      
      {/* Page 2: Risques */}
      <ContentPage pageNumber={2}>
        <RisksSection risks={projectData.risks} />
      </ContentPage>
      
      {/* Page 3: Tâches */}
      <ContentPage pageNumber={3}>
        <TasksSection tasks={projectData.tasks} />
      </ContentPage>
    </Document>
  );
};

// Fonction principale pour générer et télécharger le PDF
export const generateProjectFramingPDF = async (projectData: ProjectData): Promise<void> => {
  try {
    const blob = await pdf(
      <ProjectFramingDocument projectData={projectData} />
    ).toBlob();
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Note_Cadrage_${projectData.project.title.replace(/\s+/g, '_')}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error);
    throw new Error("Impossible de générer le PDF");
  }
};
