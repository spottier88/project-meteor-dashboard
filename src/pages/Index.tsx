import { DashboardHeader } from "@/components/DashboardHeader";
import { ProjectGrid } from "@/components/ProjectGrid";
import { useToast } from "@/components/ui/use-toast";

const mockProjects = [
  {
    id: "1",
    title: "Website Redesign",
    status: "sunny",
    progress: "better",
    completion: 75,
    lastReviewDate: "2024-03-15",
  },
  {
    id: "2",
    title: "Mobile App Development",
    status: "cloudy",
    progress: "stable",
    completion: 45,
    lastReviewDate: "2024-03-10",
  },
  {
    id: "3",
    title: "Database Migration",
    status: "stormy",
    progress: "worse",
    completion: 30,
    lastReviewDate: "2024-03-05",
  },
];

const Index = () => {
  const { toast } = useToast();

  const handleNewReview = () => {
    toast({
      title: "Coming Soon",
      description: "The review form will be implemented in the next iteration.",
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 min-h-screen animate-fade-in">
      <DashboardHeader onNewReview={handleNewReview} />
      <ProjectGrid projects={mockProjects} />
    </div>
  );
};

export default Index;