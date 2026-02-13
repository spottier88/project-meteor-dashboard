
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useMyTasks } from "@/hooks/useMyTasks";
import { ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";

export const TasksIndicator = () => {
  const navigate = useNavigate();
  const { data: overdueTasks, isLoading } = useMyTasks(true);
  
  if (isLoading || !overdueTasks || overdueTasks.length === 0) {
    return null;
  }
  
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="relative"
      onClick={() => navigate("/my-tasks?filter=overdue")}
    >
      <ListChecks className="h-5 w-5" />
      <Badge 
        variant="destructive" 
        className="absolute -top-1 -right-1 px-1.5 min-w-[20px] h-5 flex items-center justify-center rounded-full text-xs"
      >
        {overdueTasks.length}
      </Badge>
    </Button>
  );
};
