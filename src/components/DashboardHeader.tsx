
import React from "react";
import { Button } from "./ui/button";
import { usePermissionsContext } from "@/contexts/PermissionsContext";

export const DashboardHeader = ({
  onNewProject,
  onNewReview,
}: {
  onNewProject: () => void;
  onNewReview: () => void;
}) => {
  const { userProfile } = usePermissionsContext();
  const canCreateProjects = userProfile?.roles?.some(
    (role) => role === "admin" || role === "project_creator"
  );

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <img
            src="/lovable-uploads/6e5660c0-6a3a-46d7-9632-b2935a4bf13c.png"
            alt="Logo"
            className="w-12 h-12 animate-[scale-in_0.5s_ease-out,fade-in_0.5s_ease-out]"
          />
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
        </div>
        <div className="flex space-x-4">
          {canCreateProjects && (
            <Button
              onClick={onNewProject}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Nouveau projet
            </Button>
          )}
          <Button
            onClick={onNewReview}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Nouvelle revue
          </Button>
        </div>
      </div>
    </div>
  );
};
