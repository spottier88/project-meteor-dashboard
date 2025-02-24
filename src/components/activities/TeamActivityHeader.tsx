
import React from 'react';
import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChartIcon, List, FileSpreadsheet } from "lucide-react";

interface TeamActivityHeaderProps {
  hasActivities: boolean;
  viewMode: 'chart' | 'list';
  setViewMode: (mode: 'chart' | 'list') => void;
  onExport: () => void;
}

export const TeamActivityHeader = ({
  hasActivities,
  viewMode,
  setViewMode,
  onExport
}: TeamActivityHeaderProps) => {
  return (
    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle>Activités des équipes</CardTitle>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={!hasActivities}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
        <Button
          variant={viewMode === 'chart' ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode('chart')}
        >
          <BarChartIcon className="h-4 w-4 mr-2" />
          Graphique
        </Button>
        <Button
          variant={viewMode === 'list' ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode('list')}
        >
          <List className="h-4 w-4 mr-2" />
          Liste
        </Button>
      </div>
    </div>
  );
};
