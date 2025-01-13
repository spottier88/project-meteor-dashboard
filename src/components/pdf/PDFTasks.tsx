import { View, Text } from "@react-pdf/renderer";
import { styles } from "./PDFStyles";
import { Database } from "@/integrations/supabase/types";

type TaskStatus = Database["public"]["Enums"]["task_status"];

interface Task {
  title: string;
  status: TaskStatus;
}

interface PDFTasksProps {
  tasks: Task[];
}

const statusLabels = {
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminé",
} as const;

export const PDFTasks = ({ tasks }: PDFTasksProps) => {
  const todoTasks = tasks.filter(task => task.status === "todo");
  const inProgressTasks = tasks.filter(task => task.status === "in_progress");
  const doneTasks = tasks.filter(task => task.status === "done");

  if (tasks.length === 0) {
    return (
      <View style={styles.section} wrap={false}>
        <Text style={styles.sectionTitle}>Tâches</Text>
        <Text style={styles.emptyText}>Aucune tâche pour ce projet</Text>
      </View>
    );
  }

  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>Tâches</Text>
      <View style={styles.kanbanBoard} wrap>
        <View style={styles.taskColumn} wrap>
          <Text style={styles.taskColumnTitle}>
            {statusLabels.todo} ({todoTasks.length})
          </Text>
          {todoTasks.map((task, index) => (
            <View key={index} style={styles.task} wrap={false}>
              <Text style={styles.taskTitle}>{task.title}</Text>
            </View>
          ))}
        </View>
        <View style={styles.taskColumn} wrap>
          <Text style={styles.taskColumnTitle}>
            {statusLabels.in_progress} ({inProgressTasks.length})
          </Text>
          {inProgressTasks.map((task, index) => (
            <View key={index} style={styles.task} wrap={false}>
              <Text style={styles.taskTitle}>{task.title}</Text>
            </View>
          ))}
        </View>
        <View style={styles.taskColumn} wrap>
          <Text style={styles.taskColumnTitle}>
            {statusLabels.done} ({doneTasks.length})
          </Text>
          {doneTasks.map((task, index) => (
            <View key={index} style={styles.task} wrap={false}>
              <Text style={styles.taskTitle}>{task.title}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};