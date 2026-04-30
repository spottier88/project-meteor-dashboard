import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("retourne une chaîne vide sans arguments", () => {
    expect(cn()).toBe("");
  });

  it("fusionne des classes simples", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("ignore les valeurs falsy", () => {
    expect(cn("foo", undefined, null, false, "bar")).toBe("foo bar");
  });

  it("résout les conflits Tailwind (dernière classe gagne)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("fusionne les classes conditionnelles", () => {
    const active = true;
    const disabled = false;
    expect(cn("base", active && "active", disabled && "disabled")).toBe("base active");
  });

  it("gère les tableaux de classes", () => {
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz");
  });
});
