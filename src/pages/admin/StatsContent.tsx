/**
 * @page StatsContent
 * @description Page admin "Statistiques de contenu".
 * Donne une vue agrégée de l'état du patrimoine : projets, tâches,
 * risques, revues, organisation et utilisateurs, avec filtres par
 * pôle / direction / service et export Excel.
 */
import { useNavigate } from "react-router";
import { ArrowLeft, FolderKanban, CheckCircle2, AlertTriangle, Sparkles, Users, ListTodo, ShieldAlert, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { useAdminStatsFilters } from "@/hooks/admin-stats/useAdminStatsFilters";
import { useContentStats } from "@/hooks/admin-stats/useContentStats";
import { StatsFiltersBar } from "@/components/admin/stats/StatsFiltersBar";
import { KpiCard } from "@/components/admin/stats/KpiCard";
import { exportContentStatsToExcel } from "@/utils/adminStatsExport";
import { usePermissionsContext } from "@/contexts/PermissionsContext";

const LIFECYCLE_COLORS = ["#3b82f6", "#10b981", "#a855f7", "#f59e0b", "#ef4444"];
const WEATHER_COLORS: Record<string, string> = {
  Beau: "#10b981",
  Nuageux: "#f59e0b",
  Orageux: "#ef4444",
  Inconnu: "#94a3b8",
};

export const StatsContent = () => {
  const navigate = useNavigate();
  const { isAdmin } = usePermissionsContext();
  const { filters, setPeriod, setCustomRange, setOrg } = useAdminStatsFilters("admin-stats-content-filters");
  const { data, isLoading } = useContentStats({
    poleId: filters.poleId,
    directionId: filters.directionId,
    serviceId: filters.serviceId,
  });

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-sm text-destructive">Accès réservé aux administrateurs.</p>
      </div>
    );
  }

  const lifecycleData = data
    ? [
        { name: "En cours", value: data.projects.in_progress },
        { name: "Terminés", value: data.projects.completed },
        { name: "Étude", value: data.projects.study },
        { name: "Validés", value: data.projects.validated },
        { name: "Suspendus", value: data.projects.suspended },
      ]
    : [];

  const weatherData = data
    ? [
        { name: "Beau", value: data.weather.sunny },
        { name: "Nuageux", value: data.weather.cloudy },
        { name: "Orageux", value: data.weather.stormy },
        { name: "Inconnu", value: data.weather.unknown },
      ]
    : [];

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div>
        <Button variant="ghost" onClick={() => void navigate("/admin")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l'administration
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Statistiques de contenu</h1>
        <p className="text-muted-foreground">
          Vue agrégée du patrimoine de données (projets, tâches, risques, revues, organisation).
        </p>
      </div>

      <StatsFiltersBar
        filters={filters}
        showPeriod={false}
        setPeriod={setPeriod}
        setCustomRange={setCustomRange}
        setOrg={setOrg}
        onExport={() => data && void exportContentStatsToExcel(data)}
      />

      {isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <>
          {/* KPIs projets */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Total projets" value={data.projects.total} icon={FolderKanban} />
            <KpiCard label="En cours" value={data.projects.in_progress} icon={CheckCircle2} accent="success" />
            <KpiCard label="Innovants" value={data.projects.innovative} icon={Sparkles} />
            <KpiCard label="Avancement moyen" value={`${data.weather.avg_completion}%`} />
          </div>

          {/* Charts projets */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Répartition par cycle de vie</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={lifecycleData} dataKey="value" nameKey="name" outerRadius={80} label>
                      {lifecycleData.map((_, i) => (
                        <Cell key={i} fill={LIFECYCLE_COLORS[i % LIFECYCLE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Météo (dernière revue)</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={weatherData} dataKey="value" nameKey="name" outerRadius={80} label>
                      {weatherData.map((d, i) => (
                        <Cell key={i} fill={WEATHER_COLORS[d.name]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Répartition organisationnelle */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Projets par pôle</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.by_pole} layout="vertical" margin={{ left: 60 }}>
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={120} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Top 15 directions</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.by_direction} layout="vertical" margin={{ left: 60 }}>
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={140} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#a855f7" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* KPIs Tâches / Risques / Revues */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Tâches totales" value={data.tasks.total} icon={ListTodo} />
            <KpiCard label="Tâches terminées" value={data.tasks.done} accent="success" />
            <KpiCard label="Tâches en retard" value={data.tasks.overdue} accent="danger" icon={AlertTriangle} />
            <KpiCard label="Sans revue >30j" value={data.missing_reviews} accent="warning" />
            <KpiCard label="Risques ouverts" value={data.risks.open_count} icon={ShieldAlert} />
            <KpiCard label="Risques critiques" value={data.risks.critical} accent="danger" />
            <KpiCard label="Revues saisies" value={data.reviews.total} icon={ClipboardCheck} />
            <KpiCard label="Projets revus" value={data.reviews.projects_reviewed} />
          </div>

          {/* Organisation & utilisateurs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard label="Pôles" value={data.org.poles} />
            <KpiCard label="Directions" value={data.org.directions} />
            <KpiCard label="Services" value={data.org.services} />
            <KpiCard label="Utilisateurs actifs" value={data.org.active_users} icon={Users} accent="success" />
            <KpiCard label="Utilisateurs inactifs" value={data.org.inactive_users} accent="warning" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Utilisateurs par rôle</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.roles}>
                    <XAxis dataKey="role" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Top chefs de projet</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chef de projet</TableHead>
                      <TableHead className="text-right">Nb projets</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.top_pms.length === 0 ? (
                      <TableRow><TableCell colSpan={2} className="text-center text-sm text-muted-foreground">Aucune donnée</TableCell></TableRow>
                    ) : data.top_pms.map((p) => (
                      <TableRow key={p.email}>
                        <TableCell>{p.name}</TableCell>
                        <TableCell className="text-right font-medium">{p.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default StatsContent;
