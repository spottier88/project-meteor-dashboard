// src/locales/fr.ts

export const fr = {
  calendar: {
    monthFull: [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
    ],
    monthShort: [
      "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
      "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc",
    ],
    dayFull: [
      "Dimanche", "Lundi", "Mardi", "Mercredi",
      "Jeudi", "Vendredi", "Samedi",
    ],
    dayShort: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
    hours: "Heures",
    minutes: "Minutes",
    done: "Valider",
    clear: "Effacer",
    today: "Aujourd'hui",
    am: ["am", "AM"],
    pm: ["pm", "PM"],
    weekStart: 1,       // Semaine commençant le lundi (norme FR)
    clockFormat: 24,    // Format 24h
  },

  core: {
    ok: "OK",
    cancel: "Annuler",
    select: "Sélectionner",
    "No data": "Aucune donnée",
  },

  formats: {
    dateFormat: "%d/%m/%Y",   // Format date français
    timeFormat: "%H:%i",
  },

  lang: "fr-FR",

  gantt: {
    // En-tête / barre latérale
    "Task name": "Nom de la tâche",
    "Start date": "Date de début",
    "Add task": "Ajouter une tâche",
    Duration: "Durée",
    Task: "Tâche",
    Milestone: "Jalon",
    "Summary task": "Tâche récapitulative",

    // Formulaire latéral
    Save: "Enregistrer",
    Delete: "Supprimer",
    Name: "Nom",
    Description: "Description",
    "Select type": "Sélectionner le type",
    Type: "Type",
    "End date": "Date de fin",
    Progress: "Avancement",
    Predecessors: "Prédécesseurs",
    Successors: "Successeurs",
    "Add task name": "Saisir le nom de la tâche",
    "Add description": "Saisir la description",
    "Select link type": "Sélectionner le type de lien",
    "End-to-start": "Fin-à-début",
    "Start-to-start": "Début-à-début",
    "End-to-end": "Fin-à-fin",
    "Start-to-end": "Début-à-fin",

    // Menu contextuel / barre d'outils
    Add: "Ajouter",
    "Child task": "Tâche enfant",
    "Task above": "Tâche au-dessus",
    "Task below": "Tâche en-dessous",
    "Convert to": "Convertir en",
    Edit: "Modifier",
    Cut: "Couper",
    Copy: "Copier",
    Paste: "Coller",
    Move: "Déplacer",
    Up: "Haut",
    Down: "Bas",
    Indent: "Indenter",
    Outdent: "Désindenter",
    "Split task": "Fractionner la tâche",
    Segment: "Segment",

    // Barre d'outils
    "New task": "Nouvelle tâche",
    "Move up": "Monter",
    "Move down": "Descendre",
    Undo: "Annuler",
    Redo: "Rétablir",

    // Formats d'affichage
    Week: "Semaine",
    Q: "Trimestre",
  },
};
