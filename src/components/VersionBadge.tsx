/**
 * Composant affichant la version de l'application
 * Position fixe en bas à gauche de l'écran
 */
export function VersionBadge() {
  const version = import.meta.env.VITE_APP_VERSION || "0.0.0";

  return (
    <div className="fixed bottom-2 left-2 z-40">
      <span className="text-xs text-muted-foreground font-mono px-2 py-1 bg-background/50 backdrop-blur-sm rounded">
        Meteor v{version}
      </span>
    </div>
  );
}
