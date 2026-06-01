/**
 * @page StatsUsage
 * @description Page admin "Statistiques d'usage".
 * Présente la fréquentation (DAU/WAU/MAU), l'activité fonctionnelle
 * sur la période sélectionnée (création de projets, revues, tâches,
 * notes, risques) et les tops utilisateurs / projets.
 */
import { useMemo } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Users, Activity, AlertCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { useAdminStatsFilters } from "@/hooks/admin-stats/useAdminStatsFilters";
import { useUsageStats } from "@/hooks/admin-stats/useUsageStats";
import { StatsFiltersBar } from "@/components/admin/stats/StatsFiltersBar";
import { KpiCard } from "@/components/admin/stats/KpiCard";
import { exportUsageStatsToExcel } from "@/utils/adminStatsExport";
import { usePermissionsContext } from "@/contexts/PermissionsContext";

const EVENT_LABELS: Record<string, string> = {
  project_created: "Projets créés",
  review_created: "Revues",
  task_created: "Tâches créées",
  task_updated: "Tâches modifiées",
  note_created: "Notes",
  risk_created: "Risques",
  activity_logged: "Activités",
};

const EVENT_COLORS: Record<string, string> = {
  project_created: "#3b82f6",
  review_created: "#10b981",
  task_created: "#a855f7",
  task_updated: "#8b5cf6",
  note_created: "#f59e0b",
  risk_created: "#ef4444",
  activity_logged: "#06b6d4",
};

export const StatsUsage = () => {
  const navigate = useNavigate();
  const { isAdmin } = usePermissionsContext();
  const { filters, setPeriod, setCustomRange, setOrg } = useAdminStatsFilters("admin-stats-usage-filters");
  const { data, isLoading } = useUsageStats({
    startDate: filters.startDate,
    endDate: filters.endDate,
    poleId: filters.poleId,
    directionId: filters.directionId,
    serviceId: filters.serviceId,
  });

  // Pivote les daily_events en un format Recharts multi-séries.
  const pivotedDailyEvents = useMemo(() => {
    if (!data) return [];
    const byDay = new Map<string, Record<string, number | string>>();
    data.daily_events.forEach((d) => {
      const row = byDay.get(d.day) ?? { day: d.day };
      row[d.event_type] = d.count;
      byDay.set(d.day, row);
    });
    return Array.from(byDay.values()).sort((a, b) => String(a.day).localeCompare(String(b.day)));
  }, [data]);

  const seriesKeys = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.daily_events.map((d) => d.event_type)));
  }, [data]);

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-sm text-destructive">Accès réservé aux administrateurs.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div>
        <Button variant="ghost" onClick={() => void navigate("/admin")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l'administration
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Statistiques d'usage</h1>
        <p className="text-muted-foreground">
          Fréquentation et activité fonctionnelle des utilisateurs sur la période sélectionnée.
        </p>
      </div>

      <StatsFiltersBar
        filters={filters}
        setPeriod={setPeriod}
        setCustomRange={setCustomRange}
        setOrg={setOrg}
        onExport={() => data && void exportUsageStatsToExcel(data)}
      />

      {isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <>
          {/* KPIs utilisateurs actifs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard label="DAU (24h)" value={data.active.dau} icon={Users} />
            <KpiCard label="WAU (7j)" value={data.active.wau} icon={Users} />
            <KpiCard label="MAU (30j)" value={data.active.mau} icon={Users} accent="success" />
            <KpiCard
              label="Comptes actifs"
              value={data.active.total_active_accounts}
              hint="Sur la base des profils actifs"
            />
            <KpiCard
              label="Inactifs >30j"
              value={data.inactive_accounts}
              icon={AlertCircle}
              accent="warning"
            />
          </div>

          {/* KPIs événements */}
          <Card>
            <CardHeader><CardTitle className="text-base">Activité sur la période</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(EVENT_LABELS).map(([k, label]) => (
                  <KpiCard key={k} label={label} value={data.events[k] ?? 0} icon={Activity} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Évolution utilisateurs actifs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Utilisateurs actifs par jour
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.daily_active}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="active_users" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Évolution événements multi-séries */}
          <Card>
            <CardHeader><CardTitle className="text-base">Évolution de l'activité par type</CardTitle></CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pivotedDailyEvents}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  {seriesKeys.map((k) => (
                    <Line
                      key={k}
                      type="monotone"
                      dataKey={k}
                      name={EVENT_LABELS[k] ?? k}
                      stroke={EVENT_COLORS[k] ?? "#64748b"}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tops */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Top 20 utilisateurs</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.top_users.length === 0 ? (
                      <TableRow><TableCell colSpan={2} className="text-center text-sm text-muted-foreground">Aucune donnée</TableCell></TableRow>
                    ) : data.top_users.map((u) => (
                      <TableRow key={u.user_id}>
                        <TableCell>
                          <div className="font-medium">{u.name}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </TableCell>
                        <TableCell className="text-right font-medium">{u.actions}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Top 10 projets actifs</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Projet</TableHead>
                      <TableHead className="text-right">Événements</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.top_projects.length === 0 ? (
                      <TableRow><TableCell colSpan={2} className="text-center text-sm text-muted-foreground">Aucune donnée</TableCell></TableRow>
                    ) : data.top_projects.map((p) => (
                      <TableRow key={p.project_id}>
                        <TableCell>{p.title}</TableCell>
                        <TableCell className="text-right font-medium">{p.events}</TableCell>
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

export default StatsUsage;
