export const statusLabels = {
  sunny: "Ensoleillé",
  cloudy: "Nuageux",
  stormy: "Orageux",
} as const;

export const progressLabels = {
  better: "En amélioration",
  stable: "Stable",
  worse: "En dégradation",
} as const;

export const riskLabels = {
  probability: {
    low: "Faible",
    medium: "Moyenne",
    high: "Élevée",
  },
  severity: {
    low: "Faible",
    medium: "Moyenne",
    high: "Élevée",
  },
  status: {
    open: "Ouvert",
    in_progress: "En cours",
    resolved: "Résolu",
  },
} as const;