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

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tâches</Text>
      <View style={styles.kanbanBoard}>
        <View style={styles.taskColumn}>
          <Text style={styles.taskColumnTitle}>
            {statusLabels.todo} ({todoTasks.length})
          </Text>
          {todoTasks.map((task, index) => (
            <View key={index} style={styles.task}>
              <Text style={styles.taskTitle}>{task.title}</Text>
            </View>
          ))}
        </View>
        <View style={styles.taskColumn}>
          <Text style={styles.taskColumnTitle}>
            {statusLabels.in_progress} ({inProgressTasks.length})
          </Text>
          {inProgressTasks.map((task, index) => (
            <View key={index} style={styles.task}>
              <Text style={styles.taskTitle}>{task.title}</Text>
            </View>
          ))}
        </View>
        <View style={styles.taskColumn}>
          <Text style={styles.taskColumnTitle}>
            {statusLabels.done} ({doneTasks.length})
          </Text>
          {doneTasks.map((task, index) => (
            <View key={index} style={styles.task}>
              <Text style={styles.taskTitle}>{task.title}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};