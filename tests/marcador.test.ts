import { describe, expect, it, vi } from "vitest";
import { atualizarMelhor, melhor, registrarMelhor } from "../src/web/marcador.js";
import type { MarcadorState } from "../src/web/marcador.js";

const vazio = (): MarcadorState => ({ marcas: {} });

describe("card de melhor performance — registrarMelhor", () => {
  it("grava a primeira marca e guarda a menor (a marca só recua, nunca sobe)", () => {
    let s = registrarMelhor(vazio(), "ex1-soma", 62);
    expect(s.marcas["ex1-soma"]).toBe(62);

    s = registrarMelhor(s, "ex1-soma", 55);
    expect(s.marcas["ex1-soma"]).toBe(55);

    s = registrarMelhor(s, "ex1-soma", 70);
    expect(s.marcas["ex1-soma"]).toBe(55);
  });

  it("guarda cada exercício separadamente e não toca no estado original", () => {
    const antes = vazio();
    let s = registrarMelhor(antes, "ex1-soma", 62);
    s = registrarMelhor(s, "ex2-desvio", 40);
    expect(antes.marcas).toEqual({});
    expect(s.marcas["ex1-soma"]).toBe(62);
    expect(s.marcas["ex2-desvio"]).toBe(40);
  });
});

describe("card de melhor performance — atualizarMelhor", () => {
  it("sem marca anterior: registra e devolve true", () => {
    expect(melhor("ex1-soma")).toBeUndefined();
    expect(atualizarMelhor("ex1-soma", 62)).toBe(true);
    expect(melhor("ex1-soma")).toBe(62);
  });

  it("rodada pior (ou igual): não mexe no card e devolve false", () => {
    expect(atualizarMelhor("ex1-soma", 70)).toBe(false);
    expect(atualizarMelhor("ex1-soma", 62)).toBe(false);
    expect(melhor("ex1-soma")).toBe(62);
  });

  it("rodada melhor: atualiza o card e devolve true", () => {
    expect(atualizarMelhor("ex1-soma", 55)).toBe(true);
    expect(melhor("ex1-soma")).toBe(55);
  });

  it("o card atualizado fica salvo no localStorage", () => {
    const mem = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => mem.get(key) ?? null,
      setItem: (key: string, value: string) => {
        mem.set(key, value);
      },
    });
    try {
      atualizarMelhor("ex3-hello", 120);
      const salvo = JSON.parse(mem.get("ak8-marcador") as string) as MarcadorState;
      expect(salvo.marcas["ex3-hello"]).toBe(120);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("dado antigo com outro schema (por pessoa) não derruba a leitura", async () => {
    const mem = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => mem.get(key) ?? null,
      setItem: (key: string, value: string) => {
        mem.set(key, value);
      },
    });
    try {
      // shape guard: marcas aninhadas por pessoa (schema antigo) voltam ao default vazio
      mem.set("ak8-marcador", JSON.stringify({ jogador: "ana", marcas: { ana: { "ex1-soma": 1 } } }));
      vi.resetModules();
      const md = await import("../src/web/marcador.js");
      expect(md.melhor("ex1-soma")).toBeUndefined();
      md.atualizarMelhor("ex1-soma", 9);
      const salvo = JSON.parse(mem.get("ak8-marcador") as string) as MarcadorState;
      expect(salvo.marcas).toEqual({ "ex1-soma": 9 });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
