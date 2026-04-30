/**
 * Assistant de gestion des droits en masse.
 * Wizard en 3 étapes : choix action/rôle, sélection utilisateurs, exécution avec synthèse.
 */
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBulkRoleAssignment, BulkRoleResult } from "@/hooks/useBulkRoleAssignment";
import { UserRole } from "@/types/user";
import { ArrowLeft, ArrowRight, Check, AlertTriangle, Users, Building } from "lucide-react";

// Labels lisibles pour chaque rôle
const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Administrateur" },
  { value: "chef_projet", label: "Chef de projet" },
  { value: "manager", label: "Manager" },
  { value: "membre", label: "Membre" },
  { value: "time_tracker", label: "Suivi activités" },
  { value: "portfolio_manager", label: "Gestionnaire de portefeuille" },
  { value: "quality_manager", label: "Responsable Qualité" },
];

interface BulkRoleWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface UserWithCurrentRoles {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  roles: UserRole[];
}

export const BulkRoleWizard = ({ isOpen, onClose, onSuccess }: BulkRoleWizardProps) => {
  const { applyBulkRole, isProcessing, progress } = useBulkRoleAssignment();

  // État du wizard
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [action, setAction] = useState<"add" | "remove">("add");
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [result, setResult] = useState<BulkRoleResult | null>(null);
  const [executed, setExecuted] = useState(false);

  // Filtres organisationnels
  const [selectedPoleId, setSelectedPoleId] = useState<string>("");
  const [selectedDirectionId, setSelectedDirectionId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");

  // Réinitialiser à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setAction("add");
      setSelectedRole("");
      setSelectedUserIds(new Set());
      setSearchTerm("");
      setResult(null);
      setExecuted(false);
      setSelectedPoleId("");
      setSelectedDirectionId("");
      setSelectedServiceId("");
    }
  }, [isOpen]);

  // --- Chargement des données ---

  // Tous les utilisateurs avec leurs rôles
  const { data: allUsers = [] } = useQuery({
    queryKey: ["bulkWizardUsers"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*");
      const { data: roles } = await supabase.from("user_roles").select("*");
      return (profiles || []).map((p) => ({
        id: p.id,
        email: p.email,
        first_name: p.first_name,
        last_name: p.last_name,
        roles: (roles || [])
          .filter((r) => r.user_id === p.id)
          .map((r) => r.role as UserRole),
      })) as UserWithCurrentRoles[];
    },
    enabled: isOpen,
  });

  // Pôles
  const { data: poles = [] } = useQuery({
    queryKey: ["bulkWizardPoles"],
    queryFn: async () => {
      const { data } = await supabase.from("poles").select("id, name").order("name");
      return data || [];
    },
    enabled: isOpen,
  });

  // Directions filtrées par pôle sélectionné
  const { data: directions = [] } = useQuery({
    queryKey: ["bulkWizardDirections", selectedPoleId],
    queryFn: async () => {
      let query = supabase.from("directions").select("id, name, pole_id").order("name");
      if (selectedPoleId) query = query.eq("pole_id", selectedPoleId);
      const { data } = await query;
      return data || [];
    },
    enabled: isOpen,
  });

  // Services filtrés par direction sélectionnée
  const { data: services = [] } = useQuery({
    queryKey: ["bulkWizardServices", selectedDirectionId],
    queryFn: async () => {
      let query = supabase.from("services").select("id, name, direction_id").order("name");
      if (selectedDirectionId) query = query.eq("direction_id", selectedDirectionId);
      const { data } = await query;
      return data || [];
    },
    enabled: isOpen,
  });

  // Utilisateurs rattachés à l'organisation sélectionnée
  const { data: orgUserIds = [] } = useQuery({
    queryKey: ["bulkWizardOrgUsers", selectedPoleId, selectedDirectionId, selectedServiceId],
    queryFn: async () => {
      // Déterminer le filtre le plus précis
      let entityId = "";
      let entityType: "pole" | "direction" | "service" | "" = "";
      if (selectedServiceId) { entityId = selectedServiceId; entityType = "service"; }
      else if (selectedDirectionId) { entityId = selectedDirectionId; entityType = "direction"; }
      else if (selectedPoleId) { entityId = selectedPoleId; entityType = "pole"; }
      if (!entityId || !entityType) return [];

      // Récupérer les utilisateurs directement affectés à ce niveau
      const { data } = await supabase
        .from("user_hierarchy_assignments")
        .select("user_id")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId);

      // Si on est au niveau pôle, inclure aussi les utilisateurs des directions et services de ce pôle
      if (entityType === "pole") {
        const { data: dirs } = await supabase.from("directions").select("id").eq("pole_id", entityId);
        const dirIds = (dirs || []).map(d => d.id);
        if (dirIds.length > 0) {
          const { data: dirUsers } = await supabase
            .from("user_hierarchy_assignments")
            .select("user_id")
            .eq("entity_type", "direction")
            .in("entity_id", dirIds);
          
          const { data: srvs } = await supabase.from("services").select("id").in("direction_id", dirIds);
          const srvIds = (srvs || []).map(s => s.id);
          let srvUsers: { user_id: string }[] = [];
          if (srvIds.length > 0) {
            const { data: su } = await supabase
              .from("user_hierarchy_assignments")
              .select("user_id")
              .eq("entity_type", "service")
              .in("entity_id", srvIds);
            srvUsers = su || [];
          }
          const allIds = new Set([
            ...(data || []).map(d => d.user_id),
            ...(dirUsers || []).map(d => d.user_id),
            ...srvUsers.map(d => d.user_id),
          ]);
          return Array.from(allIds).filter(Boolean) as string[];
        }
      }

      // Si on est au niveau direction, inclure aussi les services
      if (entityType === "direction") {
        const { data: srvs } = await supabase.from("services").select("id").eq("direction_id", entityId);
        const srvIds = (srvs || []).map(s => s.id);
        let srvUsers: Array<{ user_id: string | null }> = [];
        if (srvIds.length > 0) {
          const { data: su } = await supabase
            .from("user_hierarchy_assignments")
            .select("user_id")
            .eq("entity_type", "service")
            .in("entity_id", srvIds);
          srvUsers = su || [];
        }
        const allIds = new Set([
          ...(data || []).map(d => d.user_id),
          ...srvUsers.map(d => d.user_id),
        ]);
        return Array.from(allIds).filter(Boolean) as string[];
      }

      return (data || []).map(d => d.user_id).filter(Boolean) as string[];
    },
    enabled: isOpen && !!(selectedPoleId || selectedDirectionId || selectedServiceId),
  });

  // --- Filtrage des utilisateurs selon l'action et le rôle ---

  const filteredUsers = useMemo(() => {
    if (!selectedRole) return allUsers;
    return allUsers.filter((u) => {
      const hasRole = u.roles.includes(selectedRole as UserRole);
      // En mode ajout, masquer ceux qui ont déjà le rôle
      if (action === "add") return !hasRole;
      // En mode suppression, ne montrer que ceux qui ont le rôle
      return hasRole;
    });
  }, [allUsers, selectedRole, action]);

  // Filtre de recherche nominative
  const searchFilteredUsers = useMemo(() => {
    if (!searchTerm) return filteredUsers;
    const lower = searchTerm.toLowerCase();
    return filteredUsers.filter(
      (u) =>
        (u.first_name || "").toLowerCase().includes(lower) ||
        (u.last_name || "").toLowerCase().includes(lower) ||
        (u.email || "").toLowerCase().includes(lower)
    );
  }, [filteredUsers, searchTerm]);

  // Utilisateurs sélectionnés résolus (pour la synthèse)
  const selectedUsers = useMemo(
    () => allUsers.filter((u) => selectedUserIds.has(u.id)),
    [allUsers, selectedUserIds]
  );

  // --- Handlers ---

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      searchFilteredUsers.forEach((u) => next.add(u.id));
      return next;
    });
  };

  const deselectAll = () => setSelectedUserIds(new Set());

  const addOrgUsers = () => {
    if (orgUserIds.length === 0) return;
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      // Filtrer selon l'action/rôle avant d'ajouter
      orgUserIds.forEach((id) => {
        const user = allUsers.find((u) => u.id === id);
        if (!user) return;
        if (selectedRole) {
          const hasRole = user.roles.includes(selectedRole as UserRole);
          if (action === "add" && hasRole) return;
          if (action === "remove" && !hasRole) return;
        }
        next.add(id);
      });
      return next;
    });
  };

  const handleExecute = async () => {
    if (!selectedRole || selectedUserIds.size === 0) return;
    const res = await applyBulkRole(action, selectedRole as UserRole, Array.from(selectedUserIds));
    setResult(res);
    setExecuted(true);
    onSuccess();
  };

  const canProceedStep1 = !!selectedRole;
  const canProceedStep2 = selectedUserIds.size > 0;

  const getRoleLabel = (role: string) =>
    ROLE_OPTIONS.find((r) => r.value === role)?.label || role;

  const formatUserName = (u: UserWithCurrentRoles) => {
    const parts = [u.first_name, u.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : u.email || "Utilisateur inconnu";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Gestion des droits en masse</DialogTitle>
          <DialogDescription>
            Étape {step}/3 —{" "}
            {step === 1 && "Choix de l'action et du rôle"}
            {step === 2 && "Sélection des utilisateurs"}
            {step === 3 && (executed ? "Synthèse" : "Confirmation")}
          </DialogDescription>
        </DialogHeader>

        {/* Indicateur d'étape */}
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* ====== ÉTAPE 1 : Action et rôle ====== */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Action</Label>
              <RadioGroup value={action} onValueChange={(v) => setAction(v as "add" | "remove")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="add" id="action-add" />
                  <Label htmlFor="action-add">Ajouter un droit</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="remove" id="action-remove" />
                  <Label htmlFor="action-remove">Supprimer un droit</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Rôle concerné</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* ====== ÉTAPE 2 : Sélection des utilisateurs ====== */}
        {step === 2 && (
          <div className="flex-1 min-h-0 flex flex-col space-y-4 overflow-hidden">
            <Tabs defaultValue="nominatif" className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <TabsList>
                <TabsTrigger value="nominatif">
                  <Users className="h-4 w-4 mr-1" /> Nominatif
                </TabsTrigger>
                <TabsTrigger value="organisation">
                  <Building className="h-4 w-4 mr-1" /> Par organisation
                </TabsTrigger>
              </TabsList>

              {/* --- Mode nominatif --- */}
              <TabsContent value="nominatif" className="flex-1 min-h-0 flex flex-col space-y-3">
                <Input
                  placeholder="Rechercher par nom, prénom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllVisible}>
                    Tout sélectionner
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAll}>
                    Tout désélectionner
                  </Button>
                </div>
                <div className="border rounded-md max-h-[300px] overflow-y-auto">
                  <div className="p-2 space-y-1">
                    {searchFilteredUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-2">Aucun utilisateur trouvé</p>
                    ) : (
                      searchFilteredUsers.map((user) => (
                        <label
                          key={user.id}
                          className="flex items-start gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                        >
                          <Checkbox
                            className="mt-0.5"
                            checked={selectedUserIds.has(user.id)}
                            onCheckedChange={() => toggleUser(user.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="truncate">
                              <span className="text-sm font-medium">{formatUserName(user)}</span>
                              {user.email && (
                                <span className="text-xs text-muted-foreground ml-2">{user.email}</span>
                              )}
                            </div>
                            {user.roles.length > 0 && (
                              <div className="flex gap-1 flex-wrap mt-1">
                                {user.roles.map((r) => (
                                  <Badge key={r} variant="secondary" className="text-xs">
                                    {getRoleLabel(r)}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* --- Mode par organisation --- */}
              <TabsContent value="organisation" className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Pôle</Label>
                    <Select
                      value={selectedPoleId}
                      onValueChange={(v) => {
                        setSelectedPoleId(v);
                        setSelectedDirectionId("");
                        setSelectedServiceId("");
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                      <SelectContent>
                        {poles.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Direction</Label>
                    <Select
                      value={selectedDirectionId}
                      onValueChange={(v) => { setSelectedDirectionId(v); setSelectedServiceId(""); }}
                      disabled={!selectedPoleId}
                    >
                      <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
                      <SelectContent>
                        {directions.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Service</Label>
                    <Select
                      value={selectedServiceId}
                      onValueChange={setSelectedServiceId}
                      disabled={!selectedDirectionId}
                    >
                      <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                      <SelectContent>
                        {services.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(selectedPoleId || selectedDirectionId || selectedServiceId) && (
                  <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                    <span className="text-sm">
                      {orgUserIds.length} utilisateur(s) trouvé(s) dans cette organisation
                    </span>
                    <Button size="sm" onClick={addOrgUsers}>
                      Ajouter à la sélection
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Résumé de la sélection */}
            <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
              <span className="text-sm font-medium">
                {selectedUserIds.size} utilisateur(s) sélectionné(s)
              </span>
              {selectedUserIds.size > 0 && (
                <Button variant="ghost" size="sm" onClick={deselectAll}>
                  Réinitialiser
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ====== ÉTAPE 3 : Confirmation et exécution ====== */}
        {step === 3 && (
          <div className="flex-1 min-h-0 max-h-[350px] overflow-y-auto">
          <div className="space-y-4 pr-1">
            {!executed ? (
              <>
                {/* Résumé avant exécution */}
                <div className="space-y-3 p-4 border rounded-md bg-muted/30">
                  <div className="flex gap-2 items-center">
                    <span className="text-sm font-medium">Action :</span>
                    <Badge variant={action === "add" ? "default" : "destructive"}>
                      {action === "add" ? "Ajouter" : "Supprimer"}
                    </Badge>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-sm font-medium">Rôle :</span>
                    <Badge variant="secondary">{getRoleLabel(selectedRole)}</Badge>
                  </div>
                  <div>
                    <span className="text-sm font-medium">
                      {selectedUsers.length} utilisateur(s) concerné(s) :
                    </span>
                    <div className="mt-2 max-h-[200px] overflow-y-auto">
                      <ul className="space-y-1 pl-4 pr-3">
                        {selectedUsers.map((u) => (
                          <li key={u.id} className="text-sm list-disc">
                            {formatUserName(u)}
                            {u.email && (
                              <span className="text-muted-foreground ml-1">({u.email})</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {isProcessing && (
                  <div className="space-y-2">
                    <Progress value={progress} />
                    <p className="text-xs text-muted-foreground text-center">
                      Traitement en cours... {progress}%
                    </p>
                  </div>
                )}
              </>
            ) : (
              /* Synthèse après exécution */
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 border rounded-md bg-muted/30">
                  <Check className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Traitement terminé</p>
                    <p className="text-sm text-muted-foreground">
                      {result?.success} succès sur {result?.total} opérations
                    </p>
                  </div>
                </div>
                {result && result.errors.length > 0 && (
                  <div className="p-4 border rounded-md border-destructive/50 bg-destructive/5">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium text-destructive">
                        {result.errors.length} erreur(s)
                      </span>
                    </div>
                    <div className="max-h-[150px] overflow-y-auto">
                      <ul className="space-y-1 text-xs text-destructive">
                        {result.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          {step > 1 && !executed ? (
            <Button variant="outline" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Précédent
            </Button>
          ) : (
            <div />
          )}
          {step === 1 && (
            <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>
              Suivant <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {step === 2 && (
            <Button onClick={() => setStep(3)} disabled={!canProceedStep2}>
              Suivant <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {step === 3 && !executed && (
            <Button onClick={handleExecute} disabled={isProcessing}>
              {isProcessing ? "Traitement..." : "Appliquer"}
            </Button>
          )}
          {step === 3 && executed && (
            <Button onClick={onClose}>Fermer</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
