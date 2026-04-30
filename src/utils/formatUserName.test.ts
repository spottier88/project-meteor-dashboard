import { describe, it, expect } from "vitest";
import { formatUserName } from "./formatUserName";

const profiles = [
  { id: "1", email: "alice@example.com", first_name: "Alice", last_name: "Dupont" },
  { id: "2", email: "bob@example.com", first_name: "Bob", last_name: null },
  { id: "3", email: "carol@example.com", first_name: null, last_name: "Martin" },
  { id: "4", email: "dave@example.com", first_name: null, last_name: null },
];

describe("formatUserName", () => {
  it("retourne '-' si l'email est undefined", () => {
    expect(formatUserName(undefined)).toBe("-");
  });

  it("retourne l'email si aucun profil n'est fourni", () => {
    expect(formatUserName("alice@example.com")).toBe("alice@example.com");
  });

  it("retourne l'email si le profil n'est pas trouvé dans la liste", () => {
    expect(formatUserName("unknown@example.com", profiles)).toBe("unknown@example.com");
  });

  it("retourne 'Prénom Nom' si les deux sont disponibles", () => {
    expect(formatUserName("alice@example.com", profiles)).toBe("Alice Dupont");
  });

  it("retourne uniquement le prénom si le nom est null", () => {
    expect(formatUserName("bob@example.com", profiles)).toBe("Bob");
  });

  it("retourne uniquement le nom si le prénom est null", () => {
    expect(formatUserName("carol@example.com", profiles)).toBe("Martin");
  });

  it("retourne l'email si prénom et nom sont null", () => {
    expect(formatUserName("dave@example.com", profiles)).toBe("dave@example.com");
  });

  it("fonctionne avec une liste de profils vide", () => {
    expect(formatUserName("alice@example.com", [])).toBe("alice@example.com");
  });

  it("fonctionne avec profiles null", () => {
    expect(formatUserName("alice@example.com", null)).toBe("alice@example.com");
  });
});
