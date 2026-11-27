import { describe, expect, it, vi } from "vitest";
import {
  capturarExecucao,
  estado,
  jogador,
  rankingExercicio,
  registrarExecucao,
  setJogador,
} from "../src/web/marcador.js";
import type { MarcadorState } from "../src/web/marcador.js";

const vazio = (): MarcadorState => ({ jogador: "", marcas: {} });

describe("marcador — registrarExecucao", () => {
  it("grava a primeira marca e guarda a menor (a marca só recua, nunca sobe)", () => {
    let s = registrarExecucao(vazio(), "ana", "ex1-soma", 62);
    expect(s.marcas.ana["ex1-soma"]).toBe(62);

    s = registrarExecucao(s, "ana", "ex1-soma", 55);
    expect(s.marcas.ana["ex1-soma"]).toBe(55);

    s = registrarExecucao(s, "ana", "ex1-soma", 70);
    expect(s.marcas.ana["ex1-soma"]).toBe(55);
  });

  it("não mistura as marcas de pessoas nem de exercícios diferentes", () => {
    let s = registrarExecucao(vazio(), "ana", "ex1-soma", 62);
    s = registrarExecucao(s, "bia", "ex1-soma", 50);
    s = registrarExecucao(s, "ana", "ex2-desvio", 40);
    expect(s.marcas.ana["ex1-soma"]).toBe(62);
    expect(s.marcas.bia["ex1-soma"]).toBe(50);
    expect(s.marcas.ana["ex2-desvio"]).toBe(40);
    expect(s.marcas.bia["ex2-desvio"]).toBeUndefined();
  });

  it("não toca no estado original: devolve um novo", () => {
    const antes = vazio();
    registrarExecucao(antes, "ana", "ex1-soma", 62);
    expect(antes.marcas).toEqual({});
  });
});

describe("marcador — rankingExercicio", () => {
  it("ordena do menor número de ciclos para o maior", () => {
    let s = registrarExecucao(vazio(), "ana", "ex1-soma", 62);
    s = registrarExecucao(s, "bia", "ex1-soma", 50);
    s = registrarExecucao(s, "carla", "ex1-soma", 50);
    expect(rankingExercicio(s, "ex1-soma")).toEqual([
      { jogador: "bia", ciclos: 50 },
      { jogador: "carla", ciclos: 50 },
      { jogador: "ana", ciclos: 62 },
    ]);
  });

  it("só lista quem tem marca no exercício pedido", () => {
    const s = registrarExecucao(vazio(), "ana", "ex2-desvio", 40);
    expect(rankingExercicio(s, "ex1-soma")).toEqual([]);
    expect(rankingExercicio(s, "ex2-desvio")).toEqual([{ jogador: "ana", ciclos: 40 }]);
  });

  it("ignora registro sem nome", () => {
    const s: MarcadorState = { jogador: "", marcas: { "": { "ex1-soma": 1 } } };
    expect(rankingExercicio(s, "ex1-soma")).toEqual([]);
  });
});

describe("marcador — capturarExecucao", () => {
  it("não captura enquanto a pessoa não se identifica", () => {
    expect(jogador()).toBe("");
    expect(capturarExecucao("ex1-soma", 62)).toBe(false);
    expect(estado().marcas).toEqual({});
  });

  it("grava a marca de quem se identificou e só recua; o placar reage", () => {
    setJogador("ana");
    expect(capturarExecucao("ex1-soma", 62)).toBe(true);
    expect(capturarExecucao("ex1-soma", 70)).toBe(false);
    expect(capturarExecucao("ex1-soma", 55)).toBe(true);
    expect(rankingExercicio(estado(), "ex1-soma")).toEqual([{ jogador: "ana", ciclos: 55 }]);
  });

  it("o que foi capturado fica salvo no localStorage", () => {
    const mem = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => mem.get(key) ?? null,
      setItem: (key: string, value: string) => {
        mem.set(key, value);
      },
    });
    try {
      setJogador("bia");
      capturarExecucao("ex3-hello", 120);
      const salvo = JSON.parse(mem.get("ak8-marcador") as string) as MarcadorState;
      expect(salvo.jogador).toBe("bia");
      expect(salvo.marcas.bia["ex3-hello"]).toBe(120);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
