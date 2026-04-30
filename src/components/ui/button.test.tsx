import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
  it("se rend sans crash", () => {
    render(<Button>Valider</Button>);
    expect(screen.getByRole("button", { name: "Valider" })).toBeInTheDocument();
  });

  it("applique la variante destructive", () => {
    render(<Button variant="destructive">Supprimer</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-destructive");
  });

  it("applique la variante outline", () => {
    render(<Button variant="outline">Annuler</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("border");
  });

  it("est désactivé quand disabled=true", () => {
    render(<Button disabled>Désactivé</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("applique les classes personnalisées passées via className", () => {
    render(<Button className="my-custom-class">OK</Button>);
    expect(screen.getByRole("button").className).toContain("my-custom-class");
  });
});
