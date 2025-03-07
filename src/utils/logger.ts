
/**
 * Utilitaire de logging pour l'application
 * Permet de contrôler les logs en fonction de l'environnement
 */

// Définition des niveaux de log
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Configuration
const config = {
  // En production, on désactive les logs de debug et info
  enabledLevels: import.meta.env.PROD 
    ? ['warn', 'error'] as LogLevel[]
    : ['debug', 'info', 'warn', 'error'] as LogLevel[],
  
  // Groupes de logs activés (permet de filtrer par fonctionnalité)
  enabledGroups: import.meta.env.PROD
    ? [] as string[]
    : ['auth', 'calendar', 'notifications', 'activities'] as string[]
};

/**
 * Logger pour l'application
 */
export const logger = {
  /**
   * Log de niveau debug (uniquement en développement)
   */
  debug: (message: string, group?: string, ...args: any[]) => {
    if (shouldLog('debug', group)) {
      console.debug(`[DEBUG]${group ? ` [${group}]` : ''} ${message}`, ...args);
    }
  },

  /**
   * Log de niveau info (uniquement en développement)
   */
  info: (message: string, group?: string, ...args: any[]) => {
    if (shouldLog('info', group)) {
      console.info(`[INFO]${group ? ` [${group}]` : ''} ${message}`, ...args);
    }
  },

  /**
   * Log de niveau warn (dev & prod)
   */
  warn: (message: string, group?: string, ...args: any[]) => {
    if (shouldLog('warn', group)) {
      console.warn(`[WARN]${group ? ` [${group}]` : ''} ${message}`, ...args);
    }
  },

  /**
   * Log de niveau error (dev & prod)
   */
  error: (message: string, group?: string, ...args: any[]) => {
    if (shouldLog('error', group)) {
      console.error(`[ERROR]${group ? ` [${group}]` : ''} ${message}`, ...args);
    }
  }
};

/**
 * Détermine si un log doit être affiché en fonction de son niveau et de son groupe
 */
function shouldLog(level: LogLevel, group?: string): boolean {
  // Vérifier si le niveau de log est activé
  if (!config.enabledLevels.includes(level)) {
    return false;
  }
  
  // Si pas de groupe spécifié, on affiche le log
  if (!group) {
    return true;
  }
  
  // Sinon, on vérifie si le groupe est activé
  return config.enabledGroups.includes(group);
}
