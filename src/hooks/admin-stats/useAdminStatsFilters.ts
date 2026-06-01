/**
 * Hook gérant les filtres communs aux pages de statistiques admin :
 * - période (preset + dates personnalisées)
 * - pôle / direction / service
 * Persiste les valeurs en localStorage par clé de page.
 */
import { useEffect, useMemo, useState } from "react";

export type PeriodPreset = "7d" | "30d" | "90d" | "year" | "custom";

export interface AdminStatsFilters {
  period: PeriodPreset;
  startDate: string; // ISO
  endDate: string; // ISO
  poleId: string | null;
  directionId: string | null;
  serviceId: string | null;
}

const DEFAULTS: AdminStatsFilters = {
  period: "30d",
  startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
  endDate: new Date().toISOString(),
  poleId: null,
  directionId: null,
  serviceId: null,
};

const presetRange = (preset: PeriodPreset): { startDate: string; endDate: string } | null => {
  const end = new Date();
  const start = new Date();
  switch (preset) {
    case "7d":
      start.setDate(end.getDate() - 7);
      break;
    case "30d":
      start.setDate(end.getDate() - 30);
      break;
    case "90d":
      start.setDate(end.getDate() - 90);
      break;
    case "year":
      start.setFullYear(end.getFullYear() - 1);
      break;
    case "custom":
      return null;
  }
  return { startDate: start.toISOString(), endDate: end.toISOString() };
};

export const useAdminStatsFilters = (storageKey: string) => {
  const [filters, setFilters] = useState<AdminStatsFilters>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as AdminStatsFilters;
        // recalcule la plage si preset (les dates stockées peuvent être périmées)
        if (parsed.period !== "custom") {
          const range = presetRange(parsed.period);
          if (range) return { ...parsed, ...range };
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(filters));
    } catch {
      // ignore
    }
  }, [filters, storageKey]);

  const setPeriod = (period: PeriodPreset) => {
    const range = presetRange(period);
    setFilters((f) => ({ ...f, period, ...(range ?? {}) }));
  };

  const setCustomRange = (startDate: string, endDate: string) => {
    setFilters((f) => ({ ...f, period: "custom", startDate, endDate }));
  };

  const setOrg = (poleId: string | null, directionId: string | null, serviceId: string | null) => {
    setFilters((f) => ({ ...f, poleId, directionId, serviceId }));
  };

  const rpcArgs = useMemo(
    () => ({
      p_pole: filters.poleId,
      p_direction: filters.directionId,
      p_service: filters.serviceId,
      p_start: filters.startDate,
      p_end: filters.endDate,
    }),
    [filters]
  );

  return { filters, setPeriod, setCustomRange, setOrg, setFilters, rpcArgs };
};
