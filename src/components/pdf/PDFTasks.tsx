import { View, Text } from "@react-pdf/renderer";
import { styles } from "./PDFStyles";
import { Database } from "@/integrations/supabase/types";

type TaskStatus = Database["public"]["Enums"]["task_status"];

interface Task {
  title: string;
  description?: string;
  status: TaskStatus;
  due_date?: string;
  assignee?: string;
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

  const renderTaskList = (tasks: Task[], status: string) => (
    <View style={styles.taskColumn}>
      <Text style={styles.taskColumnTitle}>{statusLabels[status as keyof typeof statusLabels]} ({tasks.length})</Text>
      {tasks.map((task, index) => (
        <View key={index} style={styles.task}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          {task.description && (
            <Text style={styles.taskDescription}>{task.description}</Text>
          )}
          {task.assignee && (
            <Text style={styles.taskAssignee}>Assigné à : {task.assignee}</Text>
          )}
          {task.due_date && (
            <Text style={styles.taskDueDate}>
              Échéance : {new Date(task.due_date).toLocaleDateString("fr-FR")}
            </Text>
          )}
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tâches</Text>
      <View style={styles.kanbanBoard}>
        {renderTaskList(todoTasks, "todo")}
        {renderTaskList(inProgressTasks, "in_progress")}
        {renderTaskList(doneTasks, "done")}
      </View>
    </View>
  );
};