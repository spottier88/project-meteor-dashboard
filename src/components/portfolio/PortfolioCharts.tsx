
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface PortfolioChartsProps {
  statusStats: {
    sunny: number;
    cloudy: number;
    stormy: number;
  };
  lifecycleStats: {
    study: number;
    validated: number;
    in_progress: number;
    completed: number;
    suspended: number;
    abandoned: number;
  };
  averageCompletion: number;
  projectCount: number;
}

const STATUS_COLORS = {
  sunny: "#22c55e",
  cloudy: "#f59e0b", 
  stormy: "#ef4444"
};

const LIFECYCLE_COLORS = {
  study: "#94a3b8",
  validated: "#3b82f6",
  in_progress: "#f59e0b",
  completed: "#22c55e",
  suspended: "#f97316",
  abandoned: "#ef4444"
};

const LIFECYCLE_LABELS = {
  study: "À l'étude",
  validated: "Validé",
  in_progress: "En cours",
  completed: "Terminé",
  suspended: "Suspendu",
  abandoned: "Abandonné"
};

export const PortfolioCharts = ({ 
  statusStats, 
  lifecycleStats, 
  averageCompletion, 
  projectCount 
}: PortfolioChartsProps) => {
  const statusData = Object.entries(statusStats)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: key === 'sunny' ? 'Ensoleillé' : key === 'cloudy' ? 'Nuageux' : 'Orageux',
      value,
      color: STATUS_COLORS[key as keyof typeof STATUS_COLORS]
    }));

  const lifecycleData = Object.entries(lifecycleStats)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: LIFECYCLE_LABELS[key as keyof typeof LIFECYCLE_LABELS],
      value,
      color: LIFECYCLE_COLORS[key as keyof typeof LIFECYCLE_COLORS]
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Avancement global */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Avancement Global</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{averageCompletion}%</div>
            <div className="text-sm text-muted-foreground">Progression moyenne</div>
          </div>
          <Progress 
            value={averageCompletion} 
            className="h-3"
            indicatorClassName="bg-primary"
          />
          <div className="text-sm text-muted-foreground text-center">
            Basé sur {projectCount} projet(s)
          </div>
        </CardContent>
      </Card>

      {/* Répartition par weather */}
      {statusData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Répartition par Statut</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Répartition par cycle de vie */}
      {lifecycleData.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Répartition par Cycle de Vie</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={lifecycleData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
