import { describe, expect, it, vi } from "vitest";
import { atualizarMelhor, melhor, registrarMelhor } from "../src/web/marcador.js";
import type { CasoCiclos, MarcaExercicio, MarcadorState } from "../src/web/marcador.js";

const vazio = (): MarcadorState => ({ marcas: {} });

const casos = (ciclosPorCaso: number[]): CasoCiclos[] =>
  ciclosPorCaso.map((ciclos, i) => ({ name: `caso ${i + 1}`, ciclos }));

const marcaDe = (ciclosPorCaso: number[]): MarcaExercicio => ({
  total: ciclosPorCaso.reduce((s, c) => s + c, 0),
  casos: casos(ciclosPorCaso),
});

describe("card de melhor performance — registrarMelhor", () => {
  it("grava a primeira marca e guarda a de menor total (a marca só recua, nunca sobe)", () => {
    let s = registrarMelhor(vazio(), "ex1-soma", marcaDe([20, 42]));
    expect(s.marcas["ex1-soma"]?.total).toBe(62);

    s = registrarMelhor(s, "ex1-soma", marcaDe([18, 37]));
    expect(s.marcas["ex1-soma"]?.total).toBe(55);

    s = registrarMelhor(s, "ex1-soma", marcaDe([19, 40]));
    expect(s.marcas["ex1-soma"]?.total).toBe(55);
    // a rodada guardada é inteira: o detalhe acompanha o total
    expect(s.marcas["ex1-soma"]?.casos.map((c) => c.ciclos)).toEqual([18, 37]);
  });

  it("guarda cada exercício separadamente e não toca no estado original", () => {
    const antes = vazio();
    let s = registrarMelhor(antes, "ex1-soma", marcaDe([20, 42]));
    s = registrarMelhor(s, "ex2-desvio", marcaDe([40]));
    expect(antes.marcas).toEqual({});
    expect(s.marcas["ex1-soma"]?.total).toBe(62);
    expect(s.marcas["ex2-desvio"]?.total).toBe(40);
  });

  it("empate de total com marca antiga sem detalhe: preenche o detalhe, não muda o total", () => {
    const s = registrarMelhor(vazio(), "ex1-soma", { total: 62, casos: [] });
    const depois = registrarMelhor(s, "ex1-soma", marcaDe([20, 42]));
    expect(depois.marcas["ex1-soma"]?.total).toBe(62);
    expect(depois.marcas["ex1-soma"]?.casos.map((c) => c.ciclos)).toEqual([20, 42]);
  });

  it("empate de total com detalhe já presente: não mexe", () => {
    const s = registrarMelhor(vazio(), "ex1-soma", marcaDe([20, 42]));
    const depois = registrarMelhor(s, "ex1-soma", marcaDe([42, 20]));
    expect(depois.marcas["ex1-soma"]?.casos.map((c) => c.ciclos)).toEqual([20, 42]);
  });
});

describe("card de melhor performance — atualizarMelhor", () => {
  it("sem marca anterior: soma os casos, registra e devolve true", () => {
    expect(melhor("ex1-soma")).toBeUndefined();
    expect(atualizarMelhor("ex1-soma", casos([20, 42]))).toBe(true);
    const marca = melhor("ex1-soma");
    expect(marca?.total).toBe(62);
    // e guarda o detalhe por caso, com o nome de cada um
    expect(marca?.casos).toEqual([
      { name: "caso 1", ciclos: 20 },
      { name: "caso 2", ciclos: 42 },
    ]);
  });

  it("rodada pior (ou igual): não mexe no card e devolve false", () => {
    expect(atualizarMelhor("ex1-soma", casos([21, 42]))).toBe(false);
    expect(atualizarMelhor("ex1-soma", casos([20, 42]))).toBe(false);
    expect(melhor("ex1-soma")?.total).toBe(62);
    expect(melhor("ex1-soma")?.casos.map((c) => c.ciclos)).toEqual([20, 42]);
  });

  it("rodada melhor: atualiza o card inteiro (total e detalhe) e devolve true", () => {
    expect(atualizarMelhor("ex1-soma", casos([18, 37]))).toBe(true);
    expect(melhor("ex1-soma")?.total).toBe(55);
    expect(melhor("ex1-soma")?.casos.map((c) => c.ciclos)).toEqual([18, 37]);
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
      atualizarMelhor("ex3-hello", casos([60, 60]));
      const salvo = JSON.parse(mem.get("ak8-marcador") as string) as MarcadorState;
      expect(salvo.marcas["ex3-hello"]?.total).toBe(120);
      expect(salvo.marcas["ex3-hello"]?.casos).toHaveLength(2);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("dado antigo com schema só de soma migra sem perder o total", async () => {
    const mem = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => mem.get(key) ?? null,
      setItem: (key: string, value: string) => {
        mem.set(key, value);
      },
    });
    try {
      mem.set("ak8-marcador", JSON.stringify({ marcas: { "ex1-soma": 55 } }));
      vi.resetModules();
      const md = await import("../src/web/marcador.js");
      expect(md.melhor("ex1-soma")).toEqual({ total: 55, casos: [] });
      // empate com a marca antiga sem detalhe: a rodada nova preenche o detalhe
      expect(md.atualizarMelhor("ex1-soma", casos([18, 37]))).toBe(true);
      expect(md.melhor("ex1-soma")?.casos.map((c) => c.ciclos)).toEqual([18, 37]);
      // e a rodada pior não mexe
      expect(md.atualizarMelhor("ex1-soma", casos([20, 42]))).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("marca de total 0 (dado adulterado) é rejeitada: seria inbatível", async () => {
    const mem = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => mem.get(key) ?? null,
      setItem: (key: string, value: string) => {
        mem.set(key, value);
      },
    });
    try {
      mem.set("ak8-marcador", JSON.stringify({ marcas: { "ex1-soma": 0 } }));
      vi.resetModules();
      const md = await import("../src/web/marcador.js");
      expect(md.melhor("ex1-soma")).toBeUndefined();
      // e a rodada real a seguir entra normalmente
      expect(md.atualizarMelhor("ex1-soma", casos([18, 37]))).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("atualizarMelhor sem casos não registra rodada nenhuma", () => {
    expect(atualizarMelhor("ex9-sem-casos", [])).toBe(false);
    expect(melhor("ex9-sem-casos")).toBeUndefined();
  });

  it("dado com estrutura inválida não derruba a leitura", async () => {
    const mem = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => mem.get(key) ?? null,
      setItem: (key: string, value: string) => {
        mem.set(key, value);
      },
    });
    try {
      mem.set(
        "ak8-marcador",
        JSON.stringify({ marcas: { "ex1-soma": { total: "muito" }, "ex2-desvio": { jogador: "ana" } } }),
      );
      vi.resetModules();
      const md = await import("../src/web/marcador.js");
      expect(md.melhor("ex1-soma")).toBeUndefined();
      expect(md.melhor("ex2-desvio")).toBeUndefined();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
