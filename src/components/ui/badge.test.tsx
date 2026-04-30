import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./badge";

describe("Badge", () => {
  it("se rend sans crash avec un texte", () => {
    render(<Badge>Actif</Badge>);
    expect(screen.getByText("Actif")).toBeInTheDocument();
  });

  it("applique la variante secondary", () => {
    render(<Badge variant="secondary">Brouillon</Badge>);
    expect(screen.getByText("Brouillon").className).toContain("bg-secondary");
  });

  it("applique la variante destructive", () => {
    render(<Badge variant="destructive">Erreur</Badge>);
    expect(screen.getByText("Erreur").className).toContain("bg-destructive");
  });

  it("applique la variante blue", () => {
    render(<Badge variant="blue">En cours</Badge>);
    expect(screen.getByText("En cours").className).toContain("bg-blue-100");
  });

  it("applique les classes personnalisées via className", () => {
    render(<Badge className="ma-classe">Tag</Badge>);
    expect(screen.getByText("Tag").className).toContain("ma-classe");
  });
});
