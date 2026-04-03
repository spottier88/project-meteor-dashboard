

# Migration de html2canvas vers html-to-image

## Périmètre

Un seul fichier utilise `html2canvas` : `src/components/gantt/GanttExportButtons.tsx`. La migration est simple et localisée.

## Différences d'API

| html2canvas | html-to-image |
|---|---|
| `html2canvas(element, options)` → `Canvas` | `toPng(element, options)` → `data:image/png;base64,...` |
| Retourne un canvas DOM | Retourne directement une data URL |
| `backgroundColor` option | `backgroundColor` option (identique) |
| Pas de gestion native du scroll | `height`/`width` en options |

## Modifications

### 1. Installer html-to-image, supprimer html2canvas

```bash
bun add html-to-image
bun remove html2canvas
```

### 2. `src/components/gantt/GanttExportButtons.tsx`

Remplacer :
```typescript
import html2canvas from 'html2canvas';
```
par :
```typescript
import { toPng } from 'html-to-image';
```

Remplacer la fonction `handleExportToPng` :
```typescript
const handleExportToPng = async () => {
  if (ganttRef.current) {
    try {
      const dataUrl = await toPng(ganttRef.current, {
        height: ganttRef.current.scrollHeight,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = 'gantt-projets.png';
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Erreur lors de l'export PNG:", error);
    }
  }
};
```

## Avantages

- `html-to-image` est activement maintenu (dernière mise à jour récente vs 2022 pour html2canvas)
- Plus léger (~10 KB vs ~40 KB)
- Meilleur support des CSS modernes (flexbox, grid, SVG)

## Impact

Migration isolée à un seul fichier, aucun changement de signature pour les appelants. Le comportement utilisateur reste identique.

