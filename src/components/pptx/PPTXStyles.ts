/**
 * @file PPTXStyles.ts
 * @description Définit les styles visuels pour la génération de présentations PPTX.
 * Contient les définitions de styles pour les titres, sous-titres, textes, couleurs,
 * et dispositions des diapositives pour maintenir une apparence cohérente.
 */

export const pptxStyles = {
  title: {
    fontSize: 24,
    color: "FFFFFF",
    bold: true,
  },
  subtitle: {
    fontSize: 18,
    color: "FFFFFF",
  },
  sectionTitle: {
    fontSize: 12,
    color: "000000",
    bold: true,
  },
  text: {
    fontSize: 11,
    color: "363636",
  },
  header: {
    fontSize: 14,
    color: "FFFFFF",
  },
  date: {
    fontSize: 10,
    color: "FFFFFF",
  },
};

export const pptxColors = {
  primary: "CC0000",
  secondary: "000000",
  text: "363636",
  muted: "666666",
};

export const pptxLayout = {
  margin: 0.5,
  width: 10,
  grid: {
    x: 0.5,
    y: 1,
    w: 9,
    h: 5,
    columnGap: 0.1,
    rowGap: 0.1
  }
};
